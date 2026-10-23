import assert from "node:assert/strict";
import AxeBuilder from "@axe-core/playwright";
import { chromium } from "playwright";

import {
  groupProjects,
  INITIAL_VISIBLE_PROJECTS,
} from "../src/lib/projects.mjs";

const BASE_URL = "http://localhost:3000";
const EXPECTED = [
  {
    name: "Placeholder project one",
    period: "MM.YYYY\u2009–\u2009Present",
    hasLink: true,
  },
  {
    name: "Placeholder project two",
    period: "MM.YYYY\u2009–\u2009MM.YYYY",
    hasLink: true,
  },
  {
    name: "Placeholder project three",
    period: "MM.YYYY\u2009–\u2009Present",
    hasLink: false,
  },
  {
    name: "Placeholder project four",
    period: "MM.YYYY\u2009–\u2009Present",
    hasLink: false,
  },
  {
    name: "Placeholder project five",
    period: "MM.YYYY\u2009–\u2009MM.YYYY",
    hasLink: true,
  },
];

assert.equal(INITIAL_VISIBLE_PROJECTS, 3);
assert.deepEqual(groupProjects([]), {
  visible: [],
  remaining: [],
  hasMore: false,
});
assert.deepEqual(groupProjects([1, 2, 3]), {
  visible: [1, 2, 3],
  remaining: [],
  hasMore: false,
});
assert.deepEqual(groupProjects([1, 2, 3, 4]), {
  visible: [1, 2, 3],
  remaining: [4],
  hasMore: true,
});
assert.equal(
  groupProjects([1, 2, 3]).hasMore,
  false,
  "show-more control must be hidden for three projects",
);

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

