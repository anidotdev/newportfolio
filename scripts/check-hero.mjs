import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

const BASE_URL = "http://localhost:3000";

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
  title: "A long recently played track title for responsive truncation",
  artists: ["Artist one", "Artist two", "Artist three"],
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

let spotifyMode = "playing";

await page.route("**/api/spotify", async (route) => {
  const body =
    spotifyMode === "playing"
      ? playing
      : spotifyMode === "last"
        ? lastPlayed
        : failure;

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

async function waitForSpotifyStatus(label) {
  await page.waitForFunction((expected) => {
    const status = document.querySelector('[data-testid="spotify-status"]');
    return status?.textContent?.trim() === expected;
  }, label);
}

async function assertSpotifyPlacement(width) {
  const row = await box(page.getByTestId("spotify-status-row"));
  const social = await box(page.getByTestId("social-link").first());
  const gap = row.y - (social.y + social.height);

  assert.ok(gap >= 0, `Spotify row should follow the social row at ${width}`);
  assert.ok(
    gap <= 20,
    `Spotify row should sit directly below the social row at ${width}`,
  );
  assert.ok(
    Math.abs(row.x - social.x) <= 1,
    `Spotify row should align with social links at ${width}`,
  );
  assert.ok(
    row.x + row.width <= width + 1,
    `Spotify row should stay inside the viewport at ${width}`,
  );

  const followsSocials = await page.evaluate(() => {
    const socialLink = document.querySelector('[data-testid="social-link"]');
    const statusRow = document.querySelector('[data-testid="spotify-status-row"]');
    return Boolean(
      socialLink &&
        statusRow &&
        socialLink.compareDocumentPosition(statusRow) &
          Node.DOCUMENT_POSITION_FOLLOWING,
    );
  });
  assert.ok(followsSocials, `Spotify row should follow social links at ${width}`);
}

async function assertSpotifyFits(width) {
  const metrics = await page
    .getByTestId("spotify-status-row")
    .evaluate((element) => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    }));
  assert.ok(
    metrics.scrollWidth <= metrics.clientWidth + 1,
    `Spotify row should not overflow at ${width}`,
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
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await waitForSpotifyStatus("Now Playing");

  assert.equal(
    await page.locator('[role="group"][aria-label="Profile details"]').count(),
    0,
    "profile information group should be removed",
  );
  for (const text of [
    "West Bengal, India",
    "hello@example.com",
    "+91 00000 00000",
    "same time",
  ]) {
    assert.equal(
      await page.getByText(text, { exact: true }).count(),
      0,
      `${text} should be removed`,
    );
  }
  assert.equal(await page.locator('a[href^="mailto:"]').count(), 0);
  assert.equal(await page.locator('a[href^="tel:"]').count(), 0);

  const socialNav = page.getByRole("navigation", { name: "Social links" });
  assert.equal(await socialNav.count(), 1, "social nav");
  const socials = page.getByTestId("social-link");
  assert.equal(await socials.count(), 5, "social link count");
  for (let index = 0; index < 5; index += 1) {
    const social = socials.nth(index);
    assert.ok(await social.isVisible(), `social link ${index} visible`);
    assert.ok(await social.getAttribute("href"), `social link ${index} href`);
  }

  const status = page.getByTestId("spotify-status");
  assert.equal(await status.innerText(), "Now Playing", "playing status");
  const track = page.getByTestId("spotify-track");
  const trackLink = track.getByRole("link");
  assert.equal(await trackLink.count(), 1, "playing track link");
  assert.equal(await trackLink.getAttribute("href"), playing.url);
  assert.equal(await trackLink.getAttribute("target"), "_blank");
  assert.equal(await trackLink.getAttribute("rel"), "noopener noreferrer");
  const playingText = (await track.innerText()).replace(/\s+/g, " ").trim();
  assert.match(playingText, /Test track/, "playing title");
  assert.match(playingText, /Test artist/, "playing artist");

  const icon = page.getByTestId("spotify-icon");
  assert.equal(await icon.getAttribute("role"), "img");
  assert.equal(await icon.getAttribute("aria-label"), "Spotify");
  assert.equal(
    await icon.evaluate((element) => getComputedStyle(element).color),
    "rgb(29, 185, 84)",
    "Spotify icon should be green",
  );
  assert.equal(
    await status.evaluate((element) => getComputedStyle(element).fontSize),
    "12px",
    "status label size",
  );
  assert.equal(
    await track.evaluate((element) => getComputedStyle(element).fontSize),
    "14px",
    "track text size",
  );

  const row = page.getByTestId("spotify-status-row");
  const rowStyle = await row.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      backgroundColor: style.backgroundColor,
      borderTopWidth: style.borderTopWidth,
      borderRightWidth: style.borderRightWidth,
      borderBottomWidth: style.borderBottomWidth,
      borderLeftWidth: style.borderLeftWidth,
      borderRadius: style.borderRadius,
    };
  });
  assert.equal(rowStyle.backgroundColor, "rgba(0, 0, 0, 0)");
  assert.equal(rowStyle.borderTopWidth, "0px");
  assert.equal(rowStyle.borderRightWidth, "0px");
  assert.equal(rowStyle.borderBottomWidth, "0px");
  assert.equal(rowStyle.borderLeftWidth, "0px");
  assert.equal(rowStyle.borderRadius, "0px");

  assert.equal(await page.getByTestId("spotify-card").count(), 0);
  assert.equal(await page.getByTestId("spotify-caption").count(), 0);
  assert.equal(await page.getByTestId("spotify-status-dot").count(), 0);
  assert.equal(await page.getByText("SYNCED", { exact: true }).count(), 0);
  assert.equal(await page.getByText("NOT SYNCED", { exact: true }).count(), 0);

  const about = page.getByTestId("about-section");
  assert.equal(
    await page.getByRole("heading", { name: "About", level: 2 }).count(),
    1,
    "About heading",
  );
  assert.equal(
    await page.getByTestId("about-bio").locator("li").count(),
    3,
    "About bio bullets",
  );
  assert.equal(
    await page.getByRole("list", { name: "Tech stack" }).count(),
    1,
    "About tech stack",
  );
  assert.equal(
    await page.getByRole("region", { name: "Next sections" }).count(),
    1,
    "About spacer",
  );
  assert.equal(
    await about.getByTestId("spotify-card").count(),
    0,
    "old card should not be in About",
  );
  assert.equal(
    await about.getByTestId("spotify-status-row").count(),
    0,
    "Spotify row should not be in About",
  );
  assert.equal(
    await about.locator("img").count(),
    0,
    "About should not render album art",
  );

  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(250);

    await assertNoOverflow(width);
    await assertSpotifyPlacement(width);
    await assertSpotifyFits(width);

    const spotifyRow = await box(row);
    const aboutRow = await box(about);
    assert.ok(
      spotifyRow.y + spotifyRow.height <= aboutRow.y + 1,
      `Spotify row should stay before About at ${width}`,
    );
    assert.ok(
      (await box(status)).width > 0,
      `status label should stay visible at ${width}`,
    );
    assert.ok(
      (await box(icon)).width > 0,
      `Spotify icon should stay visible at ${width}`,
    );

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

  spotifyMode = "last";
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await waitForSpotifyStatus("Last played");

  assert.equal(await status.innerText(), "Last played", "last played status");
  const lastLink = page.getByTestId("spotify-track").getByRole("link");
  assert.equal(await lastLink.getAttribute("href"), lastPlayed.url);
  assert.equal(await lastLink.getAttribute("target"), "_blank");
  assert.equal(await lastLink.getAttribute("rel"), "noopener noreferrer");
  const lastText = (await track.innerText()).replace(/\s+/g, " ").trim();
  assert.match(lastText, /A long recently played track title/);
  assert.match(lastText, /Artist one, Artist two, Artist three/);
  await assertSpotifyPlacement(1440);
  await assertSpotifyFits(1440);

  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(250);
  await assertNoOverflow(390);
  await assertSpotifyPlacement(390);
  await assertSpotifyFits(390);
  const truncation = await lastLink.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      overflow: style.overflow,
      textOverflow: style.textOverflow,
      whiteSpace: style.whiteSpace,
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
    };
  });
  assert.deepEqual(
    [truncation.overflow, truncation.textOverflow, truncation.whiteSpace],
    ["hidden", "ellipsis", "nowrap"],
    "long track text should truncate",
  );
  assert.ok(
    truncation.scrollWidth > truncation.clientWidth,
    "long track text should actually be truncated at 390",
  );

  spotifyMode = "failure";
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await waitForSpotifyStatus("Last played");
  assert.equal(
    await page.getByTestId("spotify-track").getByRole("link").getAttribute("href"),
    failure.url,
    "fallback link",
  );
  const failureText = (await page.getByTestId("spotify-track").innerText())
    .replace(/\s+/g, " ")
    .trim();
  assert.match(failureText, /Track title/);
  assert.match(failureText, /Artist name/);
  assert.equal(await page.getByText("NOT SYNCED", { exact: true }).count(), 0);

  spotifyMode = "last";
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);
  await waitForSpotifyStatus("Last played");

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
  await assertNoOverflow(1440);
  await page.getByRole("button", { name: /Switch to light theme/ }).click();
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("light"),
  );
  await page.waitForTimeout(250);
  await assertNoOverflow(1440);
  assert.equal(
    await page
      .getByTestId("spotify-icon")
      .evaluate((element) => getComputedStyle(element).color),
    "rgb(29, 185, 84)",
    "Spotify icon remains green in light theme",
  );
  await runAxe("light desktop");

  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(250);
  await assertNoOverflow(390);
  await assertSpotifyPlacement(390);
  await assertSpotifyFits(390);
  await runAxe("light mobile");
  await page.getByRole("button", { name: /Switch to dark theme/ }).click();
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("dark"),
  );
  await page.waitForTimeout(250);
  await assertNoOverflow(390);
  await assertSpotifyPlacement(390);
  await assertSpotifyFits(390);
  await runAxe("dark mobile");

  assert.deepEqual(consoleErrors, [], "console should have no errors");
  console.log(
    "hero checks passed (1440, 1024, 768, 390; playing/last/failure; light/dark)",
  );
} finally {
  await browser.close();
}
