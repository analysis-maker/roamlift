import { describe, expect, it } from 'vitest';
import {
  EQUIPMENT_IDS,
  EXERCISES,
  generatePlan,
  getExercise,
  getSwaps,
  normalizeDetection,
  setsForWeek,
  type EquipmentId,
  type PlanInput,
} from '../src';
import { canDo, expandKit, isSafeFor } from '../src/kit';

const HOTEL: EquipmentId[] = ['dumbbells', 'adjustable_bench', 'cable_stack', 'treadmill'];
const base: PlanInput = { kit: HOTEL, goal: 'muscle', level: 2, minutes: 45, daysPerWeek: 3, length: { kind: 'weeks', weeks: 4 } };

describe('exercise library', () => {
  it('has unique ids and only known equipment', () => {
    const ids = EXERCISES.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const ex of EXERCISES) for (const group of ex.needs) for (const id of group) expect(EQUIPMENT_IDS).toContain(id);
  });

  it('every exercise has at least two cues', () => {
    for (const ex of EXERCISES) expect(ex.cues.length).toBeGreaterThanOrEqual(2);
  });
});

describe('generatePlan', () => {
  it('only uses kit that is in the room', () => {
    const plan = generatePlan(base);
    const kit = expandKit(HOTEL);
    for (const s of plan.sessions) for (const p of s.exercises) expect(canDo(getExercise(p.exerciseId), kit)).toBe(true);
  });

  it('is deterministic for a seed and changes on regenerate', () => {
    const a = generatePlan({ ...base, seed: 7 });
    const b = generatePlan({ ...base, seed: 7 });
    expect(a).toEqual(b);
    const names = (p: typeof a) => p.sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId)).join();
    const variants = new Set([1, 2, 3, 4, 5, 6].map((seed) => names(generatePlan({ ...base, seed }))));
    expect(variants.size).toBeGreaterThan(1);
  });

  it('builds the right number of sessions per split', () => {
    expect(generatePlan({ ...base, length: { kind: 'session' } }).sessions).toHaveLength(1);
    for (const days of [2, 3, 4, 5, 6]) expect(generatePlan({ ...base, daysPerWeek: days }).sessions).toHaveLength(days);
  });

  it('never repeats an exercise inside one session', () => {
    for (const days of [1, 2, 3, 4, 5, 6]) {
      for (const s of generatePlan({ ...base, daysPerWeek: days }).sessions) {
        const ids = s.exercises.map((e) => e.exerciseId);
        expect(new Set(ids).size).toBe(ids.length);
      }
    }
  });

  it('respects injured areas', () => {
    const plan = generatePlan({ ...base, avoid: ['knee', 'shoulder'] });
    for (const s of plan.sessions) for (const p of s.exercises) expect(isSafeFor(getExercise(p.exerciseId), ['knee', 'shoulder'])).toBe(true);
    expect(plan.notes.join(' ')).toMatch(/knee/);
  });

  it('still fills the session when injuries rule out whole slots', () => {
    const plan = generatePlan({ kit: ['dumbbells', 'treadmill'], goal: 'fat_loss', level: 1, minutes: 30, daysPerWeek: 1, length: { kind: 'session' }, avoid: ['knee'] });
    const ex = plan.sessions[0].exercises;
    expect(ex.length).toBe(4);
    expect(ex.at(-1)?.exerciseId).toBe('shadow_boxing');
  });

  it('works in an empty hotel room (bodyweight only)', () => {
    const plan = generatePlan({ ...base, kit: [], goal: 'general', length: { kind: 'session' }, minutes: 30 });
    expect(plan.sessions[0].exercises.length).toBeGreaterThanOrEqual(3);
    expect(plan.sessions[0].exercises.some((e) => e.tempo)).toBe(true);
  });

  it('keeps beginners off advanced lifts', () => {
    const plan = generatePlan({ ...base, level: 1, kit: ['barbell', 'squat_rack', 'flat_bench', 'dumbbells'] });
    for (const s of plan.sessions) for (const p of s.exercises) expect(getExercise(p.exerciseId).level).toBeLessThanOrEqual(2);
  });

  it('scales exercise count with time', () => {
    const short = generatePlan({ ...base, minutes: 20, goal: 'muscle', length: { kind: 'session' } });
    const long = generatePlan({ ...base, minutes: 75, goal: 'muscle', length: { kind: 'session' } });
    expect(short.sessions[0].exercises.length).toBeLessThan(long.sessions[0].exercises.length);
  });

  it('adds a cardio finisher for fat loss when there is a cardio machine', () => {
    const plan = generatePlan({ ...base, goal: 'fat_loss', length: { kind: 'session' } });
    expect(plan.sessions[0].exercises.at(-1)?.pattern).toBe('conditioning');
    expect(plan.sessions[0].exercises.at(-1)?.exerciseId).toBe('treadmill_intervals');
  });

  it('honours excluded exercises', () => {
    const plan = generatePlan({ ...base, excludeIds: ['db_bench', 'cable_chest_press'] });
    const ids = plan.sessions.flatMap((s) => s.exercises.map((e) => e.exerciseId));
    expect(ids).not.toContain('db_bench');
    expect(ids).not.toContain('cable_chest_press');
  });

  it('progresses week by week, lighter week 1', () => {
    const plan = generatePlan({ ...base, length: { kind: 'weeks', weeks: 6 } });
    expect(plan.weeks).toHaveLength(6);
    expect(plan.weeks[0].setsDelta).toBe(-1);
    expect(plan.weeks[5].title).toBe('Deload');
    const first = plan.sessions[0].exercises[0];
    expect(setsForWeek(first, plan.weeks[0])).toBe(first.sets - 1);
  });

  it('keeps estimated session length near the requested time', () => {
    for (const minutes of [30, 45, 60]) {
      const plan = generatePlan({ ...base, minutes, length: { kind: 'session' } });
      expect(plan.sessions[0].estimatedMinutes).toBeLessThanOrEqual(minutes + 15);
    }
  });
});

