import type { EquipmentId } from './equipment';

export type Pattern =
  | 'squat'
  | 'hinge'
  | 'lunge'
  | 'horizontal_push'
  | 'vertical_push'
  | 'horizontal_pull'
  | 'vertical_pull'
  | 'chest_fly'
  | 'lateral_raise'
  | 'rear_delt'
  | 'biceps'
  | 'triceps'
  | 'quad_iso'
  | 'ham_iso'
  | 'glutes'
  | 'calves'
  | 'core_brace'
  | 'core_rotation'
  | 'conditioning';

export type Region = 'knee' | 'lower_back' | 'shoulder' | 'wrist' | 'elbow' | 'hip' | 'neck';

export type Level = 1 | 2 | 3;

export interface Exercise {
  id: string;
  name: string;
  pattern: Pattern;
  muscles: string[];
  /** AND of ORs: every inner list needs at least one item present. Empty = bodyweight. */
  needs: EquipmentId[][];
  /** Joints that take meaningful load. Used by the injury filter. */
  loads: Region[];
  level: Level;
  compound: boolean;
  unilateral?: boolean;
  cues: string[];
}

const BENCH: EquipmentId[] = ['flat_bench', 'adjustable_bench'];
const PULL_BAR: EquipmentId[] = ['pull_up_bar', 'assisted_pullup'];

