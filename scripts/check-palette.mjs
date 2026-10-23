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
      body: JSON.stringify(SPOTIFY),
    });
  } catch {
    // The page can navigate away while a request is still pending.
  }
});

const dialog = page.getByRole("dialog", { name: "Command menu" });
const input = page.getByPlaceholder("Type a command or search…");

async function openWithShortcut(key = "Control+k") {
  await page.keyboard.press(key);
  await dialog.waitFor();
}

async function closeWithEscape() {
  await page.keyboard.press("Escape");
  await dialog.waitFor({ state: "detached" });
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
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  await openWithShortcut();
  assert.equal(
    await page.locator('input[placeholder="Type a command or search…"]').count(),
    1,
  );

  const firstBox = await dialog.boundingBox();
  assert.ok(firstBox);
  assert.ok(Math.abs(firstBox.y - 900 * 0.18) <= 2, "desktop top offset");
  assert.ok(firstBox.width <= 640, "palette max width");
  assert.equal(
    await page.locator('[cmdk-item=""]').first().evaluate((element) => {
      return Math.round(element.getBoundingClientRect().height);
    }),
    44,
    "desktop item height",
  );
  assert.ok(
    (await page.locator(".command-shortcut:visible").count()) > 0,
    "desktop shortcut letters",
  );

  await page.keyboard.press("ArrowDown");
  await page.keyboard.press("ArrowDown");
  assert.ok(await dialog.getByText("Open link", { exact: true }).count());
  for (let index = 0; index < 5; index += 1) {
    await page.keyboard.press("ArrowDown");
  }
  assert.ok(await dialog.getByText("Run command", { exact: true }).count());

  const blogItem = dialog.getByRole("option", { name: "Blog" });
  assert.equal(
    await blogItem.getAttribute("data-href"),
    "https://medium.com/@anidotdev",
    "Blog palette href",
  );
  assert.equal(await blogItem.getAttribute("data-kind"), "external");

  await input.fill("pro");
  assert.equal(
    await dialog.getByRole("option", { name: "Projects" }).count(),
    1,
    "filtered Projects item",
  );
  await page.keyboard.press("Enter");
  await dialog.waitFor({ state: "detached" });
  await page.waitForTimeout(600);
  assert.equal(
    await page.evaluate(() => window.location.hash),
    "#projects",
    "Enter navigates to projects",
  );
  assert.equal(
    await page.evaluate(() => document.activeElement?.hasAttribute("data-command-trigger")),
    true,
    "focus returns to the search trigger",
  );

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(100);
  await openWithShortcut("Meta+k");
  assert.equal(await dialog.isVisible(), true, "Meta+K opens the palette");
  await closeWithEscape();
  assert.equal(
    await page.evaluate(() => document.activeElement?.hasAttribute("data-command-trigger")),
    true,
    "focus returns to the trigger after Escape",
  );

  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.waitForTimeout(100);
  await page.keyboard.press("g");
  await page.keyboard.press("h");
  await page.waitForTimeout(600);
  assert.equal(
    await page.evaluate(() => window.location.hash),
    "",
    "g then h should navigate home",
  );

  await page.evaluate(() => {
    const field = document.createElement("input");
    field.id = "chord-test-input";
    document.body.append(field);
    field.focus();
  });
  await page.evaluate(() => window.scrollTo(0, 1200));
  await page.keyboard.press("g");
  await page.keyboard.press("h");
  await page.waitForTimeout(200);
  assert.equal(
    await page.evaluate(() => document.activeElement?.id),
    "chord-test-input",
    "chords are ignored while typing",
  );
  await page.evaluate(() => document.getElementById("chord-test-input")?.remove());

  await openWithShortcut();
  await page.keyboard.press("Tab");
  for (let index = 0; index < 5; index += 1) {
    assert.equal(
      await page.evaluate(() =>
        Boolean(
          document
            .querySelector('[role="dialog"]')
            ?.contains(document.activeElement),
        ),
      ),
      true,
      "focus should stay inside the dialog",
    );
    await page.keyboard.press("Tab");
  }
  await closeWithEscape();

  await openWithShortcut();
  await runAxe("dark");
  await closeWithEscape();

  await page.getByRole("button", { name: "Switch to light theme" }).click();
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("light"),
  );
  await openWithShortcut();
  await runAxe("light");
  await closeWithEscape();

  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await openWithShortcut();
    await assertNoOverflow(width);

    const box = await dialog.boundingBox();
    assert.ok(box);
    if (width === 390) {
      assert.ok(Math.abs(box.y - 900 * 0.12) <= 2, "mobile top offset");
      assert.equal(
        await page.locator('[cmdk-item=""]').first().evaluate((element) => {
          return Math.round(element.getBoundingClientRect().height);
        }),
        48,
        "mobile item height",
      );
      assert.equal(
        await page.locator(".command-shortcut:visible").count(),
        0,
        "mobile hides shortcut letters",
      );
    }

    await closeWithEscape();
  }

  await page.setViewportSize({ width: 390, height: 900 });
  await page.locator('[data-command-trigger]:visible').first().click();
  await dialog.waitFor();
  assert.equal(await dialog.isVisible(), true, "mobile search button opens palette");
  await page.getByPlaceholder("Type a command or search…").fill("zzz");
  assert.equal(
    await dialog.getByText("No results for “zzz”.", { exact: true }).count(),
    1,
    "empty state quotes the query",
  );
  assert.equal(
    await dialog.getByText("Try a page name, like projects.", { exact: true }).count(),
    1,
    "empty state hint",
  );
  await closeWithEscape();

  await page.emulateMedia({ reducedMotion: "reduce" });
  await openWithShortcut();
  const motionStyle = await dialog.evaluate((element) => ({
    duration: getComputedStyle(element).animationDuration,
    transform: getComputedStyle(element).transform,
  }));
  assert.ok(
    Number.parseFloat(motionStyle.duration) <= 0.001,
    "reduced motion makes the dialog animation effectively instant",
  );
  assert.equal(motionStyle.transform, "none", "reduced motion has no scale");
  await closeWithEscape();

  assert.deepEqual(consoleErrors, [], "console should have no errors");
  console.log("palette checks passed (1440, 1024, 768, 390)");
} finally {
  await browser.close();
}
