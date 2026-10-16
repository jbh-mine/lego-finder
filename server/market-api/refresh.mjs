// Cron calls the running process; it does not create a second provider worker.
const base = process.env.LOCAL_API_URL || 'http://127.0.0.1:8080';
import { readFileSync } from 'node:fs';
let token;
try { token = String(process.env.ADMIN_TOKEN !== undefined ? process.env.ADMIN_TOKEN : process.env.ADMIN_TOKEN_FILE ? readFileSync(process.env.ADMIN_TOKEN_FILE, 'utf8') : '').replace(/[\r\n]+$/, ''); }
catch (error) { throw new Error('ADMIN_TOKEN_FILE could not be read.'); }
if (!token) throw new Error('ADMIN_TOKEN is required.');
const url = new URL('/v1/admin/refresh', base);
if (!['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname)) throw new Error('LOCAL_API_URL must use loopback.');
const response = await fetch(url, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' }, body: '{}', signal: AbortSignal.timeout(10000) });
if (!response.ok) throw new Error('Refresh request failed with HTTP ' + response.status);
console.log(await response.text());
