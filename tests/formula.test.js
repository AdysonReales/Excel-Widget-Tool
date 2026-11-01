const test = require('node:test');
const assert = require('node:assert/strict');
const { calculate } = require('../shared/formula');
test('recalculates references, arithmetic, and ranges', () => {
  const cells = [['2','3','=A1+B1*2'], ['4','=SUM(A1:B1,A2)','=AVERAGE(A1:A2)']];
  let value = calculate(cells);
  assert.equal(value(0,2), 8); assert.equal(value(1,1), 9); assert.equal(value(1,2), 3);
  cells[0][0] = '10'; value = calculate(cells); assert.equal(value(0,2), 16); assert.equal(value(1,1), 17);
});
test('reports circular references, invalid formulas, and division by zero', () => {
  const value = calculate([['=B1','=A1','=1/0','=WHAT(2)','=1+']]);
  assert.equal(value(0,0),'#CYCLE!'); assert.equal(value(0,2),'#DIV/0!'); assert.equal(value(0,3),'#NAME?'); assert.equal(value(0,4),'#ERROR!');
});
