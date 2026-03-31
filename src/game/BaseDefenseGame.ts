import * as THREE from 'three'

export type BuildingId =
  | 'command_center'
  | 'supply_depot_s'
  | 'supply_depot_l'
  | 'repair_bay'
  | 'support_node'
  | 'reconstruction_yard'
  | 'factory_business'
  | 'factory_factory'
  | 'factory_megacomplex'
  | 'refinery'
  | 'mega_refinery'
  | 'chemical_installation'
  | 'generator_small'
  | 'generator_large'
  | 'battery_small'
  | 'battery_large'
  | 'pylon'
  | 'nuclear_plant'
  | 'auto_turret'
  | 'auto_turret_large'
  | 'siege_cannon'
  | 'heavy_siege_gun'
  | 'aa_gun'
  | 'railgun'
  | 'missile_launcher_s'
  | 'missile_launcher_m'
  | 'portable_silo'
  | 'missile_silo'
  | 'nuclear_silo'
  | 'hydra_launcher'
  | 'shield_generator_m'
  | 'shield_generator_l'
  | 'tesla_tower'
  | 'plasma_laser_s'
  | 'plasma_laser_m'
  | 'plasma_laser_l'

export type BuildingCategory = 'structural' | 'economy' | 'electrical' | 'turrets' | 'missile' | 'energy'

type BuildingDef = {
  id: BuildingId
  label: string
  category: BuildingCategory
  color: number
  size: { w: number; h: number } // cells (x,z)
  maxHp: number

  // Cost / capacity
  creditCost: number
  supplyCost: number
  supplyCapAdd?: number

  powerCapAdd?: number
  powerGenPerSec?: number
  powerDrainPerSec?: number

  // Shield-specific tuning (for shield generator upgrades).
  shieldCapacityMul?: number
  shieldRechargeMul?: number

  // Economy
  creditPayout?: number
  creditIntervalSec?: number

  // Combat
  range?: number
  fireRate?: number
  damage?: number
  aoeRadius?: number
  burst?: number
  projectileSpeed?: number
  kind?: 'hitscan' | 'missiles' | 'ballistic' | 'shield' | 'railgun'
  auraDamagePerSec?: number

  wheelDetails: () => [string, string]
}

type HealthBar = { group: THREE.Group; fill: THREE.Mesh; bg: THREE.Mesh }

type PlacedBuilding = {
  id: string
  defId: BuildingId
  def: BuildingDef
  origin: { x: number; z: number } // top-left in cells
  builtInInactivePhase: number
  hp: number
  mesh: THREE.Object3D
  healthBar: HealthBar
  refundSprite?: THREE.Sprite
  cooldown: number
  plasmaTargetId?: string
  charge: number
  econTimer: number
}

type WeaponAim = {
  yaw?: THREE.Object3D
  pitch?: THREE.Object3D
  muzzle?: THREE.Object3D
}

type AsteroidVariant = 'normal' | 'splitter' | 'explosive' | 'meteor' | 'seeker' | 'planet' | 'gold' | 'spawner' | 'emp' | 'colossus'

type Asteroid = {
  id: string
  mesh: THREE.Mesh
  healthBar: HealthBar
  hp: number
  maxHp: number
  alive: boolean
  variant: AsteroidVariant
  splitLevel: number // 0..2 only relevant for variant==='splitter'
  speed: number // magnitude of velocity (for seeker steering)
  spawnCooldown: number // used by spawner asteroid
  target: THREE.Vector3
  velocity: THREE.Vector3
  impactRadius: number
  impactDamage: number
}

type Missile = {
  mesh: THREE.Mesh
  target: Asteroid | null
  targetId: string | null
  mode: 'death_location' | 'retarget'
  noSplash: boolean
  volleyId: string | null
  lastKnownTargetPos: THREE.Vector3
  launchUpTime: number
  launchUpSpeed: number
  speed: number
  ttl: number
  damage: number
  aoeRadius: number
}

type PendingMissileBurst = {
  origin: THREE.Vector3
  target: Asteroid | null
  def: BuildingDef
  remaining: number
  interval: number
  timer: number
  mode: 'death_location' | 'retarget'
  noSplash: boolean
  volleyId: string | null
}

type ShieldField = {
  generatorId: string
  hp: number
  maxHp: number
  radius: number
  bubble: THREE.Mesh
  disabled: boolean
}

type Ballistic = {
  mesh: THREE.Mesh
  start: THREE.Vector3
  end: THREE.Vector3
  t: number
  duration: number
  damage: number
  aoeRadius: number
}

type RepairDrone = {
  mesh: THREE.Mesh
  bayId: string
  targetId: string
  state: 'to_target' | 'healing' | 'returning'
}

export type UpgradeId =
  | 'core_protocol'
  | 'unlock_factory'
  | 'unlock_megacomplex'
  | 'turret_targeting'
  | 'generator_efficiency'
  | 'unlock_turret_t2'
  | 'unlock_railgun'
  | 'turret_range_1'
  | 'turret_range_2'
  | 'turret_damage_1'
  | 'turret_damage_2'
  | 'unlock_missile_silos'
  | 'unlock_nuclear_silo'
  | 'unlock_hydra_launcher'
  | 'missile_payload_1'
  | 'missile_payload_2'
  | 'unlock_shields'
  | 'unlock_shield_large'
  | 'shield_capacity_1'
  | 'shield_capacity_2'
  | 'shield_recharge_1'
  | 'plasma_focus_1'
  | 'plasma_focus_2'
  | 'tesla_coils_1'
  | 'logistics_1'
  | 'logistics_2'
  | 'command_autonomy_1'
  | 'structural_fortification_1'
  | 'structural_fortification_2'
  | 'structural_auto_repair'
  | 'battery_capacity_1'
  | 'battery_capacity_2'
  | 'power_distribution_1'
  | 'power_distribution_2'
  | 'nuclear_overclock_1'
  | 'economy_optimization_1'
  | 'economy_optimization_2'
  | 'unlock_refinery'
  | 'unlock_mega_refinery'
  | 'unlock_repair_infra'
  | 'unlock_reconstruction_yard'
  | 'unlock_grid_expansion'
  | 'unlock_pylon'
  | 'unlock_nuclear_plant'
  | 'command_center_mk2'
  | 'supply_depot_s_mk2'
  | 'supply_depot_l_mk2'
  | 'repair_bay_mk2'
  | 'support_node_mk2'
  | 'reconstruction_yard_mk2'
  | 'factory_business_mk2'
  | 'factory_factory_mk2'
  | 'factory_megacomplex_mk2'
  | 'refinery_mk2'
  | 'mega_refinery_mk2'
  | 'chemical_installation_mk2'
  | 'generator_small_mk2'
  | 'generator_large_mk2'
  | 'battery_small_mk2'
  | 'battery_large_mk2'
  | 'pylon_mk2'
  | 'nuclear_plant_mk2'
  | 'auto_turret_mk2'
  | 'auto_turret_large_mk2'
  | 'siege_cannon_mk2'
  | 'heavy_siege_gun_mk2'
  | 'aa_gun_mk2'
  | 'railgun_mk2'
  | 'missile_launcher_s_mk2'
  | 'missile_launcher_m_mk2'
  | 'portable_silo_mk2'
  | 'missile_silo_mk2'
  | 'nuclear_silo_mk2'
  | 'hydra_launcher_mk2'
  | 'shield_generator_m_mk2'
  | 'shield_generator_l_mk2'
  | 'tesla_tower_mk2'
  | 'plasma_laser_s_mk2'
  | 'plasma_laser_m_mk2'
  | 'plasma_laser_l_mk2'

type BuildingModifier = {
  rangeAdd?: number
  damageAdd?: number
  fireRateMul?: number
  creditPayoutMul?: number
  powerGenMul?: number

  powerDrainMul?: number
  aoeRadiusMul?: number

  shieldCapacityMul?: number
  shieldRechargeMul?: number

  supplyCapAddMul?: number
  powerCapAddMul?: number
}

export type UpgradeDef = {
  id: UpgradeId
  label: string
  category: BuildingCategory
  creditCost: number
  description: string
  prereqIds?: UpgradeId[]
  unlockBuildingIds?: BuildingId[]
  modifiers?: Partial<Record<BuildingId, BuildingModifier>>
}

const BOARD_SIZE = 101
const HALF = Math.floor(BOARD_SIZE / 2) // 50

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const key = (x: number, z: number) => `${x}:${z}`

// Balance variables: edit these to globally tune pacing.
const VARS = {
  C: 1, // credit costs scale
  P: 1, // power rates scale
  S: 1, // supply scale
  E: 1, // economy outputs scale
}

// Global multiplier to tighten power budgeting.
// Increase if power feels "too generous" during active waves.
const POWER_DRAIN_GLOBAL_MUL = 1.5
const ALL_ASTEROID_VARIANTS: AsteroidVariant[] = [
  'normal',
  'splitter',
  'explosive',
  'meteor',
  'seeker',
  'planet',
  'gold',
  'spawner',
  'emp',
  'colossus',
]

export const BUILDINGS: BuildingDef[] = [
  {
    id: 'command_center',
    label: 'Command Center',
    category: 'structural',
    color: 0x60a5fa,
    size: { w: 5, h: 5 },
    maxHp: 1000,
    creditCost: Math.round(1000 * VARS.C),
    supplyCost: 0,
    supplyCapAdd: Math.round(20 * VARS.S),
    creditPayout: Math.round(18 * VARS.E),
    creditIntervalSec: 1,
    powerGenPerSec: 1.6 * VARS.P,
    wheelDetails: () => ['Cost: 1000c', '+20 Supply, +1.6P/s, +18c/s'],
  },
  {
    id: 'supply_depot_s',
    label: 'Supply Depo (S)',
    category: 'structural',
    color: 0x60a5fa,
    size: { w: 2, h: 2 },
    maxHp: 300,
    creditCost: Math.round(200 * VARS.C),
    supplyCost: 0,
    supplyCapAdd: Math.round(18 * VARS.S),
    wheelDetails: () => ['Cost: 200c', '+18 Supply'],
  },
  {
    id: 'supply_depot_l',
    label: 'Supply Depo (L)',
    category: 'structural',
    color: 0x60a5fa,
    size: { w: 3, h: 3 },
    maxHp: 500,
    creditCost: Math.round(300 * VARS.C),
    supplyCost: 0,
    supplyCapAdd: Math.round(30 * VARS.S),
    wheelDetails: () => ['Cost: 300c', '+30 Supply'],
  },
  {
    id: 'repair_bay',
    label: 'Repair Bay',
    category: 'structural',
    color: 0x60a5fa,
    size: { w: 3, h: 3 },
    maxHp: 800,
    creditCost: Math.round(550 * VARS.C),
    supplyCost: 0,
    powerDrainPerSec: 0,
    fireRate: 0.2,
    damage: 30,
    projectileSpeed: 9,
    wheelDetails: () => ['Launch drones every 5s (max 5 active)', 'Fast targeted healing'],
  },
  {
    id: 'support_node',
    label: 'Support Node',
    category: 'structural',
    color: 0x60a5fa,
    size: { w: 1, h: 1 },
    maxHp: 200,
    creditCost: Math.round(200 * VARS.C),
    supplyCost: 0,
    range: 8,
    fireRate: 0.2, // pulse every 5s
    wheelDetails: () => ['Pulse: 8 range / 2.5s', 'Heals 25 HP each, costs 10P'],
  },
  {
    id: 'reconstruction_yard',
    label: 'Reconstruction Yard',
    category: 'structural',
    color: 0x60a5fa,
    size: { w: 3, h: 3 },
    maxHp: 900,
    creditCost: Math.round(700 * VARS.C),
    supplyCost: 0,
    range: 10,
    wheelDetails: () => ['Auto rebuilds within 10 range', 'Rebuild cost: 50%'],
  },
  {
    id: 'factory_business',
    label: 'Business',
    category: 'economy',
    color: 0x22c55e,
    size: { w: 2, h: 2 },
    maxHp: 650,
    creditCost: 160,
    supplyCost: 4,
    creditPayout: Math.round(8 * VARS.E),
    creditIntervalSec: 1,
    // Business must spend real power to keep credit flow going.
    powerDrainPerSec: 0.6 * VARS.P,
    wheelDetails: () => ['Basic economy', 'Power-dependent credits'],
  },
  {
    id: 'factory_factory',
    label: 'Factory',
    category: 'economy',
    color: 0x22c55e,
    size: { w: 3, h: 3 },
    maxHp: 1250,
    creditCost: 480,
    supplyCost: 10,
    creditPayout: Math.round(45 * VARS.E),
    creditIntervalSec: 3,
    powerDrainPerSec: 0.9 * VARS.P,
    wheelDetails: () => ['Larger economy core', 'Better output, low power'],
  },
  {
    id: 'factory_megacomplex',
    label: 'Mega Factory',
    category: 'economy',
    color: 0x22c55e,
    size: { w: 5, h: 5 },
    maxHp: 3600,
    creditCost: Math.round(1700 * VARS.C),
    supplyCost: 28,
    creditPayout: Math.round(240 * VARS.E),
    creditIntervalSec: 6,
    powerDrainPerSec: 2.4 * VARS.P,
    wheelDetails: () => ['Massive economy hub', 'More credits, heavier power drain'],
  },
  {
    id: 'refinery',
    label: 'Refinery',
    category: 'economy',
    color: 0x22c55e,
    size: { w: 2, h: 2 },
    maxHp: 560,
    creditCost: Math.round(260 * VARS.C),
    supplyCost: 4,
    creditPayout: Math.round(20 * VARS.E),
    creditIntervalSec: 1,
    powerDrainPerSec: 2.2 * VARS.P,
    wheelDetails: () => ['Fast cash pulses', 'Small footprint, high power'],
  },
  {
    id: 'mega_refinery',
    label: 'Mega Refinery',
    category: 'economy',
    color: 0x22c55e,
    size: { w: 3, h: 3 },
    maxHp: 1300,
    creditCost: Math.round(750 * VARS.C),
    supplyCost: 10,
    creditPayout: Math.round(70 * VARS.E),
    creditIntervalSec: 1,
    powerDrainPerSec: 5.4 * VARS.P,
    wheelDetails: () => ['High-throughput mega refinery', 'Bigger payout, higher upkeep'],
  },
  {
    id: 'chemical_installation',
    label: 'Chemical Installation',
    category: 'economy',
    color: 0x22c55e,
    size: { w: 3, h: 3 },
    maxHp: 900,
    creditCost: Math.round(1300 * VARS.C),
    supplyCost: 10,
    creditPayout: Math.round(150 * VARS.E),
    creditIntervalSec: 4,
    powerDrainPerSec: 1.1 * VARS.P,
    auraDamagePerSec: 3.2,
    wheelDetails: () => ['High-tech dome economy', 'Damages buildings within 12 range'],
  },
  {
    id: 'generator_small',
    label: 'Generator (S)',
    category: 'electrical',
    color: 0xeab308,
    size: { w: 2, h: 2 },
    maxHp: 500,
    creditCost: Math.round(150 * VARS.C),
    supplyCost: 3,
    powerGenPerSec: 5.5 * VARS.P,
    wheelDetails: () => ['Default small generator', '+Power over time'],
  },
  {
    id: 'generator_large',
    label: 'Generator (L)',
    category: 'electrical',
    color: 0xeab308,
    size: { w: 4, h: 4 },
    maxHp: 1100,
    creditCost: Math.round(520 * VARS.C),
    supplyCost: 10,
    powerGenPerSec: 16 * VARS.P,
    wheelDetails: () => ['Default large generator', '+High power over time'],
  },
  {
    id: 'battery_small',
    label: 'Battery (S)',
    category: 'electrical',
    color: 0xeab308,
    size: { w: 2, h: 2 },
    maxHp: 420,
    creditCost: Math.round(180 * VARS.C),
    supplyCost: 0,
    powerCapAdd: Math.round(55 * VARS.P),
    wheelDetails: () => ['Horizontal rooftop cells', '+Max Power'],
  },
  {
    id: 'battery_large',
    label: 'Battery (L)',
    category: 'electrical',
    color: 0xeab308,
    size: { w: 3, h: 3 },
    maxHp: 700,
    creditCost: Math.round(340 * VARS.C),
    supplyCost: 0,
    powerCapAdd: Math.round(110 * VARS.P),
    wheelDetails: () => ['Large battery bank', 'Bigger max power increase'],
  },
  {
    id: 'pylon',
    label: 'Pylon',
    category: 'electrical',
    color: 0xeab308,
    size: { w: 1, h: 1 },
    maxHp: 180,
    creditCost: Math.round(120 * VARS.C),
    supplyCost: 0,
    powerGenPerSec: 0,
    wheelDetails: () => ['Generates with nearby pylons', 'Destroyed pylon shocks nearby pylons'],
  },
  {
    id: 'nuclear_plant',
    label: 'Nuclear Plant',
    category: 'electrical',
    color: 0xeab308,
    size: { w: 4, h: 4 },
    maxHp: 1400,
    creditCost: Math.round(1200 * VARS.C),
    supplyCost: 0,
    powerGenPerSec: 34 * VARS.P,
    creditPayout: -Math.round(20 * VARS.E),
    creditIntervalSec: 1,
    wheelDetails: () => ['Highest power output', 'Drains credits continuously'],
  },
  {
    id: 'auto_turret',
    label: 'Auto-Turret',
    category: 'turrets',
    color: 0xf97316,
    size: { w: 1, h: 1 },
    maxHp: 260,
    creditCost: Math.round(90 * VARS.C),
    supplyCost: 2,
    powerDrainPerSec: 1.6 * VARS.P,
    kind: 'hitscan',
    range: 15,
    fireRate: 8.5,
    damage: 11,
    wheelDetails: () => ['Fast, normal-damage turret', 'High power draw'],
  },
  {
    id: 'auto_turret_large',
    label: 'Auto-Turret (L)',
    category: 'turrets',
    color: 0xf97316,
    size: { w: 2, h: 2 },
    maxHp: 680,
    creditCost: Math.round(320 * VARS.C),
    supplyCost: 5,
    powerDrainPerSec: 2.6 * VARS.P,
    kind: 'hitscan',
    range: 18,
    fireRate: 9.2,
    damage: 16,
    wheelDetails: () => ['Large rapid-fire turret', 'Higher power, higher DPS'],
  },
  {
    id: 'siege_cannon',
    label: 'Siege Cannon',
    category: 'turrets',
    color: 0xf97316,
    size: { w: 2, h: 2 },
    maxHp: 520,
    creditCost: Math.round(260 * VARS.C),
    supplyCost: 6,
    powerDrainPerSec: 0.9 * VARS.P,
    kind: 'hitscan',
    range: 40,
    fireRate: 0.28,
    damage: 260,
    wheelDetails: () => ['Long-range slow artillery', 'High single-target damage'],
  },
  {
    id: 'heavy_siege_gun',
    label: 'Heavy Siege Gun',
    category: 'turrets',
    color: 0xf97316,
    size: { w: 3, h: 3 },
    maxHp: 980,
    creditCost: Math.round(620 * VARS.C),
    supplyCost: 10,
    powerDrainPerSec: 1.4 * VARS.P,
    kind: 'hitscan',
    range: 44,
    fireRate: 0.2,
    damage: 420,
    wheelDetails: () => ['Heavier siege platform', 'Very high single-shot damage'],
  },
  {
    id: 'aa_gun',
    label: 'AA Gun',
    category: 'turrets',
    color: 0xf97316,
    size: { w: 2, h: 2 },
    maxHp: 620,
    creditCost: Math.round(630 * VARS.C),
    supplyCost: 7,
    powerDrainPerSec: 1.1 * VARS.P,
    kind: 'hitscan',
    range: 65,
    fireRate: 1.05,
    damage: 68,
    aoeRadius: 2.4,
    wheelDetails: () => ['4-barrel explosive AA fire', 'Very long range'],
  },
  {
    id: 'railgun',
    label: 'Railgun',
    category: 'turrets',
    color: 0xf97316,
    size: { w: 3, h: 3 },
    maxHp: 900,
    creditCost: Math.round(900 * VARS.C),
    supplyCost: 12,
    powerDrainPerSec: 0,
    kind: 'railgun',
    range: 70,
    fireRate: 0.25,
    damage: 700,
    wheelDetails: () => ['Charges from power and pierces', 'Fire speed scales with supplied power'],
  },
  {
    id: 'missile_launcher_s',
    label: 'Missile Launcher (S)',
    category: 'missile',
    color: 0xef4444,
    size: { w: 2, h: 2 },
    maxHp: 520,
    creditCost: Math.round(260 * VARS.C),
    supplyCost: 6,
    powerDrainPerSec: 0.7 * VARS.P,
    kind: 'missiles',
    range: 46,
    fireRate: 1.1,
    damage: 95,
    aoeRadius: 3.6,
    burst: 1,
    projectileSpeed: 46,
    wheelDetails: () => ['Average missile launcher', 'Tracks death location, good AOE'],
  },
  {
    id: 'missile_launcher_m',
    label: 'Missile Launcher (M)',
    category: 'missile',
    color: 0xef4444,
    size: { w: 3, h: 3 },
    maxHp: 780,
    creditCost: Math.round(520 * VARS.C),
    supplyCost: 10,
    powerDrainPerSec: 1.0 * VARS.P,
    kind: 'missiles',
    range: 52,
    fireRate: 1.0,
    damage: 130,
    aoeRadius: 4.2,
    burst: 1,
    projectileSpeed: 44,
    wheelDetails: () => ['Medium launcher stream', 'Higher per-shot impact'],
  },
  {
    id: 'portable_silo',
    label: 'Portable Silo',
    category: 'missile',
    color: 0xef4444,
    size: { w: 1, h: 1 },
    maxHp: 420,
    creditCost: Math.round(280 * VARS.C),
    supplyCost: 5,
    powerDrainPerSec: 0.8 * VARS.P,
    kind: 'missiles',
    range: 66,
    fireRate: 0.22,
    damage: 280,
    aoeRadius: 5.2,
    burst: 1,
    projectileSpeed: 48,
    wheelDetails: () => ['Small retargeting silo', 'Slow fire, bigger blasts'],
  },
  {
    id: 'missile_silo',
    label: 'Missile Silo',
    category: 'missile',
    color: 0xef4444,
    size: { w: 3, h: 3 },
    maxHp: 1100,
    creditCost: Math.round(700 * VARS.C),
    supplyCost: 12,
    powerDrainPerSec: 1.2 * VARS.P,
    kind: 'missiles',
    range: 76,
    fireRate: 0.14,
    damage: 520,
    aoeRadius: 7.8,
    burst: 1,
    projectileSpeed: 46,
    wheelDetails: () => ['Retargeting heavy silo', 'Large AOE, long reload'],
  },
  {
    id: 'nuclear_silo',
    label: 'Nuclear Silo',
    category: 'missile',
    color: 0xef4444,
    size: { w: 5, h: 5 },
    maxHp: 1900,
    creditCost: Math.round(1700 * VARS.C),
    supplyCost: 20,
    powerDrainPerSec: 1.8 * VARS.P,
    kind: 'missiles',
    range: 90,
    fireRate: 0.08,
    damage: 1250,
    aoeRadius: 12,
    burst: 1,
    projectileSpeed: 44,
    wheelDetails: () => ['Massive retargeting nuke', 'Huge AOE and damage'],
  },
  {
    id: 'hydra_launcher',
    label: 'Hydra Launcher',
    category: 'missile',
    color: 0xef4444,
    size: { w: 3, h: 3 },
    maxHp: 960,
    creditCost: Math.round(880 * VARS.C),
    supplyCost: 14,
    powerDrainPerSec: 1.1 * VARS.P,
    kind: 'missiles',
    range: 60,
    fireRate: 0.2,
    damage: 70,
    aoeRadius: 0,
    burst: 12,
    projectileSpeed: 68,
    wheelDetails: () => ['8-missile volley (0.1s)', 'Fast missiles, stacking volley damage'],
  },
  {
    id: 'shield_generator_m',
    label: 'Shield Generator (M)',
    category: 'energy',
    color: 0x22d3ee,
    size: { w: 3, h: 3 },
    maxHp: 1100,
    creditCost: Math.round(600 * VARS.C),
    supplyCost: 10,
    kind: 'shield',
    range: 12,
    powerDrainPerSec: 5.5 * VARS.P,
    shieldCapacityMul: 1,
    shieldRechargeMul: 1,
    wheelDetails: () => ['Medium shield dome', 'Constant power + recharge draw'],
  },
  {
    id: 'shield_generator_l',
    label: 'Shield Generator (L)',
    category: 'energy',
    color: 0x22d3ee,
    size: { w: 5, h: 5 },
    maxHp: 1900,
    creditCost: Math.round(1300 * VARS.C),
    supplyCost: 18,
    kind: 'shield',
    range: 24,
    powerDrainPerSec: 10.5 * VARS.P,
    shieldCapacityMul: 1,
    shieldRechargeMul: 1,
    wheelDetails: () => ['Large shield dome', 'Higher upkeep and shield capacity'],
  },
  {
    id: 'tesla_tower',
    label: 'Tesla Tower',
    category: 'energy',
    color: 0x22d3ee,
    size: { w: 2, h: 2 },
    maxHp: 760,
    creditCost: Math.round(520 * VARS.C),
    supplyCost: 9,
    powerDrainPerSec: 7.2 * VARS.P,
    kind: 'hitscan',
    range: 8,
    fireRate: 20,
    damage: 95,
    wheelDetails: () => ['Top-emitter chain zaps in range', 'Fastest DoT, constant power drain'],
  },
  {
    id: 'plasma_laser_s',
    label: 'Plasma Laser (S)',
    category: 'energy',
    color: 0x22d3ee,
    size: { w: 1, h: 1 },
    maxHp: 380,
    creditCost: Math.round(260 * VARS.C),
    supplyCost: 5,
    powerDrainPerSec: 5.4 * VARS.P,
    kind: 'hitscan',
    range: 38,
    fireRate: 14,
    damage: 85,
    wheelDetails: () => ['Small beam platform', 'Long-range damage-over-time beam'],
  },
  {
    id: 'plasma_laser_m',
    label: 'Plasma Laser (M)',
    category: 'energy',
    color: 0x22d3ee,
    size: { w: 2, h: 2 },
    maxHp: 760,
    creditCost: Math.round(620 * VARS.C),
    supplyCost: 10,
    powerDrainPerSec: 9.4 * VARS.P,
    kind: 'hitscan',
    range: 48,
    fireRate: 16,
    damage: 128,
    wheelDetails: () => ['Medium beam platform', 'Sustained long-range plasma pressure'],
  },
  {
    id: 'plasma_laser_l',
    label: 'Plasma Laser (L)',
    category: 'energy',
    color: 0x22d3ee,
    size: { w: 3, h: 3 },
    maxHp: 1200,
    creditCost: Math.round(1050 * VARS.C),
    supplyCost: 16,
    powerDrainPerSec: 14.5 * VARS.P,
    kind: 'hitscan',
    range: 58,
    fireRate: 18,
    damage: 182,
    wheelDetails: () => ['Large beam platform', 'Highest energy-beam throughput'],
  },
]

