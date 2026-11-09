// Nearby gyms, hotels and apartment buildings from Google Places (New),
// joined with any kit already on the shared gym map.
// Only Pro-SKU fields are requested to keep the bill down.
import { admin, cors, env, getUser, json } from '../_shared/http.ts';

const GYM_TYPES = ['gym', 'fitness_center'];
const STAY_TYPES = ['hotel', 'lodging', 'resort_hotel', 'extended_stay_hotel', 'apartment_building', 'apartment_complex'];
const FIELD_MASK = 'places.id,places.displayName,places.formattedAddress,places.location,places.primaryType,places.types';

interface GPlace {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  location?: { latitude: number; longitude: number };
  types?: string[];
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST only' }, 405);

  try {
    if (!(await getUser(req))) return json({ error: 'Sign in first' }, 401);
    const { lat, lng, radius } = (await req.json().catch(() => ({}))) as { lat?: number; lng?: number; radius?: number };
    if (typeof lat !== 'number' || typeof lng !== 'number' || Math.abs(lat) > 90 || Math.abs(lng) > 180) return json({ error: 'lat and lng required' }, 400);

    const res = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': env('GOOGLE_MAPS_API_KEY'), 'X-Goog-FieldMask': FIELD_MASK },
      body: JSON.stringify({
        includedTypes: [...GYM_TYPES, ...STAY_TYPES],
        maxResultCount: 20,
        rankPreference: 'DISTANCE',
        locationRestriction: { circle: { center: { latitude: lat, longitude: lng }, radius: Math.min(Math.max(radius ?? 1500, 100), 5000) } },
      }),
    });
    if (!res.ok) {
      console.error('places error', res.status, await res.text());
      return json({ error: 'Places lookup failed' }, 502);
    }
    const places = ((await res.json()).places ?? []) as GPlace[];

    const ids = places.map((p) => p.id);
    const { data: kits } = ids.length
      ? await admin().from('gym_kit_latest').select('place_id, kit, last_scanned_at, scans').in('place_id', ids)
      : { data: [] };
    const byId = new Map((kits ?? []).map((k) => [k.place_id as string, k]));

    return json({
      places: places.map((p) => {
        const k = byId.get(p.id);
        return {
          placeId: p.id,
          name: p.displayName?.text ?? 'Unnamed place',
          address: p.formattedAddress,
          lat: p.location?.latitude,
          lng: p.location?.longitude,
          kind: (p.types ?? []).some((t) => GYM_TYPES.includes(t)) ? 'gym' : 'stay',
          kit: k?.kit,
          lastScannedAt: k?.last_scanned_at,
          scans: k?.scans,
        };
      }),
    });
  } catch (e) {
    console.error(e);
    return json({ error: 'Server error' }, 500);
  }
});
