import type { JointName, Pose, Pt } from './rig';

export type Prop =
  | { k: 'bench'; x: number; y: number; w: number }
  | { k: 'box'; x: number; y: number; w: number }
  | { k: 'bar'; x1: number; x2: number; y: number }
  | { k: 'column'; x: number }
  | { k: 'cable'; from: Pt; to: JointName; band?: boolean }
  | { k: 'db'; at: JointName }
  | { k: 'kb'; at: JointName }
  | { k: 'plate'; at: JointName; r?: number }
  | { k: 'seat'; x: number; y: number; w: number }
  | { k: 'pad'; at: JointName }
  | { k: 'line'; p1: Pt; p2: Pt; w?: number }
  | { k: 'wheel'; c: Pt; r: number }
  | { k: 'link'; a: JointName; b: JointName }
  | { k: 'rod'; from: Pt; to: JointName };

export interface Motion {
  A: Pose;
  B: Pose;
  props?: Prop[];
  /** Which way is the slow, lowering half. 'even' for holds and cardio. */
  slow?: 'toB' | 'toA' | 'even';
  /** Phase labels: [moving A to B, moving B to A]. */
  labels?: [string, string];
}

// ---------- anchors and props ----------
const LOW: Pt = [184, 140], MID: Pt = [184, 78], HIGH: Pt = [184, 16];
const BLOW: Pt = [16, 140], BMID: Pt = [16, 78], BHIGH: Pt = [16, 16];
const col = (x = 184): Prop => ({ k: 'column', x });
const cable = (from: Pt, to: JointName = 'w1', band = false): Prop => ({ k: 'cable', from, to, band });
const db = (both = true): Prop[] => (both ? [{ k: 'db', at: 'w2' }, { k: 'db', at: 'w1' }] : [{ k: 'db', at: 'w1' }]);
const kb: Prop = { k: 'kb', at: 'w1' };
const bar = (at: JointName = 'w1', r = 13): Prop => ({ k: 'plate', at, r });
const bench = (x = 40, y = 120, w = 92): Prop => ({ k: 'bench', x, y, w });
const seat = (x = 70, y = 116, w = 34): Prop => ({ k: 'seat', x, y, w });
const machineCable = (from: Pt, to: JointName = 'w1') => [col(from[0]), cable(from, to)];

// ---------- reusable poses ----------
const STAND: Pose = { u1: 6, f1: 6, u2: 2, f2: 2, a2: -3, b2: -3 };
const GOBLET: Pose = { ...STAND, u1: 22, f1: 165, u2: 22, f2: 165 };
const SQUAT_LOW = { t: 32, a1: 88, b1: -28, a2: 84, b2: -30 };
const SEATED: Pose = { hip: [86, 112], t: -4, a1: 90, b1: 2, a2: 88, b2: 0, pin: 'none' };
const KNEEL: Pose = { a1: 0, b1: -90, a2: 2, b2: -88, c1: -90, c2: -90, pin: 'lowest' };
const SUPINE_BENCH: Pose = { hip: [108, 113], t: -90, a1: 78, b1: 8, a2: 74, b2: 6, pin: 'none' };
const SUPINE_FLOOR: Pose = { hip: [104, 141], t: -92, a1: 135, b1: 12, a2: 130, b2: 10, pin: 'none' };
const HINGE: Pose = { t: 78, a1: 12, b1: -4, a2: 10, b2: -6, u1: 0, f1: 0, u2: -2, f2: -2 };
const STAGGER: Pose = { a1: 14, b1: 4, a2: -16, b2: -16 };
const PLANK_TOP: Pose = { hip: [100, 118], t: 72, a1: -61, b1: -61, a2: -62, b2: -62, c1: 160, c2: 160, u1: 0, f1: 0, u2: 2, f2: 2, pin: 'none' };
const PLANK_LOW: Pose = { hip: [100, 133], t: 86, a1: -75, b1: -75, a2: -76, b2: -76, c1: 165, c2: 165, u1: -62, f1: 62, u2: -63, f2: 63, pin: 'none' };
const HANG = (x = 100): Pose => ({ t: 0, u1: 178, f1: 178, u2: 176, f2: 176, a1: 22, b1: -72, a2: 18, b2: -76, c1: 20, c2: 20, pin: { joint: 'w1', at: [x, 6] } });
const RUN_A: Pose = { t: 10, u1: -40, f1: 40, u2: 50, f2: 140, a1: 40, b1: -10, a2: -25, b2: -60 };
const RUN_B: Pose = { t: 10, u1: 50, f1: 140, u2: -40, f2: 40, a1: -25, b1: -60, a2: 40, b2: -10 };

const standingPress = (from: Pt): Motion => ({
  A: { ...STAND, ...STAGGER, u1: -80, f1: 90, u2: -84, f2: 86 },
  B: { ...STAND, ...STAGGER, t: 6, u1: 88, f1: 90, u2: 84, f2: 86 },
  props: [...machineCable(from)], slow: 'toA', labels: ['Press', 'Return slowly'],
});

