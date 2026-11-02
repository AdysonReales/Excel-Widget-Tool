const fs = require('node:fs');
const path = require('node:path');
const root = path.join(__dirname, '..');
const requested = process.argv.slice(2);
const targets = requested.length ? requested : ['browser', 'chrome'];
if (targets.some(target => !['browser', 'chrome'].includes(target))) throw new Error('Expected browser or chrome.');
const files = ['style.css', 'csv.js', 'formula.js', 'grid-resize.js', 'grid-format.js', 'whiteboard.js', 'app.js'];
const html = fs.readFileSync(path.join(root, 'shared', 'index.html'), 'utf8').replace('<script defer src="desktop-extras.js"></script>', '');
for (const target of targets) {
  const destination = path.join(root, target);
  fs.mkdirSync(destination, { recursive: true });
  for (const file of files) fs.copyFileSync(path.join(root, 'shared', file), path.join(destination, file));
  fs.writeFileSync(path.join(destination, 'index.html'), html);
  console.log(`Updated ${target} extension files.`);
}
