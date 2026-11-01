const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

function harness() {
  const events = {}, updates = [], creates = [];
  const event = name => ({ addListener: listener => { events[name] = listener; } });
  const chrome = { runtime: { getURL: file => 'chrome-extension://test/' + file }, tabs: {
    onCreated: event('created'), onUpdated: event('updated'), onRemoved: event('removed'),
    update: (id, options, done) => { updates.push({ id, ...options }); done(); },
    create: (options, done) => { creates.push(options); done(); }
  }, action: { onClicked: event('action') } };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, '../browser/background.js'), 'utf8'), { chrome });
  return { events, updates, creates };
}
test('redirects a new Opera start page and opens a tab from the toolbar', () => {
  const { events, updates, creates } = harness();
  events.created({ id: 1, url: 'opera://startpage/' });
  events.created({ id: 2, url: 'about:blank' }); events.updated(2, { url: 'browser://startpage/' });
  events.action();
  assert.deepEqual(updates.map(x => x.id), [1,2]);
  assert.equal(updates[0].url, 'chrome-extension://test/index.html');
  assert.equal(creates[0].url, 'chrome-extension://test/index.html');
});
test('leaves ordinary navigation and existing tabs alone', () => {
  const { events, updates } = harness();
  events.created({ id: 1, url: 'https://example.com' });
  events.updated(1, { url: 'opera://startpage/' });
  events.updated(99, { url: 'opera://startpage/' });
  events.created({ id: 3, url: 'about:blank' }); events.updated(3, { url: 'https://example.com' }); events.updated(3, { url: 'opera://startpage/' });
  events.created({ id: 4 }); events.removed(4); events.updated(4, { url: 'opera://startpage/' });
  assert.equal(updates.length, 0);
});
