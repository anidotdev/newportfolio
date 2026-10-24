import { chromium } from "playwright";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
await page.goto("http://localhost:3000", { waitUntil: "domcontentloaded" });
await page.waitForSelector('[aria-label="Boop the Lain mascot"]');

const info = await page.evaluate(() => {
  const button = document.querySelector('[aria-label="Boop the Lain mascot"]');
  const name = document.querySelector("#profile-name");
  const identity = document.querySelector('[data-testid="hero-identity"]');
  const buttonBox = button.getBoundingClientRect();
  const nameBox = name.getBoundingClientRect();
  const identityBox = identity.getBoundingClientRect();
  return {
    name: { x: Math.round(nameBox.x), right: Math.round(nameBox.right) },
    mascot: {
      x: Math.round(buttonBox.x),
      y: Math.round(buttonBox.y),
      width: Math.round(buttonBox.width),
      height: Math.round(buttonBox.height),
    },
    identity: {
      x: Math.round(identityBox.x),
      right: Math.round(identityBox.right),
      height: Math.round(identityBox.height),
    },
    gapAfterName: Math.round(buttonBox.left - nameBox.right),
    fitsIdentity: buttonBox.left >= nameBox.right && buttonBox.right <= identityBox.right,
    label: button.getAttribute("aria-label"),
  };
});

console.log(JSON.stringify(info, null, 2));
await browser.close();
