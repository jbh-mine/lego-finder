# Market SQL verification

Run in this directory:

```sh
npm ci
npm test
```

The pinned PGlite dependency runs PostgreSQL in memory. `bootstrap.sql` creates
local test roles and an unrelated Kuji probe table; **never apply bootstrap.sql
to the hosted project**. Local tests run each rollback case separately and then
the complete verification script, asserting no fixture rows remain.

After applying `../schema.sql` to the intended hosted project, an administrator
can run the **complete** `verify-rollback.sql` file before starting the collector.
Its 21 cases use clearly marked synthetic prices and temporarily configured
test authentication only inside a transaction. The final `ROLLBACK` is required.
Do not copy individual fixture statements into production or commit them as
operational market observations. No provider HTTP requests are made by this SQL.

For an already running collector, pause it or wait until no live lease exists
before running verification. The tests serialize on the LEGO settings row and
do not modify Kuji or Auth data, schemas, policies, or grants.
