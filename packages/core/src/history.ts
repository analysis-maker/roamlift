import { EXERCISE_BY_ID, type Pattern } from './exercises';

/**
 * Training history belongs to the user, not the gym. Logs are keyed by
 * exercise and movement pattern, so a cable row in Bangkok informs a
 * dumbbell row in Sydney.
 */
export interface LoggedExercise {
  exerciseId: string;
  name: string;
  pattern: Pattern;
  setsPlanned: number;
  setsDone: number;
  /** As typed: "12 kg", "25lb", "pin 5". */
  weight?: string;
  /** Reps achieved on a typical set. */
  reps?: number;
  /** Target range from the plan, e.g. "8-12" or "10-15 / side". */
  target: string;
}

export interface WorkoutLog {
  id: string;
  date: string; // ISO
  gymName: string;
  placeId?: string;
  sessionKey: string;
  sessionTitle: string;
  week: number;
  entries: LoggedExercise[];
}

export interface Weight {
  value: number;
  unit: 'kg' | 'lb' | 'pin' | 'level';
}

/** "12 kg", "12kg", "25 lb", "pin 5", "5" (assumed kg), "level 8". Null if unreadable. */
export function parseWeight(text: string | undefined): Weight | null {
  if (!text) return null;
  const s = text.trim().toLowerCase();
  const num = s.match(/(\d+(?:[.,]\d+)?)/);
  if (!num) return null;
  const value = parseFloat(num[1].replace(',', '.'));
  if (!Number.isFinite(value)) return null;
  const unit = /lb|pound/.test(s) ? 'lb' : /pin|plate|stack|notch/.test(s) ? 'pin' : /level|lvl/.test(s) ? 'level' : 'kg';
  return { value, unit };
}

export function targetRange(target: string): { lo: number; hi: number } | null {
  const m = target.match(/(\d+)\s*-\s*(\d+)/);
  if (!m || /s\b|min/.test(target.replace(/\/ side/, ''))) return null; // holds and timed work
  return { lo: Number(m[1]), hi: Number(m[2]) };
}

const newest = (logs: WorkoutLog[]) => [...logs].sort((a, b) => b.date.localeCompare(a.date));

export interface LastTime {
  entry: LoggedExercise;
  log: WorkoutLog;
  /** True when it's the same exercise; false when it's the closest match by movement. */
  exact: boolean;
}

/** The most recent time you did this exercise, or failing that, the same movement with other kit. */
export function lastTime(exerciseId: string, logs: WorkoutLog[], before?: string): LastTime | null {
  const pattern = EXERCISE_BY_ID[exerciseId]?.pattern;
  let similar: LastTime | null = null;
  for (const log of newest(logs)) {
    if (before && log.date >= before) continue;
    for (const entry of log.entries) {
      if (entry.setsDone === 0) continue;
      if (entry.exerciseId === exerciseId) return { entry, log, exact: true };
      if (!similar && pattern && entry.pattern === pattern && pattern !== 'conditioning') similar = { entry, log, exact: false };
    }
  }
  return similar;
}

export type Advice = { kind: 'up' | 'same' | 'down' | 'first'; text: string };

/** Double progression: top of the range on every set earns a heavier step next time. */
export function nextTimeAdvice(last: LastTime | null): Advice {
  if (!last) return { kind: 'first', text: 'First time: pick a weight that leaves 2 to 3 reps in the tank.' };
  const { entry, exact } = last;
  const w = parseWeight(entry.weight);
  const range = targetRange(entry.target);
  const used = entry.weight ? `${entry.weight}` : 'your last weight';
  if (!exact) return { kind: 'same', text: `Last ${patternWord(entry.pattern)}: ${entry.name}${entry.weight ? `, ${entry.weight}` : ''}${entry.reps ? ` x ${entry.reps}` : ''}. Different kit, so start a little lighter.` };
  if (!range || entry.reps === undefined) return { kind: 'same', text: `Last time: ${used}.` };
  if (entry.setsDone >= entry.setsPlanned && entry.reps >= range.hi) {
    const step = w ? (w.unit === 'pin' || w.unit === 'level' ? `${w.unit} ${w.value + 1}` : `${roundStep(w)} ${w.unit}`) : 'the next step up';
    return { kind: 'up', text: `Last time ${used} x ${entry.reps}, top of the range. Try ${step} today.` };
  }
  if (entry.reps < range.lo) return { kind: 'down', text: `Last time ${used} x ${entry.reps}, under the range. Stay there or go one step lighter.` };
  return { kind: 'same', text: `Last time ${used} x ${entry.reps}. Same weight, aim for one more rep.` };
}

function roundStep(w: Weight): number {
  const step = w.unit === 'lb' ? 5 : w.value < 10 ? 1 : 2.5;
  return Math.round((w.value + step) / step) * step;
}

function patternWord(p: Pattern): string {
  return ({ squat: 'squat', hinge: 'hinge', lunge: 'lunge', horizontal_push: 'press', vertical_push: 'overhead press', horizontal_pull: 'row', vertical_pull: 'pulldown' } as Partial<Record<Pattern, string>>)[p] ?? 'similar move';
}

/** Hard sets per movement in the last 7 days, for the weekly summary. */
export function weeklySets(logs: WorkoutLog[], now = new Date()): { pattern: Pattern; sets: number }[] {
  const since = new Date(now.getTime() - 7 * 864e5).toISOString();
  const totals = new Map<Pattern, number>();
  for (const log of logs) {
    if (log.date < since) continue;
    for (const e of log.entries) totals.set(e.pattern, (totals.get(e.pattern) ?? 0) + e.setsDone);
  }
  return [...totals].map(([pattern, sets]) => ({ pattern, sets })).filter((x) => x.sets > 0).sort((a, b) => b.sets - a.sets);
}

/** Consecutive ISO weeks (ending this week or last) with at least one workout. */
export function weekStreak(logs: WorkoutLog[], now = new Date()): number {
  const weekId = (d: Date) => Math.floor((d.getTime() / 864e5 + 3) / 7); // weeks since epoch, Monday start
  const weeks = new Set(logs.map((l) => weekId(new Date(l.date))));
  let w = weekId(now);
  if (!weeks.has(w)) w -= 1;
  let streak = 0;
  while (weeks.has(w)) { streak++; w--; }
  return streak;
}

/** Workouts kept on the free tier. */
export function visibleHistory(logs: WorkoutLog[], isPro: boolean, now = new Date(), freeDays = 30): WorkoutLog[] {
  if (isPro) return newest(logs);
  const since = new Date(now.getTime() - freeDays * 864e5).toISOString();
  return newest(logs).filter((l) => l.date >= since);
}

export const PATTERN_NAMES: Record<Pattern, string> = {
  squat: 'Squat', hinge: 'Hinge', lunge: 'Lunge', horizontal_push: 'Chest press', vertical_push: 'Overhead press',
  horizontal_pull: 'Row', vertical_pull: 'Pulldown', chest_fly: 'Chest fly', lateral_raise: 'Side delts', rear_delt: 'Rear delts',
  biceps: 'Biceps', triceps: 'Triceps', quad_iso: 'Quads', ham_iso: 'Hamstrings', glutes: 'Glutes', calves: 'Calves',
  core_brace: 'Core', core_rotation: 'Core rotation', conditioning: 'Conditioning',
};
