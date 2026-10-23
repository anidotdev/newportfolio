import { siteConfig } from "@/config/site";

const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 60 * 60 * 1000;
const rateLimit = new Map<string, number[]>();

function json(body: unknown, status = 200) {
  return Response.json(body, { status });
}

function stripNewlines(value: string) {
  return value.replace(/[\r\n]+/g, " ").trim();
}

function clientIp(request: Request) {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]?.trim() || "unknown";
  return request.headers.get("x-real-ip")?.trim() || "unknown";
}

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as
    | Record<string, unknown>
    | null;

  if (!body || typeof body !== "object") {
    return json({ ok: false, error: "validation", fields: {} }, 400);
  }

  const website = typeof body.website === "string" ? body.website : "";
  const startedAt =
    typeof body.startedAt === "number" ? body.startedAt : Number.NaN;
  const elapsed = Date.now() - startedAt;

  // Honeypot and impossibly fast submissions receive a quiet success.
  if (website.trim() || !Number.isFinite(elapsed) || elapsed < 2000) {
    return json({ ok: true });
  }

  const form = siteConfig.contact.form;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const topic = typeof body.topic === "string" ? body.topic.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const fields: Record<string, string> = {};

  if (!name) fields.name = form.errors.name;
  else if (name.length > 100) fields.name = form.errors.nameLong;

  if (!email) fields.email = form.errors.email;
  else if (email.length > 200) fields.email = form.errors.emailLong;
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    fields.email = form.errors.emailFormat;
  }

  if (!message) fields.message = form.errors.message;
  else if (message.length < 10) fields.message = form.errors.messageShort;
  else if (message.length > 2000) {
    fields.message = form.errors.messageLong;
  }

  const topicOption = form.topics.find((option) => option.value === topic);
  if (!topicOption) fields.topic = form.errors.topic;

  if (Object.keys(fields).length > 0) {
    return json({ ok: false, error: "validation", fields }, 400);
  }

  const ip = clientIp(request);
  const now = Date.now();
  const recent = (rateLimit.get(ip) ?? []).filter(
    (timestamp) => now - timestamp < RATE_WINDOW_MS,
  );

  if (recent.length >= RATE_LIMIT) {
    return json({ ok: false, error: "rate_limited" }, 429);
  }

  recent.push(now);
  rateLimit.set(ip, recent);

  const apiKey = process.env.RESEND_API_KEY?.trim();
  const to = process.env.CONTACT_TO_EMAIL?.trim();
  const from = process.env.CONTACT_FROM_EMAIL?.trim();

  if (!apiKey || !to || !from) {
    return json({ ok: false, error: "not_configured" }, 503);
  }

  const subject = stripNewlines(
    `Portfolio message from ${name}`,
  );
  const text = [
    `New message from ${stripNewlines(name)} <${stripNewlines(email)}>`,
    `Topic: ${topicOption?.label ?? topic}`,
    "",
    message,
  ].join("\n");

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: stripNewlines(from),
        to: [stripNewlines(to)],
        subject,
        text,
        reply_to: stripNewlines(email),
      }),
    });

    if (!response.ok) {
      return json({ ok: false, error: "send_failed" }, 502);
    }

    return json({ ok: true });
  } catch {
    return json({ ok: false, error: "send_failed" }, 502);
  }
}
