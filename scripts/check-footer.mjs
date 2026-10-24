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
const BANNER_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 822 120" width="822" height="120"><rect width="822" height="120" fill="none"/></svg>';
const BANNER_RATIO = 822 / 120;
const bannerRequests = [];

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

async function stub(pageToStub, requestLog = bannerRequests) {
  await pageToStub.route("https://ascii.rest/**", async (route) => {
    requestLog.push(route.request().url());
    try {
      await route.fulfill({
        status: 200,
        contentType: "image/svg+xml",
        body: BANNER_SVG,
      });
    } catch {
      // The page can navigate away while a request is still pending.
    }
  });
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

function bannerRequestKinds() {
  return bannerRequests.map((url) =>
    url.includes(".dark.svg") ? "dark" : "light",
  );
}

async function setTheme(theme) {
  const current = await page.evaluate(() =>
    document.documentElement.classList.contains("dark") ? "dark" : "light",
  );
  if (current === theme) return;

  await page
    .getByRole("button", {
      name: theme === "dark" ? /Switch to dark theme/ : /Switch to light theme/,
    })
    .click();
  await page.waitForFunction(
    (next) => document.documentElement.classList.contains(next),
    theme,
  );
  await page.waitForTimeout(250);
}

async function assertBanner(footer, theme, width) {
  const label = `${theme} banner at ${width}`;
  const banner = footer.getByTestId("footer-banner");
  const inner = banner.getByTestId("footer-banner-inner");
  assert.equal(await banner.getAttribute("aria-hidden"), "true", `${label} is decorative`);
  assert.equal(
    await banner.evaluate((element) => getComputedStyle(element).borderTopWidth),
    "1px",
    `${label} hairline`,
  );
  assert.equal(
    await banner.evaluate(
      (element) => element === element.parentElement?.lastElementChild,
    ),
    true,
    `${label} is last`,
  );

  const light = banner.locator('img[src*="Animesh.svg"]');
  const dark = banner.locator('img[src*="Animesh.dark.svg"]');
  assert.equal(await light.count(), 1, `${label} light image`);
  assert.equal(await dark.count(), 1, `${label} dark image`);

  const lightSrc = (await light.getAttribute("src")) ?? "";
  const darkSrc = (await dark.getAttribute("src")) ?? "";
  assert.match(darkSrc, /\.dark\.svg/, `${label} dark source`);
  assert.equal(lightSrc.includes(".dark.svg"), false, `${label} light source`);
  assert.match(
    lightSrc,
    /\/banner\/Animesh\.svg\?art=command-code&place=right$/,
    `${label} light URL`,
  );
  assert.match(
    darkSrc,
    /\/banner\/Animesh\.dark\.svg\?art=command-code&place=right$/,
    `${label} dark URL`,
  );

  assert.equal(await light.isVisible(), theme === "light", `${label} light visibility`);
  assert.equal(await dark.isVisible(), theme === "dark", `${label} dark visibility`);

  for (const image of [light, dark]) {
    assert.equal(await image.getAttribute("alt"), "", `${label} empty alt`);
    assert.equal(await image.getAttribute("loading"), "lazy", `${label} lazy`);
    assert.equal(await image.getAttribute("decoding"), "async", `${label} async`);
    assert.equal(
      await image.getAttribute("referrerpolicy"),
      "no-referrer",
      `${label} referrer`,
    );
    assert.equal(await image.getAttribute("width"), "822", `${label} width attr`);
    assert.equal(await image.getAttribute("height"), "120", `${label} height attr`);
  }

  const visible = theme === "dark" ? dark : light;
  await visible.evaluate((image) => image.decode().catch(() => {}));
  const box = await visible.boundingBox();
  assert.ok(box && box.height > 0, `${label} rendered`);
  const ratio = box.width / box.height;
  assert.ok(
    Math.abs(ratio - BANNER_RATIO) / BANNER_RATIO <= 0.01,
    `${label} ratio ${ratio.toFixed(3)}`,
  );

  const metrics = await inner.evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return {
      paddingTop: Number.parseFloat(style.paddingTop),
      paddingBottom: Number.parseFloat(style.paddingBottom),
      paddingLeft: Number.parseFloat(style.paddingLeft),
      paddingRight: Number.parseFloat(style.paddingRight),
      contentLeft: rect.left + Number.parseFloat(style.paddingLeft),
      contentRight: rect.right - Number.parseFloat(style.paddingRight),
      contentWidth:
        element.clientWidth -
        Number.parseFloat(style.paddingLeft) -
        Number.parseFloat(style.paddingRight),
    };
  });
  assert.ok(
    box.width <= metrics.contentWidth + 0.5,
    `${label} fits the container`,
  );
  assert.ok(
    Math.abs(box.x - metrics.contentLeft - (metrics.contentRight - (box.x + box.width))) <= 2,
    `${label} centered`,
  );
  assert.equal(metrics.paddingLeft, 20, `${label} left padding`);
  assert.equal(metrics.paddingRight, 20, `${label} right padding`);
  assert.equal(metrics.paddingTop, width >= 768 ? 40 : 32, `${label} top padding`);
  assert.equal(
    metrics.paddingBottom,
    width >= 768 ? 48 : 40,
    `${label} bottom padding`,
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

  assert.equal(
    await footer.locator(".footer-wordmark").count(),
    0,
    "wordmark row is gone",
  );
  assert.equal(
    await footer.getByText("Animesh", { exact: true }).count(),
    0,
    "standalone wordmark text is gone",
  );
  await assertBanner(footer, "dark", 1440);
  assert.equal(
    bannerRequestKinds().filter((kind) => kind === "light").length,
    0,
    "hidden light banner is not requested",
  );
  assert.ok(
    bannerRequestKinds().includes("dark"),
    "visible dark banner is requested",
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

  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await page.waitForTimeout(450);
  assert.equal(
    await page
      .getByTestId("bottom-blur")
      .evaluate((element) => Number(getComputedStyle(element).opacity)),
    0,
    "blur fades at the page bottom",
  );

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
  await assertBanner(footer, "dark", 390);
  await runAxe("dark mobile");

  await setTheme("light");
  await assertBanner(footer, "light", 390);
  assert.ok(
    bannerRequestKinds().includes("light"),
    "light banner loads when shown",
  );
  await runAxe("light mobile");

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(200);
  await assertBanner(footer, "light", 1440);
  await runAxe("light desktop");
  await setTheme("dark");
  await assertBanner(footer, "dark", 1440);
  await runAxe("dark desktop");

  for (const width of [1024, 768]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(150);
    await setTheme("dark");
    await assertBanner(footer, "dark", width);
    await setTheme("light");
    await assertBanner(footer, "light", width);
    await assertNoOverflow(width);
  }
  await setTheme("dark");
  assert.equal(
    bannerRequestKinds().filter((kind) => kind === "dark").length,
    1,
    "dark banner requested once",
  );
  assert.equal(
    bannerRequestKinds().filter((kind) => kind === "light").length,
    1,
    "light banner requested once",
  );

  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(150);
    await assertNoOverflow(width);
  }

  const yearPage = await context.newPage();
  await stub(yearPage, []);
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
