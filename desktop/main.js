const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
const syncFs = require('node:fs');
let window;
app.whenReady().then(() => {
  const boundsFile = path.join(app.getPath('userData'), 'window.json');
  let bounds = { width: 720, height: 570 };
  try { const saved = JSON.parse(syncFs.readFileSync(boundsFile, 'utf8')); if (Number.isFinite(saved.x) && Number.isFinite(saved.y) && Number.isFinite(saved.width) && Number.isFinite(saved.height) && screen.getAllDisplays().some(d => saved.x < d.workArea.x + d.workArea.width && saved.y < d.workArea.y + d.workArea.height && saved.x + saved.width > d.workArea.x && saved.y + saved.height > d.workArea.y)) bounds = saved; } catch {}
  window = new BrowserWindow({ ...bounds, minWidth: 420, minHeight: 360, frame: false, alwaysOnTop: true, backgroundColor: '#f8f5f2', title: 'Little Grid', webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false } });
  window.on('close', () => { try { syncFs.writeFileSync(boundsFile, JSON.stringify(window.getBounds())); } catch (error) { console.error('Could not save window position:', error); } });
  window.loadFile(path.join(__dirname, '../shared/index.html'), { query: { desktop: '1' } });
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) app.relaunch(); });
});
ipcMain.on('window:minimize', () => window.minimize());
ipcMain.on('window:close', () => window.close());
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
ipcMain.handle('load', async () => { try { return JSON.parse(await fs.readFile(path.join(app.getPath('userData'), 'grid.json'), 'utf8')); } catch (error) { if (error.code === 'ENOENT') return null; throw error; } });
ipcMain.handle('save', async (_, data) => { const target = path.join(app.getPath('userData'), 'grid.json'); const temp = target + '.tmp'; await fs.writeFile(temp, JSON.stringify(data), 'utf8'); await fs.rename(temp, target); });
ipcMain.handle('startup:get', () => app.getLoginItemSettings({ path: process.execPath, args: app.isPackaged ? undefined : [app.getAppPath()] }).openAtLogin);
ipcMain.handle('startup:set', (_, enabled) => { const options = { openAtLogin: Boolean(enabled), path: process.execPath }; if (!app.isPackaged) options.args = [app.getAppPath()]; app.setLoginItemSettings(options); return app.getLoginItemSettings({ path: options.path, args: options.args }).openAtLogin; });
