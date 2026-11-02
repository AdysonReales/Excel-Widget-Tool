(function (root) {
  function calculate(cells) {
    const cache = new Map(), visiting = new Set();
    function cell(r, c) {
      const key = r + ':' + c;
      if (cache.has(key)) return cache.get(key);
      if (visiting.has(key)) throw new Error('#CYCLE!');
      const raw = String(cells[r]?.[c] ?? '');
      if (!raw.startsWith('=')) return raw;
      visiting.add(key);
      try { const result = expression(raw.slice(1)); cache.set(key, result); return result; }
      finally { visiting.delete(key); }
    }
    function expression(source) {
      const tokens = source.match(/\s*(?:(\d+(?:\.\d*)?|\.\d+)(?:[eE]([+-]?\d+))?|([A-Za-z]+\d+|[A-Za-z]+)|(.))/g) || [];
      const parts = tokens.map(t => t.trim()).filter(Boolean); let i = 0;
      function numeric(v) { if (v === '') return 0; const n = Number(v); if (!Number.isFinite(n)) throw new Error('#VALUE!'); return n; }
      function address(token) { const m = /^([A-Z]+)([1-9]\d*)$/i.exec(token || ''); if (!m) return null; let c = 0; for (const ch of m[1].toUpperCase()) c = c * 26 + ch.charCodeAt(0) - 64; return [Number(m[2]) - 1, c - 1]; }
      function primary() {
        const token = parts[i++]; if (token === undefined) throw new Error('#ERROR!');
        if (token === '(') { const v = sum(); if (parts[i++] !== ')') throw new Error('#ERROR!'); return v; }
        if (token === '+' || token === '-') { const v = numeric(primary()); return token === '-' ? -v : v; }
        if (/^(?:\d+(?:\.\d*)?|\.\d+)(?:e[+-]?\d+)?$/i.test(token)) return Number(token);
        const pos = address(token); if (pos) return numeric(cell(...pos));
        if (/^[a-z]+$/i.test(token) && parts[i++] === '(') {
          const values = []; if (parts[i] !== ')') do {
            const start = address(parts[i]);
            if (start && parts[i + 1] === ':') { i += 2; const end = address(parts[i++]); if (!end) throw new Error('#ERROR!'); const count = (Math.abs(end[0]-start[0])+1)*(Math.abs(end[1]-start[1])+1); if (count > 10000) throw new Error('#RANGE!'); for (let r = Math.min(start[0],end[0]); r <= Math.max(start[0],end[0]); r++) for (let c = Math.min(start[1],end[1]); c <= Math.max(start[1],end[1]); c++) { const item = cell(r,c); if (item !== '' && Number.isFinite(Number(item))) values.push(Number(item)); } }
            else values.push(numeric(sum()));
            if (parts[i] !== ',') break; i++;
          } while (true);
          if (parts[i++] !== ')') throw new Error('#ERROR!');
          switch (token.toUpperCase()) { case 'SUM': return values.reduce((a,b) => a+b,0); case 'AVERAGE': if (!values.length) throw new Error('#DIV/0!'); return values.reduce((a,b)=>a+b,0)/values.length; case 'MIN': return values.length ? Math.min(...values) : 0; case 'MAX': return values.length ? Math.max(...values) : 0; default: throw new Error('#NAME?'); }
        }
        throw new Error('#ERROR!');
      }
      function product() { let v = numeric(primary()); while (parts[i] === '*' || parts[i] === '/') { const op = parts[i++], right = numeric(primary()); if (op === '/' && right === 0) throw new Error('#DIV/0!'); v = op === '*' ? v * right : v / right; } return v; }
      function sum() { let v = product(); while (parts[i] === '+' || parts[i] === '-') { const op = parts[i++], right = product(); v = op === '+' ? v + right : v - right; } return v; }
      const result = sum(); if (i !== parts.length || !Number.isFinite(result)) throw new Error('#ERROR!'); return result;
    }
    return (r,c) => { try { return cell(r,c); } catch (error) { return /^#[A-Z0-9/?!]+$/.test(error.message) ? error.message : '#ERROR!'; } };
  }
  const api = { calculate }; if (typeof module !== 'undefined') module.exports = api; else root.Formula = api;
})(globalThis);
