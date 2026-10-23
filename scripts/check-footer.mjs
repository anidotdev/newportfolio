import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";
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
const page = await context.newPage();
const consoleErrors = [];

page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

async function stub(pageToStub) {
  await pageToStub.route("**/api/spotify", async (route) => {
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
  await pageToStub.route("**/api/contact", async (route) => {
    try {
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        body: JSON.stringify({ ok: false, error: "not_configured" }),
      });
    } catch {
      // The page can navigate away while a request is still pending.
    }
  });
}

await stub(page);

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
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  const footer = page.getByTestId("site-footer");
  const contact = page.getByTestId("contact-section");
  await footer.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);

  assert.equal(
    await footer.getByRole("heading", { name: "Footer" }).count(),
    1,
    "footer landmark label",
  );
  assert.equal(
    Math.round((await footer.getByTestId("section-separator").boundingBox()).height),
    32,
    "footer hatch height",
  );

  const navigate = footer.getByRole("navigation", { name: "Navigate" });
  const socials = footer.getByRole("navigation", { name: "Socials" });
  const elsewhere = footer.getByRole("navigation", { name: "Elsewhere" });
  assert.equal(await navigate.count(), 1);
  assert.equal(await socials.count(), 1);
  assert.equal(await elsewhere.count(), 1);

  assert.deepEqual(
    await navigate.getByRole("link").allTextContents(),
    ["Home", "Projects", "Blog (opens in new tab)", "Contact"],
    "navigate links",
  );
  const blog = navigate.getByRole("link", { name: /^Blog/ });
  assert.equal(await blog.getAttribute("href"), "https://medium.com/@anidotdev");
  assert.equal(await blog.getAttribute("target"), "_blank");
  assert.match((await blog.getAttribute("rel")) ?? "", /\bnoopener\b/);

  assert.equal(await socials.getByRole("link").count(), 3, "three social links");
  for (const label of ["GitHub", "X", "LinkedIn"]) {
    const link = socials.getByRole("link", { name: new RegExp(`^${label}`) });
    assert.equal(await link.count(), 1, `social ${label}`);
    assert.equal(await link.getAttribute("target"), "_blank");
    assert.match((await link.getAttribute("rel")) ?? "", /\bnoopener\b/);
  }

  assert.deepEqual(
    await elsewhere.getByRole("link").allTextContents(),
    ["Medium (opens in new tab)", "Email"],
    "elsewhere links",
  );
  assert.equal(
    await elsewhere.getByRole("link", { name: /^Medium/ }).getAttribute("href"),
    "https://medium.com/@anidotdev",
  );
  assert.equal(
    await elsewhere.getByRole("link", { name: "Email", exact: true }).getAttribute("href"),
    "mailto:hello@example.com",
  );

  const columnBoxes = [
    await navigate.boundingBox(),
    await socials.boundingBox(),
    await elsewhere.boundingBox(),
  ];
  assert.ok(columnBoxes.every(Boolean));
  assert.ok(
    Math.abs(columnBoxes[0].y - columnBoxes[1].y) <= 1 &&
      Math.abs(columnBoxes[1].y - columnBoxes[2].y) <= 1,
    "three footer columns share a row at 1440",
  );
  assert.ok(
    columnBoxes[0].x < columnBoxes[1].x &&
      columnBoxes[1].x < columnBoxes[2].x,
    "footer columns run left to right",
  );

  const year = new Date().getFullYear();
  await page.waitForFunction(
    (expected) =>
      document.querySelector('[data-testid="site-footer"] time')?.textContent?.trim() ===
      String(expected),
    year,
  );
  assert.equal(
    await footer.locator("time").innerText(),
    String(year),
    "footer year",
  );
  assert.equal(
    await footer.getByText("Built with Next.js and Tailwind CSS", { exact: true }).count(),
    1,
  );
  assert.equal(
    await footer.getByText(`© ${year} Animesh Gautam`, { exact: true }).count(),
    1,
  );

  const wordmark = footer.locator(".footer-wordmark");
  assert.equal(await wordmark.innerText(), "Animesh");
  assert.equal(await wordmark.getAttribute("aria-hidden"), "true");
  assert.ok(
    Number.parseFloat(await wordmark.evaluate((element) => getComputedStyle(element).fontSize)) >=
      64,
    "wordmark is oversized",
  );
  assert.equal(
    await wordmark.evaluate((element) => getComputedStyle(element).overflow),
    "visible",
    "wordmark text itself is not clipped",
  );
  assert.equal(
    await wordmark.evaluate((element) => element.parentElement.style.overflow),
    "",
    "wordmark wrapper uses the overflow-hidden utility",
  );
  assert.equal(
    await wordmark.evaluate((element) => getComputedStyle(element.parentElement).overflow),
    "hidden",
    "wordmark wrapper clips overflow",
  );

  const footerBox = await footer.boundingBox();
  const contactBox = await contact.boundingBox();
  assert.ok(footerBox && contactBox);
  assert.ok(footerBox.y >= contactBox.y + contactBox.height, "footer follows contact");
  assert.equal(
    Math.round(footerBox.width),
    await page.evaluate(() => document.documentElement.clientWidth),
    "footer is full width",
  );

  const sentinel = await page.locator("#page-end").boundingBox();
  assert.ok(sentinel);
  assert.ok(sentinel.y >= footerBox.y + footerBox.height, "page-end follows footer");

  await page.getByRole("button", { name: "Back to top" }).click();
  await page.waitForTimeout(900);
  assert.equal(
    await page.evaluate(() => document.activeElement?.id),
    "main-content",
    "back to top focuses main",
  );
  assert.ok(
    (await page.evaluate(() => window.scrollY)) < 80,
    "back to top scrolls to the top",
  );

  await navigate.getByRole("link", { name: "Contact" }).click();
  await page.waitForTimeout(600);
  assert.equal(await page.evaluate(() => location.hash), "#contact");
  assert.equal(
    await page.evaluate(() => {
      const box = document.getElementById("contact")?.getBoundingClientRect();
      return Boolean(box && box.top >= 60 && box.top <= 100);
    }),
    true,
    "contact link respects the scroll margin",
  );

  await page.setViewportSize({ width: 390, height: 900 });
  await footer.scrollIntoViewIfNeeded();
  await page.waitForTimeout(200);
  const mobileBoxes = [
    await navigate.boundingBox(),
    await socials.boundingBox(),
    await elsewhere.boundingBox(),
  ];
  assert.ok(mobileBoxes.every(Boolean));
  assert.ok(
    Math.abs(mobileBoxes[0].x - mobileBoxes[1].x) <= 1 &&
      Math.abs(mobileBoxes[1].x - mobileBoxes[2].x) <= 1,
    "footer stacks to one column at 390",
  );
  assert.ok(
    mobileBoxes[0].y < mobileBoxes[1].y &&
      mobileBoxes[1].y < mobileBoxes[2].y,
    "footer columns stack top to bottom",
  );
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

  const yearPage = await context.newPage();
  await stub(yearPage);
  await yearPage.addInitScript(() => {
    const RealDate = Date;
    const fixed = "2031-05-05T12:00:00Z";
    class MockDate extends RealDate {
      constructor(...args) {
        if (args.length === 0) {
          super(fixed);
        } else {
          super(...args);
        }
      }
      static now() {
        return new RealDate(fixed).getTime();
      }
    }
    window.Date = MockDate;
  });
  await yearPage.goto(BASE_URL, { waitUntil: "networkidle" });
  await yearPage.waitForFunction(
    () =>
      document.querySelector('[data-testid="site-footer"] time')?.textContent?.trim() ===
      "2031",
  );
  assert.equal(
    await yearPage.getByTestId("site-footer").locator("time").innerText(),
    "2031",
    "footer year comes from the client clock",
  );
  await yearPage.close();

  assert.deepEqual(consoleErrors, [], "console should have no errors");
  console.log("footer checks passed (1440, 1024, 768, 390, 320; columns; year; back to top; axe)");
} finally {
  await browser.close();
}
