import type { EquipmentId } from './equipment';
import { EXERCISES, type Exercise, type Level, type Pattern, type Region } from './exercises';
import { canDo, expandKit, isSafeFor, type Kit } from './kit';
import { mulberry32 } from './random';

export type Goal = 'muscle' | 'strength' | 'general' | 'fat_loss';
export type Focus = 'balanced' | 'upper' | 'lower' | 'glutes' | 'arms_shoulders';
export type PlanLength = { kind: 'session' } | { kind: 'weeks'; weeks: number };

export interface PlanInput {
  kit: EquipmentId[];
  goal: Goal;
  level: Level;
  /** Minutes per session, warm-up included. */
  minutes: number;
  daysPerWeek: number;
  length: PlanLength;
  focus?: Focus;
  avoid?: Region[];
  /** Exercises the user asked never to see. */
  excludeIds?: string[];
  /** Change it to get a different but equally valid plan ("regenerate"). */
  seed?: number;
}

export interface PlannedExercise {
  exerciseId: string;
  name: string;
  pattern: Pattern;
  sets: number;
  reps: string;
  restSec: number;
  tempo?: string;
  /** Set when the planned pattern had no match and a stand-in was used. */
  note?: string;
}

export interface Session {
  key: string;
  title: string;
  exercises: PlannedExercise[];
  estimatedMinutes: number;
}

export interface WeekRule {
  week: number;
  title: string;
  note: string;
  /** Added to every exercise's sets that week (week 1 and deloads are lighter). */
  setsDelta: number;
}

export interface Plan {
  engineVersion: string;
  input: PlanInput;
  sessions: Session[];
  weeks: WeekRule[];
  notes: string[];
}

export const ENGINE_VERSION = '0.1.0';

// ---------- session templates: slots in priority order, so short sessions keep the big lifts ----------
type Template = { title: string; slots: Pattern[] };

const T = {
  fullA: { title: 'Full body A', slots: ['squat', 'horizontal_push', 'horizontal_pull', 'hinge', 'lateral_raise', 'core_brace', 'biceps', 'triceps'] },
  fullB: { title: 'Full body B', slots: ['hinge', 'vertical_pull', 'vertical_push', 'lunge', 'chest_fly', 'core_rotation', 'triceps', 'calves'] },
  fullC: { title: 'Full body C', slots: ['lunge', 'horizontal_push', 'horizontal_pull', 'glutes', 'rear_delt', 'core_brace', 'biceps', 'calves'] },
  upperA: { title: 'Upper A', slots: ['horizontal_push', 'horizontal_pull', 'vertical_push', 'vertical_pull', 'lateral_raise', 'biceps', 'triceps', 'rear_delt'] },
  upperB: { title: 'Upper B', slots: ['vertical_pull', 'horizontal_push', 'horizontal_pull', 'chest_fly', 'rear_delt', 'triceps', 'biceps', 'lateral_raise'] },
  lowerA: { title: 'Lower A', slots: ['squat', 'hinge', 'lunge', 'ham_iso', 'calves', 'core_brace', 'glutes'] },
  lowerB: { title: 'Lower B', slots: ['hinge', 'lunge', 'squat', 'quad_iso', 'glutes', 'core_rotation', 'calves'] },
  push: { title: 'Push', slots: ['horizontal_push', 'vertical_push', 'chest_fly', 'lateral_raise', 'triceps', 'core_brace', 'triceps'] },
  pull: { title: 'Pull', slots: ['vertical_pull', 'horizontal_pull', 'rear_delt', 'biceps', 'horizontal_pull', 'core_rotation', 'biceps'] },
  legs: { title: 'Legs', slots: ['squat', 'hinge', 'lunge', 'quad_iso', 'ham_iso', 'calves', 'core_brace'] },
  glutes: { title: 'Glutes and legs', slots: ['hinge', 'glutes', 'lunge', 'squat', 'ham_iso', 'core_brace', 'calves'] },
  arms: { title: 'Arms and shoulders', slots: ['vertical_push', 'biceps', 'triceps', 'lateral_raise', 'rear_delt', 'biceps', 'triceps'] },
} satisfies Record<string, Template>;

function templatesFor(days: number, focus: Focus): Template[] {
  if (days <= 1) {
    return [{ balanced: T.fullA, upper: T.upperA, lower: T.lowerA, glutes: T.glutes, arms_shoulders: T.arms }[focus]];
  }
  if (days === 2) return focus === 'upper' ? [T.upperA, T.upperB] : focus === 'lower' || focus === 'glutes' ? [T.lowerA, T.glutes] : [T.fullA, T.fullB];
  if (days === 3) return [T.fullA, T.fullB, T.fullC];
  if (days === 4) return [T.upperA, T.lowerA, T.upperB, T.lowerB];
  if (days === 5) return [T.upperA, T.lowerA, T.push, T.pull, T.legs];
  return [T.push, T.pull, T.legs, T.upperB, T.lowerB, T.glutes];
}

