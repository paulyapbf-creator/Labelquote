// Writes src/buildinfo.json with current git version info.
// Run before pushing so Railway has accurate version at build time.
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const pkg = JSON.parse(fs.readFileSync(path.join(__dirname, '../package.json'), 'utf8'));

function run(cmd) {
  try { return execSync(cmd, { encoding: 'utf8' }).trim(); }
  catch { return null; }
}

const hash    = run('git rev-parse --short HEAD') || 'unknown';
const count   = parseInt(run('git rev-list --count HEAD') || '0', 10);
const [major, minor] = pkg.version.split('.');
const version = `${major}.${minor}.${count}`;
const date    = new Date().toISOString().slice(0, 10);

const out = { version, hash, date };
fs.writeFileSync(
  path.join(__dirname, '../src/buildinfo.json'),
  JSON.stringify(out, null, 2) + '\n'
);
console.log(`Stamped: v${version} (${hash}) · ${date}`);
