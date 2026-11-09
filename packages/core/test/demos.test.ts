import { describe, expect, it } from 'vitest';
import { EXERCISES, MOTIONS, demoFrame, demoFrameAt, demoJoints, phase } from '../src';

describe('exercise demos', () => {
  it('every exercise has an animated demo, and no demo is orphaned', () => {
    for (const ex of EXERCISES) expect(MOTIONS[ex.id], ex.id).toBeDefined();
    const ids = new Set(EXERCISES.map((e) => e.id));
    for (const id of Object.keys(MOTIONS)) expect(ids.has(id), id).toBe(true);
  });

  it('keeps the figure on the canvas and not through the floor', () => {
    for (const ex of EXERCISES) {
      const j = demoJoints(ex.id)!;
      for (const pose of [j.A, j.B]) {
        for (const [name, [x, y]] of Object.entries(pose)) {
          expect(x, `${ex.id} ${name} x`).toBeGreaterThan(-4);
          expect(x, `${ex.id} ${name} x`).toBeLessThan(204);
          expect(y, `${ex.id} ${name} y`).toBeGreaterThan(-12);
          expect(y, `${ex.id} ${name} y`).toBeLessThan(153);
        }
      }
    }
  });

  it('moves between two different positions', () => {
    for (const ex of EXERCISES) {
      const { A, B } = demoJoints(ex.id)!;
      const moved = Object.keys(A).some((k) => Math.hypot(A[k as keyof typeof A][0] - B[k as keyof typeof B][0], A[k as keyof typeof A][1] - B[k as keyof typeof B][1]) > 1.5);
      expect(moved, ex.id).toBe(true);
    }
  });

  it('loops smoothly and labels each half of the rep', () => {
    const m = MOTIONS.goblet_squat_db;
    expect(phase(m, 0).k).toBe(0);
    expect(phase(m, 3600).k).toBe(0);
    expect(demoFrame('goblet_squat_db', 1200)?.label).toBe('Sit down');
    expect(demoFrame('goblet_squat_db', 3000)?.label).toBe('Drive up');
    expect(demoFrameAt('goblet_squat_db', 1)?.shapes.some((s) => s.role === 'hot')).toBe(true);
  });
});
