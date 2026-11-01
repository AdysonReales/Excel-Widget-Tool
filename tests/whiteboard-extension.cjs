const { chromium } = require('playwright-core');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
  try {
    const page = await browser.newPage({ viewport: { width: 1340, height: 950 }, deviceScaleFactor: 1 });
    await page.addInitScript(() => { window.chrome = window.chrome || {}; window.chrome.storage = { local: { get: (_key, callback) => setTimeout(() => callback({ littleGrid: JSON.parse(localStorage.getItem('sheet') || '{"cells":[["hello"]],"todos":[{"id":"1","text":"Plan","done":false}]}') }), 20), set: (data, callback) => { localStorage.setItem('sheet', JSON.stringify(data.littleGrid)); setTimeout(callback, 0); } } }; });
    await page.goto(pathToFileURL(path.join(__dirname, '../browser/index.html')).href);
    const excel = page.getByRole('button', { name: /Excel/ }), board = page.getByRole('button', { name: /Whiteboard/ });
    await board.waitFor(); assert.ok((await board.boundingBox()).y < (await page.locator('#format-toolbar').boundingBox()).y);
    await board.click(); assert.equal(await page.locator('#todo-card').isVisible(), true); assert.equal(await page.locator('#grid').isVisible(), false);
    const canvas = page.locator('#board-canvas'); const box = await canvas.boundingBox();
    await page.mouse.move(box.x + 40, box.y + 40); await page.mouse.down(); await page.mouse.move(box.x + 80, box.y + 40); await page.mouse.up();
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('sheet') || '{}').whiteboard?.strokes?.length === 1);
    await excel.click(); assert.equal(await page.locator('#grid td input').first().inputValue(), 'hello'); assert.equal(await page.getByText('Plan', { exact: true }).isVisible(), true);
    await page.reload(); await board.click(); await page.waitForFunction(() => document.querySelector('#board-canvas').getContext('2d').getImageData(60,40,1,1).data[3] > 0);
    const failed = await browser.newPage();
    await failed.addInitScript(() => { window.chrome = window.chrome || {}; window.chrome.runtime = { lastError: { message: 'Storage unavailable' } }; window.chrome.storage = { local: { get: (_key, callback) => setTimeout(() => callback(undefined), 0), set: () => { sessionStorage.setItem('overwritten', 'yes'); } } }; });
    await failed.goto(pathToFileURL(path.join(__dirname, '../browser/index.html')).href);
    await failed.waitForSelector('.workspace-tab.load-error');
    assert.equal(await failed.locator('.workspace-tab.load-error').isDisabled(), true);
    assert.match(await failed.locator('#status').textContent(), /Could not load/);
    await failed.locator('#grid td input').first().fill('must not overwrite'); await failed.waitForTimeout(350);
    assert.equal(await failed.evaluate(() => sessionStorage.getItem('overwritten')), null);
    console.log('PASS: callback-only storage, extension tabs, saving, and safe load-error handling');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
