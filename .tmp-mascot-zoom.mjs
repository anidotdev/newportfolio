import { chromium } from "playwright";
import path from "node:path";
import os from "node:os";

const out = path.join(os.tmpdir(), "mascot-inspect");
const browser = await chromium.launch();

for (const theme of ["light", "dark"]) {
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 3 });
  const page = await ctx.newPage();
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[aria-label="Boop the Lain mascot"]');
  await page.evaluate((t) => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(t);
  }, theme);
  await page.waitForTimeout(900);

  const btn = page.locator('[aria-label="Boop the Lain mascot"]');
  const b = await btn.boundingBox();
  await page.screenshot({
    path: path.join(out, `ctx-${theme}.png`),
    clip: { x: b.x - 90, y: b.y - 60, width: b.width + 180, height: b.height + 140 },
  });
  await btn.screenshot({ path: path.join(out, `el-${theme}.png`) });

  const geom = await page.evaluate(() => {
    const btn = document.querySelector('[aria-label="Boop the Lain mascot"]');
    const name = document.querySelector("#profile-name");
    const identity = document.querySelector('[data-testid="hero-identity"]');
    const bb = btn.getBoundingClientRect();
    const nb = name.getBoundingClientRect();
    const ib = identity.getBoundingClientRect();
    return {
      mascot: { x: bb.x, y: bb.y, w: bb.width, h: bb.height, right: bb.right, bottom: bb.bottom },
      name: { right: nb.right, width: nb.width },
      identity: { top: ib.top, right: ib.right, bottom: ib.bottom },
      gapAfterName: Math.round(bb.left - nb.right),
      computedZ: getComputedStyle(btn).zIndex,
    };
  });
  console.log(theme, JSON.stringify(geom));

  // reaction frame
  await btn.click();
  await page.waitForTimeout(180);
  const b2 = await btn.boundingBox();
  await page.screenshot({
    path: path.join(out, `ctx-${theme}-boop.png`),
    clip: { x: b2.x - 90, y: b2.y - 60, width: b2.width + 180, height: b2.height + 140 },
  });
  await ctx.close();
}

await browser.close();
console.log("done");
