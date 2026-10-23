import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";
const EMAIL = "hello@example.com";
const SPOTIFY = {
  ok: true,
  isPlaying: false,
  title: "Another track",
  artists: ["Artist one"],
  albumArt: null,
  url: "https://open.spotify.com/track/last",
};

function parseRgb(value) {
  const match = value.match(/rgba?\(([^)]+)\)/);
  if (!match) return null;
  return match[1]
    .split(",")
    .slice(0, 3)
    .map((channel) => Number.parseFloat(channel.trim()));
}

function luminance([r, g, b]) {
  const channels = [r, g, b].map((channel) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

function contrastRatio(first, second) {
  const high = Math.max(luminance(first), luminance(second));
  const low = Math.min(luminance(first), luminance(second));
  return (high + 0.05) / (low + 0.05);
}

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  reducedMotion: "no-preference",
});
await context.grantPermissions(["clipboard-read", "clipboard-write"], {
  origin: BASE_URL,
});
const page = await context.newPage();
const consoleErrors = [];

page.on("console", (message) => {
  if (message.type() !== "error") return;
  // The client intentionally renders 400/429/502/503 responses below.
  if (/Failed to load resource.*\b(400|429|502|503)\b/.test(message.text())) {
    return;
  }
  consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

await page.route("**/api/spotify", async (route) => {
  try {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(SPOTIFY),
    });
  } catch {
    // The page can navigate away while a request is still pending.
  }
});

let contactMode = "success";
let contactDelay = 0;
let lastContactBody = null;

await page.route("**/api/contact", async (route) => {
  const body = route.request().postDataJSON();
  if (body && typeof body === "object") lastContactBody = body;

  if (contactDelay) {
    await new Promise((resolve) => setTimeout(resolve, contactDelay));
  }

  const responses = {
    success: { status: 200, body: { ok: true } },
    bad: {
      status: 400,
      body: {
        ok: false,
        error: "validation",
        fields: { email: "Use a different email." },
      },
    },
    rate: { status: 429, body: { ok: false, error: "rate_limited" } },
    failed: { status: 502, body: { ok: false, error: "send_failed" } },
    unconfigured: {
      status: 503,
      body: { ok: false, error: "not_configured" },
    },
  };
  const response = responses[contactMode] ?? responses.success;

  try {
    await route.fulfill({
      status: response.status,
      contentType: "application/json",
      body: JSON.stringify(response.body),
    });
  } catch {
    // The page can navigate away while a request is still pending.
  }
});

const form = page.getByTestId("contact-form");
const success = page.getByTestId("contact-success");

async function load() {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await page.getByTestId("contact-section").scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
}

async function fillValid() {
  await page.locator("#contact-name").fill("Ada Lovelace");
  await page.locator("#contact-email").fill("ada@example.com");
  await page
    .locator("#contact-message")
    .fill("I would like to talk about a small data project.");
}

async function assertNoOverflow(width) {
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  assert.equal(
    metrics.scrollWidth,
    metrics.clientWidth,
    `horizontal overflow at ${width}`,
  );
}

async function assertPlaceholderContrast(label) {
  const colors = await page.evaluate(() => {
    const field = document.querySelector("#contact-name");
    return {
      placeholder: getComputedStyle(field, "::placeholder").color,
      background: getComputedStyle(field).backgroundColor,
    };
  });
  const placeholder = parseRgb(colors.placeholder);
  const background = parseRgb(colors.background);
  assert.ok(placeholder && background, `${label} placeholder colors parse`);
  const ratio = contrastRatio(placeholder, background);
  assert.ok(
    ratio >= 4.5,
    `${label} placeholder contrast ${ratio.toFixed(2)}:1`,
  );
}

async function runAxe(theme) {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"])
    .analyze();

  assert.deepEqual(
    results.violations,
    [],
    `${theme} axe violations:\n${JSON.stringify(
      results.violations.map((violation) => ({
        id: violation.id,
        nodes: violation.nodes.map((node) => node.target),
      })),
      null,
      2,
    )}`,
  );
}