/** One motion per exercise id. Tests make sure every exercise has one. */
export const MOTIONS: Record<string, Motion> = {
  // ---------- squat ----------
  bw_squat: { A: { ...STAND, u1: 80, f1: 85, u2: 76, f2: 80 }, B: { ...STAND, ...SQUAT_LOW, u1: 85, f1: 90, u2: 80, f2: 86 }, slow: 'toB', labels: ['Sit down', 'Drive up'] },
  goblet_squat_db: { A: GOBLET, B: { ...GOBLET, ...SQUAT_LOW }, props: [{ k: 'db', at: 'w1' }], slow: 'toB', labels: ['Sit down', 'Drive up'] },
  goblet_squat_cable: { A: GOBLET, B: { ...GOBLET, ...SQUAT_LOW }, props: machineCable(LOW), slow: 'toB', labels: ['Sit down', 'Drive up'] },
  back_squat: { A: { ...STAND, u1: -50, f1: 150, u2: -52, f2: 148 }, B: { ...STAND, ...SQUAT_LOW, t: 38, u1: -10, f1: 170, u2: -12, f2: 168 }, props: [bar('sh', 11), { k: 'line', p1: [150, 40], p2: [150, 150], w: 3 }], slow: 'toB', labels: ['Sit down', 'Drive up'] },
  smith_squat: { A: { ...STAND, u1: -50, f1: 150, u2: -52, f2: 148 }, B: { ...STAND, ...SQUAT_LOW, t: 22, u1: -20, f1: 170, u2: -22, f2: 168 }, props: [{ k: 'line', p1: [76, 10], p2: [76, 150], w: 3 }, { k: 'line', p1: [130, 10], p2: [130, 150], w: 3 }, bar('sh', 9)], slow: 'toB', labels: ['Lower', 'Drive up'] },
  leg_press: {
    A: { hip: [66, 118], t: -62, a1: 165, b1: 70, a2: 162, b2: 66, u1: 10, f1: 40, c1: 160, c2: 160, pin: 'none' },
    B: { hip: [66, 118], t: -62, a1: 118, b1: 118, a2: 116, b2: 116, u1: 10, f1: 40, c1: 200, c2: 200, pin: 'none' },
    props: [{ k: 'line', p1: [30, 112], p2: [60, 130], w: 6 }, { k: 'line', p1: [56, 128], p2: [100, 128], w: 6 }, { k: 'pad', at: 't1' }, { k: 'line', p1: [70, 132], p2: [70, 150], w: 3 }],
    slow: 'toA', labels: ['Push', 'Lower slowly'],
  },
  hack_squat: { A: { ...STAND, t: -8, u1: -40, f1: 160 }, B: { ...STAND, t: 6, a1: 88, b1: -18, a2: 84, b2: -20, u1: -40, f1: 160 }, props: [{ k: 'line', p1: [56, 20], p2: [90, 150], w: 4 }], slow: 'toB', labels: ['Lower', 'Drive up'] },

  // ---------- hinge ----------
  glute_bridge: { A: { ...SUPINE_FLOOR, u1: 90, f1: 90 }, B: { ...SUPINE_FLOOR, hip: [104, 120], t: -112, a1: 108, b1: 4, a2: 105, b2: 2, u1: 70, f1: 90 }, slow: 'toA', labels: ['Squeeze up', 'Lower'] },
  single_leg_rdl_bw: { A: { ...STAND, u1: 10, f1: 10 }, B: { ...STAND, t: 80, a1: 8, b1: -2, a2: -80, b2: -84, c2: 0, u1: 0, f1: 0, u2: -4, f2: -4 }, slow: 'toB', labels: ['Hinge forward', 'Stand tall'] },
  db_rdl: { A: { ...STAND, u1: 0, f1: 0 }, B: HINGE, props: db(), slow: 'toB', labels: ['Hips back', 'Stand tall'] },
  kb_swing: { A: { ...HINGE, t: 62, a1: 24, b1: -8, a2: 22, b2: -10, u1: -28, f1: -28, u2: -30, f2: -30 }, B: { ...STAND, u1: 92, f1: 92, u2: 90, f2: 90 }, props: [kb], slow: 'even', labels: ['Snap the hips', 'Hike back'] },
  cable_rdl: { A: { ...STAND, u1: 4, f1: 4 }, B: HINGE, props: machineCable(LOW), slow: 'toB', labels: ['Hips back', 'Stand tall'] },
  cable_pull_through: { A: { ...HINGE, t: 70, a1: 16, a2: -14, b2: -14, u1: -26, f1: -26 }, B: { ...STAND, a1: 10, a2: -12, b2: -12, u1: -4, f1: -6 }, props: machineCable(BLOW), slow: 'toA', labels: ['Hips through', 'Hinge back'] },
  barbell_rdl: { A: { ...STAND, u1: 0, f1: 0 }, B: HINGE, props: [bar()], slow: 'toB', labels: ['Hips back', 'Stand tall'] },
  hip_thrust_bench: {
    A: { hip: [106, 130], t: -110, a1: 120, b1: -6, a2: 116, b2: -8, u1: 150, f1: 70, pin: 'none' },
    B: { hip: [108, 112], t: -94, a1: 102, b1: 2, a2: 100, b2: 0, u1: 120, f1: 60, pin: 'none' },
    props: [bench(18, 120, 50), bar('hip', 12)], slow: 'toA', labels: ['Drive the hips up', 'Lower'],
  },
  hip_thrust_machine: {
    A: { hip: [106, 130], t: -110, a1: 120, b1: -6, a2: 116, b2: -8, u1: 150, f1: 70, pin: 'none' },
    B: { hip: [108, 112], t: -94, a1: 102, b1: 2, a2: 100, b2: 0, u1: 120, f1: 60, pin: 'none' },
    props: [bench(18, 120, 50), { k: 'pad', at: 'hip' }], slow: 'toA', labels: ['Drive the hips up', 'Lower'],
  },

  // ---------- lunge ----------
  split_squat: { A: { ...STAND, ...STAGGER, a1: 20, a2: -22, b2: -22, c2: 40 }, B: { ...STAND, a1: 80, b1: 0, a2: -8, b2: -95, c2: -10 }, slow: 'toB', labels: ['Drop the back knee', 'Drive up'] },
  reverse_lunge_db: { A: STAND, B: { ...STAND, a1: 80, b1: 0, a2: -8, b2: -95, c2: -10 }, props: db(), slow: 'toB', labels: ['Step back', 'Drive up'] },
  bulgarian_split_squat: {
    A: { ...STAND, hip: [104, 92], a1: 22, b1: 0, a2: -40, b2: -100, c2: -100, pin: 'none' },
    B: { ...STAND, hip: [98, 112], t: 14, a1: 78, b1: -6, a2: -8, b2: -110, c2: -100, pin: 'none' },
    props: [bench(20, 120, 40)], slow: 'toB', labels: ['Lower straight down', 'Drive up'],
  },
  step_up: {
    A: { ...STAND, hip: [88, 88], a1: 70, b1: 0, a2: 0, b2: 0, pin: 'none' },
    B: { ...STAND, hip: [112, 66], a1: 0, b1: 0, a2: -6, b2: -40, pin: 'none' },
    props: [{ k: 'box', x: 100, y: 128, w: 44 }], slow: 'toA', labels: ['Step up', 'Lower slowly'],
  },
  cable_reverse_lunge: { A: GOBLET, B: { ...GOBLET, a1: 80, b1: 0, a2: -8, b2: -95, c2: -10 }, props: machineCable(LOW), slow: 'toB', labels: ['Step back', 'Drive up'] },

  // ---------- horizontal push ----------
  push_up: { A: PLANK_TOP, B: PLANK_LOW, slow: 'toB', labels: ['Lower', 'Push up'] },
  db_bench: { A: { ...SUPINE_BENCH, u1: 178, f1: 178, u2: 176, f2: 176 }, B: { ...SUPINE_BENCH, u1: 12, f1: 175, u2: 10, f2: 172 }, props: [bench(), ...db()], slow: 'toB', labels: ['Lower', 'Press'] },
  db_floor_press: { A: { ...SUPINE_FLOOR, u1: 178, f1: 178, u2: 176, f2: 176 }, B: { ...SUPINE_FLOOR, u1: 82, f1: 178, u2: 80, f2: 176 }, props: db(), slow: 'toB', labels: ['Lower', 'Press'] },
  cable_chest_press: standingPress(BMID),
  machine_chest_press: {
    A: { ...SEATED, u1: -80, f1: 90, u2: -82, f2: 88 }, B: { ...SEATED, u1: 88, f1: 90, u2: 86, f2: 88 },
    props: [seat(), { k: 'line', p1: [66, 112], p2: [62, 50], w: 6 }, { k: 'pad', at: 'w1' }], slow: 'toA', labels: ['Press', 'Return slowly'],
  },
  barbell_bench: { A: { ...SUPINE_BENCH, u1: 178, f1: 178 }, B: { ...SUPINE_BENCH, u1: 14, f1: 172 }, props: [bench(), { k: 'line', p1: [70, 70], p2: [70, 150], w: 3 }, bar()], slow: 'toB', labels: ['Lower to the chest', 'Press'] },
  smith_bench: { A: { ...SUPINE_BENCH, u1: 178, f1: 178 }, B: { ...SUPINE_BENCH, u1: 14, f1: 172 }, props: [bench(), { k: 'line', p1: [58, 10], p2: [58, 150], w: 3 }, bar('w1', 9)], slow: 'toB', labels: ['Lower', 'Press'] },
  trx_chest_press: {
    A: { t: 26, a1: -26, b1: -26, a2: -27, b2: -27, c1: 120, c2: 120, u1: 112, f1: 112, u2: 110, f2: 110, hip: [86, 94], pin: 'none' },
    B: { t: 42, a1: -42, b1: -42, a2: -43, b2: -43, c1: 130, c2: 130, u1: -40, f1: 140, u2: -42, f2: 138, hip: [100, 104], pin: 'none' },
    props: [cable(HIGH)], slow: 'toB', labels: ['Lower', 'Press away'],
  },

  // ---------- vertical push ----------
  pike_push_up: {
    A: { hip: [92, 82], t: 148, a1: -30, b1: -30, a2: -31, b2: -31, c1: 150, c2: 150, u1: 20, f1: 20, u2: 18, f2: 18, pin: 'lowest' },
    B: { hip: [96, 92], t: 128, a1: -38, b1: -38, a2: -39, b2: -39, c1: 150, c2: 150, u1: -40, f1: 60, u2: -42, f2: 58, pin: 'lowest' },
    slow: 'toB', labels: ['Lower the head', 'Press up'],
  },
  db_shoulder_press: { A: { ...STAND, u1: 12, f1: 178, u2: 10, f2: 176 }, B: { ...STAND, u1: 176, f1: 178, u2: 174, f2: 176 }, props: db(), slow: 'toA', labels: ['Press up', 'Lower to the ears'] },
  machine_shoulder_press: { A: { ...SEATED, t: -6, u1: 12, f1: 178 }, B: { ...SEATED, t: -6, u1: 176, f1: 178 }, props: [seat(), { k: 'line', p1: [70, 112], p2: [66, 60], w: 6 }, { k: 'pad', at: 'w1' }], slow: 'toA', labels: ['Press up', 'Lower slowly'] },
  cable_shoulder_press: { A: { ...KNEEL, u1: 12, f1: 178, u2: 10, f2: 176 }, B: { ...KNEEL, u1: 176, f1: 178, u2: 174, f2: 176 }, props: [col(184), col(16), cable(LOW), cable(BLOW, 'w2')], slow: 'toA', labels: ['Press up', 'Lower slowly'] },
  landmine_press: { A: { ...STAND, ...STAGGER, u1: 16, f1: 175 }, B: { ...STAND, ...STAGGER, t: 8, u1: 140, f1: 140 }, props: [{ k: 'rod', from: [30, 146], to: 'w1' }], slow: 'toA', labels: ['Press up and out', 'Lower'] },

  // ---------- horizontal pull ----------
  towel_row: {
    A: { t: -34, a1: 34, b1: 34, a2: 33, b2: 33, c1: 124, c2: 124, u1: 124, f1: 124, u2: 122, f2: 122, hip: [112, 108], pin: 'feet' },
    B: { t: -26, a1: 26, b1: 26, a2: 25, b2: 25, c1: 116, c2: 116, u1: -20, f1: 112, u2: -22, f2: 110, hip: [116, 100], pin: 'feet' },
    props: [{ k: 'line', p1: [178, 40], p2: [178, 150], w: 6 }], slow: 'toA', labels: ['Pull the chest in', 'Lower slowly'],
  },
  db_row: { A: { ...HINGE, t: 82, a2: -14, b2: -14, u2: 20, f2: 20 }, B: { ...HINGE, t: 82, a2: -14, b2: -14, u2: 20, f2: 20, u1: -64, f1: 2 }, props: [bench(118, 112, 40), { k: 'db', at: 'w1' }], slow: 'toA', labels: ['Elbow to the hip', 'Lower slowly'] },
  chest_supported_db_row: {
    A: { hip: [72, 108], t: 52, a1: 40, b1: 10, a2: 38, b2: 8, u1: 0, f1: 0, u2: -2, f2: -2, pin: 'feet' },
    B: { hip: [72, 108], t: 52, a1: 40, b1: 10, a2: 38, b2: 8, u1: -62, f1: 4, u2: -64, f2: 2, pin: 'feet' },
    props: [{ k: 'line', p1: [70, 112], p2: [112, 70], w: 6 }, { k: 'line', p1: [80, 112], p2: [80, 150], w: 3 }, ...db()], slow: 'toA', labels: ['Row and squeeze', 'Lower slowly'],
  },
  cable_row: {
    A: { hip: [64, 132], t: 18, a1: 86, b1: 94, a2: 84, b2: 92, c1: 170, c2: 170, u1: 90, f1: 90, u2: 88, f2: 88, pin: 'none' },
    B: { hip: [64, 132], t: -4, a1: 86, b1: 94, a2: 84, b2: 92, c1: 170, c2: 170, u1: -70, f1: 82, u2: -72, f2: 80, pin: 'none' },
    props: [col(184), cable([184, 122]), { k: 'line', p1: [126, 120], p2: [126, 150], w: 5 }], slow: 'toA', labels: ['Pull to the ribs', 'Reach forward'],
  },
  cable_single_arm_row: { A: { ...STAND, ...STAGGER, t: 10, u1: 90, f1: 90 }, B: { ...STAND, ...STAGGER, t: 4, u1: -72, f1: 84 }, props: machineCable(MID), slow: 'toA', labels: ['Elbow back', 'Reach forward'] },
  trx_row: {
    A: { t: -36, a1: 36, b1: 36, a2: 35, b2: 35, c1: 126, c2: 126, u1: 128, f1: 128, u2: 126, f2: 126, hip: [110, 100], pin: 'feet' },
    B: { t: -22, a1: 22, b1: 22, a2: 21, b2: 21, c1: 112, c2: 112, u1: -22, f1: 118, u2: -24, f2: 116, hip: [124, 96], pin: 'feet' },
    props: [cable(HIGH)], slow: 'toA', labels: ['Pull the chest up', 'Lower slowly'],
  },
  barbell_row: { A: { ...HINGE, t: 62, a1: 22, b1: -8, a2: 20, b2: -10 }, B: { ...HINGE, t: 62, a1: 22, b1: -8, a2: 20, b2: -10, u1: -60, f1: 8, u2: -62, f2: 6 }, props: [bar()], slow: 'toA', labels: ['Row to the belly', 'Lower slowly'] },
  band_row: { A: { ...STAND, ...STAGGER, u1: 90, f1: 90, u2: 88, f2: 88 }, B: { ...STAND, ...STAGGER, u1: -72, f1: 84, u2: -74, f2: 82 }, props: [cable(MID, 'w1', true), col(184)], slow: 'toA', labels: ['Elbows back', 'Return slowly'] },

  // ---------- vertical pull ----------
  pull_up: { A: HANG(), B: { ...HANG(), t: -12, u1: 28, f1: 172, u2: 26, f2: 170 }, props: [{ k: 'bar', x1: 60, x2: 150, y: 6 }], slow: 'toA', labels: ['Pull the chest up', 'Lower all the way'] },
  lat_pulldown: { A: { ...SEATED, hip: [86, 114], u1: 172, f1: 172, u2: 170, f2: 170 }, B: { ...SEATED, hip: [86, 114], t: -12, u1: 22, f1: 168, u2: 20, f2: 166 }, props: [seat(), { k: 'pad', at: 'k1' }, col(184), cable([110, 12]), { k: 'line', p1: [110, 12], p2: [184, 12], w: 3 }], slow: 'toA', labels: ['Pull to the chest', 'Control it up'] },
  cable_pulldown_kneeling: { A: { ...KNEEL, u1: 150, f1: 150 }, B: { ...KNEEL, u1: 12, f1: 150 }, props: machineCable(HIGH), slow: 'toA', labels: ['Elbow to the ribs', 'Reach up'] },
  band_pulldown: { A: { ...KNEEL, u1: 150, f1: 150, u2: 148, f2: 148 }, B: { ...KNEEL, u1: 12, f1: 150, u2: 10, f2: 148 }, props: [col(184), cable(HIGH, 'w1', true)], slow: 'toA', labels: ['Elbows down', 'Reach up'] },
  db_pullover: { A: { ...SUPINE_BENCH, u1: 176, f1: 176, u2: 174, f2: 174 }, B: { ...SUPINE_BENCH, u1: -100, f1: -104, u2: -102, f2: -106 }, props: [bench(), { k: 'db', at: 'w1' }], slow: 'toB', labels: ['Lower behind', 'Pull over'] },
  straight_arm_pulldown: { A: { ...STAND, t: 18, u1: 140, f1: 140, u2: 138, f2: 138 }, B: { ...STAND, t: 18, u1: 4, f1: 4, u2: 2, f2: 2 }, props: machineCable(HIGH), slow: 'toA', labels: ['Sweep down', 'Return slowly'] },

  // ---------- chest fly ----------
  db_fly: { A: { ...SUPINE_BENCH, u1: 178, f1: 176, u2: 176, f2: 174 }, B: { ...SUPINE_BENCH, u1: 98, f1: 110, u2: 96, f2: 108 }, props: [bench(), ...db()], slow: 'toB', labels: ['Open wide', 'Hug together'] },
  cable_fly: { A: { ...STAND, ...STAGGER, u1: -50, f1: -20, u2: -52, f2: -22 }, B: { ...STAND, ...STAGGER, t: 8, u1: 84, f1: 90, u2: 82, f2: 88 }, props: machineCable(BMID), slow: 'toA', labels: ['Hug together', 'Open slowly'] },
  pec_deck: { A: { ...SEATED, u1: -50, f1: 30, u2: -52, f2: 28 }, B: { ...SEATED, u1: 76, f1: 160, u2: 74, f2: 158 }, props: [seat(), { k: 'line', p1: [66, 112], p2: [62, 40], w: 6 }, { k: 'pad', at: 'e1' }], slow: 'toA', labels: ['Bring together', 'Open slowly'] },

  // ---------- shoulders (front view) ----------
  db_lateral_raise: { A: { view: 'front', u1: 12, f1: 14 }, B: { view: 'front', u1: 88, f1: 92 }, props: db(), slow: 'toA', labels: ['Raise to the side', 'Lower slowly'] },
  cable_lateral_raise: { A: { view: 'front', u1: 12, f1: 14 }, B: { view: 'front', u1: 88, f1: 92 }, props: [col(16), cable(BLOW)], slow: 'toA', labels: ['Raise out', 'Lower slowly'] },
  band_lateral_raise: { A: { view: 'front', u1: 12, f1: 14 }, B: { view: 'front', u1: 88, f1: 92 }, props: [cable([106, 146], 'w1', true)], slow: 'toA', labels: ['Raise out', 'Lower slowly'] },
  face_pull: { A: { ...STAND, ...STAGGER, u1: 110, f1: 110 }, B: { ...STAND, ...STAGGER, u1: -80, f1: 160 }, props: machineCable([184, 50]), slow: 'toA', labels: ['Pull to the forehead', 'Return slowly'] },
  db_rear_delt_fly: { A: { ...HINGE, t: 70, u1: 0, f1: 4 }, B: { ...HINGE, t: 70, u1: -82, f1: -78 }, props: [{ k: 'db', at: 'w1' }], slow: 'toA', labels: ['Open the arms', 'Lower slowly'] },
  reverse_pec_deck: { A: { ...SEATED, t: 8, u1: 88, f1: 90 }, B: { ...SEATED, t: 8, u1: -60, f1: -60 }, props: [seat(), { k: 'line', p1: [128, 112], p2: [130, 50], w: 6 }], slow: 'toA', labels: ['Sweep back', 'Return slowly'] },
  band_pull_apart: { A: { view: 'front', u1: 60, f1: 70 }, B: { view: 'front', u1: 92, f1: 92 }, props: [{ k: 'link', a: 'w1', b: 'w2' }], slow: 'toA', labels: ['Pull apart', 'Return slowly'] },

  // ---------- arms ----------
  db_curl: { A: { ...STAND, u1: 2, f1: 2 }, B: { ...STAND, u1: 8, f1: 160 }, props: [{ k: 'db', at: 'w1' }], slow: 'toA', labels: ['Curl', 'Lower slowly'] },
  cable_curl: { A: { ...STAND, u1: 2, f1: 8 }, B: { ...STAND, u1: 8, f1: 160 }, props: machineCable(LOW), slow: 'toA', labels: ['Curl', 'Lower slowly'] },
  ez_curl: { A: { ...STAND, u1: 2, f1: 2 }, B: { ...STAND, u1: 8, f1: 160 }, props: [bar('w1', 11)], slow: 'toA', labels: ['Curl', 'Lower slowly'] },
  band_curl: { A: { ...STAND, u1: 2, f1: 4 }, B: { ...STAND, u1: 8, f1: 160 }, props: [cable([112, 148], 'w1', true)], slow: 'toA', labels: ['Curl', 'Lower slowly'] },
  cable_pushdown: { A: { ...STAND, t: 8, u1: 4, f1: 150 }, B: { ...STAND, t: 8, u1: 2, f1: 4 }, props: [col(184), cable([128, 16]), { k: 'line', p1: [128, 16], p2: [184, 16], w: 3 }], slow: 'toA', labels: ['Push down', 'Return slowly'] },
  db_overhead_extension: { A: { ...STAND, u1: 168, f1: -12 }, B: { ...STAND, u1: 172, f1: 176 }, props: [{ k: 'db', at: 'w1' }], slow: 'toA', labels: ['Extend up', 'Lower behind'] },
  bench_dip: {
    A: { t: 2, u1: -14, f1: -10, u2: -16, f2: -12, a1: 82, b1: 10, a2: 80, b2: 8, pin: { joint: 'w1', at: [74, 118] } },
    B: { t: 4, u1: -82, f1: -6, u2: -84, f2: -8, a1: 110, b1: -26, a2: 108, b2: -28, pin: { joint: 'w1', at: [74, 118] } },
    props: [bench(30, 120, 46)], slow: 'toB', labels: ['Lower', 'Press up'],
  },
  dip: { A: { t: 8, u1: 4, f1: 0, u2: 2, f2: -2, a1: 10, b1: -60, a2: 6, b2: -64, pin: { joint: 'w1', at: [104, 84] } }, B: { t: 22, u1: -70, f1: 8, u2: -72, f2: 6, a1: 14, b1: -60, a2: 10, b2: -64, pin: { joint: 'w1', at: [104, 84] } }, props: [{ k: 'bar', x1: 84, x2: 130, y: 86 }, { k: 'line', p1: [126, 86], p2: [126, 150], w: 4 }], slow: 'toB', labels: ['Lower', 'Press up'] },
  diamond_push_up: { A: PLANK_TOP, B: { ...PLANK_LOW, u1: -70, f1: 58, u2: -71, f2: 58 }, slow: 'toB', labels: ['Lower', 'Push up'] },

  // ---------- legs, isolation ----------
  leg_extension: { A: { ...SEATED, u1: 20, f1: 20 }, B: { ...SEATED, u1: 20, f1: 20, b1: 88, b2: 86, c1: 160, c2: 160 }, props: [seat(), { k: 'line', p1: [66, 112], p2: [60, 58], w: 6 }, { k: 'pad', at: 'a1' }], slow: 'toA', labels: ['Straighten the legs', 'Lower slowly'] },
  wall_sit: { A: { t: -2, a1: 90, b1: 0, a2: 88, b2: -2, u1: 4, f1: 30 }, B: { t: -2, a1: 88, b1: 2, a2: 86, b2: 0, u1: 4, f1: 34 }, props: [{ k: 'line', p1: [68, 10], p2: [68, 150], w: 6 }], slow: 'even', labels: ['Hold', 'Breathe'] },
  leg_curl: { A: { ...SEATED, u1: 20, f1: 30, b1: 80, b2: 78 }, B: { ...SEATED, u1: 20, f1: 30, b1: -16, b2: -18 }, props: [seat(), { k: 'line', p1: [66, 112], p2: [60, 58], w: 6 }, { k: 'pad', at: 'a1' }, { k: 'pad', at: 'k1' }], slow: 'toA', labels: ['Curl under', 'Return slowly'] },
  trx_hamstring_curl: {
    A: { hip: [100, 128], t: -96, a1: 96, b1: 96, a2: 95, b2: 95, c1: 170, c2: 170, u1: 90, f1: 90, pin: 'none' },
    B: { hip: [100, 112], t: -108, a1: 150, b1: 10, a2: 148, b2: 8, c1: 170, c2: 170, u1: 90, f1: 90, pin: 'none' },
    props: [cable([170, 16], 'a1')], slow: 'toA', labels: ['Curl the heels in', 'Extend slowly'],
  },
  cable_kickback: { A: { ...STAND, t: 24, u1: 30, f1: 60 }, B: { ...STAND, t: 24, u1: 30, f1: 60, a1: -38, b1: -30 }, props: [col(184), cable(LOW, 'a1')], slow: 'toA', labels: ['Kick back', 'Return slowly'] },
  single_leg_bridge: { A: { ...SUPINE_FLOOR, a2: 150, b2: 150, u1: 90, f1: 90 }, B: { ...SUPINE_FLOOR, hip: [104, 120], t: -112, a1: 108, b1: 4, a2: 112, b2: 112, u1: 70, f1: 90 }, slow: 'toA', labels: ['Drive up', 'Lower'] },
  calf_raise: { A: { ...STAND }, B: { ...STAND, c1: 40, c2: 40 }, slow: 'toA', labels: ['Rise high', 'Lower all the way'] },
  leg_press_calf_raise: {
    A: { hip: [66, 118], t: -62, a1: 118, b1: 118, a2: 116, b2: 116, u1: 10, f1: 40, c1: 200, c2: 200, pin: 'none' },
    B: { hip: [66, 118], t: -62, a1: 118, b1: 118, a2: 116, b2: 116, u1: 10, f1: 40, c1: 240, c2: 240, pin: 'none' },
    props: [{ k: 'line', p1: [30, 112], p2: [60, 130], w: 6 }, { k: 'line', p1: [56, 128], p2: [100, 128], w: 6 }, { k: 'pad', at: 't1' }],
    slow: 'toA', labels: ['Push through the toes', 'Lower slowly'],
  },

  // ---------- core ----------
  plank: { A: { hip: [98, 133], t: 78, a1: -75, b1: -75, a2: -76, b2: -76, c1: 165, c2: 165, u1: 0, f1: 90, u2: 2, f2: 92, pin: 'none' }, B: { hip: [98, 131], t: 78, a1: -75, b1: -75, a2: -76, b2: -76, c1: 165, c2: 165, u1: 0, f1: 90, u2: 2, f2: 92, pin: 'none' }, slow: 'even', labels: ['Hold, ribs down', 'Breathe'] },
  side_plank: { A: { hip: [98, 128], t: 74, a1: -72, b1: -72, a2: -72, b2: -72, c1: 165, c2: 165, u1: 0, f1: 90, u2: 160, f2: 160, pin: 'none' }, B: { hip: [98, 126], t: 74, a1: -72, b1: -72, a2: -72, b2: -72, c1: 165, c2: 165, u1: 0, f1: 90, u2: 165, f2: 165, pin: 'none' }, slow: 'even', labels: ['Hips high', 'Breathe'] },
  dead_bug: { A: { ...SUPINE_FLOOR, hip: [110, 144], a1: 180, b1: 90, a2: 178, b2: 88, u1: 178, f1: 178, u2: 176, f2: 176 }, B: { ...SUPINE_FLOOR, hip: [110, 144], a1: 180, b1: 90, a2: 100, b2: 100, u1: -84, f1: -86, u2: 176, f2: 176 }, slow: 'toB', labels: ['Reach long', 'Return'] },
  hanging_knee_raise: { A: HANG(), B: { ...HANG(), a1: 100, b1: 0, a2: 96, b2: -4, c1: 90, c2: 90 }, props: [{ k: 'bar', x1: 60, x2: 150, y: 6 }], slow: 'toA', labels: ['Knees up', 'Lower slowly'] },
  pallof_press: { A: { view: 'front', u1: 12, f1: -118 }, B: { view: 'front', u1: 26, f1: -104 }, props: [col(184), cable(MID)], slow: 'toA', labels: ['Press out, hold', 'Return'] },
  cable_woodchop: { A: { ...STAND, ...STAGGER, t: -6, u1: 150, f1: 150, u2: 148, f2: 148 }, B: { ...STAND, ...STAGGER, t: 18, u1: 40, f1: 40, u2: 38, f2: 38 }, props: machineCable(BHIGH), slow: 'toA', labels: ['Chop across', 'Return slowly'] },
  russian_twist: {
    A: { hip: [100, 140], t: -36, a1: 110, b1: 60, a2: 108, b2: 58, u1: 60, f1: 140, u2: 58, f2: 138, pin: 'lowest' },
    B: { hip: [100, 140], t: -36, a1: 110, b1: 60, a2: 108, b2: 58, u1: 20, f1: 100, u2: 18, f2: 98, pin: 'lowest' },
    props: [{ k: 'db', at: 'w1' }], slow: 'even', labels: ['Rotate', 'Rotate back'],
  },
  suitcase_carry: { A: { ...STAND, a1: 20, b1: 0, a2: -18, b2: -22, u1: 0, f1: 0 }, B: { ...STAND, a1: -18, b1: -22, a2: 20, b2: 0, u1: 0, f1: 0 }, props: [{ k: 'db', at: 'w1' }], slow: 'even', labels: ['Walk tall', 'No leaning'] },

  // ---------- conditioning ----------
  treadmill_intervals: { A: RUN_A, B: RUN_B, props: [{ k: 'line', p1: [40, 150], p2: [170, 140], w: 6 }, { k: 'line', p1: [160, 140], p2: [176, 60], w: 4 }, { k: 'line', p1: [150, 62], p2: [184, 56], w: 5 }], slow: 'even', labels: ['Run', 'Run'] },
  bike_intervals: {
    A: { hip: [96, 84], t: 30, u1: 70, f1: 110, a1: 70, b1: -14, a2: 120, b2: 30, pin: 'none' },
    B: { hip: [96, 84], t: 30, u1: 70, f1: 110, a1: 120, b1: 30, a2: 70, b2: -14, pin: 'none' },
    props: [{ k: 'line', p1: [86, 90], p2: [110, 150], w: 5 }, { k: 'line', p1: [140, 60], p2: [146, 150], w: 5 }, { k: 'wheel', c: [146, 132], r: 16 }], slow: 'even', labels: ['Pedal hard', 'Keep spinning'],
  },
  row_intervals: {
    A: { hip: [70, 134], t: 32, a1: 140, b1: 20, a2: 138, b2: 18, u1: 92, f1: 92, u2: 90, f2: 90, c1: 150, c2: 150, pin: 'none' },
    B: { hip: [44, 134], t: -22, a1: 92, b1: 92, a2: 90, b2: 90, u1: -60, f1: 84, u2: -62, f2: 82, c1: 175, c2: 175, pin: 'none' },
    props: [{ k: 'line', p1: [20, 142], p2: [180, 142], w: 4 }, cable([170, 120]), { k: 'wheel', c: [174, 122], r: 10 }], slow: 'toA', labels: ['Legs, body, arms', 'Arms, body, legs'],
  },
  elliptical_intervals: { A: { ...RUN_A, u1: 80, f1: 120, u2: 60, f2: 120, b2: -20 }, B: { ...RUN_B, u1: 60, f1: 120, u2: 80, f2: 120, b1: -20 }, props: [{ k: 'line', p1: [50, 150], p2: [170, 150], w: 6 }, { k: 'line', p1: [160, 150], p2: [166, 50], w: 4 }], slow: 'even', labels: ['Drive the pedals', 'Stand tall'] },
  shadow_boxing: { A: { ...STAND, ...STAGGER, u1: 20, f1: 160, u2: 30, f2: 150 }, B: { ...STAND, ...STAGGER, t: 6, u1: 90, f1: 90, u2: 30, f2: 150 }, slow: 'even', labels: ['Punch', 'Guard up'] },
  bw_circuit: { A: { ...STAND, u1: 80, f1: 85 }, B: { ...STAND, ...SQUAT_LOW, u1: 85, f1: 90 }, slow: 'even', labels: ['Squat', 'Up'] },
};
