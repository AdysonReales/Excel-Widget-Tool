(() => {
  if (!window.LittleGridWorkspace) return;
  const app = window.LittleGridWorkspace;
  const grid = document.getElementById('grid');
  const sheetCard = document.querySelector('.sheet-card');
  const toolbar = sheetCard.querySelector('.sheet-toolbar');
  const tabs = document.createElement('nav'); tabs.className = 'workspace-tabs'; tabs.setAttribute('aria-label', 'Workspace views');
  const sheetTab = document.createElement('button');
  sheetTab.type = 'button'; sheetTab.className = 'workspace-tab active'; sheetTab.textContent = '▦  Excel';
  const boardTab = document.createElement('button');
  boardTab.type = 'button'; boardTab.className = 'workspace-tab'; boardTab.textContent = '✎  Whiteboard'; boardTab.disabled = true;
  tabs.append(sheetTab, boardTab); document.getElementById('format-toolbar').before(tabs);
  const board = document.createElement('section');
  board.className = 'whiteboard'; board.hidden = true;
  board.setAttribute('aria-label', 'Whiteboard');
  board.innerHTML = '<div class="whiteboard-tools" role="toolbar" aria-label="Whiteboard tools"><button type="button" data-tool="pen" aria-pressed="true">✎ Draw</button><button type="button" data-tool="eraser" aria-pressed="false">◌ Erase</button><button type="button" data-tool="pan" aria-pressed="false">✥ Move</button><label>Color <input type="color" id="board-color" value="#514945" aria-label="Pen color"></label><label>Size <input type="range" id="board-size" min="1" max="40" value="4" aria-label="Pen or eraser size"></label><button type="button" id="board-zoom-out" aria-label="Zoom out">−</button><span id="board-zoom" aria-live="polite">100%</span><button type="button" id="board-zoom-in" aria-label="Zoom in">+</button><button type="button" id="board-reset-view" title="Return to the starting position">Home</button><button type="button" id="board-undo">Undo</button><button type="button" id="board-clear">Clear all</button></div><div class="whiteboard-surface"><canvas id="board-canvas" aria-label="Drawing surface"></canvas><div class="board-hint">Draw your ideas · Use Move to pan · Scroll to zoom</div></div>';
  sheetCard.querySelector('.grid-wrap').before(board);
  const canvas = board.querySelector('canvas'), ctx = canvas.getContext('2d');
  const color = board.querySelector('#board-color'), size = board.querySelector('#board-size'), zoomLabel = board.querySelector('#board-zoom');
  const sheetElements = [toolbar, sheetCard.querySelector('.grid-wrap'), sheetCard.querySelector('.sheet-footer'), sheetCard.querySelector('.card-header'), document.getElementById('format-toolbar'), document.querySelector('.insert-toolbar'), document.querySelector('.pivot-panel')].filter(Boolean);
  let strokes = [], tool = 'pen', zoom = 1, offsetX = 0, offsetY = 0, gesture = null, isReady = false, boardOpen = false;
  function sync() { app.state.whiteboard = { strokes }; app.save(); }
  function resize() {
    if (board.hidden) return;
    const rect = canvas.getBoundingClientRect(), ratio = window.devicePixelRatio || 1;
    const width = Math.max(1, Math.round(rect.width * ratio)), height = Math.max(1, Math.round(rect.height * ratio));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    render();
  }
  function setTransform() { const ratio = window.devicePixelRatio || 1; ctx.setTransform(ratio * zoom, 0, 0, ratio * zoom, ratio * offsetX, ratio * offsetY); }
  function drawStroke(stroke) {
    const points = stroke.points; if (!points.length) return;
    ctx.save(); ctx.globalCompositeOperation = stroke.tool === 'eraser' ? 'destination-out' : 'source-over';
    ctx.strokeStyle = stroke.color; ctx.fillStyle = stroke.color; ctx.lineWidth = stroke.size; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath(); ctx.moveTo(points[0][0], points[0][1]);
    if (points.length === 1) { ctx.arc(points[0][0], points[0][1], stroke.size / 2, 0, Math.PI * 2); ctx.fill(); }
    else { for (let i = 1; i < points.length; i++) ctx.lineTo(points[i][0], points[i][1]); ctx.stroke(); }
    ctx.restore();
  }
  function render() { ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height); setTransform(); for (const stroke of strokes) drawStroke(stroke); }
  function point(event) { const rect = canvas.getBoundingClientRect(); return [(event.clientX - rect.left - offsetX) / zoom, (event.clientY - rect.top - offsetY) / zoom]; }
  function setZoom(next, x, y) {
    const newZoom = Math.max(0.1, Math.min(5, next));
    const wx = (x - offsetX) / zoom, wy = (y - offsetY) / zoom;
    zoom = newZoom; offsetX = x - wx * zoom; offsetY = y - wy * zoom;
    zoomLabel.textContent = `${Math.round(zoom * 100)}%`; render();
  }
  function centreZoom(factor) { const rect = canvas.getBoundingClientRect(); setZoom(zoom * factor, rect.width / 2, rect.height / 2); }
  canvas.addEventListener('pointerdown', event => {
    if (!isReady || gesture || (event.pointerType === 'mouse' && event.button !== 0 && event.button !== 1)) return;
    event.preventDefault(); canvas.setPointerCapture(event.pointerId);
    if (tool === 'pan' || event.button === 1) { gesture = { id: event.pointerId, pan: true, x: event.clientX, y: event.clientY, ox: offsetX, oy: offsetY }; return; }
    const stroke = { tool, color: color.value, size: Number(size.value), points: [point(event)] };
    strokes.push(stroke); gesture = { id: event.pointerId, stroke }; setTransform(); drawStroke(stroke);
  });
  canvas.addEventListener('pointermove', event => {
    if (!gesture || gesture.id !== event.pointerId) return;
    if (gesture.pan) { offsetX = gesture.ox + event.clientX - gesture.x; offsetY = gesture.oy + event.clientY - gesture.y; render(); return; }
    const stroke = gesture.stroke, last = stroke.points[stroke.points.length - 1], next = point(event);
    stroke.points.push(next); setTransform(); drawStroke({ ...stroke, points: [last, next] });
  });
  function end(event) { if (!gesture || gesture.id !== event.pointerId) return; const drew = !gesture.pan; gesture = null; if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId); if (drew) sync(); }
  canvas.addEventListener('pointerup', end); canvas.addEventListener('pointercancel', end);
  canvas.addEventListener('wheel', event => { event.preventDefault(); const rect = canvas.getBoundingClientRect(); setZoom(zoom * (event.deltaY < 0 ? 1.1 : 1 / 1.1), event.clientX - rect.left, event.clientY - rect.top); }, { passive: false });
  board.querySelectorAll('[data-tool]').forEach(button => button.addEventListener('click', () => { tool = button.dataset.tool; board.querySelectorAll('[data-tool]').forEach(b => b.setAttribute('aria-pressed', String(b === button))); canvas.style.cursor = tool === 'pan' ? 'grab' : 'crosshair'; }));
  board.querySelector('#board-zoom-in').onclick = () => centreZoom(1.2);
  board.querySelector('#board-zoom-out').onclick = () => centreZoom(1 / 1.2);
  board.querySelector('#board-reset-view').onclick = () => { zoom = 1; offsetX = 0; offsetY = 0; zoomLabel.textContent = '100%'; render(); };
  board.querySelector('#board-undo').onclick = () => { if (strokes.length) { strokes.pop(); render(); sync(); } };
  board.querySelector('#board-clear').onclick = () => { if (strokes.length && confirm('Clear all drawings on the whiteboard?')) { strokes = []; render(); sync(); } };
  function selectBoard(show) {
    if (!isReady || show === boardOpen) return;
    boardOpen = show;
    if (gesture) { if (gesture.stroke) sync(); gesture = null; }
    board.hidden = !show; sheetElements.forEach(element => { if (show) { element.dataset.boardPreviouslyHidden = String(element.hidden); element.hidden = true; } else { element.hidden = element.dataset.boardPreviouslyHidden === 'true'; delete element.dataset.boardPreviouslyHidden; } });
    sheetTab.classList.toggle('active', !show); boardTab.classList.toggle('active', show);
    sheetTab.setAttribute('aria-pressed', String(!show)); boardTab.setAttribute('aria-pressed', String(show));
    if (show) requestAnimationFrame(resize);
  }
  sheetTab.setAttribute('aria-pressed', 'true'); boardTab.setAttribute('aria-pressed', 'false');
  sheetTab.onclick = () => selectBoard(false); boardTab.onclick = () => selectBoard(true);
  new ResizeObserver(resize).observe(canvas);
  function initialise() {
    if (isReady || !app.loaded) return;
    const saved = app.state.whiteboard;
    if (Array.isArray(saved?.strokes)) strokes = saved.strokes.filter(s => s && ['pen','eraser'].includes(s.tool) && /^#[0-9a-f]{6}$/i.test(s.color) && Number.isFinite(s.size) && s.size >= 1 && s.size <= 40 && Array.isArray(s.points) && s.points.length && s.points.every(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)));
    isReady = true; boardTab.disabled = false;
  }
  function showLoadError() { boardTab.disabled = true; boardTab.title = 'Saved data could not be loaded. Reload this page or extension to retry.'; boardTab.classList.add('load-error'); }
  document.addEventListener('littlegrid-loaded', initialise);
  document.addEventListener('littlegrid-load-error', showLoadError);
  const observer = new MutationObserver(() => { if (grid.tBodies.length && app.loaded) { observer.disconnect(); initialise(); } });
  observer.observe(grid, { childList: true });
  if (app.loaded) initialise(); else if (app.loadError) showLoadError();
})();