export const UPGRADES: UpgradeDef[] = [
  {
    id: 'core_protocol',
    label: 'Core Protocol',
    category: 'structural',
    creditCost: 0,
    description: 'Starting upgrade. Unlocks adjacent branches in the skill tree.',
  },
  {
    id: 'unlock_factory',
    label: 'Unlock Factory Tier',
    category: 'economy',
    creditCost: 550,
    description: 'Unlocks the Factory building.',
    unlockBuildingIds: ['factory_factory'],
  },
  {
    id: 'unlock_megacomplex',
    label: 'Unlock Mega-Complex',
    category: 'economy',
    creditCost: 1200,
    description: 'Unlocks the Mega-Complex building.',
    prereqIds: ['unlock_factory'],
    unlockBuildingIds: ['factory_megacomplex', 'chemical_installation'],
  },
  {
    id: 'turret_targeting',
    label: 'Turret Targeting Suite',
    category: 'turrets',
    creditCost: 700,
    description: 'Auto-Turret and Siege Cannon gain range and damage.',
    modifiers: {
      auto_turret: { rangeAdd: 5, damageAdd: 2 },
      auto_turret_large: { rangeAdd: 5, damageAdd: 3 },
      siege_cannon: { rangeAdd: 10, damageAdd: 30 },
      heavy_siege_gun: { rangeAdd: 10, damageAdd: 50 },
      aa_gun: { rangeAdd: 6, damageAdd: 8 },
      railgun: { rangeAdd: 8, damageAdd: 80 },
    },
  },
  {
    id: 'generator_efficiency',
    label: 'Generator Efficiency',
    category: 'electrical',
    creditCost: 480,
    description: 'Generators produce 25% more power.',
    modifiers: {
      generator_small: { powerGenMul: 1.25 },
      generator_large: { powerGenMul: 1.25 },
      pylon: { powerGenMul: 1.25 },
      nuclear_plant: { powerGenMul: 1.15 },
    },
  },
  {
    id: 'unlock_repair_infra',
    label: 'Unlock Repair Bay',
    category: 'structural',
    creditCost: 520,
    description: 'Unlocks the Repair Bay.',
    unlockBuildingIds: ['repair_bay'],
  },
  {
    id: 'unlock_reconstruction_yard',
    label: 'Unlock Reconstruction Yard',
    category: 'structural',
    creditCost: 780,
    description: 'Unlocks the Reconstruction Yard.',
    prereqIds: ['unlock_repair_infra'],
    unlockBuildingIds: ['reconstruction_yard'],
  },
  {
    id: 'unlock_grid_expansion',
    label: 'Unlock Grid Expansion',
    category: 'electrical',
    creditCost: 700,
    description: 'Unlocks the Large Generator and Large Battery.',
    prereqIds: ['generator_efficiency'],
    unlockBuildingIds: ['generator_large', 'battery_large'],
  },
  {
    id: 'unlock_pylon',
    label: 'Unlock Pylon Network',
    category: 'electrical',
    creditCost: 650,
    description: 'Unlocks Pylon structures.',
    prereqIds: ['generator_efficiency'],
    unlockBuildingIds: ['pylon'],
  },
  {
    id: 'unlock_nuclear_plant',
    label: 'Unlock Nuclear Plant',
    category: 'electrical',
    creditCost: 1100,
    description: 'Unlocks the Nuclear Plant.',
    prereqIds: ['unlock_grid_expansion'],
    unlockBuildingIds: ['nuclear_plant'],
  },
  {
    id: 'unlock_turret_t2',
    label: 'Unlock Heavy Turrets',
    category: 'turrets',
    creditCost: 650,
    description: 'Unlocks larger and specialized turret platforms.',
    unlockBuildingIds: ['auto_turret_large', 'heavy_siege_gun', 'aa_gun'],
  },
  {
    id: 'unlock_railgun',
    label: 'Unlock Railgun',
    category: 'turrets',
    creditCost: 950,
    description: 'Unlocks the Railgun defense platform.',
    prereqIds: ['unlock_turret_t2'],
    unlockBuildingIds: ['railgun'],
  },
  {
    id: 'turret_range_1',
    label: 'Turret Range I',
    category: 'turrets',
    creditCost: 500,
    description: 'All turrets gain a moderate range increase.',
    modifiers: {
      auto_turret: { rangeAdd: 2 },
      auto_turret_large: { rangeAdd: 2 },
      siege_cannon: { rangeAdd: 4 },
      heavy_siege_gun: { rangeAdd: 4 },
      aa_gun: { rangeAdd: 5 },
      railgun: { rangeAdd: 6 },
    },
  },
  {
    id: 'turret_range_2',
    label: 'Turret Range II',
    category: 'turrets',
    creditCost: 900,
    description: 'All turrets gain a large range increase.',
    prereqIds: ['turret_range_1'],
    modifiers: {
      auto_turret: { rangeAdd: 3 },
      auto_turret_large: { rangeAdd: 3 },
      siege_cannon: { rangeAdd: 6 },
      heavy_siege_gun: { rangeAdd: 6 },
      aa_gun: { rangeAdd: 7 },
      railgun: { rangeAdd: 8 },
    },
  },
  {
    id: 'turret_damage_1',
    label: 'Turret Damage I',
    category: 'turrets',
    creditCost: 550,
    description: 'All turrets gain a moderate damage increase.',
    modifiers: {
      auto_turret: { damageAdd: 2 },
      auto_turret_large: { damageAdd: 3 },
      siege_cannon: { damageAdd: 40 },
      heavy_siege_gun: { damageAdd: 60 },
      aa_gun: { damageAdd: 10 },
      railgun: { damageAdd: 120 },
    },
  },
  {
    id: 'turret_damage_2',
    label: 'Turret Damage II',
    category: 'turrets',
    creditCost: 980,
    description: 'All turrets gain a large damage increase.',
    prereqIds: ['turret_damage_1'],
    modifiers: {
      auto_turret: { damageAdd: 3 },
      auto_turret_large: { damageAdd: 4 },
      siege_cannon: { damageAdd: 70 },
      heavy_siege_gun: { damageAdd: 110 },
      aa_gun: { damageAdd: 14 },
      railgun: { damageAdd: 200 },
    },
  },
  {
    id: 'unlock_missile_silos',
    label: 'Unlock Silo Tech',
    category: 'missile',
    creditCost: 700,
    description: 'Unlocks retargeting silo platforms.',
    unlockBuildingIds: ['portable_silo', 'missile_silo', 'missile_launcher_m'],
  },
  {
    id: 'unlock_nuclear_silo',
    label: 'Unlock Nuclear Silo',
    category: 'missile',
    creditCost: 1600,
    description: 'Unlocks the Nuclear Silo platform.',
    prereqIds: ['unlock_missile_silos'],
    unlockBuildingIds: ['nuclear_silo'],
  },
  {
    id: 'unlock_hydra_launcher',
    label: 'Unlock Hydra Launcher',
    category: 'missile',
    creditCost: 1100,
    description: 'Unlocks the Hydra burst launcher.',
    prereqIds: ['unlock_missile_silos'],
    unlockBuildingIds: ['hydra_launcher'],
  },
  {
    id: 'missile_payload_1',
    label: 'Missile Payload I',
    category: 'missile',
    creditCost: 650,
    description: 'Improves explosive payload radius for non-Hydra missiles.',
    modifiers: {
      missile_launcher_s: { aoeRadiusMul: 1.15 },
      missile_launcher_m: { aoeRadiusMul: 1.15 },
      portable_silo: { aoeRadiusMul: 1.12 },
      missile_silo: { aoeRadiusMul: 1.12 },
      nuclear_silo: { aoeRadiusMul: 1.1 },
    },
  },
  {
    id: 'missile_payload_2',
    label: 'Missile Payload II',
    category: 'missile',
    creditCost: 1100,
    description: 'Further improves explosive payload radius and damage.',
    prereqIds: ['missile_payload_1'],
    modifiers: {
      missile_launcher_s: { aoeRadiusMul: 1.18, damageAdd: 15 },
      missile_launcher_m: { aoeRadiusMul: 1.18, damageAdd: 20 },
      portable_silo: { aoeRadiusMul: 1.15, damageAdd: 35 },
      missile_silo: { aoeRadiusMul: 1.15, damageAdd: 55 },
      nuclear_silo: { aoeRadiusMul: 1.12, damageAdd: 120 },
    },
  },
  {
    id: 'unlock_shields',
    label: 'Unlock Shield Generator',
    category: 'energy',
    creditCost: 900,
    description: 'Unlocks the Medium Shield Generator.',
    unlockBuildingIds: ['shield_generator_m'],
  },
  {
    id: 'unlock_shield_large',
    label: 'Unlock Large Shield',
    category: 'energy',
    creditCost: 1500,
    description: 'Unlocks the Large Shield Generator.',
    prereqIds: ['unlock_shields'],
    unlockBuildingIds: ['shield_generator_l'],
  },
  {
    id: 'shield_capacity_1',
    label: 'Shield Capacity I',
    category: 'energy',
    creditCost: 750,
    description: 'Increases shield field maximum health.',
    prereqIds: ['unlock_shields'],
    modifiers: {
      shield_generator_m: { shieldCapacityMul: 1.25 },
      shield_generator_l: { shieldCapacityMul: 1.2 },
    },
  },
  {
    id: 'shield_capacity_2',
    label: 'Shield Capacity II',
    category: 'energy',
    creditCost: 1200,
    description: 'Greatly increases shield field maximum health.',
    prereqIds: ['shield_capacity_1'],
    modifiers: {
      shield_generator_m: { shieldCapacityMul: 1.25 },
      shield_generator_l: { shieldCapacityMul: 1.25 },
    },
  },
  {
    id: 'shield_recharge_1',
    label: 'Shield Recharge I',
    category: 'energy',
    creditCost: 850,
    description: 'Increases shield recharge rate (still costs power to recharge).',
    prereqIds: ['unlock_shields'],
    modifiers: {
      shield_generator_m: { shieldRechargeMul: 1.35 },
      shield_generator_l: { shieldRechargeMul: 1.3 },
    },
  },
  {
    id: 'plasma_focus_1',
    label: 'Plasma Focus I',
    category: 'energy',
    creditCost: 650,
    description: 'Plasma lasers gain damage and range.',
    unlockBuildingIds: ['plasma_laser_s', 'plasma_laser_m'],
    modifiers: {
      plasma_laser_s: { damageAdd: 18, rangeAdd: 4 },
      plasma_laser_m: { damageAdd: 26, rangeAdd: 5 },
      plasma_laser_l: { damageAdd: 34, rangeAdd: 6 },
    },
  },
  {
    id: 'plasma_focus_2',
    label: 'Plasma Focus II',
    category: 'energy',
    creditCost: 1150,
    description: 'Plasma lasers gain more damage and become slightly more power efficient.',
    prereqIds: ['plasma_focus_1'],
    unlockBuildingIds: ['plasma_laser_l'],
    modifiers: {
      plasma_laser_s: { damageAdd: 22, rangeAdd: 4, powerDrainMul: 0.92 },
      plasma_laser_m: { damageAdd: 30, rangeAdd: 5, powerDrainMul: 0.92 },
      plasma_laser_l: { damageAdd: 40, rangeAdd: 6, powerDrainMul: 0.92 },
    },
  },
  {
    id: 'tesla_coils_1',
    label: 'Tesla Coils I',
    category: 'energy',
    creditCost: 700,
    description: 'Tesla tower zaps farther and hits harder.',
    unlockBuildingIds: ['tesla_tower'],
    modifiers: {
      tesla_tower: { rangeAdd: 2, damageAdd: 25 },
    },
  },
  {
    id: 'logistics_1',
    label: 'Logistics I',
    category: 'structural',
    creditCost: 450,
    description: 'Supply structures provide more maximum supply.',
    modifiers: {
      command_center: { supplyCapAddMul: 1.15 },
      supply_depot_s: { supplyCapAddMul: 1.15 },
      supply_depot_l: { supplyCapAddMul: 1.15 },
    },
  },
  {
    id: 'logistics_2',
    label: 'Logistics II',
    category: 'structural',
    creditCost: 850,
    description: 'Supply structures provide significantly more maximum supply.',
    prereqIds: ['logistics_1'],
    modifiers: {
      command_center: { supplyCapAddMul: 1.2 },
      supply_depot_s: { supplyCapAddMul: 1.2 },
      supply_depot_l: { supplyCapAddMul: 1.2 },
    },
  },
  {
    id: 'command_autonomy_1',
    label: 'Command Autonomy I',
    category: 'structural',
    creditCost: 700,
    description: 'Command Centers generate more credits and power.',
    modifiers: {
      command_center: { creditPayoutMul: 1.25, powerGenMul: 1.25 },
    },
  },
  {
    id: 'structural_fortification_1',
    label: 'Structural Fortification I',
    category: 'structural',
    creditCost: 550,
    description: 'All structural buildings gain health.',
    modifiers: {
      command_center: { damageAdd: 0 },
      supply_depot_s: { damageAdd: 0 },
      supply_depot_l: { damageAdd: 0 },
      repair_bay: { damageAdd: 0 },
      support_node: { damageAdd: 0 },
      reconstruction_yard: { damageAdd: 0 },
    },
  },
  {
    id: 'structural_fortification_2',
    label: 'Structural Fortification II',
    category: 'structural',
    creditCost: 950,
    description: 'Further improves structural durability.',
    prereqIds: ['structural_fortification_1'],
    modifiers: {
      command_center: { damageAdd: 0 },
      supply_depot_s: { damageAdd: 0 },
      supply_depot_l: { damageAdd: 0 },
      repair_bay: { damageAdd: 0 },
      support_node: { damageAdd: 0 },
      reconstruction_yard: { damageAdd: 0 },
    },
  },
  {
    id: 'structural_auto_repair',
    label: 'Structural Auto-Repair',
    category: 'structural',
    creditCost: 950,
    description: 'All buildings passively repair up to 50% max health over time.',
    prereqIds: ['structural_fortification_1'],
  },
  {
    id: 'battery_capacity_1',
    label: 'Battery Capacity I',
    category: 'electrical',
    creditCost: 500,
    description: 'Batteries increase max power storage more.',
    modifiers: {
      battery_small: { powerCapAddMul: 1.25 },
      battery_large: { powerCapAddMul: 1.25 },
    },
  },
  {
    id: 'battery_capacity_2',
    label: 'Battery Capacity II',
    category: 'electrical',
    creditCost: 900,
    description: 'Batteries greatly increase max power storage.',
    prereqIds: ['battery_capacity_1'],
    modifiers: {
      battery_small: { powerCapAddMul: 1.3 },
      battery_large: { powerCapAddMul: 1.3 },
    },
  },
  {
    id: 'power_distribution_1',
    label: 'Power Distribution I',
    category: 'electrical',
    creditCost: 600,
    description: 'Energy weapons and missiles consume less power.',
    modifiers: {
      shield_generator_m: { powerDrainMul: 0.92 },
      shield_generator_l: { powerDrainMul: 0.92 },
      tesla_tower: { powerDrainMul: 0.92 },
      plasma_laser_s: { powerDrainMul: 0.92 },
      plasma_laser_m: { powerDrainMul: 0.92 },
      plasma_laser_l: { powerDrainMul: 0.92 },
      missile_launcher_s: { powerDrainMul: 0.92 },
      missile_launcher_m: { powerDrainMul: 0.92 },
      portable_silo: { powerDrainMul: 0.92 },
      missile_silo: { powerDrainMul: 0.92 },
      nuclear_silo: { powerDrainMul: 0.92 },
      hydra_launcher: { powerDrainMul: 0.92 },
    },
  },
  {
    id: 'power_distribution_2',
    label: 'Power Distribution II',
    category: 'electrical',
    creditCost: 1100,
    description: 'Further reduces power usage for high-tech systems.',
    prereqIds: ['power_distribution_1'],
    modifiers: {
      shield_generator_m: { powerDrainMul: 0.9 },
      shield_generator_l: { powerDrainMul: 0.9 },
      tesla_tower: { powerDrainMul: 0.9 },
      plasma_laser_s: { powerDrainMul: 0.9 },
      plasma_laser_m: { powerDrainMul: 0.9 },
      plasma_laser_l: { powerDrainMul: 0.9 },
      missile_launcher_s: { powerDrainMul: 0.9 },
      missile_launcher_m: { powerDrainMul: 0.9 },
      portable_silo: { powerDrainMul: 0.9 },
      missile_silo: { powerDrainMul: 0.9 },
      nuclear_silo: { powerDrainMul: 0.9 },
      hydra_launcher: { powerDrainMul: 0.9 },
    },
  },
  {
    id: 'nuclear_overclock_1',
    label: 'Nuclear Overclock I',
    category: 'electrical',
    creditCost: 950,
    description: 'Nuclear plants generate more power (still require credits to run).',
    modifiers: {
      nuclear_plant: { powerGenMul: 1.25 },
    },
  },
  {
    id: 'economy_optimization_1',
    label: 'Economy Optimization I',
    category: 'economy',
    creditCost: 650,
    description: 'Economy buildings produce more credits.',
    modifiers: {
      factory_business: { creditPayoutMul: 1.15 },
      factory_factory: { creditPayoutMul: 1.15 },
      factory_megacomplex: { creditPayoutMul: 1.12 },
      refinery: { creditPayoutMul: 1.12 },
      mega_refinery: { creditPayoutMul: 1.12 },
      chemical_installation: { creditPayoutMul: 1.1 },
    },
  },
  {
    id: 'economy_optimization_2',
    label: 'Economy Optimization II',
    category: 'economy',
    creditCost: 1200,
    description: 'Further improves economy building output.',
    prereqIds: ['economy_optimization_1'],
    modifiers: {
      factory_business: { creditPayoutMul: 1.2 },
      factory_factory: { creditPayoutMul: 1.2 },
      factory_megacomplex: { creditPayoutMul: 1.18 },
      refinery: { creditPayoutMul: 1.15 },
      mega_refinery: { creditPayoutMul: 1.15 },
      chemical_installation: { creditPayoutMul: 1.12 },
    },
  },
  {
    id: 'unlock_refinery',
    label: 'Unlock Refinery',
    category: 'economy',
    creditCost: 450,
    description: 'Unlocks the Refinery building.',
    unlockBuildingIds: ['refinery'],
  },
  {
    id: 'unlock_mega_refinery',
    label: 'Unlock Mega Refinery',
    category: 'economy',
    creditCost: 900,
    description: 'Unlocks the Mega Refinery building.',
    prereqIds: ['unlock_refinery'],
    unlockBuildingIds: ['mega_refinery'],
  },
  {
    id: 'command_center_mk2',
    label: 'Command Center Level 2',
    category: 'structural',
    creditCost: 900,
    description: 'Command Centers provide more supply, power, and credits.',
    prereqIds: ['command_autonomy_1'],
    modifiers: { command_center: { supplyCapAddMul: 1.15, powerGenMul: 1.2, creditPayoutMul: 1.2 } },
  },
  {
    id: 'supply_depot_s_mk2',
    label: 'Supply Depot (S) Level 2',
    category: 'structural',
    creditCost: 450,
    description: 'Small supply depots provide more supply.',
    prereqIds: ['logistics_1'],
    modifiers: { supply_depot_s: { supplyCapAddMul: 1.25 } },
  },
  {
    id: 'supply_depot_l_mk2',
    label: 'Supply Depot (L) Level 2',
    category: 'structural',
    creditCost: 650,
    description: 'Large supply depots provide more supply.',
    prereqIds: ['logistics_2'],
    modifiers: { supply_depot_l: { supplyCapAddMul: 1.25 } },
  },
  {
    id: 'repair_bay_mk2',
    label: 'Repair Bay Level 2',
    category: 'structural',
    creditCost: 700,
    description: 'Repair drones heal faster and launch more frequently.',
    prereqIds: ['structural_fortification_1'],
    modifiers: { repair_bay: { damageAdd: 10, fireRateMul: 1.2 } },
  },
  {
    id: 'support_node_mk2',
    label: 'Support Node Level 2',
    category: 'structural',
    creditCost: 600,
    description: 'Support Node pulses heal more and cover more range.',
    prereqIds: ['structural_fortification_1'],
    modifiers: { support_node: { rangeAdd: 2, damageAdd: 10 } },
  },
  {
    id: 'reconstruction_yard_mk2',
    label: 'Reconstruction Yard Level 2',
    category: 'structural',
    creditCost: 850,
    description: 'Reconstruction Yards can rebuild from farther away.',
    prereqIds: ['structural_fortification_2'],
    modifiers: { reconstruction_yard: { rangeAdd: 4 } },
  },
  {
    id: 'factory_business_mk2',
    label: 'Business Level 2',
    category: 'economy',
    creditCost: 550,
    description: 'Businesses generate more credits.',
    prereqIds: ['economy_optimization_1'],
    modifiers: { factory_business: { creditPayoutMul: 1.18 } },
  },
  {
    id: 'factory_factory_mk2',
    label: 'Factory Level 2',
    category: 'economy',
    creditCost: 800,
    description: 'Factories generate more credits.',
    prereqIds: ['unlock_factory'],
    modifiers: { factory_factory: { creditPayoutMul: 1.18 } },
  },
  {
    id: 'factory_megacomplex_mk2',
    label: 'Mega-Complex Level 2',
    category: 'economy',
    creditCost: 1250,
    description: 'Mega-Complexes generate significantly more credits.',
    prereqIds: ['unlock_megacomplex'],
    modifiers: { factory_megacomplex: { creditPayoutMul: 1.2 } },
  },
  {
    id: 'refinery_mk2',
    label: 'Refinery Level 2',
    category: 'economy',
    creditCost: 650,
    description: 'Refineries output more credits with slightly better efficiency.',
    prereqIds: ['unlock_refinery'],
    modifiers: { refinery: { creditPayoutMul: 1.22, powerDrainMul: 0.95 } },
  },
  {
    id: 'mega_refinery_mk2',
    label: 'Mega Refinery Level 2',
    category: 'economy',
    creditCost: 1100,
    description: 'Mega Refineries output more credits with slightly better efficiency.',
    prereqIds: ['unlock_mega_refinery'],
    modifiers: { mega_refinery: { creditPayoutMul: 1.22, powerDrainMul: 0.95 } },
  },
  {
    id: 'chemical_installation_mk2',
    label: 'Chemical Installation Level 2',
    category: 'economy',
    creditCost: 1400,
    description: 'Chemical installations produce more credits.',
    prereqIds: ['unlock_megacomplex'],
    modifiers: { chemical_installation: { creditPayoutMul: 1.15 } },
  },
  {
    id: 'generator_small_mk2',
    label: 'Generator (S) Level 2',
    category: 'electrical',
    creditCost: 500,
    description: 'Small generators produce more power.',
    prereqIds: ['generator_efficiency'],
    modifiers: { generator_small: { powerGenMul: 1.2 } },
  },
  {
    id: 'generator_large_mk2',
    label: 'Generator (L) Level 2',
    category: 'electrical',
    creditCost: 900,
    description: 'Large generators produce more power.',
    prereqIds: ['generator_efficiency'],
    modifiers: { generator_large: { powerGenMul: 1.2 } },
  },
  {
    id: 'battery_small_mk2',
    label: 'Battery (S) Level 2',
    category: 'electrical',
    creditCost: 450,
    description: 'Small batteries provide more max power storage.',
    prereqIds: ['battery_capacity_1'],
    modifiers: { battery_small: { powerCapAddMul: 1.2 } },
  },
  {
    id: 'battery_large_mk2',
    label: 'Battery (L) Level 2',
    category: 'electrical',
    creditCost: 750,
    description: 'Large batteries provide more max power storage.',
    prereqIds: ['battery_capacity_2'],
    modifiers: { battery_large: { powerCapAddMul: 1.2 } },
  },
  {
    id: 'pylon_mk2',
    label: 'Pylon Level 2',
    category: 'electrical',
    creditCost: 650,
    description: 'Pylons generate more network power.',
    prereqIds: ['power_distribution_1'],
    modifiers: { pylon: { powerGenMul: 1.18 } },
  },
  {
    id: 'nuclear_plant_mk2',
    label: 'Nuclear Plant Level 2',
    category: 'electrical',
    creditCost: 1200,
    description: 'Nuclear plants output more power and drain fewer credits.',
    prereqIds: ['nuclear_overclock_1'],
    modifiers: { nuclear_plant: { powerGenMul: 1.2, creditPayoutMul: 0.85 } },
  },
  {
    id: 'auto_turret_mk2',
    label: 'Auto-Turret Level 2',
    category: 'turrets',
    creditCost: 500,
    description: 'Auto-Turrets fire faster and hit harder.',
    prereqIds: ['turret_targeting'],
    modifiers: { auto_turret: { damageAdd: 3, fireRateMul: 1.12 } },
  },
  {
    id: 'auto_turret_large_mk2',
    label: 'Auto-Turret (L) Level 2',
    category: 'turrets',
    creditCost: 800,
    description: 'Large Auto-Turrets fire faster and hit harder.',
    prereqIds: ['unlock_turret_t2'],
    modifiers: { auto_turret_large: { damageAdd: 5, fireRateMul: 1.12 } },
  },
  {
    id: 'siege_cannon_mk2',
    label: 'Siege Cannon Level 2',
    category: 'turrets',
    creditCost: 900,
    description: 'Siege Cannons gain range and heavy-shot damage.',
    prereqIds: ['turret_damage_1'],
    modifiers: { siege_cannon: { rangeAdd: 4, damageAdd: 70 } },
  },
  {
    id: 'heavy_siege_gun_mk2',
    label: 'Heavy Siege Gun Level 2',
    category: 'turrets',
    creditCost: 1250,
    description: 'Heavy Siege Guns gain range and heavy-shot damage.',
    prereqIds: ['unlock_turret_t2'],
    modifiers: { heavy_siege_gun: { rangeAdd: 4, damageAdd: 120 } },
  },
  {
    id: 'aa_gun_mk2',
    label: 'AA Gun Level 2',
    category: 'turrets',
    creditCost: 950,
    description: 'AA Guns gain per-shot damage and larger blast radius.',
    prereqIds: ['unlock_turret_t2'],
    modifiers: { aa_gun: { damageAdd: 12, aoeRadiusMul: 1.1 } },
  },
  {
    id: 'railgun_mk2',
    label: 'Railgun Level 2',
    category: 'turrets',
    creditCost: 1600,
    description: 'Railguns gain range and much higher beam damage.',
    prereqIds: ['unlock_railgun'],
    modifiers: { railgun: { rangeAdd: 6, damageAdd: 240 } },
  },
  {
    id: 'missile_launcher_s_mk2',
    label: 'Missile Launcher (S) Level 2',
    category: 'missile',
    creditCost: 650,
    description: 'Small missile launchers fire faster and hit harder.',
    prereqIds: ['missile_payload_1'],
    modifiers: { missile_launcher_s: { damageAdd: 16, fireRateMul: 1.1 } },
  },
  {
    id: 'missile_launcher_m_mk2',
    label: 'Missile Launcher (M) Level 2',
    category: 'missile',
    creditCost: 900,
    description: 'Medium missile launchers fire faster and hit harder.',
    prereqIds: ['unlock_missile_silos'],
    modifiers: { missile_launcher_m: { damageAdd: 22, fireRateMul: 1.1 } },
  },
  {
    id: 'portable_silo_mk2',
    label: 'Portable Silo Level 2',
    category: 'missile',
    creditCost: 950,
    description: 'Portable silos gain range, damage, and blast radius.',
    prereqIds: ['unlock_missile_silos'],
    modifiers: { portable_silo: { rangeAdd: 6, damageAdd: 60, aoeRadiusMul: 1.1 } },
  },
  {
    id: 'missile_silo_mk2',
    label: 'Missile Silo Level 2',
    category: 'missile',
    creditCost: 1200,
    description: 'Missile silos gain range, damage, and blast radius.',
    prereqIds: ['unlock_missile_silos'],
    modifiers: { missile_silo: { rangeAdd: 8, damageAdd: 90, aoeRadiusMul: 1.1 } },
  },
  {
    id: 'nuclear_silo_mk2',
    label: 'Nuclear Silo Level 2',
    category: 'missile',
    creditCost: 2200,
    description: 'Nuclear silos gain extreme range and payload damage.',
    prereqIds: ['unlock_nuclear_silo'],
    modifiers: { nuclear_silo: { rangeAdd: 10, damageAdd: 180, aoeRadiusMul: 1.08 } },
  },
  {
    id: 'hydra_launcher_mk2',
    label: 'Hydra Launcher Level 2',
    category: 'missile',
    creditCost: 1350,
    description: 'Hydra launchers fire faster and boost volley damage.',
    prereqIds: ['unlock_hydra_launcher'],
    modifiers: { hydra_launcher: { damageAdd: 12, fireRateMul: 1.15 } },
  },
  {
    id: 'shield_generator_m_mk2',
    label: 'Shield Generator (M) Level 2',
    category: 'energy',
    creditCost: 1100,
    description: 'Medium shields gain capacity and recharge performance.',
    prereqIds: ['shield_capacity_1'],
    modifiers: { shield_generator_m: { shieldCapacityMul: 1.2, shieldRechargeMul: 1.15 } },
  },
  {
    id: 'shield_generator_l_mk2',
    label: 'Shield Generator (L) Level 2',
    category: 'energy',
    creditCost: 1700,
    description: 'Large shields gain capacity and recharge performance.',
    prereqIds: ['unlock_shield_large'],
    modifiers: { shield_generator_l: { shieldCapacityMul: 1.2, shieldRechargeMul: 1.15 } },
  },
  {
    id: 'tesla_tower_mk2',
    label: 'Tesla Tower Level 2',
    category: 'energy',
    creditCost: 1000,
    description: 'Tesla towers zap harder and farther.',
    prereqIds: ['tesla_coils_1'],
    modifiers: { tesla_tower: { rangeAdd: 2, damageAdd: 35 } },
  },
  {
    id: 'plasma_laser_s_mk2',
    label: 'Plasma Laser (S) Level 2',
    category: 'energy',
    creditCost: 950,
    description: 'Small plasma lasers gain beam damage and range.',
    prereqIds: ['plasma_focus_1'],
    modifiers: { plasma_laser_s: { rangeAdd: 4, damageAdd: 26 } },
  },
  {
    id: 'plasma_laser_m_mk2',
    label: 'Plasma Laser (M) Level 2',
    category: 'energy',
    creditCost: 1300,
    description: 'Medium plasma lasers gain beam damage and range.',
    prereqIds: ['plasma_focus_1'],
    modifiers: { plasma_laser_m: { rangeAdd: 4, damageAdd: 36 } },
  },
  {
    id: 'plasma_laser_l_mk2',
    label: 'Plasma Laser (L) Level 2',
    category: 'energy',
    creditCost: 1850,
    description: 'Large plasma lasers gain beam damage and range.',
    prereqIds: ['plasma_focus_2'],
    modifiers: { plasma_laser_l: { rangeAdd: 5, damageAdd: 48 } },
  },
]

