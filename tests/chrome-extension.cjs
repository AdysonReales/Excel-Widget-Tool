const { chromium } = require('playwright-core');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const root = path.resolve(__dirname, '..'), extension = path.join(root, 'chrome');
  fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
  const profile = fs.mkdtempSync(path.join(root, 'dist', 'chrome-test-'));
  const context = await chromium.launchPersistentContext(profile, {
    headless: true,
    // Branded Chrome may ignore --load-extension in automation; Edge supports it.
    executablePath: process.env.CHROME_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args: [`--disable-extensions-except=${extension}`, `--load-extension=${extension}`]
  });
  try {
    const page = await context.newPage(); await page.goto('chrome://newtab/');
    await page.waitForSelector('#grid td input', { timeout: 15000 });
    await page.locator('#grid td input').first().fill('Chrome saved value');
    await page.getByRole('button', { name: /Whiteboard/ }).click();
    const canvas = page.locator('#board-canvas'), box = await canvas.boundingBox();
    await page.mouse.move(box.x + 30, box.y + 30); await page.mouse.down(); await page.mouse.move(box.x + 80, box.y + 30); await page.mouse.up();
    await page.waitForFunction(() => document.getElementById('status').textContent === 'All changes saved');
    await page.reload(); await page.getByRole('button', { name: /Whiteboard/ }).click();
    await page.waitForFunction(() => document.querySelector('#board-canvas').getContext('2d').getImageData(50,30,1,1).data[3] > 0);
    await page.getByRole('button', { name: /Excel/ }).click();
    assert.equal(await page.locator('#grid td input').first().inputValue(), 'Chrome saved value');
    await page.locator('#todo-input').fill('Test task'); await page.locator('#todo-form button').click();
    assert.equal(await page.getByText('Test task', { exact: true }).count(), 1);
    console.log('PASS: Chrome-style new tab override, sheet, whiteboard and to-do list');
  } finally { await context.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
