import { createClient, type SupabaseClient, type User } from 'npm:@supabase/supabase-js@2';

export const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...cors, 'Content-Type': 'application/json' } });
}

export function env(name: string, fallback?: string): string {
  const v = Deno.env.get(name) ?? fallback;
  if (v === undefined) throw new Error(`Missing secret ${name}`);
  return v;
}

/** First key in a JSON map env var (newer projects expose keys as SUPABASE_*_KEYS). */
function keyFrom(jsonVar: string): string | undefined {
  try { const v = Deno.env.get(jsonVar); return v ? (Object.values(JSON.parse(v))[0] as string) : undefined; } catch { return undefined; }
}

/** The signed-in (usually anonymous) user behind this request, or null. */
export async function getUser(req: Request): Promise<User | null> {
  const auth = req.headers.get('Authorization');
  if (!auth) return null;
  const apikey = req.headers.get('apikey') ?? Deno.env.get('SUPABASE_ANON_KEY') ?? keyFrom('SUPABASE_PUBLISHABLE_KEYS') ?? '';
  const res = await fetch(`${env('SUPABASE_URL')}/auth/v1/user`, { headers: { Authorization: auth, apikey } });
  return res.ok ? ((await res.json()) as User) : null;
}

/** Service-role client for writes users may not make directly. Never leaves the server. */
export function admin(): SupabaseClient {
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? keyFrom('SUPABASE_SECRET_KEYS');
  if (!key) throw new Error('Missing service key');
  return createClient(env('SUPABASE_URL'), key, { auth: { persistSession: false } });
}