describe('getSwaps (machine taken)', () => {
  it('offers 3 same-movement swaps without the busy machine', () => {
    const swaps = getSwaps({ exerciseId: 'cable_row', kit: HOTEL, level: 2 });
    expect(swaps).toHaveLength(3);
    for (const s of swaps) {
      expect(s.exercise.needs.flat()).not.toContain('cable_stack');
      expect(['horizontal_pull', 'vertical_pull']).toContain(s.exercise.pattern);
    }
    expect(swaps[0].exercise.pattern).toBe('horizontal_pull');
  });

  it('skips exercises already in the session', () => {
    const swaps = getSwaps({ exerciseId: 'machine_chest_press', kit: ['chest_press_machine', 'dumbbells', 'flat_bench'], level: 2, inSession: ['db_bench'] });
    expect(swaps.map((s) => s.exercise.id)).not.toContain('db_bench');
    expect(swaps.length).toBeGreaterThan(0);
  });

  it('respects injuries', () => {
    const swaps = getSwaps({ exerciseId: 'leg_press', kit: HOTEL, level: 2, avoid: ['knee'] });
    for (const s of swaps) expect(s.exercise.loads).not.toContain('knee');
  });
});

describe('normalizeDetection', () => {
  it('maps ids, aliases and merges duplicates', () => {
    const out = normalizeDetection({
      items: [
        { equipment_id: 'dumbbells', label: 'Dumbbell rack 2-20 kg', confidence: 0.9, weight_range: '2-20 kg' },
        { equipment_id: null, label: 'Technogym dual pulley functional trainer', confidence: 0.8 },
        { equipment_id: 'dumbbells', label: 'dumbbells', confidence: 0.7 },
        { equipment_id: 'leg_press', label: 'maybe a leg press', confidence: 0.3 },
        { label: 'massage chair', confidence: 0.9 },
        { equipment_id: 'bodyweight', label: 'mat', confidence: 1 },
      ],
    });
    const ids = out.items.map((i) => i.id);
    expect(ids).toEqual(['dumbbells', 'cable_stack', 'leg_press']);
    expect(out.items[0].weightRange).toBe('2-20 kg');
    expect(out.items.find((i) => i.id === 'leg_press')?.checked).toBe(false);
    expect(out.unknown).toEqual(['massage chair']);
  });

  it('survives junk input', () => {
    expect(normalizeDetection(null)).toEqual({ items: [], unknown: [] });
    expect(normalizeDetection({ items: [null, 5, { label: '' }] })).toEqual({ items: [], unknown: [] });
  });
});
