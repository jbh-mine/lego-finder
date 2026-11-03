import { createHandler, createRpc } from './handler.mjs';

// Public price reads are intentional. Collector writes authenticate their own
// strong bearer token and the RPC is callable only by the server service role.
// Deployment must use verify_jwt=false; never return these built-in credentials.
const rpc = createRpc({
  url: Deno.env.get('SUPABASE_URL'),
  serviceKey: Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'),
});
Deno.serve(createHandler({ rpc }));