/** ~70 exercises chosen for what hotels, condos and busy gyms actually have. */
export const EXERCISES: Exercise[] = [
  // ---------- squat ----------
  { id: 'bw_squat', name: 'Bodyweight squat', pattern: 'squat', muscles: ['quads', 'glutes'], needs: [], loads: ['knee'], level: 1, compound: true,
    cues: ['Feet shoulder width, toes slightly out.', 'Sit between your heels, chest up.', 'Drive up through the whole foot.'] },
  { id: 'goblet_squat_db', name: 'Dumbbell goblet squat', pattern: 'squat', muscles: ['quads', 'glutes'], needs: [['dumbbells', 'kettlebell']], loads: ['knee'], level: 1, compound: true,
    cues: ['Hold the weight at your chest, elbows down.', 'Sit straight down between your heels.', 'Keep the chest tall the whole rep.'] },
  { id: 'goblet_squat_cable', name: 'Cable goblet squat', pattern: 'squat', muscles: ['quads', 'glutes'], needs: [['cable_stack']], loads: ['knee'], level: 1, compound: true,
    cues: ['Low pulley, handle at your chest.', 'Step back until the cable is taut.', 'Sit down and drive up, stack never slams.'] },
  { id: 'back_squat', name: 'Barbell back squat', pattern: 'squat', muscles: ['quads', 'glutes', 'adductors'], needs: [['barbell'], ['squat_rack']], loads: ['knee', 'lower_back'], level: 3, compound: true,
    cues: ['Bar on the upper back, set the safeties.', 'Brace, then sit down and slightly back.', 'Knees track over the toes.'] },
  { id: 'smith_squat', name: 'Smith machine squat', pattern: 'squat', muscles: ['quads', 'glutes'], needs: [['smith_machine']], loads: ['knee'], level: 2, compound: true,
    cues: ['Feet slightly in front of the bar.', 'Unhook, brace, lower under control.', 'Set the stoppers just below your bottom position.'] },
  { id: 'leg_press', name: 'Leg press', pattern: 'squat', muscles: ['quads', 'glutes'], needs: [['leg_press']], loads: ['knee'], level: 1, compound: true,
    cues: ['Feet mid-platform, shoulder width.', 'Lower until hips start to tuck, no further.', 'Never lock the knees hard at the top.'] },
  { id: 'hack_squat', name: 'Hack squat', pattern: 'squat', muscles: ['quads', 'glutes'], needs: [['hack_squat']], loads: ['knee'], level: 2, compound: true,
    cues: ['Back flat against the pad.', 'Lower slowly to a comfortable depth.', 'Drive through the mid-foot.'] },

  // ---------- hinge ----------
  { id: 'glute_bridge', name: 'Glute bridge', pattern: 'hinge', muscles: ['glutes', 'hamstrings'], needs: [], loads: [], level: 1, compound: false,
    cues: ['Heels close to the hips.', 'Squeeze the glutes to lift, ribs down.', 'Pause one second at the top.'] },
  { id: 'single_leg_rdl_bw', name: 'Single-leg reach (bodyweight RDL)', pattern: 'hinge', muscles: ['hamstrings', 'glutes'], needs: [], loads: [], level: 2, compound: true, unilateral: true,
    cues: ['Soft knee on the standing leg.', 'Hinge forward, back leg straight behind.', 'Stand tall by squeezing the glute.'] },
  { id: 'db_rdl', name: 'Dumbbell Romanian deadlift', pattern: 'hinge', muscles: ['hamstrings', 'glutes'], needs: [['dumbbells', 'kettlebell']], loads: ['lower_back'], level: 1, compound: true,
    cues: ['Weights slide down the front of the thighs.', 'Push the hips back, soft knees.', 'Stop when the hamstrings are tight, then stand.'] },
  { id: 'kb_swing', name: 'Kettlebell swing', pattern: 'hinge', muscles: ['glutes', 'hamstrings'], needs: [['kettlebell']], loads: ['lower_back'], level: 2, compound: true,
    cues: ['Hike the bell back between the legs.', 'Snap the hips forward, arms just guide it.', 'Float to chest height, no higher.'] },
  { id: 'cable_rdl', name: 'Cable Romanian deadlift', pattern: 'hinge', muscles: ['hamstrings', 'glutes'], needs: [['cable_stack']], loads: ['lower_back'], level: 1, compound: true,
    cues: ['Low pulley, face the machine.', 'Hips back until the hamstrings stretch.', 'Stand tall, squeeze the glutes.'] },
  { id: 'cable_pull_through', name: 'Cable pull-through', pattern: 'hinge', muscles: ['glutes', 'hamstrings'], needs: [['cable_stack']], loads: [], level: 1, compound: true,
    cues: ['Face away, rope between the legs.', 'Hinge back, then drive the hips through.', 'Arms stay long, the hips do the work.'] },
  { id: 'barbell_rdl', name: 'Barbell Romanian deadlift', pattern: 'hinge', muscles: ['hamstrings', 'glutes', 'back'], needs: [['barbell']], loads: ['lower_back'], level: 2, compound: true,
    cues: ['Bar close to the legs at all times.', 'Hips back, flat back, soft knees.', 'Stand up by driving the hips forward.'] },
  { id: 'hip_thrust_bench', name: 'Hip thrust (bench)', pattern: 'hinge', muscles: ['glutes'], needs: [BENCH], loads: [], level: 1, compound: false,
    cues: ['Upper back on the bench edge.', 'Chin tucked, drive the hips up.', 'Hold a hard squeeze at the top.'] },
  { id: 'hip_thrust_machine', name: 'Hip thrust machine', pattern: 'hinge', muscles: ['glutes'], needs: [['hip_thrust_machine']], loads: [], level: 1, compound: false,
    cues: ['Pad across the hips.', 'Drive up until the hips are level with the knees.', 'Lower slowly.'] },

  // ---------- lunge ----------
  { id: 'split_squat', name: 'Split squat', pattern: 'lunge', muscles: ['quads', 'glutes'], needs: [], loads: ['knee'], level: 1, compound: true, unilateral: true,
    cues: ['Long stance, back heel up.', 'Drop the back knee straight down.', 'All reps one side, then switch.'] },
  { id: 'reverse_lunge_db', name: 'Dumbbell reverse lunge', pattern: 'lunge', muscles: ['quads', 'glutes'], needs: [['dumbbells', 'kettlebell']], loads: ['knee'], level: 2, compound: true, unilateral: true,
    cues: ['Step back, not out.', 'Front shin stays fairly vertical.', 'Push through the front heel to return.'] },
  { id: 'bulgarian_split_squat', name: 'Bulgarian split squat', pattern: 'lunge', muscles: ['quads', 'glutes'], needs: [['flat_bench', 'adjustable_bench', 'step_box']], loads: ['knee'], level: 2, compound: true, unilateral: true,
    cues: ['Rear foot laces-down on the bench.', 'Lower straight down, torso slightly forward.', 'Front foot far enough out to keep the heel down.'] },
  { id: 'step_up', name: 'Step-up', pattern: 'lunge', muscles: ['quads', 'glutes'], needs: [['flat_bench', 'adjustable_bench', 'step_box']], loads: ['knee'], level: 1, compound: true, unilateral: true,
    cues: ['Whole foot on the box.', 'Drive up through the top leg, not the back foot.', 'Lower slowly.'] },
  { id: 'cable_reverse_lunge', name: 'Cable reverse lunge', pattern: 'lunge', muscles: ['quads', 'glutes'], needs: [['cable_stack']], loads: ['knee'], level: 2, compound: true, unilateral: true,
    cues: ['Low pulley, handle at the chest.', 'Step back and lower the knee.', 'Drive back to standing.'] },

  // ---------- horizontal push ----------
  { id: 'push_up', name: 'Push-up', pattern: 'horizontal_push', muscles: ['chest', 'triceps', 'front delts'], needs: [], loads: ['shoulder', 'wrist'], level: 1, compound: true,
    cues: ['Hands just outside the shoulders.', 'Body in one straight line.', 'Hands on a bench to make it easier.'] },
  { id: 'db_bench', name: 'Dumbbell bench press', pattern: 'horizontal_push', muscles: ['chest', 'triceps', 'front delts'], needs: [['dumbbells'], BENCH], loads: ['shoulder'], level: 1, compound: true,
    cues: ['Shoulder blades pinched back.', 'Lower to the sides of the chest.', 'Press up and slightly in.'] },
  { id: 'db_floor_press', name: 'Dumbbell floor press', pattern: 'horizontal_push', muscles: ['chest', 'triceps'], needs: [['dumbbells', 'kettlebell']], loads: ['shoulder'], level: 1, compound: true,
    cues: ['Lie on the floor, knees bent.', 'Lower until the upper arms touch the floor.', 'Press straight up.'] },
  { id: 'cable_chest_press', name: 'Standing cable chest press', pattern: 'horizontal_push', muscles: ['chest', 'triceps'], needs: [['cable_stack']], loads: ['shoulder'], level: 1, compound: true,
    cues: ['Pulleys at chest height, staggered stance.', 'Press forward and slightly together.', 'Control the return.'] },
  { id: 'machine_chest_press', name: 'Machine chest press', pattern: 'horizontal_push', muscles: ['chest', 'triceps'], needs: [['chest_press_machine']], loads: ['shoulder'], level: 1, compound: true,
    cues: ['Handles at mid-chest height.', 'Press without shrugging.', 'Slow on the way back.'] },
  { id: 'barbell_bench', name: 'Barbell bench press', pattern: 'horizontal_push', muscles: ['chest', 'triceps', 'front delts'], needs: [['barbell'], BENCH, ['squat_rack']], loads: ['shoulder'], level: 3, compound: true,
    cues: ['Set safeties or use a spotter.', 'Lower to the lower chest.', 'Feet planted, press up and back.'] },
  { id: 'smith_bench', name: 'Smith machine bench press', pattern: 'horizontal_push', muscles: ['chest', 'triceps'], needs: [['smith_machine'], BENCH], loads: ['shoulder'], level: 2, compound: true,
    cues: ['Bench placed so the bar meets the lower chest.', 'Set the stoppers.', 'Press smoothly, no bounce.'] },
  { id: 'trx_chest_press', name: 'Suspension chest press', pattern: 'horizontal_push', muscles: ['chest', 'triceps'], needs: [['suspension_trainer']], loads: ['shoulder'], level: 2, compound: true,
    cues: ['Lean forward into the straps.', 'Lower with elbows at 45 degrees.', 'Walk feet back to make it harder.'] },

  // ---------- vertical push ----------
  { id: 'pike_push_up', name: 'Pike push-up', pattern: 'vertical_push', muscles: ['shoulders', 'triceps'], needs: [], loads: ['shoulder', 'wrist'], level: 2, compound: true,
    cues: ['Hips high, body in an upside-down V.', 'Lower the head toward the floor.', 'Press back up.'] },
  { id: 'db_shoulder_press', name: 'Dumbbell shoulder press', pattern: 'vertical_push', muscles: ['shoulders', 'triceps'], needs: [['dumbbells', 'kettlebell']], loads: ['shoulder'], level: 1, compound: true,
    cues: ['Seated or standing, ribs down.', 'Press up and slightly in.', 'Lower to ear height.'] },
  { id: 'machine_shoulder_press', name: 'Machine shoulder press', pattern: 'vertical_push', muscles: ['shoulders', 'triceps'], needs: [['shoulder_press_machine']], loads: ['shoulder'], level: 1, compound: true,
    cues: ['Seat height puts handles at shoulder level.', 'Press without arching the back.', 'Lower slowly.'] },
  { id: 'cable_shoulder_press', name: 'Kneeling cable shoulder press', pattern: 'vertical_push', muscles: ['shoulders', 'triceps'], needs: [['cable_stack']], loads: ['shoulder'], level: 2, compound: true,
    cues: ['Low pulleys, kneel between them.', 'Press up until arms are straight.', 'Keep the ribs down.'] },
  { id: 'landmine_press', name: 'Half-kneeling landmine press', pattern: 'vertical_push', muscles: ['shoulders', 'chest'], needs: [['barbell']], loads: ['shoulder'], level: 2, compound: true,
    cues: ['Bar end wedged in a corner.', 'Press up and forward.', 'Shoulder-friendly angle.'] },

  // ---------- horizontal pull ----------
  { id: 'towel_row', name: 'Table or doorframe row', pattern: 'horizontal_pull', muscles: ['upper back', 'lats', 'biceps'], needs: [], loads: ['elbow'], level: 1, compound: true,
    cues: ['Use a sturdy table edge or a towel round a solid door frame.', 'Pull the chest to your hands.', 'Test the anchor before every set.'] },
  { id: 'db_row', name: 'One-arm dumbbell row', pattern: 'horizontal_pull', muscles: ['lats', 'upper back', 'biceps'], needs: [['dumbbells', 'kettlebell']], loads: [], level: 1, compound: true, unilateral: true,
    cues: ['Hand and knee on a bench, or brace on a chair.', 'Pull the elbow toward the hip.', 'No twisting.'] },
  { id: 'chest_supported_db_row', name: 'Chest-supported dumbbell row', pattern: 'horizontal_pull', muscles: ['upper back', 'lats'], needs: [['dumbbells'], ['adjustable_bench']], loads: [], level: 1, compound: true,
    cues: ['Lie face down on an incline bench.', 'Row both weights, squeeze the shoulder blades.', 'Lower slowly.'] },
  { id: 'cable_row', name: 'Seated cable row', pattern: 'horizontal_pull', muscles: ['lats', 'upper back', 'biceps'], needs: [['seated_row', 'cable_stack']], loads: [], level: 1, compound: true,
    cues: ['Sit tall, slight knee bend.', 'Pull to the lower ribs.', 'Let the shoulders reach forward on the return.'] },
  { id: 'cable_single_arm_row', name: 'Single-arm cable row', pattern: 'horizontal_pull', muscles: ['lats', 'upper back'], needs: [['cable_stack']], loads: [], level: 1, compound: true, unilateral: true,
    cues: ['Pulley at chest height, staggered stance.', 'Elbow to the back pocket.', 'Square hips, no twisting.'] },
  { id: 'trx_row', name: 'Suspension row', pattern: 'horizontal_pull', muscles: ['upper back', 'lats', 'biceps'], needs: [['suspension_trainer']], loads: [], level: 1, compound: true,
    cues: ['Lean back, body straight.', 'Pull the chest to the hands.', 'Walk feet forward to make it harder.'] },
  { id: 'barbell_row', name: 'Barbell bent-over row', pattern: 'horizontal_pull', muscles: ['upper back', 'lats'], needs: [['barbell']], loads: ['lower_back'], level: 3, compound: true,
    cues: ['Hinge to about 45 degrees.', 'Pull the bar to the belly button.', 'Flat back throughout.'] },
  { id: 'band_row', name: 'Band row', pattern: 'horizontal_pull', muscles: ['upper back', 'lats'], needs: [['resistance_band']], loads: [], level: 1, compound: true,
    cues: ['Anchor the band at chest height.', 'Pull the elbows back.', 'Pause and squeeze.'] },

  // ---------- vertical pull ----------
  { id: 'pull_up', name: 'Pull-up', pattern: 'vertical_pull', muscles: ['lats', 'biceps'], needs: [PULL_BAR], loads: ['shoulder', 'elbow'], level: 3, compound: true,
    cues: ['Start from a dead hang.', 'Pull the chest toward the bar.', 'Use the assist machine or a band if needed.'] },
  { id: 'lat_pulldown', name: 'Lat pulldown', pattern: 'vertical_pull', muscles: ['lats', 'biceps'], needs: [['lat_pulldown']], loads: ['shoulder'], level: 1, compound: true,
    cues: ['Thighs locked under the pad.', 'Pull the bar to the upper chest.', 'Control it back up.'] },
  { id: 'cable_pulldown_kneeling', name: 'Kneeling single-arm cable pulldown', pattern: 'vertical_pull', muscles: ['lats'], needs: [['cable_stack']], loads: ['shoulder'], level: 1, compound: true, unilateral: true,
    cues: ['High pulley, kneel facing it.', 'Pull the elbow down to the ribs.', 'Reach tall on the way up.'] },
  { id: 'band_pulldown', name: 'Band pulldown', pattern: 'vertical_pull', muscles: ['lats'], needs: [['resistance_band']], loads: [], level: 1, compound: true,
    cues: ['Anchor the band high.', 'Pull elbows down to the sides.', 'Slow return.'] },
  { id: 'db_pullover', name: 'Dumbbell pullover', pattern: 'vertical_pull', muscles: ['lats', 'chest'], needs: [['dumbbells'], BENCH], loads: ['shoulder'], level: 2, compound: false,
    cues: ['Lie across or along the bench.', 'Lower the weight behind the head, arms soft.', 'Pull back over the chest using the lats.'] },
  { id: 'straight_arm_pulldown', name: 'Straight-arm cable pulldown', pattern: 'vertical_pull', muscles: ['lats'], needs: [['cable_stack', 'lat_pulldown']], loads: ['shoulder'], level: 1, compound: false,
    cues: ['High pulley, slight hinge.', 'Sweep the bar to the thighs, arms long.', 'Feel the lats, not the triceps.'] },

  // ---------- accessories ----------
  { id: 'db_fly', name: 'Dumbbell chest fly', pattern: 'chest_fly', muscles: ['chest'], needs: [['dumbbells'], BENCH], loads: ['shoulder'], level: 1, compound: false,
    cues: ['Slight bend in the elbows.', 'Open wide until a stretch, not pain.', 'Hug the weights back together.'] },
  { id: 'cable_fly', name: 'Cable chest fly', pattern: 'chest_fly', muscles: ['chest'], needs: [['cable_stack']], loads: ['shoulder'], level: 1, compound: false,
    cues: ['Pulleys at shoulder height.', 'Arms in a hugging arc.', 'Squeeze at the middle.'] },
  { id: 'pec_deck', name: 'Pec deck fly', pattern: 'chest_fly', muscles: ['chest'], needs: [['pec_deck']], loads: ['shoulder'], level: 1, compound: false,
    cues: ['Handles level with the chest.', 'Bring them together smoothly.', 'Control the stretch.'] },
  { id: 'db_lateral_raise', name: 'Dumbbell lateral raise', pattern: 'lateral_raise', muscles: ['side delts'], needs: [['dumbbells']], loads: ['shoulder'], level: 1, compound: false,
    cues: ['Lead with the elbows.', 'Raise to shoulder height.', 'Light weight, slow lower.'] },
  { id: 'cable_lateral_raise', name: 'Cable lateral raise', pattern: 'lateral_raise', muscles: ['side delts'], needs: [['cable_stack']], loads: ['shoulder'], level: 1, compound: false,
    cues: ['Low pulley, cable across the body.', 'Raise out to the side.', 'Keep tension at the bottom.'] },
  { id: 'band_lateral_raise', name: 'Band lateral raise', pattern: 'lateral_raise', muscles: ['side delts'], needs: [['resistance_band']], loads: ['shoulder'], level: 1, compound: false,
    cues: ['Stand on the band.', 'Raise to shoulder height.', 'Pause at the top.'] },
  { id: 'face_pull', name: 'Cable face pull', pattern: 'rear_delt', muscles: ['rear delts', 'upper back'], needs: [['cable_stack']], loads: [], level: 1, compound: false,
    cues: ['Rope at face height.', 'Pull to the forehead, elbows high.', 'Rotate the hands back at the end.'] },
  { id: 'db_rear_delt_fly', name: 'Bent-over dumbbell rear delt fly', pattern: 'rear_delt', muscles: ['rear delts'], needs: [['dumbbells']], loads: ['lower_back'], level: 1, compound: false,
    cues: ['Hinge forward, flat back.', 'Open the arms wide.', 'Light weight, no swinging.'] },
  { id: 'reverse_pec_deck', name: 'Reverse pec deck', pattern: 'rear_delt', muscles: ['rear delts'], needs: [['pec_deck']], loads: [], level: 1, compound: false,
    cues: ['Face the pad.', 'Sweep the handles back.', 'Squeeze the upper back.'] },
  { id: 'band_pull_apart', name: 'Band pull-apart', pattern: 'rear_delt', muscles: ['rear delts', 'upper back'], needs: [['resistance_band']], loads: [], level: 1, compound: false,
    cues: ['Arms straight at chest height.', 'Pull the band to the chest.', 'Slow return.'] },
  { id: 'db_curl', name: 'Dumbbell curl', pattern: 'biceps', muscles: ['biceps'], needs: [['dumbbells', 'kettlebell']], loads: ['elbow'], level: 1, compound: false,
    cues: ['Elbows pinned to the sides.', 'Curl without swinging.', 'Lower in 2 to 3 seconds.'] },
  { id: 'cable_curl', name: 'Cable curl', pattern: 'biceps', muscles: ['biceps'], needs: [['cable_stack']], loads: ['elbow'], level: 1, compound: false,
    cues: ['Low pulley, bar or handles.', 'Elbows stay still.', 'Squeeze at the top.'] },
  { id: 'ez_curl', name: 'EZ bar curl', pattern: 'biceps', muscles: ['biceps'], needs: [['ez_bar', 'barbell']], loads: ['elbow', 'wrist'], level: 1, compound: false,
    cues: ['Grip the angled part of the bar.', 'Curl up, elbows still.', 'Control the lower.'] },
  { id: 'band_curl', name: 'Band curl', pattern: 'biceps', muscles: ['biceps'], needs: [['resistance_band']], loads: ['elbow'], level: 1, compound: false,
    cues: ['Stand on the band.', 'Curl to the shoulders.', 'Slow return.'] },
  { id: 'cable_pushdown', name: 'Cable triceps pushdown', pattern: 'triceps', muscles: ['triceps'], needs: [['cable_stack', 'lat_pulldown']], loads: ['elbow'], level: 1, compound: false,
    cues: ['High pulley, elbows at the sides.', 'Push down until the arms are straight.', 'Only the forearms move.'] },
  { id: 'db_overhead_extension', name: 'Dumbbell overhead triceps extension', pattern: 'triceps', muscles: ['triceps'], needs: [['dumbbells', 'kettlebell']], loads: ['elbow', 'shoulder'], level: 1, compound: false,
    cues: ['Hold one weight overhead with both hands.', 'Lower behind the head.', 'Elbows point forward.'] },
  { id: 'bench_dip', name: 'Bench dip', pattern: 'triceps', muscles: ['triceps'], needs: [['flat_bench', 'adjustable_bench', 'step_box']], loads: ['shoulder', 'wrist'], level: 1, compound: false,
    cues: ['Hands on the bench edge behind you.', 'Lower until upper arms are level, no deeper.', 'Press back up.'] },
  { id: 'dip', name: 'Parallel bar dip', pattern: 'triceps', muscles: ['triceps', 'chest'], needs: [['dip_station', 'assisted_pullup']], loads: ['shoulder'], level: 3, compound: true,
    cues: ['Lean slightly forward.', 'Lower to about 90 degrees at the elbow.', 'Use the assist if needed.'] },
  { id: 'diamond_push_up', name: 'Close-grip push-up', pattern: 'triceps', muscles: ['triceps', 'chest'], needs: [], loads: ['wrist', 'elbow'], level: 2, compound: true,
    cues: ['Hands under the shoulders.', 'Elbows brush the ribs.', 'Hands on a bench to make it easier.'] },
  { id: 'leg_extension', name: 'Leg extension', pattern: 'quad_iso', muscles: ['quads'], needs: [['leg_extension']], loads: ['knee'], level: 1, compound: false,
    cues: ['Knee lined up with the machine pivot.', 'Lift until the legs are straight.', 'Lower slowly.'] },
  { id: 'wall_sit', name: 'Wall sit', pattern: 'quad_iso', muscles: ['quads'], needs: [], loads: ['knee'], level: 1, compound: false,
    cues: ['Back flat on the wall.', 'Thighs near parallel.', 'Breathe, hold for time.'] },
  { id: 'leg_curl', name: 'Leg curl', pattern: 'ham_iso', muscles: ['hamstrings'], needs: [['leg_curl']], loads: ['knee'], level: 1, compound: false,
    cues: ['Pad just above the heels.', 'Curl fully, hips stay down.', 'Slow on the way back.'] },
  { id: 'trx_hamstring_curl', name: 'Suspension hamstring curl', pattern: 'ham_iso', muscles: ['hamstrings', 'glutes'], needs: [['suspension_trainer']], loads: ['knee'], level: 2, compound: false,
    cues: ['Heels in the straps, hips up.', 'Curl the heels to the hips.', 'Hips stay high.'] },
  { id: 'cable_kickback', name: 'Cable glute kickback', pattern: 'glutes', muscles: ['glutes'], needs: [['cable_stack']], loads: [], level: 1, compound: false, unilateral: true,
    cues: ['Ankle strap, low pulley.', 'Kick back and slightly out.', 'No arching the lower back.'] },
  { id: 'single_leg_bridge', name: 'Single-leg glute bridge', pattern: 'glutes', muscles: ['glutes'], needs: [], loads: [], level: 1, compound: false, unilateral: true,
    cues: ['One foot planted, other leg up.', 'Drive the hips up.', 'Keep the pelvis level.'] },
  { id: 'calf_raise', name: 'Standing calf raise', pattern: 'calves', muscles: ['calves'], needs: [], loads: [], level: 1, compound: false,
    cues: ['Balls of the feet on a step if you have one.', 'Rise high, pause.', 'Lower all the way down.'] },
  { id: 'leg_press_calf_raise', name: 'Leg press calf raise', pattern: 'calves', muscles: ['calves'], needs: [['leg_press']], loads: [], level: 1, compound: false,
    cues: ['Balls of the feet on the platform edge.', 'Push through the toes.', 'Keep the safety catches on.'] },

  // ---------- core ----------
  { id: 'plank', name: 'Plank', pattern: 'core_brace', muscles: ['abs'], needs: [], loads: ['shoulder'], level: 1, compound: false,
    cues: ['Forearms under the shoulders.', 'Squeeze glutes, ribs down.', 'Hold for time.'] },
  { id: 'dead_bug', name: 'Dead bug', pattern: 'core_brace', muscles: ['abs'], needs: [], loads: [], level: 1, compound: false,
    cues: ['Lower back pressed into the floor.', 'Extend opposite arm and leg slowly.', 'Exhale as you reach.'] },
  { id: 'side_plank', name: 'Side plank', pattern: 'core_brace', muscles: ['obliques'], needs: [], loads: ['shoulder'], level: 1, compound: false,
    cues: ['Elbow under the shoulder.', 'Hips high, body straight.', 'Bend the knees to make it easier.'] },
  { id: 'hanging_knee_raise', name: 'Hanging knee raise', pattern: 'core_brace', muscles: ['abs', 'hip flexors'], needs: [['pull_up_bar', 'dip_station']], loads: ['shoulder'], level: 2, compound: false,
    cues: ['Hang or use the captain\'s chair.', 'Curl the knees up to the chest.', 'No swinging.'] },
  { id: 'pallof_press', name: 'Cable Pallof press', pattern: 'core_rotation', muscles: ['obliques', 'abs'], needs: [['cable_stack', 'resistance_band']], loads: [], level: 1, compound: false,
    cues: ['Stand side-on to the anchor.', 'Press straight out, resist the twist.', 'Hold two seconds.'] },
  { id: 'cable_woodchop', name: 'Cable woodchop', pattern: 'core_rotation', muscles: ['obliques'], needs: [['cable_stack']], loads: ['lower_back'], level: 2, compound: false,
    cues: ['High pulley, rotate through the torso.', 'Arms stay long.', 'Pivot the back foot.'] },
  { id: 'russian_twist', name: 'Weighted Russian twist', pattern: 'core_rotation', muscles: ['obliques'], needs: [['dumbbells', 'kettlebell', 'medicine_ball']], loads: ['lower_back'], level: 2, compound: false,
    cues: ['Lean back with a straight spine.', 'Rotate the chest side to side.', 'Feet down to make it easier.'] },
  { id: 'suitcase_carry', name: 'Suitcase carry', pattern: 'core_rotation', muscles: ['obliques', 'grip'], needs: [['dumbbells', 'kettlebell']], loads: [], level: 1, compound: true, unilateral: true,
    cues: ['Heavy weight in one hand.', 'Walk tall without leaning.', 'Switch hands each length.'] },

  // ---------- conditioning ----------
  { id: 'treadmill_intervals', name: 'Treadmill intervals', pattern: 'conditioning', muscles: ['heart', 'legs'], needs: [['treadmill']], loads: ['knee'], level: 1, compound: true,
    cues: ['Alternate 1 min hard, 1 min easy.', 'Use incline walking if running hurts.', 'Hard means a 7 out of 10 effort.'] },
  { id: 'bike_intervals', name: 'Bike intervals', pattern: 'conditioning', muscles: ['heart', 'legs'], needs: [['bike']], loads: [], level: 1, compound: true,
    cues: ['30 s hard, 90 s easy.', 'Seat at hip height.', 'Build effort over the first rounds.'] },
  { id: 'row_intervals', name: 'Rower intervals', pattern: 'conditioning', muscles: ['heart', 'back', 'legs'], needs: [['rower']], loads: ['lower_back'], level: 1, compound: true,
    cues: ['Legs, then body, then arms.', '250 m hard, 1 min easy.', 'Damper around 4 to 6.'] },
  { id: 'elliptical_intervals', name: 'Cross-trainer intervals', pattern: 'conditioning', muscles: ['heart', 'legs'], needs: [['elliptical', 'stair_climber']], loads: [], level: 1, compound: true,
    cues: ['1 min hard, 1 min easy.', 'Stand tall.', 'Use the handles lightly.'] },
  { id: 'shadow_boxing', name: 'Shadow boxing intervals', pattern: 'conditioning', muscles: ['heart', 'shoulders', 'core'], needs: [], loads: [], level: 1, compound: true,
    cues: ['Light on the feet, hands up.', '40 s fast punches, 20 s easy.', 'Knee-friendly and quiet for hotel rooms.'] },
  { id: 'bw_circuit', name: 'Bodyweight finisher', pattern: 'conditioning', muscles: ['heart', 'full body'], needs: [], loads: ['knee'], level: 1, compound: true,
    cues: ['Squats, push-ups, mountain climbers, 30 s each.', 'Rest 30 s between rounds.', 'Quiet low-impact version for hotel rooms.'] },
];

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise {
  const ex = EXERCISE_BY_ID[id];
  if (!ex) throw new Error(`Unknown exercise: ${id}`);
  return ex;
}

/** Real-person demo videos. A search link stays valid when single videos are removed. */
export function demoVideoUrl(ex: Exercise): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(`${ex.name} proper form`)}`;
}
