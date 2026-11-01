(() => {
  const grid = document.getElementById('grid');
  const $ = id => document.getElementById(id);
  const fonts = ['Segoe UI', 'Arial', 'Calibri', 'Georgia', 'Times New Roman', 'Courier New'];
  let styles = {}, selected = '0:0', onChange = () => {};
  const cell = key => grid.querySelector(`input[data-row="${key.split(':')[0]}"][data-col="${key.split(':')[1]}"]`);
  const columnName = index => { let n = index + 1, name = ''; while (n) { n--; name = String.fromCharCode(65 + n % 26) + name; n = Math.floor(n / 26); } return name; };
  function safeStyle(value) {
    const s = value && typeof value === 'object' ? value : {};
    return {
      bold: s.bold === true, italic: s.italic === true, underline: s.underline === true,
      font: fonts.includes(s.font) ? s.font : 'Segoe UI', size: [10,11,12,14,16,18,20,24,28,32].includes(s.size) ? s.size : 12,
      color: /^#[0-9a-f]{6}$/i.test(s.color) ? s.color : '#514945', fill: /^#[0-9a-f]{6}$/i.test(s.fill) ? s.fill : '#ffffff',
      align: ['left','center','right'].includes(s.align) ? s.align : 'left', border: s.border === true,
      number: ['general','number','percent'].includes(s.number) ? s.number : 'general',
      conditional: s.conditional && typeof s.conditional.threshold === 'number' && Number.isFinite(s.conditional.threshold) ? { threshold: s.conditional.threshold } : null
    };
  }
  function paint(input, style) {
    if (!input) return;
    const s = safeStyle(style), td = input.parentElement;
    input.style.fontFamily = s.font; input.style.fontSize = `${s.size}px`; input.style.fontWeight = s.bold ? '700' : '400';
    input.style.fontStyle = s.italic ? 'italic' : 'normal'; input.style.textDecoration = s.underline ? 'underline' : 'none';
    input.style.color = s.color; input.style.textAlign = s.align;
    const conditional = s.conditional && input.dataset.calculated !== undefined && input.dataset.calculated !== '' && Number.isFinite(Number(input.dataset.calculated)) && Number(input.dataset.calculated) > s.conditional.threshold;
    td.style.backgroundColor = conditional ? '#ffc7ce' : s.fill;
    td.classList.toggle('formatted-border', s.border); td.classList.toggle('selected-cell-border', `${input.dataset.row}:${input.dataset.col}` === selected);
  }
  function updateControls() {
    const s = safeStyle(styles[selected]);
    $('format-font').value = s.font; $('format-size').value = String(s.size); $('format-color').value = s.color; $('format-fill').value = s.fill; $('format-number').value = s.number;
    for (const name of ['bold','italic','underline','border']) $('format-' + name).setAttribute('aria-pressed', String(s[name]));
    for (const name of ['left','center','right']) $('format-' + name).setAttribute('aria-pressed', String(s.align === name));
    const [r,c] = selected.split(':').map(Number); $('selected-cell').textContent = columnName(c) + (r + 1);
  }
  function update(change) { styles[selected] = { ...safeStyle(styles[selected]), ...change }; paint(cell(selected), styles[selected]); updateControls(); onChange({ ...styles }); }
  grid.addEventListener('focusin', event => {
    const input = event.target.closest('td input'); if (!input) return;
    const old = cell(selected); if (old) old.parentElement.classList.remove('selected-cell-border');
    selected = `${input.dataset.row}:${input.dataset.col}`; paint(input, styles[selected]); updateControls();
  });
  for (const name of ['bold','italic','underline','border']) $('format-' + name).addEventListener('click', () => update({ [name]: !safeStyle(styles[selected])[name] }));
  for (const name of ['left','center','right']) $('format-' + name).addEventListener('click', () => update({ align: name }));
  $('format-font').addEventListener('change', event => update({ font: event.target.value }));
  $('format-size').addEventListener('change', event => update({ size: Number(event.target.value) }));
  $('format-color').addEventListener('input', event => update({ color: event.target.value }));
  $('format-fill').addEventListener('input', event => update({ fill: event.target.value }));
  $('format-number').addEventListener('change', event => { update({ number: event.target.value }); grid.dispatchEvent(new CustomEvent('refresh-formatted-values')); });
  $('format-preset').addEventListener('change', event => {
    const presets = { normal: { fill: '#ffffff', color: '#514945' }, good: { fill: '#c6efce', color: '#006100' }, bad: { fill: '#ffc7ce', color: '#9c0006' }, neutral: { fill: '#ffeb9c', color: '#9c6500' }, note: { fill: '#fff2cc', color: '#514945' } };
    if (presets[event.target.value]) update(presets[event.target.value]);
    event.target.value = '';
  });
  $('format-clear').addEventListener('click', () => { delete styles[selected]; paint(cell(selected), null); updateControls(); onChange({ ...styles }); grid.dispatchEvent(new CustomEvent('refresh-formatted-values')); });
  new MutationObserver(records => {
    if (!records.some(record => Array.from(record.addedNodes).some(node => node.nodeName === 'TBODY'))) return;
    queueMicrotask(() => { grid.querySelectorAll('td input').forEach(input => paint(input, styles[`${input.dataset.row}:${input.dataset.col}`])); updateControls(); });
  }).observe(grid, { childList: true });
  window.GridFormat = { selected() { return selected.split(':').map(Number); }, getStyle() { return safeStyle(styles[selected]); }, applyStyle(style) { update(safeStyle(style)); grid.dispatchEvent(new CustomEvent('refresh-formatted-values')); }, setConditional(threshold) { update({ conditional: threshold === null ? null : { threshold } }); grid.dispatchEvent(new CustomEvent('refresh-formatted-values')); }, updateValue(input, value) { input.dataset.calculated = String(value); paint(input, styles[`${input.dataset.row}:${input.dataset.col}`]); }, formatTable(r1, c1, r2, c2) {
    for (let r = r1; r <= r2; r++) for (let c = c1; c <= c2; c++) {
      const key = `${r}:${c}`;
      styles[key] = { ...safeStyle(styles[key]), border: true, fill: r === r1 ? '#76605a' : (r - r1) % 2 ? '#f7edeb' : '#ffffff', color: r === r1 ? '#ffffff' : '#514945', bold: r === r1 };
      paint(cell(key), styles[key]);
    }
    updateControls(); onChange({ ...styles });
  }, display(r, c, value) {
    const format = safeStyle(styles[`${r}:${c}`]).number;
    if (format === 'general' || value === '' || !Number.isFinite(Number(value))) return value;
    return new Intl.NumberFormat(undefined, { style: format === 'percent' ? 'percent' : 'decimal', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value));
  }, configure(options) {
    styles = {};
    if (options.cellStyles && typeof options.cellStyles === 'object' && !Array.isArray(options.cellStyles)) for (const [key, value] of Object.entries(options.cellStyles)) if (/^\d{1,4}:\d{1,3}$/.test(key)) styles[key] = safeStyle(value);
    onChange = options.onChange; updateControls();
  } };
})();
