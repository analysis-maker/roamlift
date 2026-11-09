import { EXERCISE_BY_ID } from '../exercises';
import { MOTIONS, type Motion, type Prop } from './motions';
import { blend, FLOOR, solve, type JointName, type Joints, type Pt } from './rig';

/** What to paint. The app maps roles to theme colours, so demos follow light and dark mode. */
export type Role = 'floor' | 'prop' | 'cable' | 'band' | 'far' | 'body' | 'hot' | 'weight';
export type Shape =
  | { k: 'line'; p1: Pt; p2: Pt; w: number; role: Role; o?: number }
  | { k: 'circle'; c: Pt; r: number; role: Role; o?: number; stroke?: number }
  | { k: 'rect'; x: number; y: number; w: number; h: number; role: Role; o?: number };

export interface DemoFrame {
  shapes: Shape[];
  /** Coaching label for the current half of the rep. */
  label: string;
  /** 0 at the start position, 1 at the end position. */
  k: number;
}

/** Canvas, with headroom above y = 0 for arms overhead. */
export const VIEWBOX = '0 -12 200 172';

const W = { torso: 12, upper: 8, fore: 7, thigh: 10, shin: 8, foot: 6, head: 8.5 };

type Seg = 'torso' | 'upper' | 'fore' | 'thigh' | 'shin' | 'hip';

/** Which body parts glow for an exercise's muscles. */
export function hotSegments(muscles: string[]): Set<Seg> {
  const s = new Set<Seg>();
  for (const m of muscles) {
    if (/quad|hamstring|adductor|legs/.test(m)) s.add('thigh');
    if (/glute/.test(m)) { s.add('hip'); s.add('thigh'); }
    if (/calf|calves/.test(m)) s.add('shin');
    if (/chest|back|lat|abs|oblique|core|full body|heart/.test(m)) s.add('torso');
    if (/delt|shoulder/.test(m)) s.add('upper');
    if (/bicep|tricep/.test(m)) s.add('upper');
    if (/grip|forearm/.test(m)) s.add('fore');
  }
  return s;
}

// ---------- timing ----------
const ease = (x: number) => 0.5 - 0.5 * Math.cos(Math.PI * Math.min(1, Math.max(0, x)));

export function cycleMs(m: Motion): number {
  return m.slow === 'even' ? 2700 : 3600;
}

/** Position in the rep (0..1), which half we are in, at time `ms`. */
export function phase(m: Motion, ms: number): { k: number; toB: boolean } {
  const T = cycleMs(m);
  const t = ((ms % T) + T) % T;
  const [hA, ab, hB, ba] = m.slow === 'even' ? [150, 1200, 150, 1200] : m.slow === 'toA' ? [300, 1000, 300, 2000] : [300, 2000, 300, 1000];
  if (t < hA) return { k: 0, toB: true };
  if (t < hA + ab) return { k: ease((t - hA) / ab), toB: true };
  if (t < hA + ab + hB) return { k: 1, toB: false };
  return { k: 1 - ease((t - hA - ab - hB) / ba), toB: false };
}

// ---------- drawing ----------
function props(list: Prop[] | undefined, j: Joints, layer: 'back' | 'mid' | 'front'): Shape[] {
  const out: Shape[] = [];
  for (const p of list ?? []) {
    switch (p.k) {
      case 'bench':
        if (layer === 'back') out.push({ k: 'rect', x: p.x, y: p.y, w: p.w, h: 7, role: 'prop' }, { k: 'line', p1: [p.x + 10, p.y + 6], p2: [p.x + 10, FLOOR], w: 4, role: 'prop' }, { k: 'line', p1: [p.x + p.w - 10, p.y + 6], p2: [p.x + p.w - 10, FLOOR], w: 4, role: 'prop' });
        break;
      case 'box':
        if (layer === 'back') out.push({ k: 'rect', x: p.x, y: p.y, w: p.w, h: FLOOR - p.y, role: 'prop', o: 0.55 });
        break;
      case 'seat':
        if (layer === 'back') out.push({ k: 'rect', x: p.x, y: p.y, w: p.w, h: 7, role: 'prop' }, { k: 'line', p1: [p.x + p.w / 2, p.y + 6], p2: [p.x + p.w / 2, FLOOR], w: 4, role: 'prop' });
        break;
      case 'bar':
        if (layer === 'back') out.push({ k: 'line', p1: [p.x1, p.y], p2: [p.x2, p.y], w: 4, role: 'prop' });
        break;
      case 'column':
        if (layer === 'back') out.push({ k: 'line', p1: [p.x, 8], p2: [p.x, FLOOR], w: 7, role: 'prop', o: 0.6 });
        break;
      case 'line':
        if (layer === 'back') out.push({ k: 'line', p1: p.p1, p2: p.p2, w: p.w ?? 4, role: 'prop' });
        break;
      case 'wheel':
        if (layer === 'back') out.push({ k: 'circle', c: p.c, r: p.r, role: 'prop', stroke: 4 });
        break;
      case 'cable':
        if (layer === 'mid') {
          out.push({ k: 'line', p1: p.from, p2: j[p.to], w: p.band ? 3 : 1.6, role: p.band ? 'band' : 'cable' });
          if (!p.band) out.push({ k: 'circle', c: p.from, r: 4.5, role: 'prop' });
        }
        break;
      case 'link':
        if (layer === 'mid') out.push({ k: 'line', p1: j[p.a], p2: j[p.b], w: 3, role: 'band' });
        break;
      case 'rod':
        if (layer === 'mid') out.push({ k: 'line', p1: p.from, p2: j[p.to], w: 4, role: 'prop' });
        break;
      case 'db':
        if (layer === 'front') {
          const [x, y] = j[p.at];
          out.push({ k: 'line', p1: [x - 7, y], p2: [x + 7, y], w: 3, role: 'weight' }, { k: 'rect', x: x - 10, y: y - 5, w: 5, h: 10, role: 'weight' }, { k: 'rect', x: x + 5, y: y - 5, w: 5, h: 10, role: 'weight' });
        }
        break;
      case 'kb':
        if (layer === 'front') { const [x, y] = j[p.at]; out.push({ k: 'circle', c: [x, y + 8], r: 7, role: 'weight' }); }
        break;
      case 'plate':
        if (layer === 'front') out.push({ k: 'circle', c: j[p.at], r: p.r ?? 13, role: 'weight', o: 0.85 });
        break;
      case 'pad':
        if (layer === 'front') out.push({ k: 'circle', c: j[p.at], r: 5, role: 'prop' });
        break;
    }
  }
  return out;
}