/** When nothing fits a slot, try these in order before giving up. */
const FALLBACK: Partial<Record<Pattern, Pattern[]>> = {
  squat: ['lunge', 'quad_iso', 'hinge', 'glutes'],
  lunge: ['squat', 'glutes'],
  hinge: ['glutes', 'ham_iso'],
  vertical_pull: ['horizontal_pull'],
  horizontal_pull: ['vertical_pull'],
  vertical_push: ['horizontal_push'],
  horizontal_push: ['vertical_push'],
  chest_fly: ['horizontal_push'],
  quad_iso: ['squat', 'lunge'],
  ham_iso: ['hinge', 'glutes'],
  glutes: ['hinge'],
  rear_delt: ['horizontal_pull'],
  lateral_raise: ['vertical_push'],
  core_rotation: ['core_brace'],
  core_brace: ['core_rotation'],
};

const HOLDS = new Set(['plank', 'side_plank', 'wall_sit']);
const PRIMARY: ReadonlySet<Pattern> = new Set(['squat', 'hinge', 'lunge', 'horizontal_push', 'vertical_push', 'horizontal_pull', 'vertical_pull']);

function exercisesPerSession(minutes: number): number {
  if (minutes <= 20) return 3;
  if (minutes <= 30) return 4;
  if (minutes <= 45) return 5;
  if (minutes <= 60) return 6;
  if (minutes <= 75) return 7;
  return 8;
}

function dosage(ex: Exercise, goal: Goal, level: Level): Pick<PlannedExercise, 'sets' | 'reps' | 'restSec'> {
  if (ex.pattern === 'conditioning') return { sets: 1, reps: goal === 'fat_loss' ? '12-15 min' : '8-10 min', restSec: 0 };
  if (HOLDS.has(ex.id)) return { sets: level === 1 ? 2 : 3, reps: level === 1 ? '20-30 s' : '30-45 s', restSec: 45 };
  const big = ex.compound && PRIMARY.has(ex.pattern);
  const perSide = ex.unilateral ? ' / side' : '';
  const table: Record<Goal, [number, string, number, number, string, number]> = {
    //            compound sets, reps, rest | accessory sets, reps, rest
    strength: [4, level === 1 ? '6-8' : '4-6', 150, 3, '8-12', 75],
    muscle: [3, '8-12', 90, 3, '10-15', 60],
    general: [3, '8-12', 75, 2, '12-15', 60],
    fat_loss: [3, '10-15', 60, 2, '12-20', 45],
  };
  const [cs, cr, crest, as, ar, arest] = table[goal];
  const sets = Math.min(big ? cs : as, level === 1 ? 3 : 5);
  return big ? { sets, reps: cr + perSide, restSec: crest } : { sets, reps: ar + perSide, restSec: arest };
}

function estimateMinutes(list: PlannedExercise[]): number {
  const work = list.reduce((sum, p) => {
    if (p.pattern === 'conditioning') return sum + parseInt(p.reps, 10) * 60;
    const perSet = p.reps.includes('/ side') ? 80 : 45;
    return sum + p.sets * (perSet + p.restSec);
  }, 0);
  return Math.round(work / 60) + 5; // + warm-up
}

interface PickContext {
  kit: Kit;
  level: Level;
  avoid: Region[];
  exclude: ReadonlySet<string>;
  inSession: Set<string>;
  usage: Map<string, number>;
  rand: () => number;
}

function score(ex: Exercise, ctx: PickContext, primarySlot: boolean): number {
  let s = 0;
  if (ex.needs.length > 0) s += 3; // loaded beats bodyweight when you have the kit
  if (primarySlot && ex.compound) s += 2;
  s -= Math.abs(ex.level - ctx.level);
  s -= 4 * (ctx.usage.get(ex.id) ?? 0); // spread exercises across the week
  return s + ctx.rand() * 1.5; // seeded variety between equally good options
}

export function candidatesFor(pattern: Pattern, ctx: Omit<PickContext, 'usage' | 'rand' | 'inSession'> & { inSession?: ReadonlySet<string> }): Exercise[] {
  return EXERCISES.filter(
    (ex) =>
      ex.pattern === pattern &&
      ex.level <= ctx.level + 1 &&
      canDo(ex, ctx.kit) &&
      isSafeFor(ex, ctx.avoid) &&
      !ctx.exclude.has(ex.id) &&
      !(ctx.inSession?.has(ex.id) ?? false),
  );
}

function pick(slot: Pattern, ctx: PickContext): { ex: Exercise; via?: Pattern } | null {
  for (const pattern of [slot, ...(FALLBACK[slot] ?? [])]) {
    const options = candidatesFor(pattern, ctx);
    if (options.length === 0) continue;
    const primary = PRIMARY.has(slot);
    const best = options
      .map((ex) => ({ ex, s: score(ex, ctx, primary) }))
      .sort((a, b) => b.s - a.s)[0].ex;
    return { ex: best, via: pattern === slot ? undefined : slot };
  }
  return null;
}

