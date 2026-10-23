import assert from "node:assert/strict";
import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const consoleErrors = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});

await page.route("**/api/spotify", async (route) => {
  try {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        ok: true,
        isPlaying: false,
        title: "Another track",
        artists: ["Artist one", "Artist two"],
        albumArt: null,
        url: "https://open.spotify.com/track/last",
      }),
    });
  } catch {
    // The page can navigate away while a request is still pending.
  }
});

await page.route("**/api/contact", async (route) => {
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

try {
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(150);

    const header = await page.locator("header").boundingBox();
    assert.ok(header, `header missing at ${width}`);
    assert.equal(Math.round(header.height), 64, `header height at ${width}`);
    assert.equal(
      Math.round(header.width),
      await page.evaluate(() => document.documentElement.clientWidth),
      `header should span the viewport at ${width}`,
    );

    const shell = await page.locator("header > div").boundingBox();
    assert.ok(shell, `container missing at ${width}`);
    assert.equal(
      Math.round(shell.width),
      Math.min(width, 768),
      `container width at ${width}`,
    );

    const metrics = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }));
    const center = shell.x + shell.width / 2;
    assert.ok(
      Math.abs(center - metrics.clientWidth / 2) <= 1,
      `container not centered at ${width}`,
    );

    if (width === 390) {
      assert.equal(
        metrics.scrollWidth,
        metrics.clientWidth,
        "horizontal overflow at 390",
      );
      assert.equal(
        await page.locator('nav[aria-label="Primary"]:visible').count(),
        0,
        "mobile nav should be closed initially",
      );

      await page.getByRole("button", { name: "Open menu" }).click();
      await page.getByRole("navigation", { name: "Primary" }).waitFor();
      assert.equal(
        await page.locator('nav[aria-label="Primary"]:visible').count(),
        1,
        "exactly one visible primary nav with the mobile menu open",
      );
      for (const label of ["Home", "Projects", "Blog"]) {
        assert.equal(
          await page
            .getByRole("link", {
              name: new RegExp(`^${label}`),
            })
            .count(),
          1,
          `mobile menu link ${label}`,
        );
      }
      assert.equal(
        await page.getByText("Experience", { exact: true }).count(),
        0,
        "Experience should be removed",
      );
      assert.equal(
        await page.getByText("More", { exact: true }).count(),
        0,
        "More should be removed",
      );
      assert.equal(
        await page.evaluate(() => getComputedStyle(document.body).overflow),
        "hidden",
        "body scroll should lock while the menu is open",
      );
      await page.keyboard.press("Escape");
      await page
        .locator('nav[aria-label="Primary"]:visible')
        .waitFor({ state: "detached" });
      await page.waitForTimeout(250);
      assert.notEqual(
        await page.evaluate(() => getComputedStyle(document.body).overflow),
        "hidden",
        "body scroll should unlock after the menu closes",
      );
    } else {
      assert.equal(
        await page.locator('nav[aria-label="Primary"]:visible').count(),
        1,
        `exactly one visible primary nav at ${width}`,
      );
    }
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(150);

  const primaryNav = page.locator('nav[aria-label="Primary"]:visible');
  assert.deepEqual(
    await primaryNav.getByRole("link").allTextContents(),
    ["Home", "Projects", "Blog (opens in new tab)"],
    "desktop nav items",
  );
  const blog = primaryNav.getByRole("link", { name: /^Blog/ });
  assert.equal(
    await blog.getAttribute("href"),
    "https://medium.com/@anidotdev",
    "Blog should link to Medium",
  );
  assert.equal(await blog.getAttribute("target"), "_blank");
  assert.match((await blog.getAttribute("rel")) ?? "", /\bnoopener\b/);
  assert.equal(
    await page.getByRole("button", { name: "More", exact: true }).count(),
    0,
    "More dropdown should be removed",
  );

  let home = primaryNav.getByRole("link", { name: "Home" });
  let projectsNav = primaryNav.getByRole("link", { name: "Projects" });
  assert.equal(await home.getAttribute("aria-current"), "page");
  assert.equal(
    await home.getByTestId("active-nav-dot").count(),
    1,
    "Home dot at the top",
  );

  await page.locator("#projects").scrollIntoViewIfNeeded();
  await page.waitForFunction(() =>
    document
      .querySelector('nav[aria-label="Primary"] a[href="/#projects"]')
      ?.getAttribute("aria-current") === "page",
  );
  projectsNav = primaryNav.getByRole("link", { name: "Projects" });
  assert.equal(await projectsNav.getAttribute("aria-current"), "page");
  assert.equal(
    await projectsNav.getByTestId("active-nav-dot").count(),
    1,
    "Projects dot while in view",
  );
  assert.equal(
    await primaryNav.getByRole("link", { name: /^Blog/ }).getAttribute(
      "aria-current",
    ),
    null,
    "Blog is never active",
  );

  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(100);
  assert.equal(
    Math.round((await page.locator("header").boundingBox()).y),
    0,
    "header should stick to the top",
  );
  assert.equal(
    await page.locator("header").getByText("2.4K").count(),
    1,
    "compact star count should render",
  );
  assert.equal(
    await page.locator("header kbd:visible").count(),
    2,
    "search should show two keyboard chips",
  );

  await page.setViewportSize({ width: 390, height: 900 });
  const wasDark = await page.evaluate(() =>
    document.documentElement.classList.contains("dark"),
  );
  assert.equal(wasDark, true, "dark theme should be the default");
  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("light"),
  );
  assert.equal(
    await page.evaluate(() => document.documentElement.classList.contains("dark")),
    false,
    "theme toggle should leave dark mode",
  );

  await page.waitForTimeout(200);
  assert.deepEqual(consoleErrors, [], "console should have no errors");
  console.log("header checks passed (1440, 1024, 768, 390)");
} finally {
  await browser.close();
}
