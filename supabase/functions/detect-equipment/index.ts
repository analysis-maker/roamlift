// Photos of a gym in, a structured equipment list out.
// Photos are sent to the model and never stored.
import { admin, cors, env, getUser, json } from '../_shared/http.ts';

interface CatalogEntry { id: string; label: string; aliases?: string[] }
interface ImageIn { data: string; mediaType: string }

const MAX_IMAGES = 10;
const MAX_IMAGE_CHARS = 2_000_000; // ~1.5 MB of JPEG per photo after base64

const TOOL = {
  name: 'report_equipment',
  description: 'Report every piece of training equipment visible across the photos.',
  input_schema: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            equipment_id: { type: ['string', 'null'], description: 'One id from the catalogue, or null if nothing fits.' },
            label: { type: 'string', description: 'What you see, in a few words, e.g. "dumbbell rack 2.5-25 kg".' },
            count: { type: 'integer', description: 'How many, if more than one is visible.' },
            weight_range: { type: ['string', 'null'], description: 'Readable weight range, e.g. "2-20 kg". Null if not readable.' },
            confidence: { type: 'number', description: '0 to 1. Below 0.6 if partly hidden or you are guessing.' },
          },
          required: ['equipment_id', 'label', 'confidence'],
        },
      },
    },
    required: ['items'],
  },
};

function prompt(catalog: CatalogEntry[]): string {
  const list = catalog.map((c) => `- ${c.id}: ${c.label}${c.aliases?.length ? ` (also: ${c.aliases.join(', ')})` : ''}`).join('\n');
  return [
    'These photos show a gym, hotel fitness room or apartment gym. List the training equipment a person could use.',
    'Map each item to exactly one catalogue id below. Merge the same item seen in several photos. Ignore people, TVs, towels and decor.',
    'If a machine is out of order, roped off or covered, leave it out. If you are unsure what a machine is, give your best id with low confidence.',
    'Read dumbbell and stack weights only when the numbers are legible.',
    '',
    'Catalogue:',
    list,
  ].join('\n');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  try {
    const user = await getUser(req);
    if (!user) return json({ error: 'Sign in first' }, 401);

    const body = await req.json().catch(() => null) as { images?: ImageIn[]; catalog?: CatalogEntry[] } | null;
    const images = (body?.images ?? []).filter((i) => typeof i?.data === 'string' && i.data.length > 0 && i.data.length <= MAX_IMAGE_CHARS);
    const catalog = (body?.catalog ?? []).filter((c) => typeof c?.id === 'string' && typeof c?.label === 'string').slice(0, 100);
    if (images.length === 0 || images.length > MAX_IMAGES) return json({ error: `Send 1 to ${MAX_IMAGES} photos` }, 400);
    if (catalog.length === 0) return json({ error: 'Missing catalogue' }, 400);

    // Free tier: N scans a calendar month. Pro is unlimited.
    const db = admin();
    const limit = Number(env('FREE_SCANS_PER_MONTH', '10'));
    const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();
    const [{ data: profile }, { count }] = await Promise.all([
      db.from('profiles').select('is_pro').eq('user_id', user.id).maybeSingle(),
      db.from('scan_events').select('id', { count: 'exact', head: true }).eq('user_id', user.id).gte('created_at', monthStart),
    ]);
    if (!profile?.is_pro && (count ?? 0) >= limit) {
      return json({ error: 'scan_limit', message: `You have used your ${limit} free scans this month. Pick kit by hand, or upgrade for unlimited scans.` }, 402);
    }

    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'x-api-key': env('ANTHROPIC_API_KEY'), 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
      body: JSON.stringify({
        model: env('DETECTION_MODEL', 'claude-sonnet-5-5'),
        max_tokens: 2000,
        tools: [TOOL],
        tool_choice: { type: 'tool', name: TOOL.name },
        messages: [{
          role: 'user',
          content: [
            ...images.map((i) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: i.data } })),
            { type: 'text', text: prompt(catalog) },
          ],
        }],
      }),
    });
    if (!res.ok) {
      console.error('model error', res.status, await res.text());
      return json({ error: 'Detection failed' }, 502);
    }
    const out = await res.json();
    const call = (out.content ?? []).find((c: { type: string }) => c.type === 'tool_use');
    const ids = new Set(catalog.map((c) => c.id));
    const items = ((call?.input?.items ?? []) as Record<string, unknown>[]).map((i) => ({
      ...i,
      equipment_id: typeof i.equipment_id === 'string' && ids.has(i.equipment_id) ? i.equipment_id : null,
    }));

    await db.from('scan_events').insert({ user_id: user.id, images: images.length, items_found: items.length });
    return json({ items });
  } catch (e) {
    console.error(e);
    return json({ error: 'Server error' }, 500);
  }
});