function body(j: Joints, front: boolean, hot: Set<Seg>, heat: number): Shape[] {
  const out: Shape[] = [];
  const seg = (p1: Pt, p2: Pt, w: number, s: Seg, role: Role) => {
    out.push({ k: 'line', p1, p2, w, role });
    if (hot.has(s) && role === 'body') out.push({ k: 'line', p1, p2, w: w - 3, role: 'hot', o: heat });
  };
  if (front) {
    const shL: Pt = [j.sh[0] - 11, j.sh[1] + 2], shR: Pt = [j.sh[0] + 11, j.sh[1] + 2];
    const hipL: Pt = [j.hip[0] - 6, j.hip[1]], hipR: Pt = [j.hip[0] + 6, j.hip[1]];
    for (const [hp, k, a, t] of [[hipL, j.k2, j.a2, j.t2], [hipR, j.k1, j.a1, j.t1]] as const) {
      seg(hp, k, W.thigh, 'thigh', 'body'); seg(k, a, W.shin, 'shin', 'body'); out.push({ k: 'line', p1: a, p2: t, w: W.foot, role: 'body' });
    }
    out.push({ k: 'line', p1: hipL, p2: hipR, w: W.thigh, role: 'body' });
    seg(j.hip, j.sh, W.torso + 6, 'torso', 'body');
    out.push({ k: 'line', p1: shL, p2: shR, w: W.upper + 1, role: 'body' });
    for (const [s, e, w] of [[shL, j.e2, j.w2], [shR, j.e1, j.w1]] as const) { seg(s, e, W.upper, 'upper', 'body'); seg(e, w, W.fore, 'fore', 'body'); }
  } else {
    // Far side first, fainter, so the near limbs read in front.
    out.push({ k: 'line', p1: j.sh, p2: j.e2, w: W.upper, role: 'far' }, { k: 'line', p1: j.e2, p2: j.w2, w: W.fore, role: 'far' });
    out.push({ k: 'line', p1: j.hip, p2: j.k2, w: W.thigh, role: 'far' }, { k: 'line', p1: j.k2, p2: j.a2, w: W.shin, role: 'far' }, { k: 'line', p1: j.a2, p2: j.t2, w: W.foot, role: 'far' });
    seg(j.hip, j.k1, W.thigh, 'thigh', 'body'); seg(j.k1, j.a1, W.shin, 'shin', 'body');
    out.push({ k: 'line', p1: j.a1, p2: j.t1, w: W.foot, role: 'body' });
    seg(j.hip, j.sh, W.torso, 'torso', 'body');
    if (hot.has('hip')) out.push({ k: 'circle', c: j.hip, r: 6, role: 'hot', o: heat });
    out.push({ k: 'line', p1: j.sh, p2: j.neck, w: 6, role: 'body' });
    seg(j.sh, j.e1, W.upper, 'upper', 'body'); seg(j.e1, j.w1, W.fore, 'fore', 'body');
  }
  out.push({ k: 'circle', c: j.head, r: W.head, role: 'body' });
  return out;
}

export function motionFor(exerciseId: string): Motion | undefined {
  return MOTIONS[exerciseId];
}

