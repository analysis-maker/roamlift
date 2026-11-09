import { describe, expect, it } from 'vitest';
import { lastTime, nextTimeAdvice, parseWeight, targetRange, visibleHistory, weekStreak, weeklySets, type WorkoutLog } from '../src';

const log = (date: string, gymName: string, entries: WorkoutLog['entries']): WorkoutLog => ({ id: date, date, gymName, sessionKey: 'A', sessionTitle: 'A', week: 1, entries });
const row = (over: Partial<WorkoutLog['entries'][number]> = {}) => ({ exerciseId: 'cable_row', name: 'Seated cable row', pattern: 'horizontal_pull' as const, setsPlanned: 3, setsDone: 3, weight: '40 kg', reps: 12, target: '8-12', ...over });

describe('history', () => {
  it('parses weights the way people type them', () => {
    expect(parseWeight('12 kg')).toEqual({ value: 12, unit: 'kg' });
    expect(parseWeight('25lb')).toEqual({ value: 25, unit: 'lb' });
    expect(parseWeight('pin 5')).toEqual({ value: 5, unit: 'pin' });
    expect(parseWeight('12,5')).toEqual({ value: 12.5, unit: 'kg' });
    expect(parseWeight('heavy')).toBeNull();
  });

  it('reads rep ranges but not timed holds', () => {
    expect(targetRange('8-12')).toEqual({ lo: 8, hi: 12 });
    expect(targetRange('10-15 / side')).toEqual({ lo: 10, hi: 15 });
    expect(targetRange('20-30 s')).toBeNull();
    expect(targetRange('8-10 min')).toBeNull();
  });

  it('finds the same exercise first, then the same movement at another gym', () => {
    const logs = [
      log('2026-11-01T08:00:00Z', 'Bangkok hotel', [row()]),
      log('2026-11-05T08:00:00Z', 'Sydney condo', [row({ exerciseId: 'db_row', name: 'One-arm dumbbell row', weight: '22 kg' })]),
    ];
    expect(lastTime('cable_row', logs)?.exact).toBe(true);
    expect(lastTime('cable_row', logs)?.log.gymName).toBe('Bangkok hotel');
    const similar = lastTime('trx_row', logs)!;
    expect(similar.exact).toBe(false);
    expect(similar.entry.exerciseId).toBe('db_row');
  });

  it('advises a step up only after a full top-of-range session', () => {
    const top = lastTime('cable_row', [log('2026-11-01T08:00:00Z', 'g', [row()])]);
    expect(nextTimeAdvice(top)).toMatchObject({ kind: 'up' });
    expect(nextTimeAdvice(top).text).toContain('42.5 kg');
    const mid = lastTime('cable_row', [log('2026-11-01T08:00:00Z', 'g', [row({ reps: 10 })])]);
    expect(nextTimeAdvice(mid).kind).toBe('same');
    const low = lastTime('cable_row', [log('2026-11-01T08:00:00Z', 'g', [row({ reps: 6 })])]);
    expect(nextTimeAdvice(low).kind).toBe('down');
    const pin = lastTime('cable_row', [log('2026-11-01T08:00:00Z', 'g', [row({ weight: 'pin 7' })])]);
    expect(nextTimeAdvice(pin).text).toContain('pin 8');
    expect(nextTimeAdvice(null).kind).toBe('first');
  });

  it('summarises the week and the streak', () => {
    const now = new Date('2026-11-09T12:00:00Z');
    const logs = [log('2026-11-08T08:00:00Z', 'g', [row()]), log('2026-11-03T08:00:00Z', 'g', [row()]), log('2026-10-28T08:00:00Z', 'g', [row()])];
    expect(weeklySets(logs, now)).toEqual([{ pattern: 'horizontal_pull', sets: 6 }]);
    expect(weekStreak(logs, now)).toBe(2); // 3 and 8 Nov share a Monday-start week
    expect(visibleHistory(logs, false, now, 7)).toHaveLength(2);
    expect(visibleHistory(logs, true, now)).toHaveLength(3);
  });
});
