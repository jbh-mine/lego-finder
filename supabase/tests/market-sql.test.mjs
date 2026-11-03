import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';
import assert from 'node:assert/strict';
import { before, after, test } from 'node:test';
let module;
try { module = await import('@electric-sql/pglite'); }
catch (error) {
  if (!process.env.PGLITE_MODULE_PATH) throw error;
  module = await import(pathToFileURL(process.env.PGLITE_MODULE_PATH).href);
}
const { PGlite } = module;
let db;
const schema = await readFile(new URL('../schema.sql', import.meta.url), 'utf8');
const verification = await readFile(new URL('./verify-rollback.sql', import.meta.url), 'utf8');
const [setup, ...sections] = verification.split(/^-- test: /m);
const cases = sections.map(section => {
  const end = section.indexOf('\n');
  return { name: section.slice(0,end).trim(), sql: section.slice(end+1).replace(/\nROLLBACK;\s*$/i,'') };
});
before(async () => {
  db = await PGlite.create();
  await db.exec(await readFile(new URL('./bootstrap.sql', import.meta.url), 'utf8'));
  await db.exec(schema);
});
after(async () => { if (db) await db.close(); });
for (const item of cases) test(item.name, async () => {
  try { await db.exec(setup + item.sql + '\nROLLBACK;'); }
  catch (error) { await db.exec('rollback; reset role;'); throw error; }
  const result = await db.query(`select (select count(*)::int from lego_market.scopes) as scopes,
    (select count(*)::int from lego_market.observations) as observations,
    (select count(*)::int from public.kuji_probe) as unrelated`);
  assert.deepEqual(result.rows,[{scopes:0,observations:0,unrelated:1}]);
});
test('complete hosted verification script rolls back every fixture and preserves unrelated grants', async () => {
  await db.exec(verification);
  const result = await db.query(`select (select count(*)::int from lego_market.scopes) as scopes,
    (select collector_token_hash from lego_market.settings where singleton) as hash,
    has_table_privilege('authenticated','public.kuji_probe','select') as unrelated_grant`);
  assert.deepEqual(result.rows,[{scopes:0,hash:null,unrelated_grant:true}]);
});