export class BaseDefenseGame {
  private readonly canvas: HTMLCanvasElement
  private readonly mode: 'normal' | 'sandbox'
  private renderer!: THREE.WebGLRenderer
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private clock = new THREE.Clock()
  private raf = 0
  private ro!: ResizeObserver

  private readonly raycaster = new THREE.Raycaster()
  private readonly pointer = new THREE.Vector2()
  private readonly groundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
  private readonly tmpV3 = new THREE.Vector3()
  private readonly tmpAimVec = new THREE.Vector3()
  private readonly tmpAimPos = new THREE.Vector3()

  // Camera controls
  private camPos = new THREE.Vector3(0, 55, 70)
  private yaw = Math.PI
  private pitch = -0.65
  private readonly moveKeys = new Set<string>()
  private lookLocked = false
  private hasMousePos = false
  private lastMouseX = 0
  private lastMouseY = 0

  // Selection / hover
  private selected: BuildingId = 'auto_turret'
  private hoverCell = { x: 0, z: 0 }
  private hoverValid = false

  // Resources
  private credits = 650
  private supplyCap = 0
  private supplyUsed = 0
  private powerCap = 20
  private powerStored = 20

  // Wave control
  private wave = 0
  private firstWaveStarted = false
  private waveInProgress = false
  private waveReady = true
  private toSpawn = 0
  private spawnTimer = 0
  private waveVariantPool: AsteroidVariant[] = ['normal']

  // Active/Inactive wave lifecycle.
  // Active:
  // - spawn window: timer counts down while enemies spawn (circle fills on UI)
  // - cleanup: spawning stops when timer ends; wave continues until asteroids are destroyed
  // Inactive:
  // - lasts up to 60s (UI shows timer); player can press Space early to start next wave
  private spawnWindowDurationSec = 0
  private spawnWindowElapsedSec = 0
  private spawnWindowEnded = false
  private inactiveTimeLeftSec = 0
  private readonly inactiveDurationSec = 60
  private currentInactivePhase = 0
  private readonly purchasedUpgradeIds = new Set<UpgradeId>()
  private readonly purchasedUpgradePhase = new Map<UpgradeId, number>()
  private readonly discoveredAsteroidVariants = new Set<AsteroidVariant>()
  private asteroidDiscoveryTimerSec = 0
  private activeAsteroidDiscovery: AsteroidVariant | null = null
  private readonly unlockedBuildingIds = new Set<BuildingId>([
    'command_center',
    'supply_depot_s',
    'supply_depot_l',
    'support_node',
    'factory_business',
    'generator_small',
    'battery_small',
    'auto_turret',
    'siege_cannon',
    'missile_launcher_s',
  ])

  // World state
  private readonly buildings: PlacedBuilding[] = []
  private readonly asteroids: Asteroid[] = []
  private readonly missiles: Missile[] = []
  private readonly pendingMissileBursts: PendingMissileBurst[] = []
  private readonly hydraHitStack = new Map<string, number>()
  private readonly shieldFields = new Map<string, ShieldField>()
  private readonly ballistics: Ballistic[] = []
  private readonly repairDrones: RepairDrone[] = []
  private readonly occupied = new Map<string, string>() // cell -> placedBuilding.id

  private isLost = false
  private wheelOpen = false
  private draggingBuild = false
  private dragBuildTimer = 0
  private readonly dragBuildIntervalSec = 0.055
  private draggingSell = false
  private dragSellTimer = 0
  private readonly dragSellIntervalSec = 0.07
  private asteroidIdSeed = 0
  private volleyIdSeed = 0
  private autoWavesEnabled = true
  private resourceBonus = { supplyCap: 0, powerCap: 0, powerStored: 0 }

  // Scene objects
  private readonly world = new THREE.Group()
  private readonly projectiles = new THREE.Group()
  private readonly effects = new THREE.Group()
  private hoverOutline!: THREE.LineSegments
  private hoverGhost!: THREE.Mesh
  private skyStars!: { obj: THREE.Points; dispose: () => void }
  private refundSpriteMap?: THREE.Texture

  onStateChange?: (state: {
    credits: number
    supplyUsed: number
    supplyCap: number
    powerStored: number
    powerCap: number
    wave: number
    waveReady: boolean
    waveInProgress: boolean
    waveSpawnProgress: number
    waveSpawnEnded: boolean
    inactiveTimeLeftSec: number
    asteroidsRemaining: number
    asteroidDiscovery: { variant: AsteroidVariant; name: string; description: string; color: number } | null
    unlockedBuildingIds: BuildingId[]
    purchasedUpgradeIds: UpgradeId[]
    refundableUpgradeIds: UpgradeId[]
    selected: BuildingId
    gameOver: boolean
  }) => void

  constructor(canvas: HTMLCanvasElement, opts?: { mode?: 'normal' | 'sandbox' }) {
    this.canvas = canvas
    this.mode = opts?.mode ?? 'normal'
  }

  start() {
    this.setupRenderer()
    this.setupWorld()
    this.attachEvents()
    this.resetRun()
    this.tick()
  }

  stop() {
    cancelAnimationFrame(this.raf)
    this.detachEvents()
    this.ro.disconnect()
    this.skyStars?.dispose()
    this.renderer.dispose()
  }

  setSelected(id: BuildingId) {
    this.selected = id
    this.updateGhostForSelected()
    this.emitState()
  }

  setWheelOpen(open: boolean) {
    this.wheelOpen = open
  }

  purchaseUpgrade(id: UpgradeId) {
    if (this.isLost) return
    const up = UPGRADES.find((u) => u.id === id)
    if (!up) return
    if (this.purchasedUpgradeIds.has(id)) return
    if (this.credits < up.creditCost) return

    this.credits -= up.creditCost
    this.purchasedUpgradeIds.add(id)
    this.purchasedUpgradePhase.set(id, this.currentInactivePhase)
    this.recomputeUnlockedBuildingIds()
    this.emitState()
  }

  refundUpgrade(id: UpgradeId) {
    if (this.isLost || this.waveInProgress) return
    if (id === 'core_protocol') return
    if (!this.purchasedUpgradeIds.has(id)) return
    const phase = this.purchasedUpgradePhase.get(id)
    if (phase !== this.currentInactivePhase) return
    const up = UPGRADES.find((u) => u.id === id)
    if (!up) return

    this.credits += up.creditCost
    this.purchasedUpgradeIds.delete(id)
    this.purchasedUpgradePhase.delete(id)
    this.refundInvalidCurrentPhaseUpgrades()
    this.recomputeUnlockedBuildingIds()

    if (!this.unlockedBuildingIds.has(this.selected)) {
      const fallback = BUILDINGS.find((b) => this.unlockedBuildingIds.has(b.id))
      if (fallback) {
        this.selected = fallback.id
        this.updateGhostForSelected()
      }
    }
    this.emitState()
  }

