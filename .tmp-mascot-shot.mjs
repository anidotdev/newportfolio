import { chromium } from "playwright";
import path from "node:path";
import os from "node:os";

const out = path.join(os.tmpdir(), "mascot-inspect");
const browser = await chromium.launch();
const errors = [];

const HERO = "section.hero-grid";

async function open(width, height) {
  const context = await browser.newContext({ viewport: { width, height }, deviceScaleFactor: 2 });
  const page = await context.newPage();
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("response", (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));
  await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
  await page.waitForSelector('[aria-label="Boop the Lain mascot"]', { timeout: 20000 });
  await page.waitForTimeout(1200);
  return { context, page };
}

async function heroShot(page, width, height, name) {
  const box = await page.locator(HERO).first().boundingBox();
  await page.screenshot({
    path: path.join(out, `${name}.png`),
    clip: { x: 0, y: Math.max(0, box.y - 40), width, height: Math.min(box.height + 60, height) },
  });
}

function setTheme(page, theme) {
  return page.evaluate((t) => {
    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(t);
  }, theme);
}

// 1. dark, pointer parked far away so she looks straight ahead
let s = await open(1440, 900);
await setTheme(s.page, "dark");
await s.page.mouse.move(1439, 899);
await s.page.waitForTimeout(400);
await heroShot(s.page, 1440, 900, "page-1440-dark");
console.log("mascot count:", await s.page.getByRole("button", { name: /boop the lain mascot/i }).count());
await s.context.close();

// 2. light, pointer at the top-left so the head should turn up-left
s = await open(1440, 900);
await setTheme(s.page, "light");
await s.page.mouse.move(20, 20);
await s.page.waitForTimeout(500);
await heroShot(s.page, 1440, 900, "page-1440-light-upleft");
await s.context.close();

// 3. light, boop -> reaction frame
s = await open(1440, 900);
await setTheme(s.page, "light");
const mascot = s.page.getByRole("button", { name: /boop the lain mascot/i });
await mascot.click();
await s.page.waitForTimeout(150);
await heroShot(s.page, 1440, 900, "page-1440-boop-heart");
await s.page.waitForTimeout(300);
await heroShot(s.page, 1440, 900, "page-1440-boop-later");
await s.context.close();

// 4. mobile
s = await open(390, 844);
await setTheme(s.page, "dark");
await s.page.mouse.move(10, 800);
await s.page.waitForTimeout(400);
await heroShot(s.page, 390, 844, "page-390-dark");
await s.context.close();

// 5. assets + keyboard focus
s = await open(1440, 900);
const assets = await s.page.evaluate(async () => {
  const paths = ["/mascots/lain-directions.webp", "/mascots/lain-reactions.webp"];
  return Promise.all(
    paths.map(async (url) => {
      const res = await fetch(url);
      const blob = await res.blob();
      return `${url} -> ${res.status} ${res.headers.get("content-type")} ${blob.size}B`;
    }),
  );
});
console.log(assets.join("\n"));

const focus = await s.page.evaluate(() => {
  const btn = document.querySelector('[aria-label="Boop the Lain mascot"]');
  btn.focus();
  const cs = getComputedStyle(btn);
  const r = btn.getBoundingClientRect();
  return {
    ariaLabel: btn.getAttribute("aria-label"),
    tag: btn.tagName,
    box: `${Math.round(r.width)}x${Math.round(r.height)} at ${Math.round(r.x)},${Math.round(r.y)}`,
    center: `${Math.round(r.x + r.width / 2)},${Math.round(r.y + r.height / 2)}`,
    focusRingVariable: cs.getPropertyValue("--ring").trim(),
    outline: cs.outlineStyle,
    cursor: cs.cursor,
    overflowRight: Math.round(r.right - document.documentElement.clientWidth),
    tabIndex: btn.tabIndex,
  };
});
console.log(JSON.stringify(focus, null, 2));
await s.context.close();

await browser.close();
console.log("console/network errors:", errors.length ? errors : "none");
