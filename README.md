# Excel-Widget-Tool

An editable Excel-like grid for the Windows startup screen and Opera GX, with a browser to-do list. Cells and tasks save automatically on the device.

## Desktop widget

### Download for Windows

[Download Little Grid for Windows (.exe)](https://github.com/AdysonReales/Excel-Widget-Tool/releases/download/v1.0.0-whiteboard/Little-Grid-Setup.exe)

1. Download and run `Little-Grid-Setup.exe`. Windows may warn you because the installer is not code signed.
2. Open Little Grid from the Start menu. Node.js and PowerShell are not needed to use the installer.

Development builds are also available from [GitHub Actions](https://github.com/AdysonReales/Excel-Widget-Tool/actions/workflows/windows.yml).

Drag the widget's top bar to move it; resize it from its edges. It remembers its position. Check **Pin to desktop** to let other windows appear over it, and click it to edit. It remains a normal window above desktop icons and may be hidden by Show Desktop. Uncheck it to return to the always-on-top window.

If the widget is hidden, select Little Grid on the taskbar to bring it back.

Select **Whiteboard** above the formatting toolbar to sketch, and **Excel** to return to the spreadsheet. Choose Draw or Erase, set a color and size, and sketch on the white canvas. Choose Move and drag to pan across the board; use the mouse wheel or zoom buttons to zoom and Home to return to the starting view. Undo removes the most recent stroke, and Clear all asks for confirmation before removing the drawing. The whiteboard saves locally with the sheet. CSV export includes only spreadsheet cell contents, not the whiteboard. Desktop and Opera keep separate local copies.

### Run or build from source

To build an installer yourself, run `npm install` and `npm run dist` on Windows; the installer is placed in `dist/`.

Install [Node.js](https://nodejs.org/) (LTS), then in this folder run:

```powershell
npm install
npm start
```

The app opens as a resizable window. Enable **Open at Windows sign-in** at the bottom to launch it when you sign in. The window is a regular desktop window, not a Windows desktop gadget or wallpaper. Keep the project folder and its installed dependencies in place so Windows can launch it at sign-in. Desktop data is stored in Electron's user data directory (on Windows, typically `%APPDATA%/little-grid/grid.json`).

## Opera GX extension

[Download the Opera GX extension ZIP](https://github.com/AdysonReales/Excel-Widget-Tool/releases/download/v1.0.1-opera/Little-Grid-Opera-GX.zip)

1. Extract the ZIP to a folder that will remain on your computer.
2. In Opera GX, open `opera://extensions` and enable **Developer mode**.
3. Choose **Load unpacked** and select the extracted folder containing `manifest.json`.
4. Click the **Little Grid** extension button to open the workspace. You may need to pin it from Opera's extensions menu. The spreadsheet, whiteboard, and to-do list save locally in the browser's extension storage.

Opera GX blocks the standard new-tab override used by some Chrome extensions. Little Grid attempts to open its workspace when a newly created tab reaches Opera's start page; if Opera does not expose or allow that redirect, use the extension button instead. The extension requests the tabs permission for this new-tab behavior.

After updating this folder, open `opera://extensions`, click the reload button on Little Grid, and use the extension button to see the latest Excel and Whiteboard controls.

To keep an existing unpacked extension's local data, update its existing folder and reload that extension. Loading a separate folder can create a separate extension with separate storage.

The desktop app and browser extension keep **separate** data. Export a CSV in one and import it in the other to transfer spreadsheet values. Browser to-dos are not included in CSV. Removing the extension may remove its data; export the sheet first.

## Spreadsheet notes

Click a cell to edit it. Add rows or columns with the buttons, press Enter to move down (and create a row at the bottom), or paste a rectangular selection copied from a spreadsheet. The sheet supports basic formulas such as `=A1+B1*2` and `=SUM(A1:A3)`, plus AVERAGE, MIN, MAX and arithmetic; formulas recalculate when cells change. Click a calculated cell to edit its formula. Up to 1,000 rows and 100 columns can be imported or pasted.

Drag the right edge of a column letter to resize the column, or the bottom edge of a row number to resize the row. Sizes save automatically on this device. You can also focus a resize handle with Tab and use the arrow keys. CSV transfers cell contents, not row or column sizes.

Select a cell to format it using the toolbar: font, size, bold, italic, underline, text and fill colors, alignment, border, basic number and percent displays, and color presets. Use Clear to remove its formatting. Cell formatting is saved locally with the sheet.

In the Windows app, the Edit and Insert toolbar also includes single-cell cut/copy/paste and format painter; a conditional rule that highlights a cell when its value exceeds a threshold; table-style formatting for a selected range; and a pivot summary that groups one column and sums another. The pivot summary is an on-screen view and is not saved as a pivot table. Pictures (PNG, JPEG, and WebP up to 2 MB), simple shapes, two clip-art symbols, a three-step process diagram, and a primary-screen screenshot can be inserted as movable objects. Drag an object's title bar to move it, drag its lower-right corner to resize it, or use × to remove it. Objects save locally with the sheet. The screenshot command captures the entire primary screen after confirmation.

These are simplified tools: table styling does not create a sortable Excel table; the pivot summary is not a full Excel PivotTable; the process diagram is not editable SmartArt; and merge cells, wrap text, and advanced conditional formatting are not yet supported. These insert tools are desktop-only; the local Opera GX extension also includes the whiteboard.

Import and export use CSV, which Excel can open and save. Import replaces the current sheet after confirmation; CSV export contains the entered values and formula text, but not formatting, dimensions, or inserted objects. This lightweight grid does not support multiple sheets, `.xlsx` files, or the full range of Excel formulas. Export CSV regularly for a portable backup of cell contents.

## Structure

- `shared/` — source for the common UI and spreadsheet logic.
- `desktop/` — Electron window, local persistence, and startup integration.
- `browser/` — ready-to-load extension; its UI files are generated from `shared/`.
- `scripts/` — extension build script.
- `tests/` — CSV parsing and export tests.

Run `npm test` for the CSV and formula tests. On Windows with Microsoft Edge installed, run `npm run test:resize`, `npm run test:format`, `npm run test:desktop-extras`, and `npm run test:whiteboard` for the browser-based tests. Run `npm run test:electron` for an isolated app restart test. The `browser/` folder contains the locally updated Opera extension; `npm run build:extension` refreshes it from shared source.
