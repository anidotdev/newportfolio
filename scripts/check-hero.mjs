import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

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

async function waitForOneVisibleTitle() {
  await page.waitForFunction(() => {
    const visible = [...document.querySelectorAll("[data-title-item]")].filter(
      (element) => {
        const style = getComputedStyle(element);
        const rect = element.getBoundingClientRect();
        return (
          style.display !== "none" &&
          style.visibility !== "hidden" &&
          Number(style.opacity) > 0 &&
          rect.width > 0 &&
          rect.height > 0
        );
      },
    );
    return visible.length === 1;
  });
}

try {
  await page.goto("http://localhost:3000", { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(250);

    await assertNoOverflow(width);

    const banner = await box(page.getByTestId("hero-banner"));
    assert.equal(
      Math.round(banner.height),
      width >= 768 ? 260 : 160,
      `banner height at ${width}`,
    );
    assert.equal(
      Math.round(banner.width),
      Math.min(width, 768) - 20,
      `banner width at ${width}`,
    );

    const avatar = await box(page.getByTestId("hero-avatar"));
    const avatarSize = width >= 768 ? 160 : 96;
    assert.equal(Math.round(avatar.width), avatarSize, `avatar width at ${width}`);
    assert.equal(
      Math.round(avatar.height),
      avatarSize,
      `avatar height at ${width}`,
    );
    const avatarRadius = Number.parseFloat(
      await page
        .getByTestId("hero-avatar")
        .evaluate((element) => getComputedStyle(element).borderRadius),
    );
    assert.ok(
      avatarRadius >= avatarSize / 2,
      `avatar should be circular at ${width}`,
    );

    const identity = await box(page.getByTestId("hero-identity"));
    assert.ok(
      Math.abs(
        avatar.y + avatar.height - (identity.y + identity.height),
      ) <= 1,
      `avatar bottom should equal identity bottom at ${width}`,
    );

    const hatch = await box(page.getByTestId("hero-hatch"));
    const viewportWidth = await page.evaluate(
      () => document.documentElement.clientWidth,
    );
    assert.equal(
      Math.round(hatch.width),
      viewportWidth,
      `hatch should span the viewport at ${width}`,
    );

    const socials = page.getByTestId("social-link");
    assert.equal(await socials.count(), 5, `social link count at ${width}`);
    for (let index = 0; index < 5; index += 1) {
      const social = await box(socials.nth(index));
      assert.equal(Math.round(social.width), 40, `social width at ${width}`);
      assert.equal(Math.round(social.height), 40, `social height at ${width}`);
    }

    const note = page.getByTestId("follow-note");
    if (width === 1440) {
      await note.waitFor({ state: "visible" });
      assert.equal(await note.count(), 1, "follow note should exist at 1440");
    } else {
      assert.equal(await note.count(), 0, `follow note should be absent at ${width}`);
    }

    await waitForOneVisibleTitle();
  }

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);

  const blurAtTop = await page.getByTestId("bottom-blur").evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      position: style.position,
      pointerEvents: style.pointerEvents,
      opacity: Number(style.opacity),
    };
  });
  assert.equal(blurAtTop.position, "fixed", "blur overlay should be fixed");
  assert.equal(
    blurAtTop.pointerEvents,
    "none",
    "blur overlay should not capture pointers",
  );
  assert.ok(blurAtTop.opacity > 0, "blur overlay should be visible at the top");

  await page.evaluate(() =>
    window.scrollTo(0, document.documentElement.scrollHeight),
  );
  await page.waitForTimeout(450);
  const opacityAtBottom = await page
    .getByTestId("bottom-blur")
    .evaluate((element) => Number(getComputedStyle(element).opacity));
  assert.equal(opacityAtBottom, 0, "blur overlay should fade at the bottom");

  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(350);
  assert.ok(
    (await page
      .getByTestId("bottom-blur")
      .evaluate((element) => Number(getComputedStyle(element).opacity))) > 0,
    "blur overlay should return at the top",
  );

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
  console.log("hero checks passed (1440, 1024, 768, 390)");
} finally {
  await browser.close();
}
