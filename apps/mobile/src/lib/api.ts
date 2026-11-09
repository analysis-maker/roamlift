import { equipmentCatalogForPrompt, isEquipmentId, normalizeDetection, type EquipmentId, type NormalizedDetection } from '@roamlift/core';
import type { Gym } from './store';
import { ensureSession, supabase } from './supabase';

export const backendReady = supabase !== null;
/** Nearby search needs a Google Maps key on the server; hidden until that is set. */
export const nearbyReady = backendReady && process.env.EXPO_PUBLIC_NEARBY === '1';

export interface ScanImage {
  /** Base64 JPEG, already resized on the device. */
  data: string;
  mediaType: 'image/jpeg';
}

export interface NearbyPlace {
  placeId: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  kind: 'gym' | 'stay';
  kit?: EquipmentId[];
  lastScannedAt?: string;
  scans?: number;
}

function requireBackend() {
  if (!supabase) throw new Error('The backend is not set up yet, so add your kit by hand for now.');
  return supabase;
}

/** Photos in, catalogue ids out. Photos are processed and discarded server-side. */
export async function detectEquipment(images: ScanImage[]): Promise<NormalizedDetection> {
  const sb = requireBackend();
  await ensureSession();
  const { data, error } = await sb.functions.invoke('detect-equipment', {
    body: { images, catalog: equipmentCatalogForPrompt() },
  });
  if (error) {
    // The function explains limits (e.g. free scans used up) in its body; show that when present.
    const body = await (error as { context?: Response }).context?.json?.().catch(() => null);
    throw new Error(body?.message ?? 'Could not read the photos. Check your connection and try again.');
  }
  return normalizeDetection(data);
}

export async function nearbyPlaces(lat: number, lng: number): Promise<NearbyPlace[]> {
  const sb = requireBackend();
  await ensureSession();
  const { data, error } = await sb.functions.invoke('places-nearby', { body: { lat, lng } });
  if (error) throw new Error('Could not load nearby places right now.');
  const places = (data?.places ?? []) as NearbyPlace[];
  return places.map((p) => ({ ...p, kit: p.kit?.filter(isEquipmentId) }));
}

/** Adds this confirmed kit to the shared gym map so the next traveller skips the scan. */
export async function shareGymKit(gym: Gym, lat?: number, lng?: number): Promise<void> {
  if (!supabase || !gym.placeId) return;
  await ensureSession();
  const { error: placeError } = await supabase
    .from('gyms')
    .upsert({ place_id: gym.placeId, name: gym.name, address: gym.address ?? null, lat: lat ?? null, lng: lng ?? null }, { onConflict: 'place_id', ignoreDuplicates: true });
  if (placeError) throw placeError;
  const { error } = await supabase.from('gym_kits').insert({ place_id: gym.placeId, kit: gym.kit });
  if (error) throw error;
}

export function mapsUrl(place: { placeId?: string; name: string }): string {
  const q = encodeURIComponent(place.name);
  return place.placeId
    ? `https://www.google.com/maps/search/?api=1&query=${q}&query_place_id=${place.placeId}`
    : `https://www.google.com/maps/search/?api=1&query=${q}`;
}
