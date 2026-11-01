const { _electron: electron } = require('playwright-core');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const root = path.resolve(__dirname, '..');
  fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
  const appData = fs.mkdtempSync(path.join(root, 'dist', 'electron-test-'));
  const launch = () => electron.launch({ executablePath: require('electron'), args: [root], env: { ...process.env, LITTLE_GRID_TEST_DATA_DIR: appData } });
  let app = await launch();
  try {
    let page = await app.firstWindow();
    await page.waitForSelector('#grid td input');
    await page.locator('#insert-shape').click();
    await page.locator('dialog[open] input').fill('circle'); await page.locator('dialog[open] button[type=submit]').click();
    await page.waitForSelector('.shape-circle');
    await page.getByRole('button', { name: /Whiteboard/ }).click();
    const canvas = page.locator('#board-canvas'); await canvas.waitFor({ state: 'visible' });
    const box = await canvas.boundingBox();
    await page.mouse.move(box.x + 40, box.y + 40); await page.mouse.down(); await page.mouse.move(box.x + 100, box.y + 40); await page.mouse.up();
    await page.waitForFunction(() => document.getElementById('status').textContent === 'All changes saved');
    await app.close(); app = await launch(); page = await app.firstWindow(); await page.waitForSelector('.shape-circle');
    assert.equal(await page.locator('.shape-circle').count(), 1);
    await page.getByRole('button', { name: /Whiteboard/ }).click();
    await page.waitForFunction(() => window.LittleGridDesktop.state.whiteboard?.strokes.length === 1);
    console.log('PASS: Electron app preserves inserted shape and whiteboard stroke after restart');
  } finally { await app.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
