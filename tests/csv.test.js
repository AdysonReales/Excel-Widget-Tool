const test = require('node:test'); const assert = require('node:assert/strict'); const csv = require('../shared/csv');
test('CSV round-trips commas, quotes, and line breaks', () => { const rows = [['hello, there', 'a"b', 'line 1\nline 2'], ['', 'x', '']]; assert.deepEqual(csv.parse(csv.stringify(rows)), rows); });
test('reads BOM and Windows line endings', () => assert.deepEqual(csv.parse('\uFEFFa,b\r\nc,d\r\n'), [['a','b'],['c','d']]));
test('rejects an unclosed quoted field', () => assert.throws(() => csv.parse('"unfinished')));
