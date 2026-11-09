import { type EquipmentId, withBodyweight } from './equipment';
import type { Exercise, Region } from './exercises';

/** Some kit can stand in for other kit. A multi-gym has a pulley, a press and a pulldown. */
const IMPLIES: Partial<Record<EquipmentId, EquipmentId[]>> = {
  adjustable_bench: ['flat_bench'],
  multi_gym: ['cable_stack', 'chest_press_machine', 'lat_pulldown', 'leg_extension', 'leg_curl', 'flat_bench'],
  assisted_pullup: ['pull_up_bar', 'dip_station'],
  squat_rack: ['pull_up_bar'], // nearly every power rack has a chin bar; the confirm screen lets users untick it
};

export type Kit = ReadonlySet<EquipmentId>;

export function expandKit(kit: Iterable<EquipmentId>): Kit {
  const out = withBodyweight(kit);
  for (const id of [...out]) for (const extra of IMPLIES[id] ?? []) out.add(extra);
  return out;
}

export function canDo(ex: Exercise, kit: Kit, unavailable: ReadonlySet<EquipmentId> = new Set()): boolean {
  return ex.needs.every((anyOf) => anyOf.some((id) => kit.has(id) && !unavailable.has(id)));
}

export function isSafeFor(ex: Exercise, avoid: readonly Region[]): boolean {
  return !ex.loads.some((r) => avoid.includes(r));
}

/** Kit used by an exercise in this gym, so "machine taken" knows what to block. */
export function kitUsed(ex: Exercise, kit: Kit): EquipmentId[] {
  return ex.needs.map((anyOf) => anyOf.find((id) => kit.has(id))).filter((id): id is EquipmentId => !!id);
}
