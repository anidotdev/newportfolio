import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";
const EXPECTED_TECH = [
  "Python",
  "Go",
  "JavaScript",
  "C++",
  "AWS",
  "Google Cloud",
];

const lastPlayed = {
  ok: true,
  isPlaying: false,
  title: "Another track",
  artists: ["Artist one", "Artist two"],
  albumArt: null,
  url: "https://open.spotify.com/track/last",
};

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1440, height: 900 },
});
const page = await context.newPage();
const consoleErrors = [];

page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("pageerror", (error) => consoleErrors.push(error.message));

await page.route("**/api/spotify", async (route) => {
  try {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(lastPlayed),
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

async function box(locator) {
  const result = await locator.boundingBox();
  assert.ok(result, "element should have a bounding box");
  return result;
}

async function assertNoOverflow(width) {
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    documentScrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));

  assert.equal(
    metrics.documentScrollWidth,
    metrics.clientWidth,
    `document overflows horizontally at ${width}`,
  );
  assert.ok(
    metrics.bodyScrollWidth <= metrics.clientWidth,
    `body overflows horizontally at ${width}`,
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

  const about = page.getByTestId("about-section");
  const heading = page.getByRole("heading", { name: "About", level: 2 });
  await heading.waitFor();

  assert.equal(await page.getByTestId("spotify-card").count(), 0, "old card");
  assert.equal(
    await page.getByTestId("spotify-caption").count(),
    0,
    "old synced caption",
  );
  assert.equal(
    await page.getByTestId("spotify-status-dot").count(),
    0,
    "old status dot",
  );
  assert.equal(
    await about.getByTestId("spotify-card").count(),
    0,
    "old card inside About",
  );
  assert.equal(
    await about.getByTestId("spotify-status-row").count(),
    0,
    "Spotify row should not be inside About",
  );
  assert.equal(
    await about.locator("img").count(),
    0,
    "About should not render album art",
  );
  assert.equal(
    await page.getByText("SYNCED", { exact: true }).count(),
    0,
    "old SYNCED caption should be absent",
  );
  assert.equal(
    await page.getByText("NOT SYNCED", { exact: true }).count(),
    0,
    "old NOT SYNCED caption should be absent",
  );

  const bio = page.getByTestId("about-bio");
  assert.equal(await bio.locator("li").count(), 3, "bio should have 3 bullets");
  assert.equal(
    await page
      .getByTestId("about-bio-text")
      .first()
      .evaluate((element) => getComputedStyle(element).lineHeight),
    "30px",
    "bio line-height at 1440",
  );
  assert.equal(
    await heading.evaluate((element) => getComputedStyle(element).fontSize),
    "30px",
    "section title size",
  );

  const bioLink = bio.getByRole("link", { name: "Github" });
  assert.equal(await bioLink.getAttribute("href"), "https://github.com/anidotdev");
  assert.equal(await bioLink.getAttribute("target"), "_blank");
  assert.equal(await bioLink.getAttribute("rel"), "noopener noreferrer");

  const nextSections = page.getByRole("region", { name: "Next sections" });
  assert.equal(await nextSections.count(), 0, "next sections region should be removed");
  assert.equal(
    await page.getByText("next sections go here", { exact: true }).count(),
    0,
    "next sections spacer copy should be removed",
  );
  assert.equal(
    await page.getByRole("heading", { name: /Projects/ }).count(),
    1,
    "Projects heading should follow About",
  );

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(200);

  const sectionBox = await box(about);
  const shell = page.getByTestId("about-shell");
  const shellBox = await box(shell);
  assert.equal(Math.round(shellBox.width), 768, "shell width at 1440");
  assert.equal(Math.round(shellBox.height), Math.round(sectionBox.height));
  const shellBorders = await shell.evaluate((element) => {
    const style = getComputedStyle(element);
    return [style.borderLeftWidth, style.borderRightWidth];
  });
  assert.deepEqual(shellBorders, ["1px", "1px"], "shell edge hairlines");

  const separators = about.getByTestId("section-separator");
  assert.equal(await separators.count(), 2, "two hatch separators");
  for (let index = 0; index < 2; index += 1) {
    const separator = separators.nth(index);
    const separatorBox = await box(separator);
    assert.equal(Math.round(separatorBox.width), 1440, "separator width");
    assert.equal(Math.round(separatorBox.height), 32, "separator height");
    const borders = await separator.evaluate((element) => {
      const style = getComputedStyle(element);
      return [style.borderTopWidth, style.borderBottomWidth];
    });
    assert.deepEqual(borders, ["1px", "1px"], "separator hairlines");
  }

  const rows = about.getByTestId("section-row");
  assert.equal(await rows.count(), 3, "three About rows");
  for (let index = 0; index < 3; index += 1) {
    const row = rows.nth(index);
    const rowBox = await box(row);
    assert.equal(Math.round(rowBox.width), 1440, "row width");
    const border = await row.evaluate(
      (element) => getComputedStyle(element).borderBottomWidth,
    );
    assert.equal(border, index < 2 ? "1px" : "0px", `row border at ${index}`);
  }

  const techList = page.getByRole("list", { name: "Tech stack" });
  assert.equal(await techList.count(), 1, "tech list should have an aria-label");
  const techItems = techList.locator("li");
  assert.equal(await techItems.count(), 6, "tech item count");
  assert.deepEqual(
    await techItems.locator(".sr-only").allTextContents(),
    EXPECTED_TECH,
    "tech order",
  );
  for (let index = 0; index < 6; index += 1) {
    const glyphBox = await box(techItems.nth(index).locator("svg"));
    assert.ok(glyphBox.width >= 40, "tech glyph width");
    assert.ok(glyphBox.height >= 40, "tech glyph height");
  }
  assert.equal(
    await page.getByText("TECH STACK", { exact: true }).count(),
    1,
    "tech label",
  );

  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(250);
    await assertNoOverflow(width);

    const lineHeight = await page
      .getByTestId("about-bio-text")
      .first()
      .evaluate((element) => getComputedStyle(element).lineHeight);
    assert.equal(
      Math.round(Number.parseFloat(lineHeight)),
      width < 768 ? 26 : 30,
      `bio line-height at ${width}`,
    );

    const currentShellBox = await box(page.getByTestId("about-shell"));
    assert.equal(
      Math.round(currentShellBox.width),
      Math.min(width, 768),
      `shell width at ${width}`,
    );

    const currentSeparators = page.getByTestId("section-separator");
    for (let index = 0; index < 2; index += 1) {
      const separatorBox = await box(currentSeparators.nth(index));
      assert.equal(
        Math.round(separatorBox.width),
        width,
        `separator viewport width at ${width}`,
      );
    }

    const currentRows = about.getByTestId("section-row");
    assert.equal(await currentRows.count(), 3, `row count at ${width}`);
    for (let index = 0; index < 3; index += 1) {
      const rowBox = await box(currentRows.nth(index));
      assert.equal(Math.round(rowBox.width), width, `row viewport width at ${width}`);
    }

    const glyphBox = await box(page.getByTestId("tech-item").first().locator("svg"));
    assert.ok(glyphBox.width >= 40, `tech glyph width at ${width}`);
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);

  await runAxe("dark desktop");
  await page.getByRole("button", { name: /Switch to light theme/ }).click();
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("light"),
  );
  await page.waitForTimeout(250);
  await runAxe("light desktop");

  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(250);
  await runAxe("light mobile");
  await page.getByRole("button", { name: /Switch to dark theme/ }).click();
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("dark"),
  );
  await page.waitForTimeout(250);
  await runAxe("dark mobile");

  assert.deepEqual(consoleErrors, [], "console should have no errors");
  console.log("about checks passed (1440, 1024, 768, 390; no card)");
} finally {
  await browser.close();
}