try {
  await load();

  const contact = page.getByTestId("contact-section");
  const left = page.getByTestId("contact-panel-left");
  const right = page.getByTestId("contact-panel-right");
  assert.equal(
    await contact
      .getByTestId("section-row")
      .first()
      .evaluate((element) =>
        Math.round(element.firstElementChild.getBoundingClientRect().height),
      ),
    56,
    "contact heading row height",
  );
  assert.equal(
    await contact.evaluate((element) => getComputedStyle(element).scrollMarginTop),
    "80px",
    "contact scroll margin",
  );

  const leftBox = await left.boundingBox();
  const rightBox = await right.boundingBox();
  assert.ok(leftBox && rightBox);
  assert.equal(Math.round(leftBox.height), Math.round(rightBox.height), "equal panels");
  assert.equal(Math.round(rightBox.x - (leftBox.x + leftBox.width)), 16, "panel gap");
  assert.ok(leftBox.height <= 400, "panels are at most 400px tall");
  for (const panel of [left, right]) {
    assert.equal(
      await panel.evaluate((element) => getComputedStyle(element).padding),
      "20px",
      "panel padding",
    );
  }

  for (const width of [1440, 1024, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(120);
    const compactLeft = await left.boundingBox();
    const compactRight = await right.boundingBox();
    assert.ok(compactLeft && compactRight);
    assert.equal(
      Math.round(compactLeft.height),
      Math.round(compactRight.height),
      `equal panels at ${width}`,
    );
    assert.ok(compactLeft.height <= 400, `panel height at ${width}`);
    assert.equal(
      await left.evaluate((element) => getComputedStyle(element).padding),
      "20px",
      `left panel padding at ${width}`,
    );
    assert.equal(
      await right.evaluate((element) => getComputedStyle(element).padding),
      "20px",
      `right panel padding at ${width}`,
    );
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(120);

  const channels = left.locator("ul > li");
  assert.equal(await channels.count(), 3, "three contact channels");
  const channelHeights = [];
  for (let index = 0; index < 3; index += 1) {
    const height = Math.round((await channels.nth(index).boundingBox()).height);
    assert.ok(height >= 60, `channel row ${index + 1} min height`);
    channelHeights.push(height);
  }
  assert.ok(
    Math.max(...channelHeights) - Math.min(...channelHeights) <= 1,
    "channel rows share extra height evenly",
  );
  const lastChannel = await channels.nth(2).boundingBox();
  const availability = await left.getByTestId("contact-availability").boundingBox();
  assert.ok(lastChannel && availability);
  const channelGap = availability.y - (lastChannel.y + lastChannel.height);
  assert.ok(channelGap >= 0 && channelGap <= 8, "no dead gap above availability");
  assert.equal(
    await left
      .getByTestId("contact-availability")
      .evaluate((element) => getComputedStyle(element).paddingTop),
    "14px",
    "availability padding",
  );
  assert.equal(
    await left.getByText("Open to internships and freelance work", { exact: true }).count(),
    1,
  );
  assert.equal(
    await left.getByText("Usually replies in 1–2 days", { exact: true }).count(),
    1,
  );
  assert.equal(
    await left.locator(".status-dot").evaluate((element) => getComputedStyle(element).animationName),
    "status-pulse",
    "availability pulse",
  );

  const copyButton = left.getByRole("button", { name: "Copy email" });
  assert.equal(Math.round((await copyButton.boundingBox()).height), 32, "copy button height");
  await copyButton.click();
  await page.waitForTimeout(50);
  assert.equal(
    await page.evaluate(() => navigator.clipboard.readText()),
    EMAIL,
    "copy button writes the configured email",
  );
  assert.equal(
    await left.getByText("Email copied", { exact: true }).count(),
    1,
    "copy announcement",
  );

  assert.equal(
    Math.round((await page.locator("#contact-name").boundingBox()).height),
    44,
    "input height",
  );
  assert.ok(
    Number.parseFloat(
      await page
        .locator("#contact-message")
        .evaluate((element) => getComputedStyle(element).minHeight),
    ) >= 104,
    "textarea min height",
  );
  assert.equal(
    Math.round(
      (await page.getByRole("button", { name: "Send message" }).boundingBox()).height,
    ),
    44,
    "submit height",
  );

  for (const [id, name] of [
    ["contact-name", "Name"],
    ["contact-email", "Email"],
    ["contact-message", "Message"],
  ]) {
    assert.equal(
      await page.getByRole("textbox", { name }).count(),
      1,
      `${name} accessible name`,
    );
    const label = page.locator(`label[for="${id}"]`);
    assert.match(
      (await label.getAttribute("class")) ?? "",
      /\bsr-only\b/,
      `${name} label is sr-only`,
    );
    const labelBox = await label.boundingBox();
    assert.ok(
      labelBox && labelBox.width <= 1 && labelBox.height <= 1,
      `${name} label is not visibly rendered`,
    );
  }
  assert.equal(
    await page.getByText("What is this about?", { exact: true }).count(),
    0,
    "topic label is gone",
  );
  assert.equal(await page.getByRole("radiogroup").count(), 0, "no radiogroup");
  assert.equal(await page.getByRole("radio").count(), 0, "no topic chips");
  await assertPlaceholderContrast("dark desktop");

  const submit = page.getByRole("button", { name: "Send message" });
  const submitBox = await submit.boundingBox();
  const rightPanelBox = await right.boundingBox();
  assert.ok(submitBox && rightPanelBox);
  assert.ok(
    Math.abs(
      submitBox.y + submitBox.height + 20 - (rightPanelBox.y + rightPanelBox.height),
    ) <= 1,
    "no dead gap below submit",
  );

  const website = page.locator("#contact-website");
  assert.equal(await website.getAttribute("tabindex"), "-1");
  assert.equal(await website.getAttribute("autocomplete"), "off");
  const honeypot = await website.evaluate((element) => {
    const box = element.getBoundingClientRect();
    return {
      ariaHidden: element.closest('[aria-hidden="true"]') !== null,
      x: box.x,
      width: box.width,
      height: box.height,
    };
  });
  assert.equal(honeypot.ariaHidden, true, "honeypot is aria-hidden");
  assert.ok(honeypot.x + honeypot.width < 0, "honeypot is off-screen");

  await page.locator("#contact-name").fill("x".repeat(100));
  await page.locator("#contact-email").fill("ada@example.com");
  await page.locator("#contact-message").fill("y".repeat(1600));
  assert.equal(
    await page.getByText("1600/2000 characters used", { exact: true }).count(),
    1,
    "character counter at 80%",
  );
  const longFormHeight = (await form.boundingBox()).height;
  assert.equal(
    Math.round(longFormHeight),
    268,
    "counter does not change form height",
  );
  assert.equal(
    Math.round((await right.boundingBox()).height),
    Math.round(rightBox.height),
    "counter does not change panel height",
  );
  contactMode = "success";
  await page.getByRole("button", { name: "Send message" }).click();
  await success.waitFor();
  assert.equal(
    Math.round((await success.boundingBox()).height),
    Math.round(longFormHeight),
    "long message keeps success height",
  );
  assert.equal(
    Math.round((await right.boundingBox()).height),
    Math.round(rightBox.height),
    "long message keeps success panel height",
  );

  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("contact-section").scrollIntoViewIfNeeded();
  await page.getByRole("button", { name: "Send message" }).click();
  await page.waitForTimeout(100);
  assert.equal(
    await page.getByText("Enter your name.", { exact: true }).count(),
    1,
    "name required error",
  );
  assert.equal(
    await page.evaluate(() => document.activeElement?.id),
    "contact-name",
    "empty submit focuses first invalid field",
  );
  assert.equal(await page.locator("#contact-name").getAttribute("aria-invalid"), "true");
  assert.equal(
    await page.locator("#contact-name").getAttribute("aria-describedby"),
    "contact-name-error",
  );

  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("contact-section").scrollIntoViewIfNeeded();
  await fillValid();
  const formHeight = (await form.boundingBox()).height;
  contactMode = "success";
  contactDelay = 300;
  await page.getByRole("button", { name: "Send message" }).click();
  await page.waitForTimeout(80);
  assert.equal(
    await page.getByRole("button", { name: "Sending…" }).isDisabled(),
    true,
    "sending button is disabled",
  );
  assert.equal(
    await page.getByTestId("contact-form").getAttribute("aria-busy"),
    "true",
  );
  await success.waitFor();
  contactDelay = 0;
  assert.ok(lastContactBody, "client posted the contact form");
  assert.equal("topic" in lastContactBody, false, "client omits topic");
  assert.equal(
    await page.getByText("Message sent", { exact: true }).count(),
    1,
  );
  assert.equal(
    await page
      .getByText("Thanks, Ada. I'll reply to ada@example.com soon.", { exact: true })
      .count(),
    1,
  );
  const successHeight = (await success.boundingBox()).height;
  assert.equal(Math.round(successHeight), Math.round(formHeight), "success keeps height");
  assert.equal(
    Math.round((await right.boundingBox()).height),
    Math.round(rightBox.height),
    "success keeps panel height",
  );
  await page.getByRole("button", { name: "Send another" }).click();
  await form.waitFor();
  assert.equal(await page.locator("#contact-name").inputValue(), "");

  await fillValid();
  await page.locator("#contact-message").focus();
  await page.keyboard.press("Control+Enter");
  await success.waitFor();
  assert.equal(
    await page.getByText("Message sent", { exact: true }).count(),
    1,
    "Ctrl+Enter submits",
  );

  for (const [mode, expected] of [
    ["bad", "Use a different email."],
    ["rate", "Too many messages. Try again later, or email me directly."],
    ["failed", "Couldn't send your message. Try again, or email me directly."],
  ]) {
    await page.reload({ waitUntil: "networkidle" });
    await page.getByTestId("contact-section").scrollIntoViewIfNeeded();
    contactMode = mode;
    await fillValid();
    await page.getByRole("button", { name: "Send message" }).click();
    await page.waitForTimeout(250);
    assert.equal(
      await page.getByText(expected, { exact: false }).count() > 0,
      true,
      `${mode} path copy`,
    );
    if (mode === "bad") {
      assert.equal(
        await page.evaluate(() => document.activeElement?.id),
        "contact-email",
        "400 response focuses the first server error",
      );
    } else {
      assert.equal(
        await page.getByRole("alert").getByRole("link", { name: EMAIL }).count(),
        1,
        `${mode} path exposes a mailto link`,
      );
    }
  }

  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("contact-section").scrollIntoViewIfNeeded();
  contactMode = "unconfigured";
  await fillValid();
  await page.getByRole("button", { name: "Send message" }).click();
  const notConfigured = page.getByTestId("contact-not-configured");
  await notConfigured.waitFor();
  assert.equal(
    Math.round((await notConfigured.boundingBox()).height),
    Math.round(formHeight),
    "not-configured keeps compact height",
  );
  assert.equal(
    Math.round((await right.boundingBox()).height),
    Math.round(rightBox.height),
    "not-configured keeps panel height",
  );
  assert.equal(
    await page
      .getByText(
        "Messages can't be sent from this site yet. You can send it from your own email app instead.",
        { exact: true },
      )
      .count(),
    1,
  );
  const mailto = notConfigured.getByRole("link", { name: "Open email app" });
  const mailtoHref = decodeURIComponent(
    (await mailto.getAttribute("href")) ?? "",
  );
  assert.match(
    mailtoHref,
    /^mailto:hello@example\.com\?subject=Hello from your portfolio&body=/,
  );
  assert.match(
    mailtoHref,
    /I would like to talk about a small data project\./,
    "mailto body contains the message",
  );
  assert.equal(/topic/i.test(mailtoHref), false, "mailto has no topic");
  assert.equal(page.url(), `${BASE_URL}/#contact`.replace("/#contact", "/"), "no mail auto-open");

  contactMode = "success";
  await page.reload({ waitUntil: "networkidle" });
  await page.setViewportSize({ width: 390, height: 900 });
  await page.getByTestId("contact-section").scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const mobileLeft = await left.boundingBox();
  const mobileRight = await right.boundingBox();
  assert.ok(mobileLeft && mobileRight);
  assert.ok(mobileRight.y >= mobileLeft.y + mobileLeft.height, "panels stack at 390");
  assert.equal(Math.round(mobileLeft.width), Math.round(mobileRight.width));
  await assertNoOverflow(390);
  await runAxe("dark mobile");
  await assertPlaceholderContrast("dark mobile");
  await page.getByRole("button", { name: /Switch to light theme/ }).click();
  await page.waitForFunction(() => document.documentElement.classList.contains("light"));
  await page.waitForTimeout(200);
  await runAxe("light mobile");
  await assertPlaceholderContrast("light mobile");

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(200);
  await runAxe("light desktop");
  await page.getByRole("button", { name: /Switch to dark theme/ }).click();
  await page.waitForFunction(() => document.documentElement.classList.contains("dark"));
  await page.waitForTimeout(200);
  await runAxe("dark desktop");

  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(150);
    await assertNoOverflow(width);
  }

  const testIp = `203.0.113.${(Date.now() % 250) + 1}`;
  const real = async (data) =>
    context.request.post(`${BASE_URL}/api/contact`, {
      data,
      headers: { "x-forwarded-for": testIp },
    });
  const old = Date.now() - 3000;
  const valid = {
    name: "Ada Lovelace",
    email: "ada@example.com",
    message: "This is a valid contact message.",
    website: "",
    startedAt: old,
  };

  const bad = await real({ ...valid, email: "not-an-email" });
  assert.equal(bad.status(), 400);
  const badBody = await bad.json();
  assert.equal(badBody.ok, false);
  assert.equal(badBody.error, "validation");
  assert.ok(badBody.fields.email);

  const strayTopic = await context.request.post(`${BASE_URL}/api/contact`, {
    data: { ...valid, topic: "project" },
    headers: { "x-forwarded-for": `198.51.100.${(Date.now() % 250) + 1}` },
  });
  assert.equal(strayTopic.status(), 503, "stray topic is ignored");
  const strayTopicBody = await strayTopic.json();
  assert.equal(strayTopicBody.error, "not_configured");
  assert.equal(strayTopicBody.fields, undefined, "stray topic is not a field error");

  const statuses = [];
  const bodies = [];
  for (let index = 0; index < 6; index += 1) {
    const response = await real(valid);
    statuses.push(response.status());
    bodies.push(await response.json());
  }
  assert.deepEqual(statuses.slice(0, 5), [503, 503, 503, 503, 503]);
  assert.equal(bodies[0].ok, false);
  assert.equal(bodies[0].error, "not_configured");
  assert.equal(
    JSON.stringify(bodies[0]).includes("RESEND_API_KEY"),
    false,
    "503 response does not expose env names",
  );
  assert.equal(statuses[5], 429, "sixth real request is rate limited");
  assert.equal(bodies[5].ok, false);
  assert.equal(bodies[5].error, "rate_limited");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.reload({ waitUntil: "networkidle" });
  await page.getByTestId("contact-section").scrollIntoViewIfNeeded();
  assert.equal(
    await left.locator(".status-dot").evaluate((element) => getComputedStyle(element).animationName),
    "none",
    "availability pulse stops under reduced motion",
  );
  await page.emulateMedia({ reducedMotion: "no-preference" });

  assert.deepEqual(consoleErrors, [], "console should have no errors");
  console.log("contact checks passed (1440, 1024, 768, 390, 320; form states; copy; API; axe)");
} finally {
  await browser.close();
}
