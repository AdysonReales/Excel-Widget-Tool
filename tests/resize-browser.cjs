const { chromium } = require('playwright-core');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const assert = require('node:assert/strict');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
  try {
    const page = await browser.newPage({ viewport: { width: 1100, height: 900 } });
    await page.addInitScript(() => {
      window.desktop = {
        load: async () => JSON.parse(localStorage.getItem('test-sheet') || '{"cells":[["hello"]],"todos":[]}'),
        save: async data => localStorage.setItem('test-sheet', JSON.stringify(data)),
        getStartup: async () => false, getWidget: async () => false,
        setStartup: async v => v, setWidget: async v => v, close() {}, minimize() {}
      };
    });
    await page.goto(pathToFileURL(path.join(__dirname, '../shared/index.html')).href);
    await page.waitForSelector('.resize-column');
    const width = () => page.locator('#grid col').nth(1).evaluate(el => parseInt(el.style.width));
    const height = () => page.locator('#grid tbody tr').first().evaluate(el => parseInt(el.style.height));
    assert.equal(await width(), 140); assert.equal(await height(), 34);
    let box = await page.locator('.resize-column').first().boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 70, box.y + box.height / 2); await page.mouse.up();
    assert.equal(await width(), 210);
    box = await page.locator('.resize-row').first().boundingBox();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down(); await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2 + 30); await page.mouse.up();
    assert.equal(await height(), 64);
    await page.waitForFunction(() => { const s = JSON.parse(localStorage.getItem('test-sheet') || '{}'); return s.columnWidths?.[0] === 210 && s.rowHeights?.[0] === 64; });
    await page.reload(); await page.waitForSelector('.resize-column');
    assert.equal(await width(), 210); assert.equal(await height(), 64);
    assert.equal(await page.locator('#grid td input').first().inputValue(), 'hello');
    await page.locator('#add-row').click(); await page.waitForTimeout(50);
    assert.equal(await width(), 210); assert.equal(await height(), 64);
    console.log('PASS: pointer resizing, saved sizes, reload, existing values, and redraw');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
