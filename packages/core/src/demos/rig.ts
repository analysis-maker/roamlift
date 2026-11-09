/**
 * A tiny 2D mannequin rig. Poses are joint angles, so every frame keeps
 * real limb lengths, and in-between frames come from blending angles.
 *
 * Canvas is 200 x 160, floor at y = 150. Side view faces right (+x).
 * Angles are in degrees, absolute (not relative to the parent):
 *   limbs: 0 = pointing straight down, 90 = pointing forward, 180 = straight up, -90 = pointing back.
 *   torso: 0 = upright, + leans forward, -90 = lying with the head to the left.
 */
export type Pt = readonly [number, number];

export const FLOOR = 150;
const GROUND = FLOOR - 4; // limb centre-line sits just above the floor line

export const LEN = { torso: 42, neck: 15, upper: 24, fore: 23, thigh: 31, shin: 31, foot: 10 } as const;

export type JointName = 'head' | 'neck' | 'sh' | 'hip' | 'e1' | 'w1' | 'e2' | 'w2' | 'k1' | 'a1' | 't1' | 'k2' | 'a2' | 't2';
export type Joints = Record<JointName, Pt>;

export interface Pose {
  view?: 'side' | 'front';
  hip?: Pt;
  /** Torso angle. */
  t?: number;
  /** Extra head tilt relative to the torso. */
  n?: number;
  /** Near arm: upper arm and forearm. */
  u1?: number; f1?: number;
  /** Far arm. Defaults to the near arm. */
  u2?: number; f2?: number;
  /** Near leg: thigh and shin. */
  a1?: number; b1?: number;
  a2?: number; b2?: number;
  /** Foot angle (90 = flat, pointing forward; lower = heel raised). */
  c1?: number; c2?: number;
  /** How to place the figure: on its feet (default), lowest point on the floor, a joint pinned to a point, or as given. */
  pin?: 'feet' | 'lowest' | 'none' | { joint: JointName; at: Pt };
}

const rad = (d: number) => (d * Math.PI) / 180;
const down = (o: Pt, len: number, deg: number): Pt => [o[0] + len * Math.sin(rad(deg)), o[1] + len * Math.cos(rad(deg))];
const up = (o: Pt, len: number, deg: number): Pt => [o[0] + len * Math.sin(rad(deg)), o[1] - len * Math.cos(rad(deg))];

function full(p: Pose): Required<Omit<Pose, 'pin' | 'view'>> & Pick<Pose, 'pin' | 'view'> {
  const u1 = p.u1 ?? 6, f1 = p.f1 ?? 6, a1 = p.a1 ?? 0, b1 = p.b1 ?? 0;
  return {
    view: p.view ?? 'side', hip: p.hip ?? [100, 88], t: p.t ?? 0, n: p.n ?? 0,
    u1, f1, u2: p.u2 ?? u1, f2: p.f2 ?? f1,
    a1, b1, a2: p.a2 ?? a1, b2: p.b2 ?? b1,
    c1: p.c1 ?? 90, c2: p.c2 ?? p.c1 ?? 90,
    pin: p.pin ?? 'feet',
  };
}

export function solve(pose: Pose): Joints {
  const p = full(pose);
  const hip = p.hip;
  let j: Joints;
  if (p.view === 'front') {
    // Symmetric front view: index 1 is the figure's left (viewer's right), 2 is mirrored.
    const sh: Pt = [hip[0], hip[1] - LEN.torso];
    const neck = up(sh, 4, 0);
    const head = up(neck, LEN.neck - 4, p.n);
    const shR: Pt = [sh[0] + 11, sh[1] + 2];
    const hipR: Pt = [hip[0] + 6, hip[1]];
    const e1 = down(shR, LEN.upper, p.u1);
    const w1 = down(e1, LEN.fore, p.f1);
    const k1 = down(hipR, LEN.thigh, p.a1);
    const a1 = down(k1, LEN.shin, p.b1);
    const m = (q: Pt): Pt => [2 * hip[0] - q[0], q[1]];
    j = { head, neck, sh, hip, e1, w1, e2: m(e1), w2: m(w1), k1, a1, t1: [a1[0] + 6, a1[1]], k2: m(k1), a2: m(a1), t2: m([a1[0] + 6, a1[1]]) };
  } else {
    const sh = up(hip, LEN.torso, p.t);
    const neck = up(sh, 4, p.t);
    const head = up(neck, LEN.neck - 4, p.t + p.n);
    const e1 = down(sh, LEN.upper, p.u1), w1 = down(e1, LEN.fore, p.f1);
    const e2 = down(sh, LEN.upper, p.u2), w2 = down(e2, LEN.fore, p.f2);
    const k1 = down(hip, LEN.thigh, p.a1), a1 = down(k1, LEN.shin, p.b1), t1 = down(a1, LEN.foot, p.c1);
    const k2 = down(hip, LEN.thigh, p.a2), a2 = down(k2, LEN.shin, p.b2), t2 = down(a2, LEN.foot, p.c2);
    j = { head, neck, sh, hip, e1, w1, e2, w2, k1, a1, t1, k2, a2, t2 };
  }
  return place(j, p.pin);
}

function shift(j: Joints, dx: number, dy: number): Joints {
  const out = {} as Record<JointName, Pt>;
  for (const k of Object.keys(j) as JointName[]) out[k] = [j[k][0] + dx, j[k][1] + dy];
  return out;
}

function place(j: Joints, pin: Pose['pin']): Joints {
  if (!pin || pin === 'none') return j;
  if (pin === 'feet') {
    const low = Math.max(j.a1[1], j.a2[1], j.t1[1], j.t2[1]);
    return shift(j, 0, GROUND - low);
  }
  if (pin === 'lowest') {
    const low = Math.max(...Object.values(j).map((q) => q[1]));
    return shift(j, 0, GROUND - low);
  }
  const at = j[pin.joint];
  return shift(j, pin.at[0] - at[0], pin.at[1] - at[1]);
}

const mix = (a: number, b: number, k: number) => a + (b - a) * k;
const mixPt = (a: Pt, b: Pt, k: number): Pt => [mix(a[0], b[0], k), mix(a[1], b[1], k)];

/** Blend two poses by angle, so limbs keep their length mid-movement. */
export function blend(A: Pose, B: Pose, k: number): Pose {
  const a = full(A), b = full(B);
  const pin = typeof a.pin === 'object' && typeof b.pin === 'object' ? { joint: a.pin.joint, at: mixPt(a.pin.at, b.pin.at, k) } : k < 0.5 ? a.pin : b.pin;
  return {
    view: a.view, hip: mixPt(a.hip, b.hip, k), t: mix(a.t, b.t, k), n: mix(a.n, b.n, k),
    u1: mix(a.u1, b.u1, k), f1: mix(a.f1, b.f1, k), u2: mix(a.u2, b.u2, k), f2: mix(a.f2, b.f2, k),
    a1: mix(a.a1, b.a1, k), b1: mix(a.b1, b.b1, k), a2: mix(a.a2, b.a2, k), b2: mix(a.b2, b.b2, k),
    c1: mix(a.c1, b.c1, k), c2: mix(a.c2, b.c2, k), pin,
  };
}