await context.route("https://example.com/**", async (route) => {
  await route.fulfill({
    status: 200,
    contentType: "text/html",
    body: "<p>Example</p>",
  });
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

async function panelHeight(panel) {
  return panel.evaluate((element) => element.getBoundingClientRect().height);
}

try {
  await page.goto(BASE_URL, { waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  const projects = page.getByTestId("projects-section");
  const heading = page.getByRole("heading", { name: /Projects/ });
  await heading.waitFor();

  assert.equal(await page.getByText("next sections go here", { exact: true }).count(), 0);
  assert.equal(
    await page.getByRole("region", { name: "Next sections" }).count(),
    0,
    "old placeholder region should be gone",
  );

  assert.equal(await heading.count(), 1, "Projects heading");
  assert.equal(
    await heading.locator("sup").innerText(),
    `(${EXPECTED.length})`,
    "heading count should match configured projects",
  );

  const rows = projects.getByTestId("section-row");
  assert.equal(
    await rows.count(),
    EXPECTED.length + 2,
    "heading row, projects, and show-more row",
  );
  assert.equal(
    await projects.getByTestId("project-title").count(),
    EXPECTED.length,
    "project count",
  );
  assert.deepEqual(
    await projects.getByTestId("project-title").allInnerTexts(),
    EXPECTED.map((project) => project.name),
    "project names",
  );
  assert.deepEqual(
    await projects.getByTestId("project-period-value").allInnerTexts(),
    EXPECTED.map((project) => project.period),
    "project periods",
  );
  assert.equal(
    (await page.locator("body").innerText()).includes("∞"),
    false,
    "infinity should not appear anywhere",
  );
  assert.equal(
    await projects.getByTestId("project-period").first().getAttribute("aria-label"),
    "from MM.YYYY to present",
    "open-ended period screen-reader label",
  );
  assert.equal(
    await projects.getByTestId("project-period").nth(1).getAttribute("aria-label"),
    "from MM.YYYY to MM.YYYY",
    "ended period screen-reader label",
  );

  const icons = projects.getByTestId("project-icon");
  assert.equal(await icons.count(), EXPECTED.length, "project icons");
  for (let index = 0; index < INITIAL_VISIBLE_PROJECTS; index += 1) {
    const iconBox = await box(icons.nth(index));
    assert.equal(Math.round(iconBox.width), 32, "icon tile width");
    assert.equal(Math.round(iconBox.height), 32, "icon tile height");
    assert.equal(await icons.nth(index).locator("svg").count(), 1, "icon glyph");
    const iconStyle = await icons.nth(index).evaluate((element) => {
      const style = getComputedStyle(element);
      return {
        radius: style.borderRadius,
        border: style.borderTopWidth,
        background: style.backgroundColor,
      };
    });
    assert.equal(iconStyle.radius, "8px", "icon tile radius");
    assert.equal(iconStyle.border, "1px", "icon tile hairline");
    assert.notEqual(iconStyle.background, "rgba(0, 0, 0, 0)", "icon tile surface");
  }

  const toggle = page.getByTestId("projects-toggle");
  const more = page.getByTestId("projects-more");
  await toggle.waitFor();
  assert.equal(await toggle.count(), 1, "show-more control should render");
  assert.equal(await toggle.innerText(), "Show more");
  assert.equal(await toggle.getAttribute("aria-expanded"), "false");
  assert.equal(await toggle.getAttribute("aria-controls"), "projects-more");
  assert.equal(
    await more.getAttribute("aria-hidden"),
    "true",
    "additional projects should start hidden",
  );
  assert.notEqual(
    await more.getAttribute("inert"),
    null,
    "additional projects should start inert",
  );
  assert.equal(
    Math.round(await panelHeight(more)),
    0,
    "additional projects should have no height initially",
  );

  const toggleBox = await box(toggle);
  const shellBox = await box(page.getByTestId("projects-shell"));
  assert.equal(Math.round(toggleBox.height), 38, "show-more height");
  assert.equal(
    Math.round(toggleBox.x + toggleBox.width / 2),
    Math.round(shellBox.x + shellBox.width / 2),
    "show-more control should be centered",
  );
  assert.ok(
    toggleBox.width < shellBox.width - 40,
    "show-more control should not stretch to the container width",
  );

  const thirdRowBox = await box(rows.nth(INITIAL_VISIBLE_PROJECTS));
  assert.equal(
    Math.round(toggleBox.y - (thirdRowBox.y + thirdRowBox.height)),
    20,
    "show-more control should sit 20px below the last visible row",
  );
  const projectsBox = await box(projects);
  assert.ok(
    projectsBox.y + projectsBox.height - (toggleBox.y + toggleBox.height) >= 20,
    "show-more control should have bottom breathing room",
  );

  const toggleStyle = await toggle.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      radius: style.borderRadius,
      paddingLeft: style.paddingLeft,
      paddingRight: style.paddingRight,
      fontSize: style.fontSize,
      fontWeight: style.fontWeight,
      gap: style.gap,
      border: style.borderTopWidth,
      background: style.backgroundColor,
    };
  });
  assert.equal(toggleStyle.radius, "9px", "show-more radius");
  assert.equal(toggleStyle.paddingLeft, "16px", "show-more left padding");
  assert.equal(toggleStyle.paddingRight, "16px", "show-more right padding");
  assert.equal(toggleStyle.fontSize, "16px", "show-more text size");
  assert.equal(toggleStyle.fontWeight, "600", "show-more text weight");
  assert.equal(toggleStyle.gap, "10px", "show-more icon gap");
  assert.equal(toggleStyle.border, "1px", "show-more hairline");
  assert.notEqual(
    toggleStyle.background,
    "rgba(0, 0, 0, 0)",
    "show-more should have a surface",
  );

  const toggleIcon = toggle.locator("svg");
  assert.equal(await toggleIcon.count(), 1, "show-more chevron");
  const toggleIconBox = await box(toggleIcon);
  assert.equal(Math.round(toggleIconBox.width), 16, "show-more chevron width");
  assert.equal(Math.round(toggleIconBox.height), 16, "show-more chevron height");
  const toggleLabelBox = await box(toggle.locator("span").first());
  assert.equal(
    Math.round(toggleIconBox.x - (toggleLabelBox.x + toggleLabelBox.width)),
    10,
    "show-more label-to-chevron gap",
  );
  const initialChevron = await toggleIcon.evaluate((element) => {
    const style = getComputedStyle(element);
    return { rotate: style.rotate, transform: style.transform };
  });

  const links = projects.getByTestId("project-link");
  const disclosures = projects.getByTestId("project-disclosure");
  assert.equal(
    await links.count(),
    EXPECTED.filter((project) => project.hasLink).length,
    "only projects with URLs show a link",
  );
  assert.equal(await disclosures.count(), EXPECTED.length, "disclosure controls");
  assert.equal(
    await rows.nth(3).getByTestId("project-link").count(),
    0,
    "project without a URL should hide its external-link control",
  );
  assert.equal(
    await rows.nth(2).getByTestId("project-features").count(),
    0,
    "empty feature lists should not render",
  );
  assert.equal(
    await rows.nth(2).getByTestId("project-tags").count(),
    0,
    "empty tag containers should not render",
  );

  const firstLink = links.nth(0);
  assert.equal(await firstLink.getAttribute("href"), "https://example.com");
  assert.equal(await firstLink.getAttribute("target"), "_blank");
  assert.equal(await firstLink.getAttribute("rel"), "noopener noreferrer");
  assert.equal(
    await firstLink.getAttribute("aria-label"),
    "Open Placeholder project one",
  );
  assert.equal(
    await firstLink.locator("svg[data-icon='link']").count(),
    1,
    "project link should use the chain icon",
  );
  assert.equal(
    await disclosures.nth(0).getAttribute("aria-label"),
    "Collapse Placeholder project one",
  );
  assert.equal(
    await disclosures.nth(0).locator("svg[data-icon='collapse']").count(),
    1,
    "open project should use chevrons-down-up",
  );
  assert.equal(
    await disclosures.nth(1).locator("svg[data-icon='expand']").count(),
    1,
    "closed project should use chevrons-up-down",
  );

  const panels = projects.getByTestId("project-panel");
  assert.equal(await panels.count(), EXPECTED.length, "project panels");
  for (let index = 0; index < EXPECTED.length; index += 1) {
    const controls = await disclosures.nth(index).getAttribute("aria-controls");
    assert.ok(controls, "disclosure should have aria-controls");
    assert.equal(
      await page.locator(`#${controls}`).count(),
      1,
      "aria-controls should point to the panel",
    );
  }

  assert.equal(
    await disclosures.nth(0).getAttribute("aria-expanded"),
    "true",
    "first project should start expanded",
  );
  assert.equal(
    await disclosures.nth(0).getAttribute("aria-label"),
    "Collapse Placeholder project one",
  );
  assert.equal(
    await disclosures.nth(1).getAttribute("aria-expanded"),
    "false",
    "second project should start collapsed",
  );
  assert.equal(await panels.nth(0).getAttribute("aria-hidden"), "false");
  assert.equal(await panels.nth(0).getAttribute("inert"), null);
  assert.ok((await panelHeight(panels.nth(0))) > 0, "first panel should be open");
  assert.equal(Math.round(await panelHeight(panels.nth(1))), 0, "second panel closed");

  const firstRow = rows.nth(1);
  assert.equal(
    await firstRow.getByTestId("project-features").locator("li").count(),
    3,
    "first project features",
  );
  assert.equal(
    await firstRow.getByTestId("project-tags").locator("li").count(),
    3,
    "first project tags",
  );
  assert.equal(
    await firstRow.getByTestId("project-description").count(),
    1,
    "first project description",
  );
  const introLink = firstRow.getByRole("link", { name: "sample link" });
  assert.equal(await introLink.getAttribute("href"), "https://example.com");
  assert.equal(await introLink.getAttribute("target"), "_blank");
  assert.equal(await introLink.getAttribute("rel"), "noopener noreferrer");

  const popupPromise = context.waitForEvent("page", { timeout: 5000 });
  await firstLink.click();
  const popup = await popupPromise;
  await popup.close();
  assert.equal(
    await disclosures.nth(0).getAttribute("aria-expanded"),
    "true",
    "external link should not toggle the accordion",
  );

  const secondTitle = rows.nth(2).getByTestId("project-title").locator("button");
  await secondTitle.click();
  await page.waitForTimeout(200);
  assert.equal(
    await disclosures.nth(0).getAttribute("aria-expanded"),
    "false",
    "opening a second project should close the first",
  );
  assert.equal(
    await disclosures.nth(1).getAttribute("aria-expanded"),
    "true",
    "second project should be open",
  );
  assert.equal(
    await disclosures.nth(0).locator("svg[data-icon='expand']").count(),
    1,
    "closed first project swaps back to chevrons-up-down",
  );
  assert.equal(
    await disclosures.nth(1).locator("svg[data-icon='collapse']").count(),
    1,
    "open second project uses chevrons-down-up",
  );
  assert.equal(Math.round(await panelHeight(panels.nth(0))), 0);
  assert.ok((await panelHeight(panels.nth(1))) > 0);

  await disclosures.nth(1).click();
  await page.waitForTimeout(200);
  assert.equal(
    await disclosures.nth(1).getAttribute("aria-expanded"),
    "false",
    "clicking the open disclosure should close it",
  );
  assert.equal(Math.round(await panelHeight(panels.nth(1))), 0);

  await disclosures.nth(0).click();
  await page.waitForTimeout(200);
  assert.equal(
    await disclosures.nth(0).getAttribute("aria-expanded"),
    "true",
    "first project should reopen",
  );

  const firstTitle = rows.nth(1).getByTestId("project-title").locator("button");
  await firstTitle.click();
  await page.waitForTimeout(200);
  assert.equal(
    await disclosures.nth(0).getAttribute("aria-expanded"),
    "false",
    "title should toggle the open project closed",
  );
  await firstTitle.click();
  await page.waitForTimeout(200);

  await secondTitle.focus();
  await page.keyboard.press("Enter");
  await page.waitForTimeout(200);
  assert.equal(
    await disclosures.nth(1).getAttribute("aria-expanded"),
    "true",
    "Enter should open a project",
  );
  await page.keyboard.press("Space");
  await page.waitForTimeout(200);
  assert.equal(
    await disclosures.nth(1).getAttribute("aria-expanded"),
    "false",
    "Space should close a project",
  );

  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("data-testid")),
    "project-link",
    "Tab should reach the external link",
  );
  assert.notEqual(
    await page.evaluate(() => getComputedStyle(document.activeElement).boxShadow),
    "none",
    "keyboard focus should be visible on the external link",
  );
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("data-testid")),
    "project-disclosure",
    "Tab should reach the disclosure control",
  );
  assert.notEqual(
    await page.evaluate(() => getComputedStyle(document.activeElement).boxShadow),
    "none",
    "keyboard focus should be visible on the disclosure control",
  );

  await firstTitle.click();
  await page.waitForTimeout(200);

  assert.equal(
    await disclosures.nth(0).getAttribute("aria-expanded"),
    "true",
    "first project should be open before showing more",
  );
  await toggle.click();
  await page.waitForTimeout(250);
  assert.equal(await toggle.innerText(), "Show less");
  assert.equal(await toggle.getAttribute("aria-expanded"), "true");
  assert.equal(await more.getAttribute("aria-hidden"), "false");
  assert.equal(await more.getAttribute("inert"), null);
  assert.ok((await panelHeight(more)) > 0, "additional projects should expand");
  assert.equal(
    await disclosures.nth(0).getAttribute("aria-expanded"),
    "true",
    "show more must not toggle a project detail",
  );

  const expandedChevron = await toggleIcon.evaluate((element) => {
    const style = getComputedStyle(element);
    return { rotate: style.rotate, transform: style.transform };
  });
  assert.notDeepEqual(expandedChevron, initialChevron, "chevron should reverse");
  assert.ok(
    expandedChevron.rotate === "180deg" ||
      expandedChevron.transform.includes("-1"),
    "chevron should point upward when expanded",
  );

  for (
    let index = INITIAL_VISIBLE_PROJECTS;
    index < EXPECTED.length;
    index += 1
  ) {
    const row = rows.nth(index + 1);
    const rowBox = await box(row);
    assert.ok(rowBox.height > 0, `project ${index + 1} should be revealed`);
    assert.ok(
      (await box(row.getByTestId("project-title"))).height > 0,
      `project ${index + 1} title should be visible`,
    );
    const revealedIconBox = await box(row.getByTestId("project-icon"));
    assert.equal(
      Math.round(revealedIconBox.width),
      32,
      `revealed icon width for project ${index + 1}`,
    );
    assert.equal(
      Math.round(revealedIconBox.height),
      32,
      `revealed icon height for project ${index + 1}`,
    );
  }

  for (const width of [1440, 1024, 768, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.waitForTimeout(250);
    await assertNoOverflow(width);

    const shell = await box(page.getByTestId("projects-shell"));
    assert.equal(
      Math.round(shell.width),
      Math.min(width, 768),
      `shell width at ${width}`,
    );

    const currentRows = projects.getByTestId("section-row");
    assert.equal(
      await currentRows.count(),
      EXPECTED.length + 2,
      `row count at ${width}`,
    );
    for (let index = 0; index < EXPECTED.length + 2; index += 1) {
      const rowBox = await box(currentRows.nth(index));
      assert.equal(Math.round(rowBox.width), width, `row width at ${width}`);
      assert.equal(
        await currentRows
          .nth(index)
          .evaluate((element) => getComputedStyle(element).borderBottomWidth),
        index === EXPECTED.length + 1 ? "0px" : "1px",
        `row hairline at ${index} at ${width}`,
      );
    }

    const currentToggleBox = await box(toggle);
    assert.equal(
      Math.round(currentToggleBox.x + currentToggleBox.width / 2),
      Math.round(shell.x + shell.width / 2),
      `show-more should stay centered at ${width}`,
    );
    assert.ok(
      currentToggleBox.width < shell.width - 40,
      `show-more should not stretch at ${width}`,
    );
    const lastRowBox = await box(currentRows.nth(EXPECTED.length));
    assert.equal(
      Math.round(currentToggleBox.y - (lastRowBox.y + lastRowBox.height)),
      20,
      `show-more should follow the last expanded row at ${width}`,
    );

    const projectRow = currentRows.nth(1);
    const iconBox = await box(projectRow.getByTestId("project-icon"));
    const titleBox = await box(projectRow.getByTestId("project-title"));
    const descriptionBox = await box(projectRow.getByTestId("project-description"));
    assert.equal(
      Math.round(iconBox.x - shell.x),
      20,
      `icon should sit on the container padding at ${width}`,
    );
    assert.equal(
      Math.round(titleBox.x - (iconBox.x + iconBox.width)),
      12,
      `title should follow the icon gap at ${width}`,
    );
    assert.equal(
      Math.round(descriptionBox.x),
      Math.round(titleBox.x),
      `details should align with project information at ${width}`,
    );
    assert.ok(
      descriptionBox.x + descriptionBox.width <= shell.x + shell.width + 1,
      `details should stay inside the container at ${width}`,
    );
  }

  await page.setViewportSize({ width: 390, height: 900 });
  await toggle.click();
  await page.waitForTimeout(250);
  assert.equal(await toggle.innerText(), "Show more");
  assert.equal(await toggle.getAttribute("aria-expanded"), "false");
  assert.equal(await more.getAttribute("aria-hidden"), "true");
  assert.notEqual(await more.getAttribute("inert"), null);
  assert.equal(
    Math.round(await panelHeight(more)),
    0,
    "show less should collapse the additional projects",
  );
  assert.equal(
    await disclosures.nth(0).getAttribute("aria-expanded"),
    "true",
    "show less must not toggle a project detail",
  );
  const collapsedToggleBox = await box(toggle);
  const collapsedThirdRowBox = await box(rows.nth(INITIAL_VISIBLE_PROJECTS));
  assert.equal(
    Math.round(
      collapsedToggleBox.y -
        (collapsedThirdRowBox.y + collapsedThirdRowBox.height),
    ),
    20,
    "collapsed show-more should sit below the third project",
  );
  await assertNoOverflow("390 collapsed");

  await page.getByTestId("project-disclosure").nth(2).focus();
  await page.keyboard.press("Tab");
  assert.equal(
    await page.evaluate(() => document.activeElement?.getAttribute("data-testid")),
    "projects-toggle",
    "Tab should reach the show-more control",
  );
  assert.notEqual(
    await page.evaluate(() => getComputedStyle(document.activeElement).boxShadow),
    "none",
    "keyboard focus should be visible on the show-more control",
  );
  await page.keyboard.press("Enter");
  await page.waitForTimeout(250);
  assert.equal(await toggle.innerText(), "Show less", "Enter should expand");
  assert.equal(await toggle.getAttribute("aria-expanded"), "true");
  await page.keyboard.press("Space");
  await page.waitForTimeout(250);
  assert.equal(await toggle.innerText(), "Show more", "Space should collapse");
  assert.equal(await toggle.getAttribute("aria-expanded"), "false");

  await page.evaluate(() => {
    const long = "Placeholder".repeat(12);
    const title = document.querySelector('[data-testid="project-title"] button');
    const description = document.querySelector(
      '[data-testid="project-description"]',
    );
    const tag = document.querySelector('[data-testid="project-tags"] span');
    if (title) title.textContent = long;
    if (description) description.textContent = `${long} ${long}`;
    if (tag) tag.textContent = long;
  });
  await page.waitForTimeout(100);
  await assertNoOverflow("390 with long project content");
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  await page.setViewportSize({ width: 1440, height: 900 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(250);

  await runAxe("dark desktop");
  const darkTagBorder = await rows
    .nth(1)
    .getByTestId("project-tags")
    .locator("span")
    .first()
    .evaluate((element) => getComputedStyle(element).borderTopColor);
  const darkToggleBackground = await toggle.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );

  await page.getByRole("button", { name: /Switch to light theme/ }).click();
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("light"),
  );
  await page.waitForTimeout(250);
  const lightTagBorder = await rows
    .nth(1)
    .getByTestId("project-tags")
    .locator("span")
    .first()
    .evaluate((element) => getComputedStyle(element).borderTopColor);
  assert.notEqual(
    darkTagBorder,
    lightTagBorder,
    "project hairline should follow the theme",
  );
  const lightToggleBackground = await toggle.evaluate(
    (element) => getComputedStyle(element).backgroundColor,
  );
  assert.notEqual(
    darkToggleBackground,
    lightToggleBackground,
    "show-more surface should follow the theme",
  );
  await runAxe("light desktop");
  await toggle.click();
  await page.waitForTimeout(250);
  assert.equal(await toggle.innerText(), "Show less");
  await runAxe("light desktop expanded");
  await toggle.click();
  await page.waitForTimeout(250);
  assert.equal(await toggle.innerText(), "Show more");

  await page.setViewportSize({ width: 390, height: 900 });
  await page.waitForTimeout(250);
  await runAxe("light mobile");
  await page.getByRole("button", { name: /Switch to dark theme/ }).click();
  await page.waitForFunction(() =>
    document.documentElement.classList.contains("dark"),
  );
  await page.waitForTimeout(250);
  await runAxe("dark mobile");

  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.reload({ waitUntil: "networkidle" });
  await page.evaluate(() => document.fonts.ready);

  const reducedPanel = page.getByTestId("project-panel").first();
  const reducedMotion = await reducedPanel.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      property: style.transitionProperty,
      duration: style.transitionDuration,
    };
  });
  assert.equal(reducedMotion.property, "none", "reduced motion transition");
  assert.ok(
    Number.parseFloat(reducedMotion.duration) <= 0.01,
    "reduced motion duration",
  );

  const reducedMore = page.getByTestId("projects-more");
  const reducedToggle = page.getByTestId("projects-toggle");
  const reducedMoreMotion = await reducedMore.evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      property: style.transitionProperty,
      duration: style.transitionDuration,
    };
  });
  assert.equal(
    reducedMoreMotion.property,
    "none",
    "reduced motion show-more transition",
  );
  assert.ok(
    Number.parseFloat(reducedMoreMotion.duration) <= 0.01,
    "reduced motion show-more duration",
  );
  await reducedToggle.click();
  await page.waitForTimeout(50);
  assert.equal(await reducedToggle.innerText(), "Show less");
  assert.ok((await panelHeight(reducedMore)) > 0);
  await reducedToggle.click();
  await page.waitForTimeout(50);
  assert.equal(await reducedToggle.innerText(), "Show more");
  assert.equal(Math.round(await panelHeight(reducedMore)), 0);

  const reducedDisclosures = page.getByTestId("project-disclosure");
  await page
    .getByTestId("project-title")
    .nth(1)
    .locator("button")
    .click();
  assert.equal(
    await reducedDisclosures.nth(0).getAttribute("aria-expanded"),
    "false",
    "reduced motion should still switch projects",
  );
  assert.equal(
    await reducedDisclosures.nth(1).getAttribute("aria-expanded"),
    "true",
  );

  await page.emulateMedia({ reducedMotion: "no-preference" });
  assert.deepEqual(consoleErrors, [], "console should have no errors");
  console.log(
    "projects checks passed (1440, 1024, 768, 390; show more/less; accordion; keyboard; themes; reduced motion)",
  );
} finally {
  await browser.close();
}
