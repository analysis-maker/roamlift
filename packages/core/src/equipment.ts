/**
 * Canonical equipment catalogue. Every scan, manual pick and shared gym kit list
 * is stored as these ids, so plans and swaps never depend on free-text names.
 */
export const EQUIPMENT = {
  bodyweight: { label: 'Bodyweight / floor space', group: 'free', aliases: ['floor', 'mat', 'yoga mat', 'open space'] },
  dumbbells: { label: 'Dumbbells', group: 'free', aliases: ['dumbbell', 'dumbbell rack', 'hex dumbbells', 'adjustable dumbbells'] },
  kettlebell: { label: 'Kettlebells', group: 'free', aliases: ['kettlebell', 'kettle bell'] },
  barbell: { label: 'Barbell and plates', group: 'free', aliases: ['olympic bar', 'barbell', 'weight plates', 'plates'] },
  ez_bar: { label: 'EZ curl bar', group: 'free', aliases: ['ez bar', 'curl bar', 'fixed barbell'] },
  flat_bench: { label: 'Flat bench', group: 'bench', aliases: ['bench', 'weight bench'] },
  adjustable_bench: { label: 'Adjustable bench', group: 'bench', aliases: ['incline bench', 'adjustable bench', 'fid bench'] },
  squat_rack: { label: 'Squat rack / power rack', group: 'rack', aliases: ['power rack', 'squat rack', 'half rack', 'squat stand'] },
  smith_machine: { label: 'Smith machine', group: 'rack', aliases: ['smith', 'smith machine'] },
  pull_up_bar: { label: 'Pull-up bar', group: 'bodyweight', aliases: ['chin up bar', 'pull up bar', 'chin-up bar'] },
  dip_station: { label: 'Dip station', group: 'bodyweight', aliases: ['dip bars', 'parallel bars', 'captains chair', 'vkr'] },
  cable_stack: { label: 'Cable machine (single or dual)', group: 'machine', aliases: ['cable', 'functional trainer', 'cable crossover', 'dual pulley', 'cable tower'] },
  lat_pulldown: { label: 'Lat pulldown', group: 'machine', aliases: ['pulldown', 'lat pull down'] },
  seated_row: { label: 'Seated row machine', group: 'machine', aliases: ['seated cable row', 'row machine (strength)', 'low row'] },
  chest_press_machine: { label: 'Chest press machine', group: 'machine', aliases: ['chest press', 'seated chest press'] },
  shoulder_press_machine: { label: 'Shoulder press machine', group: 'machine', aliases: ['shoulder press', 'overhead press machine'] },
  pec_deck: { label: 'Pec deck / rear delt fly', group: 'machine', aliases: ['pec fly', 'butterfly machine', 'rear delt machine'] },
  leg_press: { label: 'Leg press', group: 'machine', aliases: ['leg press', 'sled'] },
  hack_squat: { label: 'Hack squat', group: 'machine', aliases: ['hack squat'] },
  leg_extension: { label: 'Leg extension', group: 'machine', aliases: ['leg extension', 'quad extension'] },
  leg_curl: { label: 'Leg curl', group: 'machine', aliases: ['hamstring curl', 'lying leg curl', 'seated leg curl'] },
  hip_thrust_machine: { label: 'Hip thrust / glute machine', group: 'machine', aliases: ['glute drive', 'hip thrust machine', 'glute kickback machine'] },
  assisted_pullup: { label: 'Assisted pull-up / dip machine', group: 'machine', aliases: ['assisted chin dip', 'gravitron'] },
  multi_gym: { label: 'Multi-gym (all-in-one)', group: 'machine', aliases: ['home gym', 'multi station', 'all in one gym'] },
  resistance_band: { label: 'Resistance bands', group: 'free', aliases: ['bands', 'loop band', 'tube band'] },
  suspension_trainer: { label: 'Suspension trainer (TRX)', group: 'free', aliases: ['trx', 'suspension straps', 'rings'] },
  medicine_ball: { label: 'Medicine ball / slam ball', group: 'free', aliases: ['med ball', 'slam ball', 'wall ball'] },
  step_box: { label: 'Step / plyo box', group: 'free', aliases: ['plyo box', 'step', 'box'] },
  treadmill: { label: 'Treadmill', group: 'cardio', aliases: ['treadmill', 'running machine'] },
  bike: { label: 'Exercise bike', group: 'cardio', aliases: ['stationary bike', 'spin bike', 'assault bike', 'air bike', 'recumbent bike'] },
  rower: { label: 'Rowing machine', group: 'cardio', aliases: ['rower', 'concept2', 'erg'] },
  elliptical: { label: 'Elliptical / cross trainer', group: 'cardio', aliases: ['cross trainer', 'elliptical'] },
  stair_climber: { label: 'Stair climber', group: 'cardio', aliases: ['stairmaster', 'step mill', 'stepper'] },
} as const satisfies Record<string, { label: string; group: string; aliases: readonly string[] }>;

export type EquipmentId = keyof typeof EQUIPMENT;
export type EquipmentGroup = (typeof EQUIPMENT)[EquipmentId]['group'];

export const EQUIPMENT_IDS = Object.keys(EQUIPMENT) as EquipmentId[];

export function isEquipmentId(value: unknown): value is EquipmentId {
  return typeof value === 'string' && value in EQUIPMENT;
}

/** Bodyweight is always available, wherever you are. */
export function withBodyweight(kit: Iterable<EquipmentId>): Set<EquipmentId> {
  const set = new Set(kit);
  set.add('bodyweight');
  return set;
}

/** Short list sent to the vision model so it answers in our ids. */
export function equipmentCatalogForPrompt(): { id: EquipmentId; label: string; aliases: readonly string[] }[] {
  return EQUIPMENT_IDS.map((id) => ({ id, label: EQUIPMENT[id].label, aliases: EQUIPMENT[id].aliases }));
}
