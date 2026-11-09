import type { EquipmentId } from './equipment';
import { EXERCISES, getExercise, type Exercise, type Level, type Region } from './exercises';
import { canDo, expandKit, isSafeFor, kitUsed } from './kit';

export interface SwapRequest {
  exerciseId: string;
  kit: EquipmentId[];
  /** Kit someone else is on right now. Defaults to whatever the original exercise uses. */
  taken?: EquipmentId[];
  avoid?: Region[];
  level: Level;
  /** Exercises already in today's session, so a swap doesn't duplicate one. */
  inSession?: string[];
  count?: number;
}

export interface SwapOption {
  exercise: Exercise;
  reason: string;
}

/**
 * "Machine taken": up to `count` alternatives that train the same thing
 * with kit that is free in this gym right now.
 */
export function getSwaps(req: SwapRequest): SwapOption[] {
  const original = getExercise(req.exerciseId);
  const kit = expandKit(req.kit);
  const taken = new Set(req.taken ?? kitUsed(original, kit).filter((id) => id !== 'bodyweight'));
  const skip = new Set([original.id, ...(req.inSession ?? [])]);
  const mainMuscle = original.muscles[0];

  const pool = EXERCISES.filter(
    (ex) => !skip.has(ex.id) && ex.level <= req.level + 1 && canDo(ex, kit, taken) && isSafeFor(ex, req.avoid ?? []),
  );

  const ranked = pool
    .map((ex) => {
      let s = 0;
      let reason = '';
      if (ex.pattern === original.pattern) { s += 10; reason = 'Same movement'; }
      else if (ex.muscles.includes(mainMuscle)) { s += 6; reason = `Same main muscle (${mainMuscle})`; }
      else return null;
      if (ex.compound === original.compound) s += 2;
      if (ex.needs.length > 0) s += 1;
      s -= Math.abs(ex.level - original.level);
      return { exercise: ex, reason, s };
    })
    .filter((x): x is SwapOption & { s: number } => x !== null)
    .sort((a, b) => b.s - a.s);

  return ranked.slice(0, req.count ?? 3).map(({ exercise, reason }) => ({ exercise, reason }));
}
