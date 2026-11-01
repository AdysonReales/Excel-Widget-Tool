# Excel-Widget-Tool

An editable Excel-like grid for the Windows startup screen and Opera GX, with a browser to-do list. Cells and tasks save automatically on the device.

## Desktop widget

### Download for Windows

[Find the latest Windows installer build](https://github.com/AdysonReales/Excel-Widget-Tool/actions/workflows/windows.yml)

1. Sign in to GitHub, open the latest successful build, and download **Little-Grid-Windows-Installer** under Artifacts.
2. Extract the downloaded ZIP and run `Little Grid Setup 1.0.0.exe`. Windows may warn you because the installer is not code signed.
3. Open Little Grid from the Start menu. Node.js and PowerShell are not needed to use the installer.

GitHub Actions artifacts expire, so use the latest successful build.

Drag the widget's top bar to move it; resize it from its edges. It remembers its position. Check **Pin to desktop** to place it on the Windows desktop, behind regular windows; uncheck it to return to the always-on-top window. Desktop pinning uses Windows Explorer's desktop layer and may behave differently between Windows versions or after Explorer restarts. If the desktop layer cannot be found, the app remains in normal window mode.

If the pinned window becomes inaccessible, close Little Grid using Task Manager and launch its executable with the `--window-mode` argument to temporarily start in normal mode. Then toggle **Pin to desktop** on and off to save the normal mode preference.

### Run or build from source

To build an installer yourself, run `npm install` and `npm run dist` on Windows; the installer is placed in `dist/`.

Install [Node.js](https://nodejs.org/) (LTS), then in this folder run:

```powershell
npm install
npm start
```

The app opens as a resizable window. Enable **Open at Windows sign-in** at the bottom to launch it when you sign in. The window is a regular desktop window, not a Windows desktop gadget or wallpaper. Keep the project folder and its installed dependencies in place so Windows can launch it at sign-in. Desktop data is stored in Electron's user data directory (on Windows, typically `%APPDATA%/little-grid/grid.json`).

## Opera GX extension

1. In Opera GX, open `opera://extensions` and enable **Developer mode**.
2. Choose **Load unpacked** and select this project's `browser` folder.
3. Open a new tab. The spreadsheet and to-do list save locally in the browser's extension storage.

The desktop app and browser extension keep **separate** data. Export a CSV in one and import it in the other to transfer spreadsheet values. Browser to-dos are not included in CSV. Removing the extension may remove its data; export the sheet first.

## Spreadsheet notes

Click a cell to edit it and use **Add row** for more space. Import and export use CSV, which Excel can open and save. Import replaces the current sheet after confirmation. This is a lightweight grid, not Microsoft Excel: formulas, formatting, multiple sheets, and `.xlsx` files are not supported. Export CSV regularly for a portable backup.

## Structure

- `shared/` — source for the common UI and spreadsheet logic.
- `desktop/` — Electron window, local persistence, and startup integration.
- `browser/` — ready-to-load extension; its UI files are generated from `shared/`.
- `scripts/` — extension build script.
- `tests/` — CSV parsing and export tests.

After editing shared files, run `npm run build:extension` to refresh the browser copy. Run `npm test` for the CSV tests.
