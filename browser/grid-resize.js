(() => {
  const table = document.getElementById('grid');
  const DEFAULT_WIDTH = 140, DEFAULT_HEIGHT = 34;
  let widths = [], heights = [], onChange = () => {};
  let refreshQueued = false;

  const valid = (value, min, max, fallback) => typeof value === 'number' && Number.isFinite(value) ? Math.max(min, Math.min(max, Math.round(value))) : fallback;
  const widthAt = i => valid(widths[i], 55, 600, DEFAULT_WIDTH);
  const heightAt = i => valid(heights[i], 28, 300, DEFAULT_HEIGHT);

  function apply() {
    const head = table.tHead?.rows[0], body = table.tBodies[0];
    if (!head || !body) return;
    const columns = head.cells.length - 1;
    let group = table.querySelector('colgroup');
    if (!group) { group = document.createElement('colgroup'); table.prepend(group); }
    while (group.children.length < columns + 1) group.appendChild(document.createElement('col'));
    while (group.children.length > columns + 1) group.lastChild.remove();
    group.children[0].style.width = '42px';
    let total = 42;
    for (let c = 0; c < columns; c++) {
      const width = widthAt(c); group.children[c + 1].style.width = `${width}px`; total += width;
      addHandle(head.cells[c + 1], 'column', c);
    }
    table.style.width = `${total}px`;
    for (let r = 0; r < body.rows.length; r++) {
      const row = body.rows[r], height = heightAt(r);
      row.style.height = `${height}px`;
      for (const input of row.querySelectorAll('td input')) input.style.height = `${height - 1}px`;
      addHandle(row.cells[0], 'row', r);
    }
  }

  function setSize(kind, index, size) {
    if (kind === 'column') {
      widths[index] = valid(size, 55, 600, DEFAULT_WIDTH);
      const group = table.querySelector('colgroup');
      if (group?.children[index + 1]) group.children[index + 1].style.width = `${widthAt(index)}px`;
      const columns = table.tHead.rows[0].cells.length - 1;
      table.style.width = `${42 + Array.from({ length: columns }, (_, c) => widthAt(c)).reduce((a, b) => a + b, 0)}px`;
    } else {
      heights[index] = valid(size, 28, 300, DEFAULT_HEIGHT);
      const row = table.tBodies[0]?.rows[index];
      if (row) { row.style.height = `${heightAt(index)}px`; for (const input of row.querySelectorAll('td input')) input.style.height = `${heightAt(index) - 1}px`; }
    }
  }
  function persist() { onChange({ columnWidths: widths.slice(), rowHeights: heights.slice() }); }

  function addHandle(header, kind, index) {
    if (header.querySelector('.resize-handle')) return;
    const handle = document.createElement('span');
    handle.className = `resize-handle resize-${kind}`;
    handle.tabIndex = 0;
    handle.setAttribute('role', 'separator');
    handle.setAttribute('aria-orientation', kind === 'column' ? 'vertical' : 'horizontal');
    handle.setAttribute('aria-label', `Resize ${kind} ${header.textContent}`);
    handle.title = `Drag to resize ${kind}; use arrow keys for precise sizing`;
    handle.addEventListener('pointerdown', event => {
      if (event.button !== 0) return;
      event.preventDefault();
      const initialPosition = kind === 'column' ? event.clientX : event.clientY;
      const initialSize = kind === 'column' ? widthAt(index) : heightAt(index);
      handle.setPointerCapture(event.pointerId);
      const move = e => setSize(kind, index, initialSize + (kind === 'column' ? e.clientX : e.clientY) - initialPosition);
      const finish = e => { handle.removeEventListener('pointermove', move); handle.removeEventListener('pointerup', finish); handle.removeEventListener('pointercancel', cancel); if (handle.hasPointerCapture(e.pointerId)) handle.releasePointerCapture(e.pointerId); persist(); };
      const cancel = e => { setSize(kind, index, initialSize); finish(e); };
      handle.addEventListener('pointermove', move);
      handle.addEventListener('pointerup', finish);
      handle.addEventListener('pointercancel', cancel);
    });
    handle.addEventListener('keydown', event => {
      const delta = kind === 'column' ? (event.key === 'ArrowRight' ? 10 : event.key === 'ArrowLeft' ? -10 : 0) : (event.key === 'ArrowDown' ? 5 : event.key === 'ArrowUp' ? -5 : 0);
      if (!delta) return;
      event.preventDefault(); setSize(kind, index, (kind === 'column' ? widthAt(index) : heightAt(index)) + delta); persist();
    });
    header.appendChild(handle);
  }

  new MutationObserver(records => {
    if (!records.some(record => Array.from(record.addedNodes).some(node => node.nodeName === 'THEAD' || node.nodeName === 'TBODY'))) return;
    if (!refreshQueued) { refreshQueued = true; queueMicrotask(() => { refreshQueued = false; apply(); }); }
  }).observe(table, { childList: true });

  window.GridResize = { configure(options) {
    widths = Array.isArray(options.columnWidths) ? options.columnWidths.slice(0, 100) : [];
    heights = Array.isArray(options.rowHeights) ? options.rowHeights.slice(0, 1000) : [];
    onChange = options.onChange;
    apply();
  } };
})();
