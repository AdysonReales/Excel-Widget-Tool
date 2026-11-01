(() => {
  if (!window.desktop || !window.LittleGridDesktop) return;
  const app = window.LittleGridDesktop, grid = document.getElementById('grid');
  const wrap = document.querySelector('.grid-wrap'), toolbar = document.createElement('div');
  toolbar.className = 'insert-toolbar'; toolbar.setAttribute('role', 'toolbar'); toolbar.setAttribute('aria-label', 'Insert and table tools');
  toolbar.innerHTML = '<strong>EDIT</strong> <button type="button" id="edit-cut">Cut</button> <button type="button" id="edit-copy">Copy</button> <button type="button" id="edit-paste">Paste</button> <button type="button" id="format-painter" aria-pressed="false">Format painter</button> <button type="button" id="conditional-format">Conditional format</button> <strong>INSERT</strong> <button type="button" id="insert-picture">Picture</button> <input type="file" id="picture-file" accept="image/png,image/jpeg,image/webp" hidden> <button type="button" id="insert-shape">Shape</button> <button type="button" id="insert-icon">Clip art</button> <button type="button" id="insert-process">Process diagram</button> <button type="button" id="insert-screenshot">Screenshot</button> <button type="button" id="table-style">Format table</button> <button type="button" id="pivot-summary">Pivot summary</button>';
  document.getElementById('format-toolbar').after(toolbar);
  const panel = document.createElement('section'); panel.className = 'pivot-panel'; panel.hidden = true; toolbar.after(panel);
  const overlay = document.createElement('div'); overlay.className = 'drawing-layer'; wrap.appendChild(overlay);
  let drawings = [], loaded = false;
  function ask(label, initial) {
    return new Promise(resolve => {
      const dialog = document.createElement('dialog'); dialog.className = 'grid-dialog';
      const form = document.createElement('form'); form.method = 'dialog';
      const text = document.createElement('label'); text.textContent = label;
      const input = document.createElement('input'); input.value = initial; input.maxLength = 160; text.appendChild(input);
      const actions = document.createElement('div'), cancel = document.createElement('button'), submit = document.createElement('button');
      cancel.type = 'button'; cancel.textContent = 'Cancel'; cancel.onclick = () => dialog.close('cancel');
      submit.type = 'submit'; submit.textContent = 'OK'; actions.append(cancel, submit); form.append(text, actions); dialog.appendChild(form); document.body.appendChild(dialog);
      dialog.addEventListener('cancel', event => { event.preventDefault(); dialog.close('cancel'); });
      dialog.addEventListener('close', () => { const result = dialog.returnValue === 'cancel' ? null : input.value; dialog.remove(); resolve(result); }, { once: true });
      dialog.showModal(); input.focus(); input.select();
    });
  }
  const selectedInput = () => { const [r,c] = GridFormat.selected(); return grid.querySelector(`input[data-row="${r}"][data-col="${c}"]`); };
  async function copy(cut) { try { const input = selectedInput(); if (!input) return; const [r,c] = GridFormat.selected(); await desktop.clipboardWrite(String(app.state.cells[r]?.[c] ?? '')); if (cut) { input.focus(); input.value = ''; input.dispatchEvent(new Event('input', { bubbles: true })); } } catch { app.status('Clipboard access failed', true); } }
  document.getElementById('edit-copy').onclick = () => copy(false);
  document.getElementById('edit-cut').onclick = () => copy(true);
  document.getElementById('edit-paste').onclick = async () => { try { const text = await desktop.clipboardRead(), input = selectedInput(); if (!input) return; input.focus(); if (/[\t\r\n]/.test(text)) { const data = new DataTransfer(); data.setData('text/plain', text); input.dispatchEvent(new ClipboardEvent('paste', { bubbles: true, cancelable: true, clipboardData: data })); } else { input.value = text; input.dispatchEvent(new Event('input', { bubbles: true })); } } catch { app.status('Clipboard access failed', true); } };
  let paintedStyle = null; const painter = document.getElementById('format-painter');
  painter.onclick = () => { paintedStyle = paintedStyle ? null : GridFormat.getStyle(); painter.setAttribute('aria-pressed', String(Boolean(paintedStyle))); app.status(paintedStyle ? 'Select a cell to apply formatting' : 'All changes saved'); };
  grid.addEventListener('focusin', event => { if (!paintedStyle || !event.target.matches('td input')) return; GridFormat.applyStyle(paintedStyle); paintedStyle = null; painter.setAttribute('aria-pressed', 'false'); });
  document.getElementById('conditional-format').onclick = async () => { const input = await ask('Highlight this cell red when its value is greater than (leave blank to remove the rule):', '0'); if (input === null) return; if (!input.trim()) { GridFormat.setConditional(null); return; } const threshold = Number(input); if (!Number.isFinite(threshold)) { alert('Enter a valid number.'); return; } GridFormat.setConditional(threshold); };

  function persist() { app.state.drawings = drawings; app.save(); }
  function renderDrawings() {
    overlay.replaceChildren();
    for (const item of drawings) {
      if (!item || typeof item.id !== 'string' || !['picture','rectangle','circle','star','heart','process'].includes(item.type)) continue;
      if (item.type === 'picture' && (typeof item.src !== 'string' || !/^data:image\/(png|jpeg|webp);base64,/i.test(item.src))) continue;
      const card = document.createElement('div'); card.className = 'drawing';
      const finite = (x, fallback, min, max) => typeof x === 'number' && Number.isFinite(x) ? Math.max(min, Math.min(max, x)) : fallback;
      card.style.left = `${finite(item.x, 15, 0, 10000)}px`; card.style.top = `${finite(item.y, 15, 0, 10000)}px`;
      card.style.width = `${finite(item.width, 150, 70, 800)}px`; card.style.height = `${finite(item.height, 120, 65, 800)}px`;
      const head = document.createElement('div'); head.className = 'drawing-head'; head.textContent = item.type === 'picture' ? 'Picture · drag to move' : 'Shape · drag to move';
      const remove = document.createElement('button'); remove.type = 'button'; remove.textContent = '×'; remove.title = 'Remove object'; remove.setAttribute('aria-label','Remove object');
      remove.onclick = () => { drawings = drawings.filter(value => value.id !== item.id); persist(); renderDrawings(); };
      head.appendChild(remove); card.appendChild(head);
      const content = document.createElement('div'); content.className = 'drawing-content';
      if (item.type === 'picture') { const img = document.createElement('img'); img.src = item.src; img.alt = item.name || 'Inserted picture'; content.appendChild(img); }
      else if (item.type === 'process') { const process = document.createElement('div'); process.className = 'drawing-process'; for (const label of Array.isArray(item.labels) ? item.labels.slice(0,3) : []) { const step = document.createElement('span'); step.textContent = String(label).slice(0,40); process.appendChild(step); } content.appendChild(process); }
      else { const shape = document.createElement('div'); shape.className = `drawing-shape shape-${item.type}`; if (item.type === 'star') shape.textContent = '★'; if (item.type === 'heart') shape.textContent = '♥'; content.appendChild(shape); }
      card.appendChild(content); overlay.appendChild(card);
      head.addEventListener('pointerdown', event => {
        if (event.button !== 0 || event.target === remove) return; event.preventDefault();
        const sx = event.clientX, sy = event.clientY, x = parseFloat(card.style.left), y = parseFloat(card.style.top);
        head.setPointerCapture(event.pointerId);
        const move = e => { item.x = Math.max(0, x + e.clientX - sx); item.y = Math.max(0, y + e.clientY - sy); card.style.left = `${item.x}px`; card.style.top = `${item.y}px`; };
        const end = e => { head.removeEventListener('pointermove', move); head.removeEventListener('pointerup', end); head.removeEventListener('pointercancel', end); if (head.hasPointerCapture(e.pointerId)) head.releasePointerCapture(e.pointerId); persist(); };
        head.addEventListener('pointermove', move); head.addEventListener('pointerup', end); head.addEventListener('pointercancel', end);
      });
      card.addEventListener('pointerup', () => { const width = card.offsetWidth, height = card.offsetHeight; if (width !== item.width || height !== item.height) { item.width = width; item.height = height; persist(); } });
    }
  }
  function add(type, extra = {}) {
    if (drawings.length >= 20) { alert('A sheet can contain up to 20 pictures and shapes.'); return; }
    drawings.push({ id: crypto.randomUUID(), type, x: 45 + drawings.length * 12, y: 45 + drawings.length * 12, width: 150, height: 120, ...extra }); persist(); renderDrawings();
  }
  document.getElementById('insert-picture').onclick = () => document.getElementById('picture-file').click();
  document.getElementById('picture-file').onchange = event => {
    const file = event.target.files[0]; event.target.value = ''; if (!file) return;
    if (!['image/png','image/jpeg','image/webp'].includes(file.type) || file.size > 2 * 1024 * 1024) { alert('Choose a PNG, JPEG, or WebP picture under 2 MB.'); return; }
    const reader = new FileReader(); reader.onload = () => add('picture', { src: reader.result, name: file.name.slice(0, 120) }); reader.onerror = () => alert('Could not read the picture.'); reader.readAsDataURL(file);
  };
  document.getElementById('insert-shape').onclick = async () => { const choice = await ask('Shape: rectangle or circle', 'rectangle'); if (choice === null) return; const type = choice.trim().toLowerCase(); if (!['rectangle','circle'].includes(type)) { alert('Choose rectangle or circle.'); return; } add(type); };
  document.getElementById('insert-icon').onclick = async () => { const choice = await ask('Clip art: star or heart', 'heart'); if (choice === null) return; const type = choice.trim().toLowerCase(); if (!['star','heart'].includes(type)) { alert('Choose star or heart.'); return; } add(type); };
  document.getElementById('insert-process').onclick = async () => { const value = await ask('Enter up to three process steps, separated by commas:', 'Plan, Do, Review'); if (value === null) return; const labels = value.split(',').map(s => s.trim().slice(0,40)).filter(Boolean).slice(0,3); if (!labels.length) return; add('process', { labels, width: 300, height: 100 }); };
  document.getElementById('insert-screenshot').onclick = async () => {
    if (!confirm('Capture the primary screen and insert it into this sheet?')) return;
    let stream;
    try {
      stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
      const video = document.createElement('video'); video.srcObject = stream; await video.play();
      const scale = Math.min(1, 1600 / video.videoWidth, 1000 / video.videoHeight);
      const canvas = document.createElement('canvas'); canvas.width = Math.round(video.videoWidth * scale); canvas.height = Math.round(video.videoHeight * scale);
      canvas.getContext('2d').drawImage(video, 0, 0, canvas.width, canvas.height);
      add('picture', { src: canvas.toDataURL('image/jpeg', 0.8), name: 'Screenshot' });
    } catch { alert('Could not capture the screen.'); } finally { if (stream) stream.getTracks().forEach(track => track.stop()); }
  };

  function address(value) { const match = /^\s*([A-Z]+)([1-9]\d*)\s*$/i.exec(value); if (!match) return null; let c = 0; for (const char of match[1].toUpperCase()) c = c * 26 + char.charCodeAt(0) - 64; return [Number(match[2])-1,c-1]; }
  function range(text) {
    const parts = text.split(':'); if (parts.length !== 2) return null;
    const a = address(parts[0]), b = address(parts[1]); if (!a || !b) return null;
    const r1 = Math.min(a[0],b[0]), c1 = Math.min(a[1],b[1]), r2 = Math.max(a[0],b[0]), c2 = Math.max(a[1],b[1]);
    const cols = Math.max(8, ...app.state.cells.map(row => row.length));
    if (r2 >= app.state.cells.length || c2 >= cols || (r2-r1+1)*(c2-c1+1) > 10000) return null;
    return [r1,c1,r2,c2];
  }
  document.getElementById('table-style').onclick = async () => {
    const text = await ask('Format a range as a table (first row is the header):', 'A1:D10'); if (text === null) return;
    const area = range(text); if (!area) { alert('Enter a valid existing range, such as A1:D10 (up to 10,000 cells).'); return; }
    GridFormat.formatTable(...area);
  };
  document.getElementById('pivot-summary').onclick = async () => {
    const group = await ask('Group by column (first row is a heading):', 'A'); if (group === null) return;
    const sum = await ask('Sum values in column:', 'B'); if (sum === null) return;
    const a = address(`${group.trim()}1`), b = address(`${sum.trim()}1`), cols = Math.max(8, ...app.state.cells.map(row => row.length));
    if (!a || !b || a[1] >= cols || b[1] >= cols) { alert('Enter existing column letters, such as A and B.'); return; }
    panel.hidden = false;
    function show() {
      const evaluate = Formula.calculate(app.state.cells), totals = new Map();
      for (let r = 1; r < app.state.cells.length; r++) { const key = String(evaluate(r,a[1])); if (!key) continue; const val = evaluate(r,b[1]); const number = val === '' ? 0 : Number(val); if (!Number.isFinite(number)) continue; totals.set(key, (totals.get(key) || 0) + number); }
      panel.replaceChildren(); const title = document.createElement('strong'); title.textContent = `Pivot summary: ${group.toUpperCase()} grouped, ${sum.toUpperCase()} summed`;
      const close = document.createElement('button'); close.type = 'button'; close.textContent = 'Close'; close.onclick = () => { panel.hidden = true; grid.removeEventListener('input', show); };
      const table = document.createElement('table'); table.className = 'pivot-table'; const header = table.insertRow(); for (const text of ['Group','Sum']) { const th = document.createElement('th'); th.textContent = text; header.appendChild(th); }
      for (const [key,value] of totals) { const row = table.insertRow(); row.insertCell().textContent = key; row.insertCell().textContent = String(value); }
      panel.append(title,close,table);
    }
    if (panel._update) grid.removeEventListener('input', panel._update); panel._update = show; grid.addEventListener('input', show); show();
  };
  const observer = new MutationObserver(() => { if (!loaded && grid.tBodies.length) { loaded = true; drawings = Array.isArray(app.state.drawings) ? app.state.drawings.slice(0, 20) : []; renderDrawings(); } });
  observer.observe(grid, { childList: true });
  if (grid.tBodies.length) { loaded = true; drawings = Array.isArray(app.state.drawings) ? app.state.drawings.slice(0, 20) : []; renderDrawings(); }
})();
