const { chromium } = require('playwright-core');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    await page.addInitScript(() => { let clipboard = ''; window.desktop = { load: async () => JSON.parse(localStorage.getItem('sheet') || '{"cells":[["Group","Amount"],["A","4"],["B","2"],["A","3"]],"todos":[]}'), save: async data => localStorage.setItem('sheet', JSON.stringify(data)), getStartup: async () => false, getWidget: async () => false, setStartup: async x => x, setWidget: async x => x, clipboardWrite: async x => { clipboard = x; }, clipboardRead: async () => clipboard, close() {}, minimize() {} }; });
    await page.goto(pathToFileURL(path.join(__dirname, '../shared/index.html')).href);
    await page.waitForSelector('#grid td input');
    await page.locator('input[data-row="1"][data-col="0"]').click(); await page.locator('#edit-copy').click(); await page.locator('input[data-row="2"][data-col="0"]').click(); await page.locator('#edit-paste').click();
    assert.equal(await page.locator('input[data-row="2"][data-col="0"]').inputValue(), 'A');
    await page.locator('input[data-row="2"][data-col="0"]').fill('B');
    const amount = page.locator('input[data-row="1"][data-col="1"]'); await amount.click();
    async function answer(value) { const dialog = page.locator('dialog[open]'); await dialog.locator('input').fill(value); await dialog.locator('button[type=submit]').click(); }
    await page.locator('#conditional-format').click(); await answer('3');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('input[data-row="1"][data-col="1"]').parentElement).backgroundColor === 'rgb(255, 199, 206)');
    await page.locator('#insert-shape').click(); await answer('circle');
    await page.waitForSelector('.shape-circle');
    await page.locator('#table-style').click(); await answer('A1:B4');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('input[data-row="0"][data-col="0"]').parentElement).backgroundColor === 'rgb(118, 96, 90)');
    await page.locator('#pivot-summary').click(); await answer('A'); await answer('B');
    assert.match(await page.locator('.pivot-table').innerText(), /A\s+7/);
    await page.locator('input[data-row="1"][data-col="1"]').fill('5');
    assert.match(await page.locator('.pivot-table').innerText(), /A\s+8/);
    await page.waitForFunction(() => { const s = JSON.parse(localStorage.getItem('sheet') || '{}'); return s.drawings?.length === 1 && s.cellStyles?.['0:0']?.bold && s.cells?.[1]?.[1] === '5'; });
    await page.reload(); await page.waitForSelector('.shape-circle');
    assert.equal(await page.locator('input[data-row="1"][data-col="1"]').inputValue(), '5');
    assert.equal(await page.locator('.drawing').count(), 1);
    await page.locator('#picture-file').setInputFiles({ name: 'one.png', mimeType: 'image/png', buffer: Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jRZkAAAAASUVORK5CYII=', 'base64') });
    await page.waitForSelector('.drawing img');
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('sheet') || '{}').drawings?.length === 2);
    await page.reload(); await page.waitForSelector('.drawing img');
    assert.equal(await page.locator('.drawing').count(), 2);
    console.log('PASS: clipboard, pictures, shapes, table formatting, pivot recalculation, existing data, and reload');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