/** Everything needed to draw one frame of an exercise demo at time `ms`. */
export function demoFrame(exerciseId: string, ms: number): DemoFrame | null {
  const m = MOTIONS[exerciseId];
  if (!m) return null;
  const { k, toB } = phase(m, ms);
  return demoFrameAt(exerciseId, k, toB);
}

/** A frame at a given point in the rep: k = 0 start, 1 end. Used for still images and reduced motion. */
export function demoFrameAt(exerciseId: string, k: number, toB = true): DemoFrame | null {
  const m = MOTIONS[exerciseId];
  const ex = EXERCISE_BY_ID[exerciseId];
  if (!m || !ex) return null;
  const j = solve(blend(m.A, m.B, k));
  const front = (m.A.view ?? 'side') === 'front';
  // Muscles glow brighter at the hard end of the rep (the end the slow half starts from).
  const hardAtB = m.slow !== 'toB';
  const heat = 0.35 + 0.65 * (hardAtB ? k : 1 - k);
  const labels = m.labels ?? ['Lift', 'Lower slowly'];
  return {
    k,
    label: toB ? labels[0] : labels[1],
    shapes: [
      { k: 'line', p1: [6, FLOOR], p2: [194, FLOOR], w: 2, role: 'floor' },
      ...props(m.props, j, 'back'),
      ...props(m.props, j, 'mid'),
      ...body(j, front, hotSegments(ex.muscles), heat),
      ...props(m.props, j, 'front'),
    ],
  };
}

/** Joints at the start and end positions, for tests and tooling. */
export function demoJoints(exerciseId: string): { A: Joints; B: Joints } | null {
  const m = MOTIONS[exerciseId];
  return m ? { A: solve(m.A), B: solve(m.B) } : null;
}

export type { JointName };

/** Standalone SVG for one frame. Handy for previews, tests and the web. */
export function frameToSvg(f: DemoFrame, colors: Record<Role, string>, size = 200): string {
  const attrs = (role: Role, o?: number) => `fill="none" stroke="${colors[role]}"${o !== undefined ? ` stroke-opacity="${o.toFixed(2)}"` : ''}`;
  const parts = f.shapes.map((s) => {
    if (s.k === 'line') return `<line x1="${s.p1[0].toFixed(1)}" y1="${s.p1[1].toFixed(1)}" x2="${s.p2[0].toFixed(1)}" y2="${s.p2[1].toFixed(1)}" stroke-width="${s.w}" stroke-linecap="round" ${attrs(s.role, s.o)}/>`;
    if (s.k === 'circle') return s.stroke ? `<circle cx="${s.c[0].toFixed(1)}" cy="${s.c[1].toFixed(1)}" r="${s.r}" stroke-width="${s.stroke}" ${attrs(s.role, s.o)}/>` : `<circle cx="${s.c[0].toFixed(1)}" cy="${s.c[1].toFixed(1)}" r="${s.r}" fill="${colors[s.role]}"${s.o !== undefined ? ` fill-opacity="${s.o.toFixed(2)}"` : ''}/>`;
    return `<rect x="${s.x.toFixed(1)}" y="${s.y.toFixed(1)}" width="${s.w}" height="${s.h.toFixed(1)}" rx="2" fill="${colors[s.role]}"${s.o !== undefined ? ` fill-opacity="${s.o.toFixed(2)}"` : ''}/>`;
  });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${VIEWBOX}" width="${size}" height="${(size * 0.86).toFixed(0)}">${parts.join('')}</svg>`;
}

/** A viewBox cropped to the figure and its kit, so small thumbnails stay legible. */
export function frameViewBox(f: DemoFrame, pad = 8): string {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  const add = (x: number, y: number, r = 0) => { x0 = Math.min(x0, x - r); y0 = Math.min(y0, y - r); x1 = Math.max(x1, x + r); y1 = Math.max(y1, y + r); };
  for (const s of f.shapes) {
    if (s.role === 'floor' || s.role === 'cable' || s.role === 'band') continue; // long cables would undo the crop
    if (s.k === 'line') { add(s.p1[0], s.p1[1], s.w / 2); add(s.p2[0], s.p2[1], s.w / 2); }
    else if (s.k === 'circle') add(s.c[0], s.c[1], s.r);
    else { add(s.x, s.y); add(s.x + s.w, s.y + s.h); }
  }
  y1 = Math.max(y1, FLOOR);
  let w = x1 - x0 + pad * 2, h = y1 - y0 + pad * 2;
  const ratio = 200 / 172;
  if (w / h < ratio) { const nw = h * ratio; x0 -= (nw - w) / 2; w = nw; } else { const nh = w / ratio; y0 -= nh - h; h = nh; }
  return `${(x0 - pad).toFixed(1)} ${(y0 - pad).toFixed(1)} ${w.toFixed(1)} ${h.toFixed(1)}`;
}