  // If a refunded upgrade breaks prereq chains, auto-refund dependent upgrades
  // purchased in this same inactive phase.
  private refundInvalidCurrentPhaseUpgrades() {
    let changed = true
    while (changed) {
      changed = false
      for (const upId of [...this.purchasedUpgradeIds]) {
        if (upId === 'core_protocol') continue
        if (this.purchasedUpgradePhase.get(upId) !== this.currentInactivePhase) continue
        const up = UPGRADES.find((u) => u.id === upId)
        if (!up) continue
        if (up.prereqIds?.some((p) => !this.purchasedUpgradeIds.has(p))) {
          this.credits += up.creditCost
          this.purchasedUpgradeIds.delete(upId)
          this.purchasedUpgradePhase.delete(upId)
          changed = true
        }
      }
    }
  }

  startNextWave(manual: boolean = true) {
    if (this.isLost) return

    // Can't start while a wave is active.
    if (this.waveInProgress) return

    // Avoid starting while asteroids are still alive.
    const asteroidsClear = this.asteroids.every((a) => !a.alive)
    if (!asteroidsClear) return

    // First wave can always be started manually.
    if (!this.firstWaveStarted) {
      if (!manual) return
      this.firstWaveStarted = true
    }

    // During inactive: allow manual early-start with Space, or auto-start at the end.
    if (this.firstWaveStarted && this.wave > 0) {
      if (manual) {
        if (this.inactiveTimeLeftSec <= 0) return
      } else {
        if (this.inactiveTimeLeftSec > 0) return
      }
    }

    this.currentInactivePhase += 1
    this.wave += 1
    this.waveInProgress = true
    this.waveReady = false

    this.spawnWindowEnded = false
    this.spawnWindowElapsedSec = 0
    // Earlier waves should be calmer; after wave 5 difficulty ramps up aggressively.
    const baseCount = 10 + this.wave * 3.5
    const extra = this.wave > 5 ? 6 * Math.pow(1.18, this.wave - 5) : 0
    this.toSpawn = Math.round(baseCount + extra)
    this.spawnTimer = 0

    // Approximate how long spawning will last so the UI circle matches the spawn window.
    const spawnIntervalBase = Math.max(0.06, 0.34 - this.wave * 0.015)
    const lateMult = this.wave > 5 ? Math.pow(0.93, this.wave - 5) : 1
    const spawnInterval = Math.max(0.035, spawnIntervalBase * lateMult)
    this.spawnWindowDurationSec = Math.max(6, this.toSpawn * spawnInterval)
    this.inactiveTimeLeftSec = 0
    this.configureWaveVariantPool()

    this.emitState()
  }

  private resetRun() {
    // Clear state
    for (const b of this.buildings) this.world.remove(b.mesh), this.world.remove(b.healthBar.group)
    for (const a of this.asteroids) this.world.remove(a.mesh), this.world.remove(a.healthBar.group)
    for (const m of this.missiles) this.projectiles.remove(m.mesh)
    this.pendingMissileBursts.length = 0
    this.hydraHitStack.clear()
    for (const sf of this.shieldFields.values()) sf.bubble.removeFromParent()
    this.shieldFields.clear()
    for (const b of this.ballistics) this.projectiles.remove(b.mesh)
    for (const d of this.repairDrones) this.world.remove(d.mesh)
    this.buildings.length = 0
    this.asteroids.length = 0
    this.missiles.length = 0
    this.ballistics.length = 0
    this.repairDrones.length = 0
    this.occupied.clear()

    this.isLost = false
    // Early game starts faster: more money, more power, more supply from the Command Center.
    this.credits = 1200
    this.powerCap = 45
    this.powerStored = 45
    this.supplyCap = 0
    this.supplyUsed = 0
    this.wave = 0
    this.firstWaveStarted = false
    this.waveInProgress = false
    this.waveReady = true
    this.toSpawn = 0
    this.spawnTimer = 0
    this.waveVariantPool = ['normal']
    this.discoveredAsteroidVariants.clear()
    this.activeAsteroidDiscovery = null
    this.asteroidDiscoveryTimerSec = 0
    this.spawnWindowDurationSec = 0
    this.spawnWindowElapsedSec = 0
    this.spawnWindowEnded = false
    this.inactiveTimeLeftSec = 0
    this.currentInactivePhase = 0
    this.purchasedUpgradeIds.clear()
    this.purchasedUpgradeIds.add('core_protocol')
    this.purchasedUpgradePhase.clear()
    this.purchasedUpgradePhase.set('core_protocol', -1)
    this.recomputeUnlockedBuildingIds()
    this.asteroidIdSeed = 0
    this.volleyIdSeed = 0

    // Mode setup
    if (this.mode === 'sandbox') {
      this.credits = 50000
      this.resourceBonus = { supplyCap: 999, powerCap: 999, powerStored: 999 }
      this.autoWavesEnabled = false
    } else {
      this.resourceBonus = { supplyCap: 0, powerCap: 0, powerStored: 0 }
      this.autoWavesEnabled = true
    }
    this.powerStored = Math.min(this.powerCap + this.resourceBonus.powerCap, this.powerStored + this.resourceBonus.powerStored)

    // Place initial command center at grid center.
    const cc = BUILDINGS.find((d) => d.id === 'command_center')!
    this.placeBuilding(cc, -1, -1, true)

    this.emitState()
  }

