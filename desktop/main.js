const { app, BrowserWindow, ipcMain, screen, desktopCapturer, session, clipboard } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const syncFs = require('node:fs');
let window;
let widgetMode = false;
let changingMode = false;
async function setWidgetMode(enabled, persist = true) {
  if (changingMode) throw new Error('A display change is already in progress.');
  if (enabled === widgetMode) return widgetMode;
  if (process.platform !== 'win32') throw new Error('Desktop widget mode is only available on Windows.');
  changingMode = true;
  try {
    if (persist) await fs.writeFile(path.join(app.getPath('userData'), 'widget-settings.json'), JSON.stringify({ widgetMode: enabled }), 'utf8');
    widgetMode = enabled;
    window.setAlwaysOnTop(!enabled);
    if (!enabled) { window.show(); window.focus(); }
    return widgetMode;
  } finally { changingMode = false; }
}
app.whenReady().then(async () => {
  session.defaultSession.setDisplayMediaRequestHandler(async (request, callback) => {
    try {
      if (!window || request.frame !== window.webContents.mainFrame) { callback({}); return; }
      const sources = await desktopCapturer.getSources({ types: ['screen'] });
      const primary = screen.getPrimaryDisplay().id.toString();
      const source = sources.find(item => item.display_id === primary) || sources[0];
      callback(source ? { video: source } : {});
    } catch (error) { console.error('Could not capture screen:', error); callback({}); }
  });
  const boundsFile = path.join(app.getPath('userData'), 'window.json');
  let bounds = { width: 720, height: 570 };
  try { const saved = JSON.parse(syncFs.readFileSync(boundsFile, 'utf8')); if (Number.isFinite(saved.x) && Number.isFinite(saved.y) && Number.isFinite(saved.width) && Number.isFinite(saved.height) && screen.getAllDisplays().some(d => saved.x < d.workArea.x + d.workArea.width && saved.y < d.workArea.y + d.workArea.height && saved.x + saved.width > d.workArea.x && saved.y + saved.height > d.workArea.y)) bounds = saved; } catch {}
  window = new BrowserWindow({ ...bounds, minWidth: 420, minHeight: 360, frame: false, alwaysOnTop: true, backgroundColor: '#f8f5f2', title: 'Little Grid', webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false } });
  window.on('close', () => { try { syncFs.writeFileSync(boundsFile, JSON.stringify(window.getBounds())); } catch (error) { console.error('Could not save window position:', error); } });
  try { const settings = JSON.parse(await fs.readFile(path.join(app.getPath('userData'), 'widget-settings.json'), 'utf8')); if (settings.widgetMode && !process.argv.includes('--window-mode')) await setWidgetMode(true, false); } catch (error) { if (error.code !== 'ENOENT') console.error('Could not restore desktop widget:', error); }
  window.loadFile(path.join(__dirname, '../shared/index.html'), { query: { desktop: '1' } });
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) app.relaunch(); });
});
ipcMain.on('window:minimize', () => window.minimize());
ipcMain.on('window:close', () => window.close());
ipcMain.handle('widget:get', () => widgetMode);
ipcMain.handle('widget:set', (_, enabled) => setWidgetMode(Boolean(enabled)));
ipcMain.handle('clipboard:read', event => { if (event.sender !== window.webContents) throw new Error('Invalid sender'); return clipboard.readText(); });
ipcMain.handle('clipboard:write', (event, value) => { if (event.sender !== window.webContents || typeof value !== 'string') throw new Error('Invalid clipboard request'); clipboard.writeText(value); });
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
ipcMain.handle('load', async () => { try { return JSON.parse(await fs.readFile(path.join(app.getPath('userData'), 'grid.json'), 'utf8')); } catch (error) { if (error.code === 'ENOENT') return null; throw error; } });
ipcMain.handle('save', async (_, data) => { const target = path.join(app.getPath('userData'), 'grid.json'); const temp = target + '.tmp'; await fs.writeFile(temp, JSON.stringify(data), 'utf8'); await fs.rename(temp, target); });
ipcMain.handle('startup:get', () => app.getLoginItemSettings({ path: process.execPath, args: app.isPackaged ? undefined : [app.getAppPath()] }).openAtLogin);
ipcMain.handle('startup:set', (_, enabled) => { const options = { openAtLogin: Boolean(enabled), path: process.execPath }; if (!app.isPackaged) options.args = [app.getAppPath()]; app.setLoginItemSettings(options); return app.getLoginItemSettings({ path: options.path, args: options.args }).openAtLogin; });
