const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');
const fs = require('node:fs/promises');
let window;
app.whenReady().then(() => {
  window = new BrowserWindow({ width: 1100, height: 720, minWidth: 640, minHeight: 480, backgroundColor: '#f8f5f2', title: 'Little Grid', webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false } });
  window.loadFile(path.join(__dirname, '../shared/index.html'), { query: { desktop: '1' } });
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) app.relaunch(); });
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
ipcMain.handle('load', async () => { try { return JSON.parse(await fs.readFile(path.join(app.getPath('userData'), 'grid.json'), 'utf8')); } catch (error) { if (error.code === 'ENOENT') return null; throw error; } });
ipcMain.handle('save', async (_, data) => { const target = path.join(app.getPath('userData'), 'grid.json'); const temp = target + '.tmp'; await fs.writeFile(temp, JSON.stringify(data), 'utf8'); await fs.rename(temp, target); });
ipcMain.handle('startup:get', () => app.getLoginItemSettings({ path: process.execPath, args: app.isPackaged ? undefined : [app.getAppPath()] }).openAtLogin);
ipcMain.handle('startup:set', (_, enabled) => { const options = { openAtLogin: Boolean(enabled), path: process.execPath }; if (!app.isPackaged) options.args = [app.getAppPath()]; app.setLoginItemSettings(options); return app.getLoginItemSettings({ path: options.path, args: options.args }).openAtLogin; });
