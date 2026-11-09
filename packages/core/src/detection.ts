import { EQUIPMENT, EQUIPMENT_IDS, isEquipmentId, type EquipmentId } from './equipment';

/** One item as the vision function returns it. */
export interface RawDetectedItem {
  equipment_id?: string | null;
  label?: string;
  count?: number;
  weight_range?: string | null;
  confidence?: number;
}

export interface DetectedKitItem {
  id: EquipmentId;
  label: string;
  confidence: number;
  /** Pre-ticked on the confirm screen when confident. */
  checked: boolean;
  count?: number;
  weightRange?: string;
}

export interface NormalizedDetection {
  items: DetectedKitItem[];
  /** Things seen that don't map to our catalogue. Shown so the user can add them manually. */
  unknown: string[];
}

export const CONFIDENT = 0.6;

function matchAlias(label: string): EquipmentId | null {
  const text = label.toLowerCase();
  let best: { id: EquipmentId; len: number } | null = null;
  for (const id of EQUIPMENT_IDS) {
    for (const alias of [EQUIPMENT[id].label.toLowerCase(), ...EQUIPMENT[id].aliases]) {
      if (text.includes(alias) && (!best || alias.length > best.len)) best = { id, len: alias.length };
    }
  }
  return best?.id ?? null;
}

/** Turn whatever the model returned into catalogue ids, merging duplicates across photos. */
export function normalizeDetection(raw: unknown): NormalizedDetection {
  const list: RawDetectedItem[] = Array.isArray(raw)
    ? raw
    : raw && typeof raw === 'object' && Array.isArray((raw as { items?: unknown }).items)
      ? (raw as { items: RawDetectedItem[] }).items
      : [];
  const byId = new Map<EquipmentId, DetectedKitItem>();
  const unknown = new Set<string>();

  for (const item of list) {
    if (!item || typeof item !== 'object') continue;
    const label = typeof item.label === 'string' ? item.label.trim() : '';
    const id = isEquipmentId(item.equipment_id) ? item.equipment_id : label ? matchAlias(label) : null;
    if (!id) { if (label) unknown.add(label); continue; }
    if (id === 'bodyweight') continue; // always assumed
    const confidence = Math.max(0, Math.min(1, Number(item.confidence ?? 0.5)));
    const prev = byId.get(id);
    const count = typeof item.count === 'number' && item.count > 0 ? Math.round(item.count) : undefined;
    const weightRange = typeof item.weight_range === 'string' && item.weight_range.trim() ? item.weight_range.trim() : undefined;
    if (!prev || confidence > prev.confidence) {
      byId.set(id, { id, label: EQUIPMENT[id].label, confidence, checked: confidence >= CONFIDENT, count: count ?? prev?.count, weightRange: weightRange ?? prev?.weightRange });
    }
  }

  const items = [...byId.values()].sort((a, b) => b.confidence - a.confidence);
  return { items, unknown: [...unknown] };
}
