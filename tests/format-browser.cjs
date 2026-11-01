const { chromium } = require('playwright-core');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const assert = require('node:assert/strict');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe' });
  try {
    const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
    await page.addInitScript(() => { window.desktop = { load: async () => JSON.parse(localStorage.getItem('sheet') || '{"cells":[["hello","world"]],"todos":[]}'), save: async data => localStorage.setItem('sheet', JSON.stringify(data)), getStartup: async () => false, getWidget: async () => false, setStartup: async x => x, setWidget: async x => x, close() {}, minimize() {} }; });
    await page.goto(pathToFileURL(path.join(__dirname, '../shared/index.html')).href);
    const a = page.locator('input[data-row="0"][data-col="0"]'), b = page.locator('input[data-row="0"][data-col="1"]');
    await a.click(); await page.locator('#format-bold').click(); await page.locator('#format-font').selectOption('Georgia'); await page.locator('#format-center').click();
    assert.equal(await a.evaluate(e => getComputedStyle(e).fontWeight), '700'); assert.equal(await a.evaluate(e => getComputedStyle(e).textAlign), 'center');
    await b.click(); assert.equal(await b.evaluate(e => getComputedStyle(e).fontWeight), '400');
    await page.waitForFunction(() => JSON.parse(localStorage.getItem('sheet') || '{}').cellStyles?.['0:0']?.bold);
    await page.reload(); await page.waitForSelector('#grid td input');
    await page.waitForFunction(() => getComputedStyle(document.querySelector('input[data-row="0"][data-col="0"]')).fontWeight === '700');
    assert.equal(await a.inputValue(), 'hello'); assert.equal(await a.evaluate(e => getComputedStyle(e).fontFamily), 'Georgia');
    await a.click(); await page.locator('#format-clear').click(); assert.equal(await a.evaluate(e => getComputedStyle(e).fontWeight), '400');
    await b.click(); await b.fill('0.25'); await page.locator('#format-number').focus(); await page.locator('#format-number').selectOption('percent');
    assert.match(await b.inputValue(), /25[,.]00\s*%/);
    await b.click(); assert.equal(await b.inputValue(), '0.25');
    await page.locator('#format-preset').selectOption('good');
    assert.equal(await b.evaluate(e => getComputedStyle(e.parentElement).backgroundColor), 'rgb(198, 239, 206)');
    console.log('PASS: per-cell formatting, selection, autosave, reload, and clear');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
