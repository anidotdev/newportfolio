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

await page.route("**/api/contact", async (route) => {
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

  const channels = left.locator("ul > li");
  assert.equal(await channels.count(), 3, "three contact channels");
  for (let index = 0; index < 3; index += 1) {
    assert.equal(
      Math.round((await channels.nth(index).boundingBox()).height),
      64,
      `channel row ${index + 1} height`,
    );
  }
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

  const projectTopic = page.getByRole("radio", { name: "Project" });
  assert.equal(await projectTopic.getAttribute("aria-checked"), "true");
  assert.equal(Math.round((await projectTopic.boundingBox()).height), 36);
  await projectTopic.focus();
  await page.keyboard.press("ArrowRight");
  const internshipTopic = page.getByRole("radio", { name: "Internship or job" });
  assert.equal(await internshipTopic.getAttribute("aria-checked"), "true");
  assert.equal(
    await page.evaluate(() => document.activeElement?.textContent),
    "Internship or job",
    "topic arrow keys move focus",
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
  await page.locator("#contact-message").fill("y".repeat(1600));
  assert.equal(
    await page.getByText("1600/2000 characters used", { exact: true }).count(),
    1,
    "character counter at 80%",
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
    await page
      .getByText(
        "Messages can't be sent from this site yet. You can send it from your own email app instead.",
        { exact: true },
      )
      .count(),
    1,
  );
  const mailto = notConfigured.getByRole("link", { name: "Open email app" });
  assert.match(
    (await mailto.getAttribute("href")) ?? "",
    /^mailto:hello@example\.com\?subject=Portfolio%20message%20from%20Ada/,
  );
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
  await page.getByRole("button", { name: /Switch to light theme/ }).click();
  await page.waitForFunction(() => document.documentElement.classList.contains("light"));
  await page.waitForTimeout(200);
  await runAxe("light mobile");

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
    topic: "project",
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