const PATTERN_LABEL: Record<Pattern, string> = {
  squat: 'squat', hinge: 'hip hinge', lunge: 'lunge', horizontal_push: 'chest press', vertical_push: 'overhead press',
  horizontal_pull: 'row', vertical_pull: 'pulldown', chest_fly: 'chest fly', lateral_raise: 'side delt', rear_delt: 'rear delt',
  biceps: 'biceps', triceps: 'triceps', quad_iso: 'quad isolation', ham_iso: 'hamstring curl', glutes: 'glutes', calves: 'calves',
  core_brace: 'core', core_rotation: 'core rotation', conditioning: 'conditioning',
};

export function weekRules(weeks: number): WeekRule[] {
  const rules: WeekRule[] = [];
  for (let w = 1; w <= weeks; w++) {
    if (w === 1 && weeks > 1) rules.push({ week: w, title: 'Learn the setup', note: 'One set fewer than listed. Pick weights that leave about 3 reps in the tank and log what you used.', setsDelta: -1 });
    else if (weeks >= 6 && w % 6 === 0) rules.push({ week: w, title: 'Deload', note: 'One set fewer, same weights. Recover before the next block.', setsDelta: -1 });
    else if (w === 2 || weeks === 1) rules.push({ week: w, title: 'Baseline', note: 'Full sets. Finish each set with 2 to 3 good reps left.', setsDelta: 0 });
    else if (w % 2 === 1) rules.push({ week: w, title: 'Add reps', note: 'Same weights. Add a rep to some sets, staying in the range.', setsDelta: 0 });
    else rules.push({ week: w, title: 'Add load when earned', note: 'Hit the top of the range on every set? Go up the smallest step and drop to the bottom of the range.', setsDelta: 0 });
  }
  return rules;
}

/** Build a plan from the kit in the room. Same input and seed always give the same plan. */
export function generatePlan(input: PlanInput): Plan {
  const focus = input.focus ?? 'balanced';
  const days = input.length.kind === 'session' ? 1 : Math.max(1, Math.min(6, Math.round(input.daysPerWeek)));
  const weeks = input.length.kind === 'session' ? 1 : Math.max(1, Math.min(12, Math.round(input.length.weeks)));
  const kit = expandKit(input.kit);
  const rand = mulberry32(input.seed ?? 1);
  const usage = new Map<string, number>();
  const notes: string[] = [];
  const perSession = exercisesPerSession(input.minutes);
  const finisher = (input.goal === 'fat_loss' || input.goal === 'general') && input.minutes >= 30;
  const lightKitOnly = ![...kit].some((id) => !['bodyweight', 'resistance_band', 'suspension_trainer', 'step_box', 'medicine_ball'].includes(id));

  const sessions = templatesFor(days, focus).map((tpl, i): Session => {
    const ctx: PickContext = {
      kit, level: input.level, avoid: input.avoid ?? [], exclude: new Set(input.excludeIds ?? []), inSession: new Set(), usage, rand,
    };
    const target = finisher ? perSession - 1 : perSession;
    const exercises: PlannedExercise[] = [];
    // Walk the template in priority order; a skipped slot lets the next one in, so short kits still fill the time.
    for (const slot of tpl.slots) {
      if (exercises.length >= target) break;
      const chosen = pick(slot, ctx);
      if (!chosen) {
        if (PRIMARY.has(slot)) notes.push(`${tpl.title}: no safe ${PATTERN_LABEL[slot]} option with this kit, skipped.`);
        continue;
      }
      addExercise(chosen.ex, chosen.via ? `Stand-in for ${PATTERN_LABEL[chosen.via]}, none available here.` : undefined);
    }
    if (finisher) {
      const chosen = pick('conditioning', ctx);
      if (chosen) addExercise(chosen.ex);
    }
    function addExercise(ex: Exercise, note?: string) {
      ctx.inSession.add(ex.id);
      usage.set(ex.id, (usage.get(ex.id) ?? 0) + 1);
      const tempo = lightKitOnly && input.goal !== 'fat_loss' && ex.pattern !== 'conditioning' && !HOLDS.has(ex.id) ? '3 s down, 1 s pause' : undefined;
      exercises.push({ exerciseId: ex.id, name: ex.name, pattern: ex.pattern, ...dosage(ex, input.goal, input.level), tempo, note });
    }
    const key = String.fromCharCode(65 + i);
    return { key, title: days === 1 ? tpl.title : `${key}: ${tpl.title}`, exercises, estimatedMinutes: estimateMinutes(exercises) };
  });

  if (lightKitOnly) notes.push('Light kit only: slow tempo and higher reps stand in for heavier weights.');
  if ((input.avoid ?? []).length) notes.push(`Avoiding exercises that load: ${(input.avoid ?? []).join(', ').replace(/_/g, ' ')}.`);

  return { engineVersion: ENGINE_VERSION, input, sessions, weeks: weekRules(weeks), notes: [...new Set(notes)] };
}

/** Sets for a given week, never below 1. */
export function setsForWeek(planned: PlannedExercise, rule: WeekRule | undefined): number {
  if (planned.pattern === 'conditioning') return planned.sets;
  return Math.max(1, planned.sets + (rule?.setsDelta ?? 0));
}