  private setupRenderer() {
    this.renderer = new THREE.WebGLRenderer({ canvas: this.canvas, antialias: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
    this.renderer.shadowMap.enabled = true

    this.scene = new THREE.Scene()
    this.scene.background = new THREE.Color(0x030712)
    this.scene.fog = new THREE.Fog(0x05070f, 80, 320)

    this.camera = new THREE.PerspectiveCamera(70, 1, 0.1, 1400)
    this.camera.position.copy(this.camPos)
    this.camera.lookAt(0, 0, 0)

    this.ro = new ResizeObserver(() => this.resize())
    this.ro.observe(this.canvas)
    this.resize()
  }

  private setupWorld() {
    this.scene.add(this.world)
    this.scene.add(this.projectiles)
    this.scene.add(this.effects)

    // Generic dark ground
    const ground = new THREE.Mesh(
      new THREE.PlaneGeometry(101, 101),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95, metalness: 0.02 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    this.world.add(ground)

    // 101 cells at 1 unit each: lines at half-cell boundaries align to integer cell centers.
    const grid = new THREE.GridHelper(101, 101, 0x1e3a8a, 0x1e293b)
    grid.position.y = 0.01
    this.world.add(grid)

    // Night sky + stars
    const sky = new THREE.Mesh(
      new THREE.SphereGeometry(900, 20, 14),
      new THREE.MeshBasicMaterial({ color: 0x050816, side: THREE.BackSide }),
    )
    this.world.add(sky)

    this.skyStars = this.createStars()
    this.world.add(this.skyStars.obj)

    // Lighting
    this.world.add(new THREE.AmbientLight(0xffffff, 0.18))
    const moon = new THREE.DirectionalLight(0xdbeafe, 0.9)
    moon.position.set(80, 120, 40)
    moon.castShadow = true
    this.world.add(moon)

    // Hover outline + ghost
    const outlineGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(1.02, 0.02, 1.02))
    const outlineMat = new THREE.LineBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.95 })
    this.hoverOutline = new THREE.LineSegments(outlineGeo, outlineMat)
    this.hoverOutline.position.set(0, 0.02, 0)
    this.world.add(this.hoverOutline)

    const ghostGeo = new THREE.BoxGeometry(1, 1, 1)
    const ghostMat = new THREE.MeshStandardMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.25 })
    this.hoverGhost = new THREE.Mesh(ghostGeo, ghostMat)
    this.hoverGhost.castShadow = false
    this.world.add(this.hoverGhost)
    this.updateGhostForSelected()
  }

  private attachEvents() {
    this.canvas.addEventListener('pointermove', this.onPointerMove)
    this.canvas.addEventListener('pointerdown', this.onPointerDown)
    window.addEventListener('pointerup', this.onPointerUp)
    this.canvas.addEventListener('contextmenu', (e) => e.preventDefault())
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    document.addEventListener('pointerlockchange', this.onPointerLockChange)
  }

  private detachEvents() {
    this.canvas.removeEventListener('pointermove', this.onPointerMove)
    this.canvas.removeEventListener('pointerdown', this.onPointerDown)
    window.removeEventListener('pointerup', this.onPointerUp)
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    document.removeEventListener('pointerlockchange', this.onPointerLockChange)
  }

  private readonly onPointerMove = (e: PointerEvent) => {
    const applyLook = (dx: number, dy: number) => {
      const rotSpeed = 0.0022
      this.yaw -= dx * rotSpeed
      this.pitch -= dy * rotSpeed
      const limit = Math.PI / 2 - 0.18
      this.pitch = Math.max(-limit, Math.min(limit, this.pitch))
    }

    if (!this.hasMousePos) {
      this.hasMousePos = true
      this.lastMouseX = e.clientX
      this.lastMouseY = e.clientY
    } else {
      const dx = this.lookLocked ? e.movementX : e.clientX - this.lastMouseX
      const dy = this.lookLocked ? e.movementY : e.clientY - this.lastMouseY
      this.lastMouseX = e.clientX
      this.lastMouseY = e.clientY
      // Keep gameplay camera fixed while the wheel UI is open.
      if (!this.wheelOpen) applyLook(dx, dy)
    }

    const rect = this.canvas.getBoundingClientRect()
    this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1

    // Continuous drag-build while holding LMB and moving.
    if (this.draggingBuild && !this.waveInProgress && !this.wheelOpen && this.lookLocked) {
      this.updateHover()
      if (this.hoverValid) {
        const def = this.getEffectiveDef(this.selected)
        if (def) this.tryPlace(def, this.hoverCell.x, this.hoverCell.z)
      }
    }
  }

  private readonly onPointerDown = (e: PointerEvent) => {
    if (this.isLost) return
    if (this.wheelOpen) return
    if (e.button === 0) {
      this.draggingBuild = true
      this.dragBuildTimer = 0
    }
    if (e.button === 2) {
      this.draggingSell = true
      this.dragSellTimer = 0
    }
    if (document.pointerLockElement !== this.canvas) {
      this.canvas.requestPointerLock()
      return
    }

    // During active waves, building placement and selling are disabled.
    if (this.waveInProgress) return

    if (e.button === 2) {
      this.draggingBuild = false
      this.sellLookedAt()
      return
    }

    if (e.button !== 0) return
    this.updateHover()
    if (!this.hoverValid) return
    const def = this.getEffectiveDef(this.selected)
    if (!def) return
    this.tryPlace(def, this.hoverCell.x, this.hoverCell.z)
  }

  private readonly onPointerUp = (e: PointerEvent) => {
    if (e.button === 0) this.draggingBuild = false
    if (e.button === 2) this.draggingSell = false
  }

  private readonly onKeyDown = (e: KeyboardEvent) => {
    const k = e.key.toLowerCase()
    if (k === 'w' || k === 'a' || k === 's' || k === 'd' || k === 'q' || k === 'e') this.moveKeys.add(k)
    if (e.key === ' ') this.startNextWave()
  }

  private readonly onKeyUp = (e: KeyboardEvent) => {
    this.moveKeys.delete(e.key.toLowerCase())
  }

  private readonly onPointerLockChange = () => {
    this.lookLocked = document.pointerLockElement === this.canvas
    if (!this.lookLocked) {
      this.draggingBuild = false
      this.draggingSell = false
    }
    // Prevent large jumps when pointer lock is toggled (e.g., interacting with UI).
    this.hasMousePos = false
  }

  private tick = () => {
    this.raf = requestAnimationFrame(this.tick)
    const dt = Math.min(0.04, this.clock.getDelta())
    this.update(dt)
    this.renderer.render(this.scene, this.camera)
  }

  private update(dt: number) {
    this.updateCamera(dt)
    if (!this.waveInProgress && !this.wheelOpen) {
      this.updateHover()
      this.updateHoverIndicators()
    } else {
      this.hoverValid = false
      if (this.hoverGhost) this.hoverGhost.visible = false
    }
    this.updateDragBuild(dt)
    this.updateDragSell(dt)
    this.updateResources(dt)
    this.updateWave(dt)
    this.updateAsteroids(dt)
    this.updateDefenses(dt)
    this.updateSupportSystems(dt)
    this.updateProjectiles(dt)
    this.updateHealthBars()
    if (this.asteroidDiscoveryTimerSec > 0) {
      this.asteroidDiscoveryTimerSec -= dt
      if (this.asteroidDiscoveryTimerSec <= 0) this.activeAsteroidDiscovery = null
    }
    this.updateRefundSprites()
    this.emitState()
  }

  private updateDragBuild(dt: number) {
    if (!this.draggingBuild) return
    if (this.isLost || this.waveInProgress || this.wheelOpen) return
    if (document.pointerLockElement !== this.canvas) return
    this.dragBuildTimer -= dt
    if (this.dragBuildTimer > 0) return
    this.dragBuildTimer = this.dragBuildIntervalSec
    this.updateHover()
    if (!this.hoverValid) return
    const def = this.getEffectiveDef(this.selected)
    if (!def) return
    this.tryPlace(def, this.hoverCell.x, this.hoverCell.z)
  }

  private updateDragSell(dt: number) {
    if (!this.draggingSell) return
    if (this.isLost || this.waveInProgress || this.wheelOpen) return
    if (document.pointerLockElement !== this.canvas) return
    this.dragSellTimer -= dt
    if (this.dragSellTimer > 0) return
    this.dragSellTimer = this.dragSellIntervalSec
    this.sellLookedAt()
  }

  private updateCamera(dt: number) {
    const forward = new THREE.Vector3(
      Math.sin(this.yaw) * Math.cos(this.pitch),
      Math.sin(this.pitch),
      Math.cos(this.yaw) * Math.cos(this.pitch),
    )
    const forwardH = new THREE.Vector3(forward.x, 0, forward.z)
    if (forwardH.lengthSq() > 0.000001) forwardH.normalize()
    const rightH = new THREE.Vector3()
    if (forwardH.lengthSq() > 0.000001) rightH.crossVectors(forwardH, new THREE.Vector3(0, 1, 0)).normalize()
    const up = new THREE.Vector3(0, 1, 0)

    const speed = 38
    const move = new THREE.Vector3()
    if (this.moveKeys.has('w')) move.add(forwardH)
    if (this.moveKeys.has('s')) move.sub(forwardH)
    if (this.moveKeys.has('a')) move.sub(rightH)
    if (this.moveKeys.has('d')) move.add(rightH)
    if (this.moveKeys.has('e')) move.add(up)
    if (this.moveKeys.has('q')) move.sub(up)
    if (move.lengthSq() > 0) this.camPos.add(move.normalize().multiplyScalar(speed * dt))

    // Allow the player camera to dip closer to the ground for building inspection.
    this.camPos.y = clamp(this.camPos.y, 6, 140)
    this.camPos.x = clamp(this.camPos.x, -170, 170)
    this.camPos.z = clamp(this.camPos.z, -170, 170)

    const lookTarget = new THREE.Vector3().addVectors(this.camPos, forward)
    this.camera.position.copy(this.camPos)
    this.camera.up.copy(up)
    this.camera.lookAt(lookTarget)
  }

  private getBaseDef(id: BuildingId): BuildingDef | undefined {
    return BUILDINGS.find((d) => d.id === id)
  }

  private getEffectiveDef(id: BuildingId): BuildingDef | undefined {
    const base = this.getBaseDef(id)
    if (!base) return undefined
    const out: BuildingDef = { ...base }
    for (const upId of this.purchasedUpgradeIds) {
      const up = UPGRADES.find((u) => u.id === upId)
      const mod = up?.modifiers?.[id]
      if (!mod) continue
      if (mod.rangeAdd) out.range = (out.range ?? 0) + mod.rangeAdd
      if (mod.damageAdd) out.damage = (out.damage ?? 0) + mod.damageAdd
      if (mod.fireRateMul) out.fireRate = (out.fireRate ?? 0) * mod.fireRateMul
      if (mod.creditPayoutMul) out.creditPayout = (out.creditPayout ?? 0) * mod.creditPayoutMul
      if (mod.powerGenMul) out.powerGenPerSec = (out.powerGenPerSec ?? 0) * mod.powerGenMul
      if (mod.powerDrainMul) out.powerDrainPerSec = (out.powerDrainPerSec ?? 0) * mod.powerDrainMul
      if (mod.aoeRadiusMul) out.aoeRadius = (out.aoeRadius ?? 0) * mod.aoeRadiusMul
      if (mod.shieldCapacityMul) out.shieldCapacityMul = (out.shieldCapacityMul ?? 1) * mod.shieldCapacityMul
      if (mod.shieldRechargeMul) out.shieldRechargeMul = (out.shieldRechargeMul ?? 1) * mod.shieldRechargeMul
      if (mod.supplyCapAddMul) out.supplyCapAdd = (out.supplyCapAdd ?? 0) * mod.supplyCapAddMul
      if (mod.powerCapAddMul) out.powerCapAdd = (out.powerCapAdd ?? 0) * mod.powerCapAddMul
    }
    return out
  }

  private updateResources(dt: number) {
    let gen = 0
    let drain = 0
    let powerCap = 20 + this.resourceBonus.powerCap
    let supplyCap = 0 + this.resourceBonus.supplyCap
    let supplyUsed = 0

    for (const b of this.buildings) {
      if (b.hp <= 0) continue
      const d = this.getEffectiveDef(b.defId) ?? b.def
      const isNuclear = b.defId === 'nuclear_plant'
      if (isNuclear && this.credits <= 0) {
        // Nuclear plants stop generating when out of credits.
        powerCap += d.powerCapAdd ?? 0
        supplyCap += d.supplyCapAdd ?? 0
        supplyUsed += d.supplyCost
        continue
      }
      supplyCap += d.supplyCapAdd ?? 0
      supplyUsed += d.supplyCost
      powerCap += d.powerCapAdd ?? 0
      gen += d.powerGenPerSec ?? 0
      drain += (d.powerDrainPerSec ?? 0) * POWER_DRAIN_GLOBAL_MUL
    }

    // Pylon network bonus: each pylon gains power per nearby pylon within radius 5.
    const pylons = this.buildings.filter((b) => b.hp > 0 && b.defId === 'pylon')
    for (const p of pylons) {
      let nearby = 0
      const px = p.origin.x
      const pz = p.origin.z
      for (const q of pylons) {
        if (q.id === p.id) continue
        const qx = q.origin.x
        const qz = q.origin.z
        if (Math.hypot(qx - px, qz - pz) <= 5) nearby += 1
      }
      gen += nearby * 0.82 * VARS.P
    }

    this.supplyCap = supplyCap
    this.supplyUsed = supplyUsed
    this.powerCap = powerCap

    // Building jobs only run during ACTIVE waves.
    // Inactive phase: no economy payouts and no power production/drain ticking.
    if (!this.waveInProgress) {
      this.powerStored = Math.min(this.powerStored, this.powerCap)
      return
    }

    // Power is a stored resource produced over time and drained by active buildings.
    this.powerStored = clamp(this.powerStored + gen * dt - drain * dt, 0, this.powerCap)

    // Economy payouts (require power to operate if the building has drain and power is empty).
    for (const b of this.buildings) {
      const d = this.getEffectiveDef(b.defId) ?? b.def
      if (!d.creditPayout || !d.creditIntervalSec) continue
      if (b.hp <= 0) continue
      if (b.defId === 'nuclear_plant' && this.credits <= 0 && (d.creditPayout ?? 0) < 0) continue
      // if out of power, pause economy buildings
      if ((d.powerDrainPerSec ?? 0) > 0 && this.powerStored <= 0.001) continue
      b.econTimer += dt
      if (b.econTimer >= d.creditIntervalSec) {
        b.econTimer -= d.creditIntervalSec
        const nextCredits = this.credits + d.creditPayout
        this.credits = Math.max(0, nextCredits)
      }
    }
  }

  private updateWave(dt: number) {
    const asteroidsAlive = this.asteroids.some((a) => a.alive)

    // ACTIVE: spawn + cleanup until asteroids are gone.
    if (this.waveInProgress) {
      this.spawnWindowElapsedSec += dt

      // When the spawn timer ends, stop spawning but keep the wave active
      // until all existing asteroids are destroyed.
      if (!this.spawnWindowEnded && this.spawnWindowElapsedSec >= this.spawnWindowDurationSec) {
        this.spawnWindowEnded = true
        this.toSpawn = 0
      }

      if (!this.spawnWindowEnded && this.toSpawn > 0) {
        this.spawnTimer -= dt
        if (this.spawnTimer <= 0) {
          const spawnIntervalBase = Math.max(0.06, 0.34 - this.wave * 0.015)
          const lateMult = this.wave > 5 ? Math.pow(0.93, this.wave - 5) : 1
          const spawnInterval = Math.max(0.035, spawnIntervalBase * lateMult)
          this.spawnTimer = spawnInterval
          this.spawnAsteroid()
          this.toSpawn -= 1
        }
      }

      // Cleanup end condition: no asteroids remain.
      if (!asteroidsAlive && (this.spawnWindowEnded || this.toSpawn <= 0)) {
        this.waveInProgress = false
        this.waveReady = true
        this.inactiveTimeLeftSec = this.inactiveDurationSec
        this.spawnWindowEnded = false
        this.spawnWindowDurationSec = 0
        this.spawnWindowElapsedSec = 0
        this.emitState()
      }
      return
    }

    // INACTIVE
    if (!this.firstWaveStarted) {
      this.waveReady = true
      return
    }

    // If there are still asteroids alive, don't start the timer yet.
    if (asteroidsAlive) return

    this.waveReady = this.inactiveTimeLeftSec > 0
    this.inactiveTimeLeftSec -= dt
    if (this.inactiveTimeLeftSec <= 0) {
      this.inactiveTimeLeftSec = 0
      // Auto-start at the end of the 1-minute inactive window.
      if (this.autoWavesEnabled) this.startNextWave(false)
    }
  }

  private pickAsteroidVariant(): { variant: Asteroid['variant']; splitLevel: number } {
    const weights = this.getAsteroidVariantWeights()
    const allowed: AsteroidVariant[] = this.waveVariantPool.length > 0 ? this.waveVariantPool : ['normal']
    let total = 0
    for (const v of allowed) total += Math.max(0.0001, weights[v] ?? 0.01)
    let r = Math.random() * total
    let picked: AsteroidVariant = 'normal'
    for (const v of allowed) {
      r -= Math.max(0.0001, weights[v] ?? 0.01)
      if (r <= 0) {
        picked = v
        break
      }
    }
    return { variant: picked, splitLevel: 0 }
  }

  private getAsteroidVariantWeights(): Record<AsteroidVariant, number> {
    const waveT = clamp(this.wave / 18, 0, 1)
    const w: Record<AsteroidVariant, number> = {
      normal: 1,
      splitter: 0.035 + 0.11 * waveT,
      explosive: 0.02 + 0.085 * waveT,
      meteor: 0.015 + 0.07 * waveT,
      seeker: 0.02 + 0.06 * waveT,
      planet: 0.008 + 0.03 * waveT,
      gold: 0.015 + 0.06 * waveT,
      spawner: 0.006 + 0.03 * waveT,
      emp: 0.01 + 0.045 * waveT,
      colossus: 0.002 + 0.012 * waveT,
    }
    return w
  }

  private configureWaveVariantPool() {
    const weights = this.getAsteroidVariantWeights()
    const maxTypesThisWave = Math.min(ALL_ASTEROID_VARIANTS.length, 2 + Math.floor(this.wave / 3))
    const known = [...this.discoveredAsteroidVariants]
    if (!known.includes('normal')) known.unshift('normal')
    if (known.length === 0) known.push('normal')
    known.sort((a, b) => (weights[b] ?? 0) - (weights[a] ?? 0))
    let pool = known.slice(0, maxTypesThisWave)
    if (!pool.includes('normal')) {
      if (pool.length >= maxTypesThisWave) pool[pool.length - 1] = 'normal'
      else pool.push('normal')
    }

    const unknown = ALL_ASTEROID_VARIANTS.filter((v) => !this.discoveredAsteroidVariants.has(v))
    if (unknown.length > 0 && this.wave >= 2) {
      unknown.sort((a, b) => (weights[b] ?? 0) - (weights[a] ?? 0))
      const intro = unknown[0]
      if (!pool.includes(intro)) {
        if (pool.length >= maxTypesThisWave) {
          const idx = pool.findIndex((v) => v !== 'normal')
          if (idx >= 0) pool[idx] = intro
        } else {
          pool.push(intro)
        }
      }
    }
    this.waveVariantPool = [...new Set(pool)]
  }

  private getAsteroidKillReward(a: Asteroid): number {
    switch (a.variant) {
      case 'gold':
        return 90
      case 'planet':
        return 55
      case 'spawner':
        return 45
      case 'emp':
        return 38
      case 'meteor':
        return 24
      case 'explosive':
        return 20
      case 'seeker':
        return 22
      case 'splitter':
        return a.splitLevel > 0 ? 8 : 18
      case 'colossus':
        return 220
      default:
        return 14
    }
  }

  private handleAsteroidDeath(a: Asteroid, reason: 'impact' | 'shield' | 'combat') {
    const pos = a.mesh.position.clone()

    // Player-caused kills grant credits by asteroid type.
    if (reason !== 'impact') {
      this.credits += Math.round(this.getAsteroidKillReward(a) * (1 + this.wave * 0.025))
    }

    // Splitters: each splitter can split into two smaller splitters once.
    if (a.variant === 'splitter' && a.splitLevel < 2) {
      for (const side of [-1, 1] as const) {
        this.spawnSplitterChild(a, side, a.splitLevel + 1)
      }
    }

    // Explosive asteroids: blow up on death (even midair).
    if (a.variant === 'explosive' && reason !== 'impact') {
      if (reason === 'combat') {
        this.spawnExplosion(pos, 3.0, 0xff8a80)
      }
      this.applyAoeDamage(pos, a.impactRadius, a.impactDamage)
    }

    // EMP asteroids always trigger a huge EMP blast on death.
    if (a.variant === 'emp') {
      const empRadius = 18
      const drainPerBuilding = 22 * VARS.P
      let hitCount = 0
      for (const b of this.buildings) {
        if (b.hp <= 0) continue
        const cx = b.origin.x + (b.def.size.w - 1) / 2
        const cz = b.origin.z + (b.def.size.h - 1) / 2
        if (Math.hypot(cx - pos.x, cz - pos.z) <= empRadius) hitCount += 1
      }
      this.powerStored = Math.max(0, this.powerStored - hitCount * drainPerBuilding)
      this.spawnExplosion(pos, 4.8, 0x67e8f9)
    }
  }

  private spawnMeteorFromSpawner(parent: Asteroid) {
    const geo = new THREE.DodecahedronGeometry(1.05 + Math.random() * 0.9, 0)
    const mat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, emissive: 0x1d4ed8, emissiveIntensity: 0.45, roughness: 0.92 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.copy(parent.mesh.position).add(new THREE.Vector3((Math.random() - 0.5) * 1.2, 0.4, (Math.random() - 0.5) * 1.2))
    mesh.castShadow = true
    this.world.add(mesh)

    const target = parent.target.clone()
    const speed = Math.max(26, parent.speed * 1.45)
    const dir = new THREE.Vector3().subVectors(target, mesh.position).normalize()
    const velocity = dir.multiplyScalar(speed)
    const maxHp = Math.max(45, Math.round(parent.maxHp * 0.42))
    const healthBar = this.createHealthBar(1.8, 0.22)
    healthBar.group.position.copy(mesh.position).add(new THREE.Vector3(0, 2.6, 0))
    this.world.add(healthBar.group)

    this.asteroids.push({
      id: `a_${this.asteroidIdSeed++}`,
      mesh,
      healthBar,
      hp: maxHp,
      maxHp,
      alive: true,
      variant: 'meteor',
      splitLevel: 0,
      speed,
      spawnCooldown: 0,
      target,
      velocity,
      impactRadius: 0.95,
      impactDamage: Math.round(parent.impactDamage * 0.8),
    })
    this.registerAsteroidDiscovery('meteor')
  }

  private spawnSplitterChild(parent: Asteroid, side: -1 | 1, splitLevel: number) {
    const baseSize = 1.4 + Math.random() * 1.8
    const sizeMul = splitLevel === 1 ? 0.72 : 0.45
    const geo = new THREE.DodecahedronGeometry(baseSize * sizeMul, 0)
    const mat = new THREE.MeshStandardMaterial({ color: 0xa21caf, emissive: 0x7f1d1d, emissiveIntensity: 0.45, roughness: 0.92 })
    const mesh = new THREE.Mesh(geo, mat)

    const offset = new THREE.Vector3(side * 0.55, 0.2, side * 0.25)
    mesh.position.copy(parent.mesh.position).add(offset)
    mesh.castShadow = true
    this.world.add(mesh)

    const maxHp = Math.max(30, Math.round(parent.maxHp * (splitLevel === 1 ? 0.55 : 0.32)))
    const hp = maxHp

    const speedMul = splitLevel === 1 ? 1.05 : 1.12
    const speed = Math.max(8, parent.speed * speedMul)
    const dir = parent.velocity.clone().normalize()
    const yaw = Math.atan2(dir.x, dir.z)
    const newYaw = yaw + side * 0.35 * (splitLevel === 1 ? 1.0 : 1.2)
    const h = Math.hypot(dir.x, dir.z)
    dir.x = Math.sin(newYaw) * h
    dir.z = Math.cos(newYaw) * h
    const velocity = dir.multiplyScalar(speed)

    const healthBar = this.createHealthBar(Math.max(1.2, 2.2 * sizeMul), 0.22)
    healthBar.group.position.copy(mesh.position).add(new THREE.Vector3(0, 3.1 * sizeMul, 0))
    this.world.add(healthBar.group)

    const radiusMul = splitLevel === 1 ? 0.75 : 0.5
    const dmgMul = splitLevel === 1 ? 0.7 : 0.45
    this.asteroids.push({
      id: `a_${this.asteroidIdSeed++}`,
      mesh,
      healthBar,
      hp,
      maxHp,
      alive: true,
      variant: 'splitter',
      splitLevel,
      speed,
      spawnCooldown: 0,
      target: parent.target.clone(),
      velocity,
      impactRadius: parent.impactRadius * radiusMul,
      impactDamage: parent.impactDamage * dmgMul,
    })
    this.registerAsteroidDiscovery('splitter')
  }

  private spawnAsteroid() {
    const spawnAngle = Math.random() * Math.PI * 2
    const spawnR = 160 + Math.random() * 60
    const start = new THREE.Vector3(Math.cos(spawnAngle) * spawnR, 90 + Math.random() * 30, Math.sin(spawnAngle) * spawnR)

    const pick = this.pickAsteroidVariant()

    // Target: most asteroids aim at random grid coords; seekers aim at buildings.
    let target: THREE.Vector3
    if (pick.variant === 'seeker') {
      const aliveBuildings = this.buildings.filter((b) => b.hp > 0)
      if (aliveBuildings.length > 0) {
        let best = aliveBuildings[0]
        let bestD = Infinity
        for (const b of aliveBuildings) {
          const cx = b.origin.x + (b.def.size.w - 1) / 2
          const cz = b.origin.z + (b.def.size.h - 1) / 2
          const d = Math.hypot(cx - start.x, cz - start.z)
          if (d < bestD) {
            bestD = d
            best = b
          }
        }
        const cx = best.origin.x + (best.def.size.w - 1) / 2
        const cz = best.origin.z + (best.def.size.h - 1) / 2
        target = new THREE.Vector3(cx, 0, cz)
      } else {
        const tx = Math.round((Math.random() * 2 - 1) * HALF)
        const tz = Math.round((Math.random() * 2 - 1) * HALF)
        target = new THREE.Vector3(tx, 0, tz)
      }
    } else {
      const tx = Math.round((Math.random() * 2 - 1) * HALF)
      const tz = Math.round((Math.random() * 2 - 1) * HALF)
      target = new THREE.Vector3(tx, 0, tz)
    }

    // Stronger scaling: gets significantly harder over time.
    const wavePow = Math.max(0, this.wave - 1)
    const baseHp = Math.round(100 + this.wave * 26 + Math.pow(wavePow, 1.3) * 14)
    const baseDamage = Math.round(360 + this.wave * 42 + Math.pow(wavePow, 1.22) * 16)
    const baseSpeed = 15 + this.wave * 0.9 + Math.pow(wavePow, 1.08) * 0.18

    let sizeMul = 1
    let hpMul = 1
    let speedMul = 1
    let color = 0x9f1239
    let emissive = 0x7f1d1d
    let impactRadius = 4.6
    let impactDamage = baseDamage

    switch (pick.variant) {
      case 'splitter':
        sizeMul = 1
        hpMul = 0.92
        speedMul = 1.02
        color = 0xa21caf
        emissive = 0x7f1d1d
        impactRadius = 4.2
        impactDamage = baseDamage * 0.7
        break
      case 'explosive':
        sizeMul = 1.03
        hpMul = 0.9
        speedMul = 1.08
        color = 0xff4d6d
        emissive = 0xff1744
        impactRadius = 6.6
        impactDamage = baseDamage * 0.68
        break
      case 'meteor':
        sizeMul = 0.88
        hpMul = 0.8
        speedMul = 2.05
        color = 0x38bdf8
        emissive = 0x1d4ed8
        // Very small splash radius: effectively "no splash".
        impactRadius = 0.95
        impactDamage = baseDamage * 1.45
        break
      case 'seeker':
        sizeMul = 0.95
        hpMul = 0.88
        speedMul = 1.45
        color = 0x22c55e
        emissive = 0x16a34a
        impactRadius = 4.9
        impactDamage = baseDamage * 1.02
        break
      case 'planet':
        sizeMul = 2.25
        hpMul = 2.4
        speedMul = 0.62
        color = 0xeab308
        emissive = 0x991b1b
        impactRadius = 7.6
        impactDamage = baseDamage * 1.12
        break
      case 'gold':
        sizeMul = 1.08
        hpMul = 1.12
        speedMul = 0.96
        color = 0xfacc15
        emissive = 0xb45309
        impactRadius = 4.9
        impactDamage = baseDamage * 0.95
        break
      case 'spawner':
        sizeMul = 1.35
        hpMul = 1.6
        speedMul = 0.55
        color = 0x0ea5e9
        emissive = 0x0c4a6e
        impactRadius = 4.4
        impactDamage = baseDamage * 0.82
        break
      case 'emp':
        sizeMul = 1.12
        hpMul = 1.05
        speedMul = 0.92
        color = 0x7dd3fc
        emissive = 0x38bdf8
        impactRadius = 5.8
        impactDamage = baseDamage * 0.55
        break
      case 'colossus':
        sizeMul = 10
        hpMul = 20
        speedMul = 0.5
        color = 0x9ca3af
        emissive = 0x334155
        impactRadius = 10.5
        impactDamage = baseDamage * 1.2
        break
    }

    const geo = new THREE.DodecahedronGeometry((1.4 + Math.random() * 1.8) * sizeMul, 0)
    const mat = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: 0.45, roughness: 0.92 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.copy(start)
    mesh.castShadow = true
    this.world.add(mesh)

    const maxHp = Math.max(40, Math.round(baseHp * hpMul))
    const hp = maxHp

    const dir = new THREE.Vector3().subVectors(target, start).normalize()
    const speed = baseSpeed * speedMul
    const velocity = dir.multiplyScalar(speed)

    const healthBar = this.createHealthBar(Math.max(1.2, 2.2 * sizeMul), 0.22)
    healthBar.group.position.copy(start).add(new THREE.Vector3(0, 3.1 * Math.min(2.2, sizeMul), 0))
    this.world.add(healthBar.group)

    this.asteroids.push({
      id: `a_${this.asteroidIdSeed++}`,
      mesh,
      healthBar,
      hp,
      maxHp,
      alive: true,
      variant: pick.variant,
      splitLevel: pick.variant === 'splitter' ? 0 : 0,
      speed,
      spawnCooldown: pick.variant === 'spawner' ? 6 : 0,
      target,
      velocity,
      impactRadius,
      impactDamage,
    })
    this.registerAsteroidDiscovery(pick.variant)
  }

  private registerAsteroidDiscovery(variant: AsteroidVariant) {
    if (this.discoveredAsteroidVariants.has(variant)) return
    this.discoveredAsteroidVariants.add(variant)
    this.activeAsteroidDiscovery = variant
    this.asteroidDiscoveryTimerSec = 5
  }

  private getAsteroidVariantInfo(variant: AsteroidVariant): { name: string; description: string; color: number } {
    switch (variant) {
      case 'splitter':
        return { name: 'Splitter', description: 'Splits into smaller splitters on death.', color: 0xa21caf }
      case 'explosive':
        return { name: 'Explosive', description: 'Detonates on death, even mid-air.', color: 0xff4d6d }
      case 'meteor':
        return { name: 'Meteor', description: 'Fast impactor with high single-hit damage.', color: 0x38bdf8 }
      case 'seeker':
        return { name: 'Seeker', description: 'Steers toward buildings during flight.', color: 0x22c55e }
      case 'planet':
        return { name: 'Planet', description: 'Huge and durable, but moves slower.', color: 0xeab308 }
      case 'gold':
        return { name: 'Gold', description: 'Drops bonus credits when destroyed.', color: 0xfacc15 }
      case 'spawner':
        return { name: 'Spawner', description: 'Periodically launches fast blue meteors.', color: 0x0ea5e9 }
      case 'emp':
        return { name: 'EMP', description: 'Death blast drains power in a massive area.', color: 0x7dd3fc }
      case 'colossus':
        return { name: 'Colossus', description: 'Gigantic, tanky, and slow-moving threat.', color: 0x9ca3af }
      default:
        return { name: 'Asteroid', description: 'Standard impact asteroid.', color: 0x9f1239 }
    }
  }

  private updateAsteroids(dt: number) {
    for (const a of this.asteroids) {
      if (!a.alive) continue

      // Spawner asteroids periodically spawn fast blue meteors.
      if (a.variant === 'spawner') {
        a.spawnCooldown -= dt
        if (a.spawnCooldown <= 0) {
          this.spawnMeteorFromSpawner(a)
          const next = Math.max(2.2, 5.2 - this.wave * 0.12)
          a.spawnCooldown += next
        }
      }

      // Seekers constantly steer toward the closest live building.
      if (a.variant === 'seeker') {
        let best: PlacedBuilding | null = null
        let bestD = Infinity
        for (const b of this.buildings) {
          if (b.hp <= 0) continue
          const cx = b.origin.x + (b.def.size.w - 1) / 2
          const cz = b.origin.z + (b.def.size.h - 1) / 2
          const d = Math.hypot(cx - a.mesh.position.x, cz - a.mesh.position.z)
          if (d < bestD) {
            bestD = d
            best = b
          }
        }
        if (best) {
          const tx = best.origin.x + (best.def.size.w - 1) / 2
          const tz = best.origin.z + (best.def.size.h - 1) / 2
          a.target.set(tx, 0, tz)
          const desired = new THREE.Vector3().subVectors(a.target, a.mesh.position)
          if (desired.lengthSq() > 0.000001) {
            desired.normalize()
            a.velocity.copy(desired.multiplyScalar(a.speed))
          }
        }
      }

      a.mesh.position.addScaledVector(a.velocity, dt)
      a.mesh.rotation.x += dt * 1.1
      a.mesh.rotation.y += dt * 1.3

      // Shield interception
      const shield = this.getActiveShieldHit(a.mesh.position)
      if (shield) {
        // destroy asteroid and drain extra power based on damage
        this.handleAsteroidDeath(a, 'shield')
        a.alive = false
        this.world.remove(a.mesh)
        this.world.remove(a.healthBar.group)
        shield.hp = Math.max(0, shield.hp - a.impactDamage)
        shield.disabled = shield.hp < shield.maxHp
        shield.bubble.visible = shield.hp > 0 && !shield.disabled
        this.spawnExplosion(a.mesh.position, 2.2, 0x38bdf8)
        continue
      }

      const distToTarget = a.mesh.position.distanceTo(a.target)
      if (distToTarget < 2.2 || a.mesh.position.y <= 0.6) {
        // Impact AOE
        this.handleAsteroidDeath(a, 'impact')
        a.alive = false
        const impactPos = new THREE.Vector3(a.target.x, 0, a.target.z)
        this.world.remove(a.mesh)
        this.world.remove(a.healthBar.group)
        this.spawnExplosion(impactPos, 3.0, 0xff8a80)
        this.applyAoeDamage(impactPos, a.impactRadius, a.impactDamage)
      }
    }
  }

  private updateDefenses(dt: number) {
    // Defenses are inactive outside ACTIVE waves.
    if (!this.waveInProgress) return

    for (const b of this.buildings) {
      if (b.hp <= 0) continue
      const d = this.getEffectiveDef(b.defId) ?? b.def

      // Shield: visible bubble + active only if has power
      if (d.kind === 'shield') {
        // nothing else here; interception handled in asteroid update
        continue
      }
      if (b.defId === 'tesla_tower') {
        const anchor = (b.mesh.userData as any)?.teslaAnchor as THREE.Object3D | undefined
        const origin = anchor
          ? anchor.getWorldPosition(this.tmpAimPos)
          : new THREE.Vector3(b.origin.x + (d.size.w - 1) / 2, 2.8, b.origin.z + (d.size.h - 1) / 2)
        const dps = d.damage ?? 0
        let hitAny = false
        for (const a of this.asteroids) {
          if (!a.alive) continue
          const dist = origin.distanceTo(a.mesh.position)
          if (dist > (d.range ?? 0)) continue
          a.hp -= dps * dt
          this.spawnShot(origin, a.mesh.position, 0x67e8f9)
          hitAny = true
          if (a.hp <= 0) {
            a.alive = false
            this.handleAsteroidDeath(a, 'combat')
            this.world.remove(a.mesh)
            this.world.remove(a.healthBar.group)
            this.spawnExplosion(a.mesh.position, 1.1, 0x67e8f9)
          }
        }
        if (hitAny) this.spawnExplosion(origin, 0.45, 0x22d3ee)
        continue
      }

      if (!d.range || !d.damage) continue
      // if out of power and the building drains power, it pauses
      if (d.kind !== 'railgun' && (d.powerDrainPerSec ?? 0) > 0 && this.powerStored <= 0.001) continue

      const isPlasma = b.defId === 'plasma_laser_s' || b.defId === 'plasma_laser_m' || b.defId === 'plasma_laser_l'
      if (d.kind !== 'railgun') {
        b.cooldown -= dt
        if (!isPlasma && b.cooldown > 0) continue
        if (isPlasma) b.cooldown = Math.max(0, b.cooldown)
      }

      const baseOrigin = new THREE.Vector3(b.origin.x + (d.size.w - 1) / 2, 1.1, b.origin.z + (d.size.h - 1) / 2)
      const aim = (b.mesh.userData as any)?.aim as WeaponAim | undefined

      let target: Asteroid | null = null
      if (isPlasma) {
        if (b.plasmaTargetId) {
          const locked = this.asteroids.find((a) => a.id === b.plasmaTargetId) ?? null
          if (!locked || !locked.alive) {
            b.plasmaTargetId = undefined
            b.cooldown = Math.max(b.cooldown, 0.5)
          } else if (baseOrigin.distanceTo(locked.mesh.position) <= d.range) {
            target = locked
          } else {
            b.plasmaTargetId = undefined
          }
        }
        if (!target) {
          if (b.cooldown > 0) continue
          let bestHp = -Infinity
          let bestDist = Infinity
          for (const a of this.asteroids) {
            if (!a.alive) continue
            const dist = baseOrigin.distanceTo(a.mesh.position)
            if (dist > d.range) continue
            if (a.hp > bestHp || (a.hp === bestHp && dist < bestDist)) {
              bestHp = a.hp
              bestDist = dist
              target = a
            }
          }
          if (target) b.plasmaTargetId = target.id
        }
      } else {
        let best = Infinity
        for (const a of this.asteroids) {
          if (!a.alive) continue
          const dist = baseOrigin.distanceTo(a.mesh.position)
          if (dist > d.range) continue
          if (dist < best) {
            best = dist
            target = a
          }
        }
      }
      if (!target) continue

      if (d.kind !== 'railgun' && !isPlasma) b.cooldown = 1 / (d.fireRate ?? 1)
      const origin = baseOrigin.clone()
      if (aim?.muzzle) origin.copy(aim.muzzle.getWorldPosition(this.tmpAimPos))

      if (aim?.yaw && aim?.pitch) {
        // Horizontal yaw (around +Y) points the turret toward the target.
        const yawObj = aim.yaw
        yawObj.getWorldPosition(this.tmpAimPos)
        this.tmpAimVec.copy(target.mesh.position).sub(this.tmpAimPos)
        const yaw = Math.atan2(this.tmpAimVec.x, this.tmpAimVec.z)
        yawObj.rotation.y = yaw

        // Barrel pitch (up/down) pitches toward the target's elevation.
        const pitchDist = Math.hypot(this.tmpAimVec.x, this.tmpAimVec.z)
        const pitch = Math.atan2(this.tmpAimVec.y, pitchDist)
        // Sign is flipped because of the barrel's base orientation in the composed meshes.
        const limit = Math.PI / 3
        aim.pitch.rotation.x = -clamp(pitch, -limit, limit)
      } else if (aim?.yaw) {
        const yawObj = aim.yaw
        yawObj.getWorldPosition(this.tmpAimPos)
        this.tmpAimVec.copy(target.mesh.position).sub(this.tmpAimPos)
        const yaw = Math.atan2(this.tmpAimVec.x, this.tmpAimVec.z)
        yawObj.rotation.y = yaw
      }

      if (d.kind === 'hitscan') {
        if (isPlasma) {
          target.hp -= (d.damage ?? 0) * dt
          this.spawnShot(origin, target.mesh.position, 0x22d3ee)
          if (target.hp <= 0) {
            target.alive = false
            this.handleAsteroidDeath(target, 'combat')
            this.world.remove(target.mesh)
            this.world.remove(target.healthBar.group)
            this.spawnExplosion(target.mesh.position, 1.0, 0x22d3ee)
            b.plasmaTargetId = undefined
            b.cooldown = Math.max(b.cooldown, 0.5)
          }
          continue
        }
        if ((d.aoeRadius ?? 0) > 0.01) {
          this.explodeAt(target.mesh.position, d.aoeRadius ?? 2, d.damage, d.color)
          this.spawnShot(origin, target.mesh.position, d.color)
        } else {
          target.hp -= d.damage
          this.spawnShot(origin, target.mesh.position, d.color)
          if (target.hp <= 0) {
            target.alive = false
            this.handleAsteroidDeath(target, 'combat')
            this.world.remove(target.mesh)
            this.world.remove(target.healthBar.group)
            this.spawnExplosion(target.mesh.position, 1.4, 0x38bdf8)
          }
        }
      } else if (d.kind === 'missiles') {
        const isHydra = b.defId === 'hydra_launcher'
        const isDeathLoc = b.defId === 'missile_launcher_s' || b.defId === 'missile_launcher_m'
        const mode: 'death_location' | 'retarget' = isDeathLoc ? 'death_location' : 'retarget'
        const burst = d.burst ?? 1
        if (isHydra && burst > 1) {
          const volleyId = `v_${this.volleyIdSeed++}`
          this.pendingMissileBursts.push({
            origin: origin.clone(),
            target,
            def: d,
            remaining: burst,
            interval: 0.1,
            timer: 0,
            mode,
            noSplash: true,
            volleyId,
          })
        } else {
          this.spawnMissile(origin, target, d, mode, false, null)
        }
      } else if (d.kind === 'ballistic') {
        this.spawnBallistic(origin, target.mesh.position, d)
      } else if (d.kind === 'railgun') {
        const chargeCap = 120
        const maxDrawPerSec = 24
        const drawn = Math.min(this.powerStored, maxDrawPerSec * dt)
        this.powerStored -= drawn
        b.charge += drawn
        if (b.charge < chargeCap) continue
        b.charge = 0
        this.fireRailgun(origin, target.mesh.position, d.range, d.damage)
      }
    }
  }

  private fireRailgun(origin: THREE.Vector3, targetPos: THREE.Vector3, range: number = 70, damage: number = 600) {
    const dir = new THREE.Vector3().subVectors(targetPos, origin)
    if (dir.lengthSq() < 0.0001) return
    dir.normalize()
    const end = origin.clone().add(dir.clone().multiplyScalar(range))

    // Piercing hit: damage all asteroids close to the beam segment.
    const beamRadius = 1.05
    for (const a of this.asteroids) {
      if (!a.alive) continue
      const toA = new THREE.Vector3().subVectors(a.mesh.position, origin)
      const t = toA.dot(dir)
      if (t < 0 || t > range) continue
      const closest = origin.clone().add(dir.clone().multiplyScalar(t))
      if (closest.distanceTo(a.mesh.position) <= beamRadius) {
        a.hp -= damage
        if (a.hp <= 0) {
          a.alive = false
          this.handleAsteroidDeath(a, 'combat')
          this.world.remove(a.mesh)
          this.world.remove(a.healthBar.group)
        }
      }
    }

    // Railgun VFX: multi-flash along the beam for clearer feedback.
    this.spawnShot(origin, end, 0x93c5fd)
    for (const t of [0.25, 0.5, 0.75]) {
      const mid = origin.clone().lerp(end, t)
      this.spawnExplosion(mid, 0.42, 0x93c5fd)
    }
    this.spawnExplosion(end, 0.9, 0x93c5fd)
  }

  private updateSupportSystems(dt: number) {
    if (!this.waveInProgress) return

    // Repair Bay: spawn 1 drone every 5s (base), up to 5 active drones per bay.
    for (const bay of this.buildings) {
      if (bay.hp <= 0 || bay.defId !== 'repair_bay') continue
      const d = this.getEffectiveDef(bay.defId) ?? bay.def
      const spawnInterval = 1 / Math.max(0.05, d.fireRate ?? 0.2)
      bay.cooldown -= dt
      if (bay.cooldown <= 0) {
        const activeForBay = this.repairDrones.filter((d) => d.bayId === bay.id).length
        if (activeForBay < 5) {
          const claimed = new Set(
            this.repairDrones.filter((d) => d.state !== 'returning').map((d) => d.targetId),
          )
          const target = this.findLowestHpBuilding(claimed)
          if (target) {
            const d = this.spawnRepairDrone(bay, target.id)
            this.repairDrones.push(d)
          }
        }
        bay.cooldown += spawnInterval
      }
    }
    // Remove drones whose bay no longer exists/alive.
    for (const d of [...this.repairDrones]) {
      const bay = this.buildings.find((b) => b.id === d.bayId && b.hp > 0)
      if (!bay) {
        this.world.remove(d.mesh)
        this.repairDrones.splice(this.repairDrones.indexOf(d), 1)
      }
    }

    // Drone lifecycle: go to one target, heal to full, return to bay, despawn.
    for (const d of this.repairDrones) {
      const bay = this.buildings.find((b) => b.id === d.bayId && b.hp > 0)
      if (!bay) continue
      const bayDef = this.getEffectiveDef(bay.defId) ?? bay.def
      const perDroneHeal = bayDef.damage ?? 30
      const droneSpeed = bayDef.projectileSpeed ?? 9

      const bayPos = new THREE.Vector3(bay.origin.x + (bay.def.size.w - 1) / 2, 5.2, bay.origin.z + (bay.def.size.h - 1) / 2)
      const target = this.buildings.find((b) => b.id === d.targetId && b.hp > 0) ?? null

      if (!target && d.state !== 'returning') d.state = 'returning'

      if (d.state === 'to_target' || d.state === 'healing') {
        if (!target) d.state = 'returning'
        else {
          const targetPos = new THREE.Vector3(
            target.origin.x + (target.def.size.w - 1) / 2,
            4.8 + target.def.size.h * 0.2,
            target.origin.z + (target.def.size.h - 1) / 2,
          )
          const dir = targetPos.clone().sub(d.mesh.position)
          if (dir.lengthSq() > 0.0001) d.mesh.position.add(dir.normalize().multiplyScalar(Math.min(droneSpeed * dt, dir.length())))
          const close = d.mesh.position.distanceTo(targetPos) <= 0.95
          if (close) {
            d.state = 'healing'
            const heal = perDroneHeal * dt
            const powerCost = (heal / 10) * VARS.P
            if (this.powerStored >= powerCost && target.hp < target.def.maxHp) {
              this.powerStored -= powerCost
              target.hp = Math.min(target.def.maxHp, target.hp + heal)
            }
            if (target.hp >= target.def.maxHp - 0.01) d.state = 'returning'
          }
        }
      }

      if (d.state === 'returning') {
        const dir = bayPos.clone().sub(d.mesh.position)
        if (dir.lengthSq() > 0.0001) d.mesh.position.add(dir.normalize().multiplyScalar(Math.min(droneSpeed * dt, dir.length())))
        if (d.mesh.position.distanceTo(bayPos) <= 0.9) {
          this.world.remove(d.mesh)
          this.repairDrones.splice(this.repairDrones.indexOf(d), 1)
        }
      }
    }

    // Support node pulses.
    for (const b of this.buildings) {
      if (b.hp <= 0 || b.defId !== 'support_node') continue
      const d = this.getEffectiveDef(b.defId) ?? b.def
      b.cooldown -= dt
      if (b.cooldown > 0) continue
      b.cooldown = 2.5 / Math.max(0.25, (d.fireRate ?? 0.4) / 0.4)
      const pulseRange = d.range ?? 8
      const pulseCost = 10 * VARS.P
      if (this.powerStored < pulseCost) continue
      this.powerStored -= pulseCost
      const cx = b.origin.x
      const cz = b.origin.z
      for (const t of this.buildings) {
        if (t.hp <= 0) continue
        const tx = t.origin.x + (t.def.size.w - 1) / 2
        const tz = t.origin.z + (t.def.size.h - 1) / 2
        if (Math.hypot(tx - cx, tz - cz) <= pulseRange) {
          t.hp = Math.min(t.def.maxHp, t.hp + (d.damage ?? 25))
        }
      }
      this.spawnExplosion(new THREE.Vector3(cx, 0.2, cz), 1.0, 0x60a5fa)
    }

    // Structural upgrade: passive auto-repair up to 50% health.
    if (this.purchasedUpgradeIds.has('structural_auto_repair')) {
      const regenPerSec = 18
      for (const b of this.buildings) {
        if (b.hp <= 0) continue
        const minHp = b.def.maxHp * 0.5
        if (b.hp >= minHp) continue
        b.hp = Math.min(minHp, b.hp + regenPerSec * dt)
      }
    }

    // Chemical installations: constant corrosive aura to nearby buildings.
    for (const chem of this.buildings) {
      if (chem.hp <= 0 || chem.defId !== 'chemical_installation') continue
      const auraRange = 12
      const dps = (chem.def.auraDamagePerSec ?? 0) * dt
      if (dps <= 0) continue
      const cx = chem.origin.x + (chem.def.size.w - 1) / 2
      const cz = chem.origin.z + (chem.def.size.h - 1) / 2
      for (const b of this.buildings) {
        if (b.hp <= 0 || b.id === chem.id) continue
        const bx = b.origin.x + (b.def.size.w - 1) / 2
        const bz = b.origin.z + (b.def.size.h - 1) / 2
        if (Math.hypot(bx - cx, bz - cz) <= auraRange) {
          b.hp = Math.max(0, b.hp - dps)
          if (b.hp <= 0) this.destroyBuilding(b)
        }
      }
    }

    // Shield field maintenance + recharge.
    for (const b of this.buildings) {
      if (b.hp <= 0) continue
      if (b.defId !== 'shield_generator_m' && b.defId !== 'shield_generator_l') continue
      const sf = this.shieldFields.get(b.id)
      if (!sf) continue
      const effective = this.getEffectiveDef(b.defId) ?? b.def
      const capMul = effective.shieldCapacityMul ?? 1
      const rechargeMul = effective.shieldRechargeMul ?? 1

      // Allow upgrades purchased mid-run to affect shield capacity/recharge immediately.
      const desiredMaxHp = b.def.maxHp * 2.2 * capMul
      const ratio = sf.maxHp > 0 ? sf.hp / sf.maxHp : 1
      sf.maxHp = desiredMaxHp
      sf.hp = clamp(ratio * sf.maxHp, 0, sf.maxHp)
      sf.radius = effective.range ?? sf.radius
      sf.bubble.scale.setScalar(sf.radius)

      const rechargePerSec = sf.maxHp * 0.24 * rechargeMul
      const want = rechargePerSec * dt
      const missing = sf.maxHp - sf.hp
      if (missing > 0.001) {
        const used = Math.min(missing, want)
        const powerCost = used * 0.06 * VARS.P
        const can = Math.min(used, powerCost > 0 ? this.powerStored / powerCost * used : used)
        if (can > 0.0001) {
          const actualPower = powerCost > 0 ? (can / used) * powerCost : 0
          this.powerStored = Math.max(0, this.powerStored - actualPower)
          sf.hp = Math.min(sf.maxHp, sf.hp + can)
        }
      }
      if (sf.disabled && sf.hp >= sf.maxHp - 0.001) sf.disabled = false
      sf.bubble.visible = !sf.disabled && sf.hp > 0.001 && this.powerStored > 0.001
    }
  }

  private spawnRepairDrone(bay: PlacedBuilding, targetId: string): RepairDrone {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.22, 10, 8),
      new THREE.MeshStandardMaterial({ color: 0x93c5fd, emissive: 0x1d4ed8, emissiveIntensity: 0.5, roughness: 0.25 }),
    )
    mesh.position.set(
      bay.origin.x + (bay.def.size.w - 1) / 2 + (Math.random() * 1.2 - 0.6),
      5.2,
      bay.origin.z + (bay.def.size.h - 1) / 2 + (Math.random() * 1.2 - 0.6),
    )
    this.world.add(mesh)
    return { mesh, bayId: bay.id, targetId, state: 'to_target' }
  }

  private findLowestHpBuilding(excludedIds?: Set<string>): PlacedBuilding | null {
    let best: PlacedBuilding | null = null
    let bestRatio = 1
    for (const b of this.buildings) {
      if (b.hp <= 0) continue
      if (excludedIds?.has(b.id)) continue
      const ratio = b.hp / b.def.maxHp
      if (ratio < bestRatio) {
        bestRatio = ratio
        best = b
      }
    }
    return best
  }

  private updateProjectiles(dt: number) {
    for (const p of [...this.pendingMissileBursts]) {
      p.timer -= dt
      while (p.remaining > 0 && p.timer <= 0) {
        this.spawnMissile(p.origin, p.target, p.def, p.mode, p.noSplash, p.volleyId)
        p.remaining -= 1
        p.timer += p.interval
      }
      if (p.remaining <= 0) this.pendingMissileBursts.splice(this.pendingMissileBursts.indexOf(p), 1)
    }

    for (const m of [...this.missiles]) {
      m.ttl -= dt
      if (m.ttl <= 0) {
        this.projectiles.remove(m.mesh)
        this.missiles.splice(this.missiles.indexOf(m), 1)
        continue
      }

      let destination: THREE.Vector3 | null = null
      if (m.target && m.target.alive) {
        destination = this.getLeadDestination(m, m.target)
        m.lastKnownTargetPos.copy(m.target.mesh.position)
      } else if (m.mode === 'retarget') {
        const newTarget = this.findNearestAliveAsteroid(m.mesh.position)
        if (newTarget) {
          m.target = newTarget
          m.targetId = newTarget.id
          destination = this.getLeadDestination(m, newTarget)
          m.lastKnownTargetPos.copy(newTarget.mesh.position)
        } else {
          destination = m.lastKnownTargetPos
        }
      } else {
        destination = m.lastKnownTargetPos
      }

      if (destination) {
        const dir = new THREE.Vector3().subVectors(destination, m.mesh.position)
        if (dir.lengthSq() > 0.000001) {
          // initial upward launch
          if (m.launchUpTime > 0) {
            m.launchUpTime = Math.max(0, m.launchUpTime - dt)
            m.mesh.position.y += m.launchUpSpeed * dt
          }
          m.mesh.position.addScaledVector(dir.normalize().multiplyScalar(m.speed), dt)
        }
      }
      m.mesh.rotation.y += dt * 8

      const hitLiveTarget = m.target && m.target.alive ? m.mesh.position.distanceTo(m.target.mesh.position) < 1.2 : false
      const hitLastKnown = !hitLiveTarget && m.mesh.position.distanceTo(m.lastKnownTargetPos) < 1.2
      if (hitLiveTarget || hitLastKnown) {
        if (m.noSplash) {
          if (hitLiveTarget && m.target) {
            const key = `${m.volleyId ?? 'v0'}:${m.target.id}`
            const hits = this.hydraHitStack.get(key) ?? 0
            const dmg = m.damage * (1 + hits * 0.2)
            m.target.hp -= dmg
            this.hydraHitStack.set(key, hits + 1)
            if (m.target.hp <= 0) {
              m.target.alive = false
              this.handleAsteroidDeath(m.target, 'combat')
              this.world.remove(m.target.mesh)
              this.world.remove(m.target.healthBar.group)
            }
          }
          this.spawnExplosion(m.mesh.position, 0.9, 0xffb703)
        } else {
          this.explodeAt(m.mesh.position, m.aoeRadius, m.damage, 0xffb703)
        }
        this.projectiles.remove(m.mesh)
        this.missiles.splice(this.missiles.indexOf(m), 1)
      }
    }

    for (const b of [...this.ballistics]) {
      b.t += dt
      const t = clamp(b.t / b.duration, 0, 1)
      // simple arc
      const p = new THREE.Vector3().lerpVectors(b.start, b.end, t)
      const arc = Math.sin(Math.PI * t) * 28
      p.y += arc
      b.mesh.position.copy(p)
      b.mesh.rotation.y += dt * 2
      if (t >= 1) {
        this.explodeAt(b.end, b.aoeRadius, b.damage, 0xff4d6d)
        this.projectiles.remove(b.mesh)
        this.ballistics.splice(this.ballistics.indexOf(b), 1)
      }
    }

    this.updateProjectilesAndEffects(dt)
  }

  private explodeAt(pos: THREE.Vector3, radius: number, damage: number, color: number) {
    this.spawnExplosion(pos, Math.max(2.2, radius * 0.75), color)
    // Damage asteroids
    for (const a of this.asteroids) {
      if (!a.alive) continue
      const dist = a.mesh.position.distanceTo(pos)
      if (dist > radius) continue
      const falloff = 1 - dist / radius
      a.hp -= damage * (0.45 + 0.55 * falloff)
      if (a.hp <= 0) {
        a.alive = false
        this.handleAsteroidDeath(a, 'combat')
        this.world.remove(a.mesh)
        this.world.remove(a.healthBar.group)
      }
    }
  }

  private applyAoeDamage(pos: THREE.Vector3, radius: number, damage: number) {
    for (const b of this.buildings) {
      if (b.hp <= 0) continue
      // approximate building center
      const cx = b.origin.x + (b.def.size.w - 1) / 2
      const cz = b.origin.z + (b.def.size.h - 1) / 2
      const dist = Math.hypot(cx - pos.x, cz - pos.z)
      if (dist > radius) continue
      const falloff = 1 - dist / radius
      b.hp -= damage * (0.35 + 0.65 * falloff)
      if (b.hp <= 0) {
        b.hp = 0
        this.destroyBuilding(b)
      }
    }

    // lose if all command centers dead
    const anyCC = this.buildings.some((b) => b.hp > 0 && b.defId === 'command_center')
    if (!anyCC) this.isLost = true
  }

  private destroyBuilding(b: PlacedBuilding) {
    const destroyedOrigin = { ...b.origin }
    const destroyedCenter = {
      x: b.origin.x + (b.def.size.w - 1) / 2,
      z: b.origin.z + (b.def.size.h - 1) / 2,
    }
    const destroyedDef = b.def
    const wasPylon = b.defId === 'pylon'
    this.world.remove(b.mesh)
    this.world.remove(b.healthBar.group)
    // free occupancy
    for (let dz = 0; dz < b.def.size.h; dz++) {
      for (let dx = 0; dx < b.def.size.w; dx++) {
        this.occupied.delete(key(b.origin.x + dx, b.origin.z + dz))
      }
    }
    if (b.refundSprite) b.mesh.remove(b.refundSprite)
    const sf = this.shieldFields.get(b.id)
    if (sf) {
      sf.bubble.removeFromParent()
      this.shieldFields.delete(b.id)
    }

    // Reconstruction Yard: auto-rebuild nearby destroyed buildings at 50% cost.
    if (this.waveInProgress) {
      const canRebuild = this.findReconstructionYardNear(destroyedCenter.x, destroyedCenter.z)
      if (canRebuild && this.credits >= destroyedDef.creditCost * 0.5) {
        this.credits -= destroyedDef.creditCost * 0.5
        this.placeBuilding(destroyedDef, destroyedOrigin.x, destroyedOrigin.z, true)
        const rebuilt = this.buildings[this.buildings.length - 1]
        rebuilt.builtInInactivePhase = -1
      }
    }

    if (wasPylon) {
      this.damageNearbyPylons(destroyedOrigin.x, destroyedOrigin.z, 5, 55)
      this.spawnExplosion(new THREE.Vector3(destroyedOrigin.x, 0.25, destroyedOrigin.z), 0.9, 0xeab308)
    }
  }

  private findReconstructionYardNear(x: number, z: number): PlacedBuilding | null {
    for (const b of this.buildings) {
      if (b.hp <= 0 || b.defId !== 'reconstruction_yard') continue
      const d = this.getEffectiveDef(b.defId) ?? b.def
      const range = d.range ?? 10
      const cx = b.origin.x + (b.def.size.w - 1) / 2
      const cz = b.origin.z + (b.def.size.h - 1) / 2
      if (Math.hypot(cx - x, cz - z) <= range) return b
    }
    return null
  }

  private damageNearbyPylons(x: number, z: number, radius: number, damage: number) {
    for (const b of this.buildings) {
      if (b.hp <= 0 || b.defId !== 'pylon') continue
      const bx = b.origin.x
      const bz = b.origin.z
      if (Math.hypot(bx - x, bz - z) > radius) continue
      b.hp = Math.max(0, b.hp - damage)
      if (b.hp <= 0) this.destroyBuilding(b)
    }
  }

  private sellLookedAt() {
    // raycast from screen center to building meshes
    this.raycaster.setFromCamera(new THREE.Vector2(0, 0), this.camera)
    const candidates: THREE.Object3D[] = this.buildings.filter((b) => b.hp > 0).map((b) => b.mesh)
    const hits = this.raycaster.intersectObjects(candidates, true)
    const hitObj = hits[0]?.object
    if (!hitObj) return
    const top = this.findRootBuildingByObject(hitObj)
    if (!top) return
    if (top.defId === 'command_center') return

    // 100% refund for buildings placed this inactive phase, otherwise 50%.
    const fullRefund = !this.waveInProgress && top.builtInInactivePhase === this.currentInactivePhase
    this.credits += fullRefund ? top.def.creditCost : Math.floor(top.def.creditCost * 0.5)
    top.hp = 0
    this.destroyBuilding(top)
  }

  private findRootBuildingByObject(obj: THREE.Object3D): PlacedBuilding | null {
    let cur: THREE.Object3D | null = obj
    while (cur) {
      const id = cur.userData?.buildingId
      if (typeof id === 'string') {
        const b = this.buildings.find((bb) => bb.id === id) ?? null
        if (b) return b
      }
      cur = cur.parent
    }
    return null
  }

  private tryPlace(def: BuildingDef, cx: number, cz: number) {
    // center cell -> top-left origin
    const ox = cx - Math.floor(def.size.w / 2)
    const oz = cz - Math.floor(def.size.h / 2)

    // resource checks
    if (!this.unlockedBuildingIds.has(def.id)) return
    if (this.credits < def.creditCost) return
    const ignoresSupplyLock =
      def.id === 'command_center' || def.id === 'supply_depot_s' || def.id === 'supply_depot_l'
    if (!ignoresSupplyLock && this.supplyUsed + def.supplyCost > this.supplyCap) return

    // bounds and occupancy
    for (let dz = 0; dz < def.size.h; dz++) {
      for (let dx = 0; dx < def.size.w; dx++) {
        const x = ox + dx
        const z = oz + dz
        if (Math.abs(x) > HALF || Math.abs(z) > HALF) return
        // keep a little buffer for mountains / edge
        if (Math.abs(x) >= HALF - 1 || Math.abs(z) >= HALF - 1) return
      }
    }

    // Enforce a 1-cell gap so buildings cannot be directly adjacent.
    if (!this.isAreaClearWithPadding(ox, oz, def.size.w, def.size.h, 1)) return

    // commit
    this.credits -= def.creditCost
    this.placeBuilding(def, ox, oz, false)
    this.emitState()
  }

  private placeBuilding(def: BuildingDef, ox: number, oz: number, free: boolean) {
    const id = crypto.randomUUID()

    // occupy footprint
    for (let dz = 0; dz < def.size.h; dz++) {
      for (let dx = 0; dx < def.size.w; dx++) {
        this.occupied.set(key(ox + dx, oz + dz), id)
      }
    }

    if (!free) {
      // supply/credits tracked via resource recompute; credits already charged
    } else {
      // free placement (starting CC) still counts for supply cap add
    }

    const mesh = this.createBuildingMesh(def)
    mesh.position.set(ox + (def.size.w - 1) / 2, 0, oz + (def.size.h - 1) / 2)
    mesh.traverse((o) => (o.userData.buildingId = id))
    this.world.add(mesh)

    const hb = this.createHealthBar(Math.max(1.6, def.size.w * 0.9), 0.22)
    hb.group.position.set(mesh.position.x, 3.8 + def.size.h * 0.2, mesh.position.z)
    this.world.add(hb.group)

    let refundSprite: THREE.Sprite | undefined
    if (!free) {
      refundSprite = this.createRefundSprite()
      refundSprite.position.set(0, 3.3 + def.size.h * 0.25, 0)
      mesh.add(refundSprite)
    }

    // Shield field entity (not a building hitbox)
    if (def.id === 'shield_generator_m' || def.id === 'shield_generator_l') {
      const effective = this.getEffectiveDef(def.id) ?? def
      const radius = effective.range ?? (def.range ?? 8)
      const capMul = effective.shieldCapacityMul ?? 1
      const bubble = new THREE.Mesh(
        // geometry radius = 1; scale by the shield radius so upgrades can change it at runtime.
        new THREE.SphereGeometry(1, 26, 18),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.09, depthWrite: false }),
      )
      const anchor = (mesh.userData as any)?.shieldBubbleAnchor as THREE.Object3D | undefined
      if (anchor) {
        anchor.add(bubble)
        bubble.position.set(0, 0, 0)
      } else {
        bubble.position.y = 4.0
        mesh.add(bubble)
      }
      bubble.scale.setScalar(radius)
      this.shieldFields.set(id, {
        generatorId: id,
        hp: def.maxHp * 2.2 * capMul,
        maxHp: def.maxHp * 2.2 * capMul,
        radius,
        bubble,
        disabled: false,
      })
    }

    const placed: PlacedBuilding = {
      id,
      defId: def.id,
      def,
      origin: { x: ox, z: oz },
      builtInInactivePhase: free ? -1 : this.currentInactivePhase,
      hp: def.maxHp,
      mesh,
      healthBar: hb,
      refundSprite,
      cooldown: 0,
      charge: 0,
      econTimer: 0,
    }
    this.buildings.push(placed)
  }

  private updateRefundSprites() {
    for (const b of this.buildings) {
      if (!b.refundSprite || b.hp <= 0) continue
      b.refundSprite.visible = !this.waveInProgress && b.builtInInactivePhase === this.currentInactivePhase
    }
  }

  private createRefundSprite(): THREE.Sprite {
    if (!this.refundSpriteMap) this.refundSpriteMap = this.createRefundSpriteTexture()
    const mat = new THREE.SpriteMaterial({ map: this.refundSpriteMap, transparent: true, depthWrite: false })
    const sprite = new THREE.Sprite(mat)
    sprite.scale.set(1.2, 1.2, 1)
    return sprite
  }

  private createRefundSpriteTexture(): THREE.Texture {
    const size = 128
    const canvas = document.createElement('canvas')
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!

    ctx.clearRect(0, 0, size, size)
    ctx.fillStyle = 'rgba(15, 23, 42, 0.76)'
    ctx.beginPath()
    ctx.arc(size / 2, size / 2, size * 0.34, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(34, 211, 238, 0.9)'
    ctx.lineWidth = 6
    ctx.stroke()

    ctx.fillStyle = '#eab308'
    ctx.font = 'bold 66px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('$', size / 2, size / 2 + 1)

    const tex = new THREE.CanvasTexture(canvas)
    tex.needsUpdate = true
    return tex
  }

  private createBuildingMesh(def: BuildingDef): THREE.Object3D {
    const group = new THREE.Group()
    const aim: WeaponAim = {}

    const mkMat = (color: number, metalness = 0.1, roughness = 0.88) =>
      new THREE.MeshStandardMaterial({ color, metalness, roughness })
    const mkEmat = (color: number, intensity = 0.35, roughness = 0.45) =>
      new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: color, emissiveIntensity: intensity, roughness })

    const metalDark = mkMat(def.color, 0.08, 0.95)
    const glass = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.14,
      metalness: 0.0,
      roughness: 0.1,
      emissive: def.color,
      emissiveIntensity: 0.22,
    })

    const w = def.size.w
    const h = def.size.h

    const addBase = (baseH: number, bodyColor = def.color) => {
      const body = new THREE.Mesh(new THREE.BoxGeometry(w, baseH, h), mkMat(bodyColor, 0.14, 0.88))
      body.position.y = baseH / 2
      body.castShadow = true
      group.add(body)
      return { baseH, body }
    }

    if (def.id === 'command_center') {
      const { baseH } = addBase(3.4, def.color)
      // bunker lip
      const lip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, 0.18, h * 0.98), mkMat(0x0b1220, 0.02, 0.95))
      lip.position.y = baseH + 0.09
      group.add(lip)
      // central core
      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.75, 2.2, 14), mkEmat(def.color, 0.55, 0.35))
      core.position.set(0, baseH + 1.1, 0)
      group.add(core)
      const coreTop = new THREE.Mesh(new THREE.SphereGeometry(0.34, 14, 10), mkEmat(0x22d3ee, 0.8, 0.25))
      coreTop.position.set(0, baseH + 2.2, 0)
      group.add(coreTop)

      // antenna
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.9, 10), mkMat(0xe2e8f0, 0.25, 0.5))
      ant.position.set(0, baseH + 2.65, 0)
      group.add(ant)
      return group
    }

    if (def.id === 'supply_depot_s' || def.id === 'supply_depot_l') {
      const { baseH } = addBase(1.9, def.color)
      // stacks of crates
      const crateMat = mkMat(0x9ca3af, 0.06, 0.92)
      const stackW = w * 0.35
      const stackD = h * 0.35
      for (let r = -1; r <= 1; r += 2) {
        for (let s = -1; s <= 1; s += 2) {
          const crate = new THREE.Mesh(new THREE.BoxGeometry(stackW, 0.6, stackD), crateMat)
          crate.position.set(r * w * 0.2, 0.65 + r * 0.0, s * h * 0.2)
          group.add(crate)
        }
      }
      // conveyor plates
      const plate = new THREE.Mesh(new THREE.BoxGeometry(w * 0.92, 0.06, h * 0.92), mkMat(0x0b1220, 0.02, 0.95))
      plate.position.y = baseH + 0.03
      group.add(plate)
      return group
    }

    if (def.id === 'repair_bay') {
      const { baseH } = addBase(2.0, def.color)
      const tower = new THREE.Mesh(new THREE.BoxGeometry(0.9, 2.8, 0.9), mkMat(0xe2e8f0, 0.2, 0.5))
      tower.position.set(-w * 0.28, baseH + 1.4, -h * 0.28)
      group.add(tower)
      const pad = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.1, h * 0.9), mkMat(0x0b1220, 0.02, 0.95))
      pad.position.y = baseH + 0.06
      group.add(pad)
      return group
    }

    if (def.id === 'support_node') {
      const { baseH } = addBase(1.1, def.color)
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 1.4, 10), mkMat(0xe2e8f0, 0.25, 0.5))
      mast.position.y = baseH + 0.75
      group.add(mast)
      const dish = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), mkEmat(def.color, 0.6, 0.25))
      dish.position.y = baseH + 1.5
      group.add(dish)
      return group
    }

    if (def.id === 'reconstruction_yard') {
      const { baseH } = addBase(1.9, def.color)
      const frame = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 1.2, 0.25), mkMat(0xe2e8f0, 0.22, 0.48))
      frame.position.set(0, baseH + 0.7, -h * 0.22)
      group.add(frame)
      const frame2 = frame.clone()
      frame2.position.z = h * 0.22
      group.add(frame2)
      const crane = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.4, 0.2), mkMat(0xe2e8f0, 0.22, 0.48))
      crane.position.set(-w * 0.25, baseH + 1.2, 0)
      group.add(crane)
      return group
    }

    if (def.id === 'factory_business' || def.id === 'factory_factory' || def.id === 'factory_megacomplex') {
      const tiers = def.id === 'factory_business' ? 1 : def.id === 'factory_factory' ? 2 : 3
      const baseH = 2.2 + tiers * 0.45
      const { body } = addBase(baseH, def.color)
      // stacked decks
      const deckCount = tiers
      for (let i = 0; i < deckCount; i++) {
        const deckT = 0.18
        const deckSizeX = w * (0.78 - i * 0.08)
        const deckSizeZ = h * (0.78 - i * 0.08)
        const deck = new THREE.Mesh(new THREE.BoxGeometry(deckSizeX, deckT, deckSizeZ), metalDark)
        deck.position.y = 0.9 + i * (0.7 + (tiers * 0.07))
        group.add(deck)
      }
      // chimney stacks
      const stackMat = mkMat(0xe2e8f0, 0.2, 0.55)
      for (let i = 0; i < tiers; i++) {
        const sx = (i - (tiers - 1) / 2) * (w * 0.18)
        const chimney = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.18, 1.0 + tiers * 0.2, 12), stackMat)
        chimney.position.set(sx, baseH + 0.2 + i * 0.1, 0)
        group.add(chimney)
      }
      // small emitter light
      ;(body.material as THREE.MeshStandardMaterial).emissive.setHex(def.color)
      return group
    }

    if (def.id === 'refinery' || def.id === 'mega_refinery') {
      const { baseH } = addBase(1.8, def.color)
      const tankA = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.0, 14), mkMat(0xe2e8f0, 0.2, 0.5))
      tankA.position.set(-0.28, baseH + 0.5, 0)
      group.add(tankA)
      const tankB = tankA.clone()
      tankB.position.x = 0.28
      group.add(tankB)
      const pipe = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.1, 0.14), mkMat(0x0b1220, 0.02, 0.95))
      pipe.position.set(0, baseH + 0.7, 0)
      group.add(pipe)
      return group
    }

    if (def.id === 'chemical_installation') {
      const { baseH } = addBase(2.0, def.color)
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(1.05, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.2,
          metalness: 0.0,
          roughness: 0.12,
          emissive: 0x22c55e,
          emissiveIntensity: 0.28,
        }),
      )
      dome.position.y = baseH + 0.2
      group.add(dome)
      const core = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 1.1, 10), mkEmat(0x22c55e, 0.55, 0.3))
      core.position.y = baseH + 0.55
      group.add(core)
      return group
    }

    if (def.id === 'generator_small' || def.id === 'generator_large') {
      const isLarge = def.id === 'generator_large'
      const baseH = isLarge ? 2.8 : 2.1
      addBase(baseH, def.color)

      // central generator core
      const core = new THREE.Mesh(
        new THREE.CylinderGeometry(isLarge ? 0.35 : 0.27, isLarge ? 0.45 : 0.33, isLarge ? 1.7 : 1.2, 14),
        mkEmat(0xeab308, isLarge ? 0.55 : 0.42, 0.3),
      )
      core.position.set(0, baseH + (isLarge ? 0.85 : 0.6), 0)
      group.add(core)

      // side vents
      const ventMat = mkMat(0x0b1220, 0.02, 0.95)
      const ventCount = isLarge ? 4 : 2
      for (let i = 0; i < ventCount; i++) {
        const a = (i / ventCount) * Math.PI * 2
        const vx = Math.sin(a) * w * 0.25
        const vz = Math.cos(a) * h * 0.25
        const vent = new THREE.Mesh(new THREE.BoxGeometry(isLarge ? 0.55 : 0.4, 0.18, isLarge ? 0.12 : 0.1), ventMat)
        vent.position.set(vx, baseH + 0.3, vz)
        group.add(vent)
      }
      if (isLarge) {
        // tall tower fins
        const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.2, 2.4, 10), mkMat(0xe2e8f0, 0.25, 0.5))
        tower.position.set(0, baseH + 1.2, 0)
        group.add(tower)
      }
      return group
    }

    if (def.id === 'battery_small' || def.id === 'battery_large') {
      const isLarge = def.id === 'battery_large'
      const baseH = isLarge ? 1.8 : 1.5
      addBase(baseH, def.color)
      // horizontal rooftop cylinders
      const cylCount = isLarge ? 4 : 2
      const span = w * 0.62
      for (let i = 0; i < cylCount; i++) {
        const t = i / (cylCount - 1)
        const x = -span / 2 + t * span
        const cell = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, h * 0.7, 12), mkMat(0xe2e8f0, 0.2, 0.46))
        cell.rotation.z = Math.PI / 2
        cell.position.set(x, baseH + 0.32, 0)
        group.add(cell)
      }
      const term = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.65, 0.12), mkMat(0xe2e8f0, 0.25, 0.5))
      term.position.set(0, baseH + 0.35, h * 0.28)
      group.add(term)
      return group
    }

    if (def.id === 'pylon') {
      const { baseH } = addBase(0.8, def.color)
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.08, 1.8, 10), mkMat(0xe2e8f0, 0.24, 0.5))
      mast.position.y = baseH + 0.95
      group.add(mast)
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.14, 10, 8), mkEmat(0xeab308, 0.7, 0.2))
      tip.position.y = baseH + 1.9
      group.add(tip)
      return group
    }

    if (def.id === 'nuclear_plant') {
      const { baseH } = addBase(2.2, def.color)
      const dome = new THREE.Mesh(
        new THREE.SphereGeometry(1.3, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2),
        new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.2, emissive: 0xeab308, emissiveIntensity: 0.22 }),
      )
      dome.position.y = baseH + 0.45
      group.add(dome)
      const stack = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 1.8, 14), mkMat(0xe2e8f0, 0.22, 0.5))
      stack.position.set(-0.9, baseH + 0.9, -0.9)
      group.add(stack)
      const stack2 = stack.clone()
      stack2.position.set(0.9, baseH + 0.9, -0.9)
      group.add(stack2)
      return group
    }

    // Weapons with aiming + muzzle
    if (
      def.id === 'auto_turret' ||
      def.id === 'auto_turret_large' ||
      def.id === 'siege_cannon' ||
      def.id === 'heavy_siege_gun' ||
      def.id === 'aa_gun' ||
      def.id === 'railgun' ||
      def.id === 'missile_launcher_s' ||
      def.id === 'missile_launcher_m' ||
      def.id === 'portable_silo' ||
      def.id === 'missile_silo' ||
      def.id === 'nuclear_silo' ||
      def.id === 'hydra_launcher' ||
      def.id === 'tesla_tower' ||
      def.id === 'plasma_laser_s' ||
      def.id === 'plasma_laser_m' ||
      def.id === 'plasma_laser_l'
    ) {
      const isAuto = def.id === 'auto_turret' || def.id === 'auto_turret_large'
      const isSiege = def.id === 'siege_cannon' || def.id === 'heavy_siege_gun'
      const isAA = def.id === 'aa_gun'
      const isRail = def.id === 'railgun'
      const isMissile = def.id === 'missile_launcher_s' || def.id === 'missile_launcher_m' || def.id === 'hydra_launcher'
      const isSilo = def.id === 'portable_silo' || def.id === 'missile_silo' || def.id === 'nuclear_silo'
      const isTesla = def.id === 'tesla_tower'
      const isPlasma = def.id === 'plasma_laser_s' || def.id === 'plasma_laser_m' || def.id === 'plasma_laser_l'
      const baseH = isSilo ? 1.0 : 2.0

      if (isSilo) {
        // circular low base
        const radius = Math.max(w, h) * 0.5
        const base = new THREE.Mesh(
          new THREE.CylinderGeometry(radius * 0.98, radius * 1.02, 0.95, 18),
          mkMat(def.color, 0.12, 0.9),
        )
        base.position.y = 0.48
        base.castShadow = true
        group.add(base)

        // concrete ring bands
        for (let i = 0; i < 3; i++) {
          const ring = new THREE.Mesh(new THREE.CylinderGeometry(radius * (0.76 - i * 0.1), radius * (0.82 - i * 0.1), 0.08, 18), mkMat(0x0b1220, 0.02, 0.95))
          ring.position.y = 0.52 + i * 0.1
          group.add(ring)
        }

        const missile = new THREE.Mesh(
          new THREE.CylinderGeometry(0.14, 0.22, 2.7, 14),
          mkMat(0xe2e8f0, 0.25, 0.45),
        )
        missile.position.set(0, 1.05 + 1.35, 0)
        missile.castShadow = true
        group.add(missile)

        const tip = new THREE.Mesh(
          new THREE.ConeGeometry(0.22, 0.45, 12),
          mkEmat(def.color, 0.65, 0.25),
        )
        tip.position.set(0, 1.05 + 2.7 + 0.22, 0)
        group.add(tip)

        const muzzle = new THREE.Object3D()
        muzzle.position.set(0, 1.05 + 2.7 + 0.45, 0)
        group.add(muzzle)
        aim.muzzle = muzzle
        group.userData.aim = aim
        return group
      }

      // Square-ish base for turrets/launchers
      const { baseH: builtBaseH } = addBase(baseH, def.color)

      const yawPivot = new THREE.Group()
      yawPivot.position.set(0, builtBaseH + 0.28, 0)
      group.add(yawPivot)

      if (isTesla) {
        const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 2.4, 12), mkMat(0xe2e8f0, 0.24, 0.44))
        mast.position.set(0, 1.2, 0)
        group.add(mast)
        const emitter = new THREE.Mesh(new THREE.SphereGeometry(0.24, 12, 10), mkEmat(0x22d3ee, 0.75, 0.2))
        emitter.position.set(0, 2.55, 0)
        group.add(emitter)
        const anchor = new THREE.Object3D()
        anchor.position.set(0, 2.55, 0)
        group.add(anchor)
        ;(group.userData as any).teslaAnchor = anchor
        return group
      }

      if (isPlasma) {
        const turretBody = new THREE.Mesh(new THREE.BoxGeometry(w * 0.88, 0.24, h * 0.88), metalDark)
        turretBody.position.y = 0.13
        yawPivot.add(turretBody)
        const barrelPivot = new THREE.Group()
        barrelPivot.position.set(0, 0.22, 0)
        yawPivot.add(barrelPivot)
        const barrelLen = def.id === 'plasma_laser_s' ? 1.8 : def.id === 'plasma_laser_m' ? 2.2 : 2.7
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, barrelLen, 12), mkEmat(0x67e8f9, 0.58, 0.2))
        barrel.rotation.x = Math.PI / 2
        barrel.position.set(0, 0, barrelLen / 2)
        barrelPivot.add(barrel)
        const muzzle = new THREE.Object3D()
        muzzle.position.set(0, 0, barrelLen)
        barrelPivot.add(muzzle)
        aim.yaw = yawPivot
        aim.pitch = barrelPivot
        aim.muzzle = muzzle
        group.userData.aim = aim
        return group
      }

      if (isAA) {
        const turretBody = new THREE.Mesh(new THREE.BoxGeometry(w * 0.94, 0.18, h * 0.94), metalDark)
        turretBody.position.y = 0.1
        yawPivot.add(turretBody)
        const barrelPivot = new THREE.Group()
        barrelPivot.position.set(0, 0.14, 0)
        yawPivot.add(barrelPivot)
        const offs = [
          [-0.14, -0.04],
          [0.14, -0.04],
          [-0.14, 0.04],
          [0.14, 0.04],
        ]
        const barrelLen = 1.7
        for (const [ox, oy] of offs) {
          const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, barrelLen, 10), mkMat(0xe2e8f0, 0.26, 0.42))
          barrel.rotation.x = Math.PI / 2
          barrel.position.set(ox, oy, barrelLen / 2)
          barrelPivot.add(barrel)
        }
        const muzzle = new THREE.Object3D()
        muzzle.position.set(0, 0, barrelLen)
        barrelPivot.add(muzzle)
        aim.yaw = yawPivot
        aim.pitch = barrelPivot
        aim.muzzle = muzzle
        group.userData.aim = aim
        return group
      }

      if (isRail) {
        const turretBody = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, 0.22, h * 0.98), metalDark)
        turretBody.position.y = 0.12
        yawPivot.add(turretBody)
        const barrelPivot = new THREE.Group()
        barrelPivot.position.set(0, 0.18, 0)
        yawPivot.add(barrelPivot)
        const railLen = 2.6
        const railA = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, railLen), mkMat(0xe2e8f0, 0.28, 0.4))
        railA.position.set(-0.12, 0.04, railLen / 2)
        barrelPivot.add(railA)
        const railB = railA.clone()
        railB.position.x = 0.12
        barrelPivot.add(railB)
        const core = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, railLen), mkEmat(0x93c5fd, 0.48, 0.25))
        core.position.set(0, 0, railLen / 2)
        barrelPivot.add(core)
        const muzzle = new THREE.Object3D()
        muzzle.position.set(0, 0, railLen)
        barrelPivot.add(muzzle)
        aim.yaw = yawPivot
        aim.pitch = barrelPivot
        aim.muzzle = muzzle
        group.userData.aim = aim
        return group
      }

      if (isAuto) {
        const turretBody = new THREE.Mesh(new THREE.BoxGeometry(w * 0.86, 0.22, h * 0.86), metalDark)
        turretBody.position.y = 0.12
        yawPivot.add(turretBody)

        const core = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.18, 0.24, 12), mkEmat(def.color, 0.55, 0.25))
        core.position.set(0, 0.28, 0)
        yawPivot.add(core)

        const barrelPivot = new THREE.Group()
        barrelPivot.position.set(0, 0.16, 0)
        yawPivot.add(barrelPivot)

        const barrelLen = 1.8
        const barrel = new THREE.Mesh(
          new THREE.CylinderGeometry(0.07, 0.09, barrelLen, 12),
          mkMat(0xe2e8f0, 0.28, 0.42),
        )
        barrel.rotation.x = Math.PI / 2 // axis along +Z
        barrel.position.set(0, 0, barrelLen / 2)
        barrel.castShadow = true
        barrelPivot.add(barrel)

        const muzzle = new THREE.Object3D()
        muzzle.position.set(0, 0, barrelLen)
        barrelPivot.add(muzzle)

        aim.yaw = yawPivot
        aim.pitch = barrelPivot
        aim.muzzle = muzzle
        group.userData.aim = aim
        return group
      }

      if (isSiege) {
        const turretBody = new THREE.Mesh(new THREE.BoxGeometry(w * 0.98, 0.24, h * 0.98), metalDark)
        turretBody.position.y = 0.14
        yawPivot.add(turretBody)

        const armor = new THREE.Mesh(new THREE.BoxGeometry(w * 0.68, 0.12, h * 0.68), mkMat(0x0b1220, 0.02, 0.95))
        armor.position.set(0, 0.25, 0)
        yawPivot.add(armor)

        const barrelPivot = new THREE.Group()
        barrelPivot.position.set(0, 0.18, 0)
        yawPivot.add(barrelPivot)

        const barrelLen = 2.6
        const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.10, 0.14, barrelLen, 14), mkMat(0xe2e8f0, 0.28, 0.42))
        barrel.rotation.x = Math.PI / 2
        barrel.position.set(0, 0, barrelLen / 2)
        barrel.castShadow = true
        barrelPivot.add(barrel)

        // muzzle brake
        const brake = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, 0.18), mkEmat(def.color, 0.45, 0.3))
        brake.position.set(0, -0.02, barrelLen - 0.08)
        barrelPivot.add(brake)

        const muzzle = new THREE.Object3D()
        muzzle.position.set(0, 0, barrelLen)
        barrelPivot.add(muzzle)

        aim.yaw = yawPivot
        aim.pitch = barrelPivot
        aim.muzzle = muzzle
        group.userData.aim = aim
        return group
      }

      if (isMissile) {
        // rotating launcher platform + pods
        const turretBody = new THREE.Mesh(new THREE.BoxGeometry(w * 0.9, 0.22, h * 0.9), metalDark)
        turretBody.position.y = 0.12
        yawPivot.add(turretBody)

        const dish = new THREE.Mesh(new THREE.SphereGeometry(0.18, 10, 8), mkEmat(def.color, 0.38, 0.22))
        dish.position.set(0, 0.30, 0)
        yawPivot.add(dish)

        const podMat = mkMat(0xe2e8f0, 0.22, 0.45)
        const podLen = 0.7
        const podZ = 0.62
        const pods = [-0.18, 0, 0.18]
        for (let i = 0; i < pods.length; i++) {
          const pod = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, podLen, 10), podMat)
          pod.rotation.x = Math.PI / 2
          pod.position.set(pods[i], 0.16, podZ)
          yawPivot.add(pod)
        }

        const muzzle = new THREE.Object3D()
        muzzle.position.set(0, 0.16, podZ + podLen / 2)
        yawPivot.add(muzzle)

        aim.yaw = yawPivot
        aim.muzzle = muzzle
        group.userData.aim = aim
        return group
      }

      // fallback
      group.userData.aim = aim
      return group
    }

    if (def.id === 'shield_generator_m' || def.id === 'shield_generator_l') {
      const baseH = 2.2
      addBase(baseH, def.color)
      // base ring
      const radius = Math.max(w, h) * 0.65
      const ring = new THREE.Mesh(new THREE.TorusGeometry(radius, 0.15, 12, 26), mkMat(0x93c5fd, 0.12, 0.62))
      ring.position.y = baseH + 0.3
      ring.rotation.x = Math.PI / 2
      ring.castShadow = false
      group.add(ring)
      // energy dome
      const dome = new THREE.Mesh(new THREE.SphereGeometry(radius * 0.62, 22, 16), glass)
      dome.position.y = baseH + 0.65
      group.add(dome)

      // anchor for shield bubble sphere
      const anchor = new THREE.Object3D()
      // Shield center should be at ground level.
      anchor.position.set(0, 0, 0)
      group.add(anchor)
      group.userData.shieldBubbleAnchor = anchor
      return group
    }

    // Default fallback: simple body
    addBase(2.4, def.color)
    group.userData.aim = aim
    return group
  }

  private updateHover() {
    const ndc = this.lookLocked ? new THREE.Vector2(0, 0) : this.pointer
    this.raycaster.setFromCamera(ndc, this.camera)
    const hit = this.raycaster.ray.intersectPlane(this.groundPlane, this.tmpV3)
    if (!hit) {
      this.hoverCell.x = 0
      this.hoverCell.z = 0
      this.hoverValid = false
      return
    }
    const x = Math.round(this.tmpV3.x)
    const z = Math.round(this.tmpV3.z)
    this.hoverCell.x = x
    this.hoverCell.z = z

    const def = this.getEffectiveDef(this.selected)
    if (!def) {
      this.hoverValid = false
      return
    }

    // Use center cell and validate placement
    const ox = x - Math.floor(def.size.w / 2)
    const oz = z - Math.floor(def.size.h / 2)

    if (this.credits < def.creditCost) {
      this.hoverValid = false
      return
    }
    if (this.supplyUsed + def.supplyCost > this.supplyCap) {
      this.hoverValid = false
      return
    }

    for (let dz = 0; dz < def.size.h; dz++) {
      for (let dx = 0; dx < def.size.w; dx++) {
        const cx = ox + dx
        const cz = oz + dz
        if (Math.abs(cx) > HALF || Math.abs(cz) > HALF) return void (this.hoverValid = false)
        if (Math.abs(cx) >= HALF - 1 || Math.abs(cz) >= HALF - 1) return void (this.hoverValid = false)
      }
    }
    if (!this.isAreaClearWithPadding(ox, oz, def.size.w, def.size.h, 1)) return void (this.hoverValid = false)
    this.hoverValid = true
  }

  private isAreaClearWithPadding(ox: number, oz: number, w: number, h: number, pad: number): boolean {
    for (let z = oz - pad; z <= oz + h - 1 + pad; z++) {
      for (let x = ox - pad; x <= ox + w - 1 + pad; x++) {
        if (this.occupied.has(key(x, z))) return false
      }
    }
    return true
  }

  private updateHoverIndicators() {
    const def = this.getEffectiveDef(this.selected)
    if (!def) return

    const ox = this.hoverCell.x - Math.floor(def.size.w / 2)
    const oz = this.hoverCell.z - Math.floor(def.size.h / 2)
    // outline shows footprint
    this.hoverOutline.position.set(ox + (def.size.w - 1) / 2, 0.02, oz + (def.size.h - 1) / 2)
    this.hoverOutline.scale.set(def.size.w, 1, def.size.h)

    const mat = this.hoverOutline.material as THREE.LineBasicMaterial
    mat.color.setHex(this.hoverValid ? 0x22d3ee : 0xfb7185)
    mat.opacity = this.hoverValid ? 0.95 : 0.7

    this.hoverGhost.visible = true
    this.hoverGhost.position.set(this.hoverOutline.position.x, 0, this.hoverOutline.position.z)
    this.hoverGhost.scale.set(def.size.w, 1, def.size.h)
    const gmat = this.hoverGhost.material as THREE.MeshStandardMaterial
    gmat.color.setHex(def.color)
    gmat.opacity = this.hoverValid ? 0.22 : 0.1
  }

  private updateGhostForSelected() {
    // ghost is a box; scale handled in indicator update
  }

  private createHealthBar(width: number, height: number): HealthBar {
    const group = new THREE.Group()
    const bg = new THREE.Mesh(
      new THREE.PlaneGeometry(width, height),
      new THREE.MeshBasicMaterial({ color: 0x111827, transparent: true, opacity: 0.8 }),
    )
    const fill = new THREE.Mesh(
      new THREE.PlaneGeometry(width - 0.08, height - 0.08),
      new THREE.MeshBasicMaterial({ color: 0x22c55e, transparent: true, opacity: 0.95 }),
    )
    bg.renderOrder = 60
    fill.renderOrder = 61
    group.add(bg)
    group.add(fill)
    return { group, fill, bg }
  }

  private setHealthBar(bar: HealthBar, hp: number, maxHp: number) {
    const t = Math.max(0, Math.min(1, maxHp <= 0 ? 0 : hp / maxHp))
    // Only show bars for damaged entities.
    bar.group.visible = hp > 0 && t < 0.999
    bar.fill.scale.x = t
    bar.fill.position.x = (t - 1) * 0.5
    const mat = bar.fill.material as THREE.MeshBasicMaterial
    mat.color.setHex(t > 0.6 ? 0x22c55e : t > 0.3 ? 0xf59e0b : 0xef4444)
    // Slight fade when dead
    ;(bar.bg.material as THREE.MeshBasicMaterial).opacity = hp <= 0 ? 0 : 0.8
    mat.opacity = hp <= 0 ? 0 : 0.95
  }

  private updateHealthBars() {
    for (const b of this.buildings) {
      this.setHealthBar(b.healthBar, b.hp, b.def.maxHp)
      b.healthBar.group.position.set(
        b.origin.x + (b.def.size.w - 1) / 2,
        4.2 + b.def.size.h * 0.2,
        b.origin.z + (b.def.size.h - 1) / 2,
      )
      b.healthBar.group.quaternion.copy(this.camera.quaternion)
    }
    for (const a of this.asteroids) {
      if (!a.alive) continue
      this.setHealthBar(a.healthBar, a.hp, a.maxHp)
      a.healthBar.group.position.copy(a.mesh.position).add(new THREE.Vector3(0, 3.1, 0))
      a.healthBar.group.quaternion.copy(this.camera.quaternion)
    }
  }

  private spawnShot(from: THREE.Vector3, to: THREE.Vector3, color: number) {
    const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.75 })
    const geo = new THREE.BufferGeometry().setFromPoints([from, to])
    const line = new THREE.Line(geo, mat)
    line.userData.life = 0.06
    this.effects.add(line)
  }

  private spawnExplosion(at: THREE.Vector3, size: number, color: number) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(size, 12, 9),
      new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.28 }),
    )
    mesh.position.copy(at)
    mesh.userData.life = 0.35
    this.effects.add(mesh)
  }

  private spawnMissile(
    origin: THREE.Vector3,
    target: Asteroid | null,
    def: BuildingDef,
    mode: 'death_location' | 'retarget',
    noSplash: boolean,
    volleyId: string | null,
  ) {
    const geo = new THREE.ConeGeometry(0.15, 0.7, 10)
    const mat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, emissive: 0xf59e0b, emissiveIntensity: 0.4 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.copy(origin)
    mesh.position.y += 0.5
    mesh.rotation.x = Math.PI / 2
    mesh.castShadow = true
    this.projectiles.add(mesh)
    this.missiles.push({
      mesh,
      target,
      targetId: target?.id ?? null,
      mode,
      noSplash,
      volleyId,
      lastKnownTargetPos: target ? target.mesh.position.clone() : origin.clone(),
      launchUpTime: 0.22,
      launchUpSpeed: 26,
      speed: def.projectileSpeed ?? 44,
      ttl: 4.5,
      damage: def.damage ?? 30,
      aoeRadius: def.aoeRadius ?? 3,
    })
  }

  private getLeadDestination(m: Missile, target: Asteroid): THREE.Vector3 {
    // Predictive leading using asteroid velocity.
    const pos = target.mesh.position
    const v = target.velocity
    const dist = m.mesh.position.distanceTo(pos)
    const t = clamp(dist / Math.max(1, m.speed), 0, 1.35)
    return new THREE.Vector3(pos.x + v.x * t, pos.y + v.y * t, pos.z + v.z * t)
  }

  private findNearestAliveAsteroid(pos: THREE.Vector3): Asteroid | null {
    let best: Asteroid | null = null
    let bestDist = Infinity
    for (const a of this.asteroids) {
      if (!a.alive) continue
      const d = a.mesh.position.distanceToSquared(pos)
      if (d < bestDist) {
        bestDist = d
        best = a
      }
    }
    return best
  }

  private spawnBallistic(origin: THREE.Vector3, targetPos: THREE.Vector3, def: BuildingDef) {
    const geo = new THREE.CylinderGeometry(0.22, 0.22, 1.2, 10)
    const mat = new THREE.MeshStandardMaterial({ color: 0xe2e8f0, emissive: 0xef4444, emissiveIntensity: 0.35 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.copy(origin)
    mesh.position.y += 0.8
    mesh.castShadow = true
    this.projectiles.add(mesh)

    this.ballistics.push({
      mesh,
      start: mesh.position.clone(),
      end: new THREE.Vector3(targetPos.x, 0, targetPos.z),
      t: 0,
      duration: 3.2,
      damage: def.damage ?? 800,
      aoeRadius: def.aoeRadius ?? 10,
    })
  }

  private updateProjectilesAndEffects(dt: number) {
    for (const c of [...this.effects.children]) {
      c.userData.life -= dt
      if (c.userData.life <= 0) {
        if (c instanceof THREE.Line) {
          c.geometry.dispose()
          ;(c.material as THREE.Material).dispose()
        } else if (c instanceof THREE.Mesh) {
          c.geometry.dispose()
          ;(c.material as THREE.Material).dispose()
        }
        this.effects.remove(c)
      } else if (c instanceof THREE.Mesh) {
        c.scale.multiplyScalar(1 + dt * 2.3)
        const m = c.material as THREE.MeshBasicMaterial
        m.opacity = Math.max(0, m.opacity - dt * 0.9)
      }
    }
  }

  private getActiveShieldHit(pos: THREE.Vector3): ShieldField | null {
    if (this.powerStored <= 0.001) return null
    for (const [genId, sf] of this.shieldFields) {
      const b = this.buildings.find((x) => x.id === genId && x.hp > 0)
      if (!b) continue
      if (sf.disabled || sf.hp <= 0.001) continue
      const radius = sf.radius
      const cx = b.origin.x + (b.def.size.w - 1) / 2
      const cz = b.origin.z + (b.def.size.h - 1) / 2
      const dist = Math.hypot(pos.x - cx, pos.z - cz)
      if (dist <= radius) return sf
    }
    return null
  }

  private createStars() {
    const geo = new THREE.BufferGeometry()
    const count = 1600
    const pos = new Float32Array(count * 3)
    for (let i = 0; i < count; i++) {
      const r = 520 + Math.random() * 340
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3 + 0] = Math.sin(phi) * Math.cos(theta) * r
      pos[i * 3 + 1] = Math.cos(phi) * r * 0.65
      pos[i * 3 + 2] = Math.sin(phi) * Math.sin(theta) * r
    }
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3))
    const mat = new THREE.PointsMaterial({ color: 0xffffff, size: 1.2, sizeAttenuation: true })
    const points = new THREE.Points(geo, mat)
    return {
      obj: points,
      dispose() {
        geo.dispose()
        mat.dispose()
      },
    }
  }

  private emitState() {
    const asteroidsRemaining = this.asteroids.reduce((acc, a) => acc + (a.alive ? 1 : 0), 0)
    const waveSpawnProgress =
      this.waveInProgress && this.spawnWindowDurationSec > 0 ? clamp(this.spawnWindowElapsedSec / this.spawnWindowDurationSec, 0, 1) : 0
    const refundableUpgradeIds = [...this.purchasedUpgradeIds].filter(
      (id) => id !== 'core_protocol' && this.purchasedUpgradePhase.get(id) === this.currentInactivePhase && !this.waveInProgress,
    )
    const asteroidDiscovery = this.activeAsteroidDiscovery
      ? { variant: this.activeAsteroidDiscovery, ...this.getAsteroidVariantInfo(this.activeAsteroidDiscovery) }
      : null
    this.onStateChange?.({
      credits: Math.floor(this.credits),
      supplyUsed: Math.floor(this.supplyUsed),
      supplyCap: Math.floor(this.supplyCap),
      powerStored: Math.floor(this.powerStored),
      powerCap: Math.floor(this.powerCap),
      wave: this.wave,
      waveReady: this.waveReady,
      waveInProgress: this.waveInProgress,
      waveSpawnProgress,
      waveSpawnEnded: this.spawnWindowEnded,
      inactiveTimeLeftSec: this.inactiveTimeLeftSec,
      asteroidsRemaining,
      asteroidDiscovery,
      unlockedBuildingIds: [...this.unlockedBuildingIds],
      purchasedUpgradeIds: [...this.purchasedUpgradeIds],
      refundableUpgradeIds,
      selected: this.selected,
      gameOver: this.isLost,
    })
  }

  private recomputeUnlockedBuildingIds() {
    this.unlockedBuildingIds.clear()
    this.unlockedBuildingIds.add('command_center')
    this.unlockedBuildingIds.add('supply_depot_s')
    this.unlockedBuildingIds.add('supply_depot_l')
    this.unlockedBuildingIds.add('support_node')
    this.unlockedBuildingIds.add('factory_business')
    this.unlockedBuildingIds.add('generator_small')
    this.unlockedBuildingIds.add('battery_small')
    this.unlockedBuildingIds.add('auto_turret')
    this.unlockedBuildingIds.add('siege_cannon')
    this.unlockedBuildingIds.add('missile_launcher_s')
    for (const upId of this.purchasedUpgradeIds) {
      const up = UPGRADES.find((u) => u.id === upId)
      for (const bid of up?.unlockBuildingIds ?? []) this.unlockedBuildingIds.add(bid)
    }
  }

  private resize() {
    const w = this.canvas.clientWidth
    const h = this.canvas.clientHeight
    this.renderer.setSize(w, h, false)
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
  }
}

