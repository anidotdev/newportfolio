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

const playing = {
  ok: true,
  isPlaying: true,
  title: "Test track",
  artists: ["Test artist"],
  albumArt: null,
  url: "https://open.spotify.com/track/now",
};

const lastPlayed = {
  ok: true,
  isPlaying: false,
  title: "Another track",
  artists: ["Artist one", "Artist two"],
  albumArt: null,
  url: "https://open.spotify.com/track/last",
};

const failure = {
  ok: false,
  isPlaying: false,
  title: "Track title",
  artists: ["Artist name"],
  albumArt: null,
  url: "https://open.spotify.com",
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

let mode = "playing";
let delayMs = 0;

await page.route("**/api/spotify", async (route) => {
  if (delayMs) await new Promise((resolve) => setTimeout(resolve, delayMs));

  const body = mode === "playing" ? playing : mode === "last" ? lastPlayed : failure;

  try {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(body),
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

async function waitForCard() {
  await page.waitForFunction(() => {
    const card = document.querySelector('[data-testid="spotify-card"]');
    return (
      card?.tagName === "A" &&
      card.getAttribute("href")?.startsWith("https://open.spotify.com")
    );
  });

  return page.getByTestId("spotify-card");
}

async function captionText() {
  return page
    .getByTestId("spotify-caption")
    .evaluate((element) =>
      (element.textContent ?? "").replace(/[\u00a0\u202f]/g, " ").trim(),
    );
}

async function waitForSyncedCaption() {
  await page.waitForFunction(() => {
    const element = document.querySelector('[data-testid="spotify-caption"]');
    const text = (element?.textContent ?? "")
      .replace(/[\u00a0\u202f]/g, " ")
      .trim();
    return /^SYNCED \d{1,2}:\d{2} (AM|PM)$/i.test(text);
  });
}

async function waitForNotSyncedCaption() {
  await page.waitForFunction(() =>
    (document.querySelector('[data-testid="spotify-caption"]')?.textContent ?? "")
      .replace(/[\u00a0\u202f]/g, " ")
      .trim()
      .match(/^NOT SYNCED$/i),
  );
}

try {
  mode = "playing";
  delayMs = 1500;
  await page.goto(BASE_URL, { waitUntil: "domcontentloaded" });

  const skeleton = page.getByTestId("spotify-card");
  await skeleton.waitFor();
  const skeletonBox = await box(skeleton);
  assert.equal(Math.round(skeletonBox.height), 112, "loading card height");

  delayMs = 0;
  let card = await waitForCard();
  await waitForSyncedCaption();
  await page.evaluate(() => document.fonts.ready);

  const cardBox = await box(card);
  assert.equal(Math.round(cardBox.height), 112, "loaded card height");
  assert.equal(
    Math.round(cardBox.height),
    Math.round(skeletonBox.height),
    "card height should not shift after loading",
  );
  assert.ok(cardBox.width <= 480, "card should be at most 480px wide");
  assert.equal(cardBox.width, 480, "card should use its maximum width at 1440");
  assert.equal(
    Math.round(cardBox.x + cardBox.width / 2),
    720,
    "card should be centered",
  );
  assert.equal(
    await card.getAttribute("target"),
    "_blank",
    "card should open in a new tab",
  );
  assert.equal(
    await card.getAttribute("rel"),
    "noopener noreferrer",
    "card should use a safe rel",
  );
  assert.equal(
    await card.getAttribute("aria-label"),
    "Now playing on Spotify: Now playing Test track by Test artist",
    "playing aria-label",
  );
  assert.equal(await page.getByTestId("spotify-status").innerText(), "Now playing");
  assert.equal(
    await page
      .getByTestId("spotify-status-dot")
      .evaluate((element) => getComputedStyle(element).backgroundColor),
    "rgb(29, 185, 84)",
    "playing dot should be Spotify green",
  );
  assert.match(await captionText(), /^SYNCED \d{1,2}:\d{2} (AM|PM)$/i);

  await page.getByRole("heading", { name: "About", level: 2 }).waitFor();
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
    await page
      .getByRole("heading", { name: "About", level: 2 })
      .evaluate((element) => getComputedStyle(element).fontSize),
    "30px",
    "section title size",
  );

  const bioLink = page.getByRole("link", { name: "sample link" });
  assert.equal(await bioLink.getAttribute("href"), "https://example.com");
  assert.equal(await bioLink.getAttribute("target"), "_blank");
  assert.equal(await bioLink.getAttribute("rel"), "noopener noreferrer");

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.waitForTimeout(200);

  const sectionBox = await box(page.getByTestId("about-section"));
  const shell = page.getByTestId("about-shell");
  const shellBox = await box(shell);
  assert.equal(Math.round(shellBox.width), 1000, "shell width at 1440");
  assert.equal(Math.round(shellBox.height), Math.round(sectionBox.height));
  const shellBorders = await shell.evaluate((element) => {
    const style = getComputedStyle(element);
    return [style.borderLeftWidth, style.borderRightWidth];
  });
  assert.deepEqual(shellBorders, ["1px", "1px"], "shell edge hairlines");

  const separators = page.getByTestId("section-separator");
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

  const rows = page.getByTestId("section-row");
  assert.equal(await rows.count(), 5, "five About rows");
  for (let index = 0; index < 5; index += 1) {
    const row = rows.nth(index);
    const rowBox = await box(row);
    assert.equal(Math.round(rowBox.width), 1440, "row width");
    const border = await row.evaluate(
      (element) => getComputedStyle(element).borderBottomWidth,
    );
    assert.equal(border, index < 3 ? "1px" : "0px", `row border at ${index}`);
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

    const currentCard = await waitForCard();
    const currentCardBox = await box(currentCard);
    assert.equal(Math.round(currentCardBox.height), 112, `card height at ${width}`);
    assert.ok(currentCardBox.width <= 480, `card width at ${width}`);

    const titleSize = await currentCard
      .locator("p")
      .first()
      .evaluate((element) => getComputedStyle(element).fontSize);
    assert.equal(titleSize, width < 768 ? "18px" : "22px", `title size at ${width}`);

    const statusMetrics = await page
      .getByTestId("spotify-status")
      .evaluate((element) => ({
        clientWidth: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));
    assert.ok(
      statusMetrics.scrollWidth <= statusMetrics.clientWidth + 1,
      `status should not truncate at ${width}`,
    );

    const textTruncation = await currentCard.locator("p").evaluateAll((elements) =>
      elements.map((element) => {
        const style = getComputedStyle(element);
        return [style.overflow, style.textOverflow, style.whiteSpace];
      }),
    );
    assert.deepEqual(
      textTruncation,
      [
        ["hidden", "ellipsis", "nowrap"],
        ["hidden", "ellipsis", "nowrap"],
      ],
      `title and artists should truncate cleanly at ${width}`,
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

    const currentRows = page.getByTestId("section-row");
    for (let index = 0; index < 5; index += 1) {
      const rowBox = await box(currentRows.nth(index));
      assert.equal(Math.round(rowBox.width), width, `row viewport width at ${width}`);
    }

    const glyphBox = await box(page.getByTestId("tech-item").first().locator("svg"));
    assert.ok(glyphBox.width >= 40, `tech glyph width at ${width}`);
  }

  mode = "last";
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload({ waitUntil: "domcontentloaded" });
  card = await waitForCard();
  await waitForSyncedCaption();
  assert.equal(await page.getByTestId("spotify-status").innerText(), "Last played");
  assert.equal(
    await card.getAttribute("aria-label"),
    "Last played on Spotify: Last played Another track by Artist one, Artist two",
    "last played aria-label",
  );
  assert.notEqual(
    await page
      .getByTestId("spotify-status-dot")
      .evaluate((element) => getComputedStyle(element).backgroundColor),
    "rgb(29, 185, 84)",
    "last played dot should not be green",
  );

  mode = "failure";
  await page.reload({ waitUntil: "domcontentloaded" });
  card = await waitForCard();
  await waitForNotSyncedCaption();
  assert.equal(await page.getByTestId("spotify-status").innerText(), "Last played");
  assert.equal(
    await card.getAttribute("aria-label"),
    "Last played on Spotify: Last played Track title by Artist name",
    "fallback aria-label",
  );
  assert.equal(await captionText(), "NOT SYNCED");

  const apiResponse = await page.request.get(`${BASE_URL}/api/spotify`);
  assert.equal(apiResponse.status(), 200, "API should return 200");
  assert.match(
    apiResponse.headers()["cache-control"] ?? "",
    /s-maxage=30/,
    "API cache header",
  );
  const apiText = await apiResponse.text();
  const apiBody = JSON.parse(apiText);
  assert.equal(apiBody.ok, false, "API should fall back without credentials");
  assert.equal(apiBody.isPlaying, false, "fallback should not be playing");
  assert.ok(!apiText.includes("SPOTIFY_"), "API body must not expose env names");
  assert.ok(!apiText.includes("client_secret"), "API body must not expose secrets");
  assert.deepEqual(
    Object.keys(apiBody).sort(),
    ["albumArt", "artists", "isPlaying", "ok", "title", "url"],
    "API response shape",
  );

  mode = "last";
  await page.reload({ waitUntil: "domcontentloaded" });
  await waitForCard();
  await waitForSyncedCaption();
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
  console.log(
    "about checks passed (1440, 1024, 768, 390; playing/last/failure)",
  );
} finally {
  await browser.close();
}
