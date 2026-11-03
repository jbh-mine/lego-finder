// Explicit runtime allowlist: never include credentials, databases or fixtures.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync } = require('node:child_process');
const server = path.resolve(__dirname, '../server/market-api');
const output = process.argv[2] && path.resolve(process.argv[2]);
if (!output || !output.endsWith('.tar.gz')) throw new Error('Provide the output .tar.gz path.');
if (fs.existsSync(output)) throw new Error('Output already exists; choose a new archive path.');
const files = ['config.mjs', 'oauth.mjs', 'provider.mjs', 'store.mjs', 'service.mjs', 'server.mjs',
  'hosting-entry.mjs', 'refresh.mjs', 'package.json', 'README.md', '.env.example'];
for (const name of files) if (!fs.statSync(path.join(server, name)).isFile()) throw new Error('Missing runtime file: ' + name);
fs.mkdirSync(path.dirname(output), { recursive: true });
const result = spawnSync('tar', ['-czf', output, '-C', server, ...files,
  '-C', path.resolve(__dirname, '../deploy/market-api'), 'alwaysdata.env.example'], { encoding: 'utf8', shell: false });
if (result.error || result.status !== 0) throw new Error('Packaging failed; a working tar command is required.');
const bytes = fs.readFileSync(output);
console.log(JSON.stringify({ archive: output, files: files.length + 1, bytes: bytes.length,
  sha256: crypto.createHash('sha256').update(bytes).digest('hex') }));
