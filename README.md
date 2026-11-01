# Excel-Widget-Tool

An editable Excel-like grid for the Windows startup screen and Opera GX, with a browser to-do list. Cells and tasks save automatically on the device.

## Desktop widget

### Download for Windows

[Download Little Grid for Windows (.exe)](https://github.com/AdysonReales/Excel-Widget-Tool/releases/download/v1.0.0-dynamic-grid/Little-Grid-Setup.exe)

1. Download and run `Little-Grid-Setup.exe`. Windows may warn you because the installer is not code signed.
2. Open Little Grid from the Start menu. Node.js and PowerShell are not needed to use the installer.

Development builds are also available from [GitHub Actions](https://github.com/AdysonReales/Excel-Widget-Tool/actions/workflows/windows.yml).

Drag the widget's top bar to move it; resize it from its edges. It remembers its position. Check **Pin to desktop** to let other windows appear over it, and click it to edit. It remains a normal window above desktop icons and may be hidden by Show Desktop. Uncheck it to return to the always-on-top window.

If the widget is hidden, select Little Grid on the taskbar to bring it back.

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

Click a cell to edit it. Add rows or columns with the buttons, press Enter to move down (and create a row at the bottom), or paste a rectangular selection copied from a spreadsheet. The sheet supports basic formulas such as `=A1+B1*2` and `=SUM(A1:A3)`, plus AVERAGE, MIN, MAX and arithmetic; formulas recalculate when cells change. Click a calculated cell to edit its formula. Up to 1,000 rows and 100 columns can be imported or pasted.

Import and export use CSV, which Excel can open and save. Import replaces the current sheet after confirmation; CSV export contains the entered values and formula text. This lightweight grid does not support Excel formatting, multiple sheets, `.xlsx` files, or the full range of Excel formulas. Export CSV regularly for a portable backup.

## Structure

- `shared/` — source for the common UI and spreadsheet logic.
- `desktop/` — Electron window, local persistence, and startup integration.
- `browser/` — ready-to-load extension; its UI files are generated from `shared/`.
- `scripts/` — extension build script.
- `tests/` — CSV parsing and export tests.

After editing shared files, run `npm run build:extension` to refresh the browser copy. Run `npm test` for the CSV tests.
