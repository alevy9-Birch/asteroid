import * as THREE from 'three'
import type { GameAudioEvent } from '../audio/types'

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
  | 'archangel_airfield'
  | 'archangel_starport'
  | 'archangel_fueling_station'
  | 'archangel_bulk_fueling_station'
  | 'archangel_munitions_plant'
  | 'archangel_missile_factory'
  | 'dominion_orbital_cannon'
  | 'dominion_flak_gun'
  | 'dominion_seeker_drone_spawner'
  | 'dominion_defensive_bunker'
  | 'dominion_laser_drill'
  | 'dominion_support_bay'
  | 'nova_gravity_well'
  | 'nova_photon_projector_s'
  | 'nova_photon_projector_l'
  | 'nova_shockwave_pulsar'
  | 'nova_universal_forcefield'
  | 'nova_power_bank'
  | 'citadel_repair_conduit'
  | 'citadel_construction_conduit'
  | 'citadel_defense_conduit'
  | 'citadel_attack_conduit'
  | 'citadel_efficiency_conduit'
  | 'citadel_range_conduit'
  | 'jupiter_mass_relay'
  | 'jupiter_arc_thrower'
  | 'jupiter_overclock_augment'
  | 'jupiter_radar_station'
  | 'jupiter_recon_drone'
  | 'jupiter_battery_complex'
  | 'kingpin_data_array'
  | 'kingpin_investment_complex'
  | 'kingpin_cryptographic_decoder'
  | 'kingpin_indoctrinated_labor'
  | 'kingpin_mineral_processor'
  | 'kingpin_slag_cannon'

export type BuildingCategory = 'structural' | 'economy' | 'electrical' | 'turrets' | 'missile' | 'energy' | 'hero'
export type GameDifficulty = 'easy' | 'medium' | 'hard' | 'brutal' | 'deadly'
export type HeroId = 'archangel' | 'dominion' | 'nova' | 'citadel' | 'jupiter' | 'kingpin'

export type CitadelConduitKind = 'repair' | 'construction' | 'defense' | 'attack' | 'efficiency' | 'range'

type BuildingDef = {
  id: BuildingId
  label: string
  category: BuildingCategory
  heroId?: HeroId
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
  /** Power per second required to keep the bubble online (not healing). */
  shieldUpkeepPowerPerSec?: number
  /** Power per second consumed while shield is below max and regen is active (at full budget). */
  shieldRegenPowerPerSec?: number
  /** Width of the shield’s floating health bar (larger = “better” shield readout). */
  shieldBarWidth?: number

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
  /** Kingpin Slag Cannon: credits spent per shot (in addition to power draw). */
  shotCreditCost?: number

  /** Citadel Conduits: field effects from structure center (cell units). */
  citadelConduit?: { kind: CitadelConduitKind; radius: number; strength: number }

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
  /** Shockwave Pulsar slow; movement scaled while > 0. */
  pulsarSlowTimer: number
  /** Shockwave upgrade: brief full movement stop. */
  stasisTimer: number
  /** Jupiter Radar Station: bonus damage taken + energy on death while > 0. */
  radarMarkTimer: number
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
  powerSite?: { x: number; z: number }
  damageScale?: number
}

type NovaPhotonOrb = {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  ttl: number
  hitDamage: number
  travelDps: number
  travelRadius: number
  pierceHitIds: Set<string>
  fissionOnExpire: boolean
  fissionRadius: number
  fissionDamage: number
}

type ShieldField = {
  generatorId: string
  hp: number
  maxHp: number
  radius: number
  bubble: THREE.Mesh
  /** No grid power for upkeep — bubble offline, no interception. */
  noPower: boolean
  /** Below 10% max: no interception until healed to 100%. */
  lowHpOffline: boolean
  shieldBar: HealthBar
  /** Vertical scale of bubble (1 = sphere); universal uses 0.5 for shorter dome. */
  scaleY: number
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

type DominionShrapnel = {
  mesh: THREE.Mesh
  velocity: THREE.Vector3
  ttl: number
  damage: number
}

type DominionSeekerDrone = {
  mesh: THREE.Mesh
  spawnerId: string
  state: 'flying' | 'attached'
  targetId: string | null
}

type DominionDropship = {
  mesh: THREE.Mesh
  bayId: string
  state: 'outbound' | 'healing' | 'returning'
  focusX: number
  focusZ: number
  healElapsed: number
}

type ArchangelPlaneHud = {
  group: THREE.Group
  fuelFill: THREE.Mesh
  ammoFill: THREE.Mesh
}

type ArchangelPlane = {
  id: string
  mesh: THREE.Group
  homeId: string
  /** 0 = primary, 1 = second wingman when Tight Shift is purchased. */
  slot: 0 | 1
  role: 'gunship' | 'bomber'
  state: 'refuel' | 'patrol' | 'return'
  fuel: number
  maxFuel: number
  /** Gunship only: rounds loaded on the craft (replenished on the pad from Munitions Plants). */
  bullets: number
  maxBullets: number
  /** Bomber only: air-launched missiles on the craft (replenished on the pad from Missile Factories). */
  missiles: number
  maxMissiles: number
  targetId: string | null
  evadeTimer: number
  /** Bomber: missiles remaining in current volley (0 = idle between volleys). */
  bomberBurstLeft: number
  /** Bomber: seconds until next missile in volley. */
  bomberBurstGapTimer: number
  /** Bomber: seconds until a new 4-missile volley can begin after the last ends. */
  bomberBurstRestTimer: number
  /** Random delay before leaving pad so multiple craft do not launch in perfect sync. */
  padLaunchStagger?: number
  hud: ArchangelPlaneHud
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
  | 'hero_archangel_core'
  | 'hero_archangel_unlock_bulk_fueling'
  | 'hero_archangel_fuel_efficiency_1'
  | 'hero_archangel_fuel_efficiency_2'
  | 'hero_archangel_armor_piercing'
  | 'hero_archangel_quick_reload'
  | 'hero_archangel_tight_shift'
  | 'hero_archangel_airfield_mk2'
  | 'hero_archangel_starport_mk2'
  | 'hero_archangel_fueling_mk2'
  | 'hero_archangel_bulk_fueling_mk2'
  | 'hero_archangel_munitions_mk2'
  | 'hero_archangel_missile_factory_mk2'
  | 'hero_archangel_missile_damage_1'
  | 'hero_archangel_missile_damage_2'
  | 'hero_archangel_missile_range_1'
  | 'hero_archangel_missile_range_2'
  | 'hero_archangel_missile_payload_1'
  | 'hero_archangel_missile_payload_2'
  | 'hero_dominion_core'
  | 'hero_dominion_unlock_elite_weaponry'
  | 'hero_dominion_unlock_advanced_tech'
  | 'hero_dominion_extended_support'
  | 'hero_dominion_enhanced_power'
  | 'hero_dominion_reinforced_plating'
  | 'hero_dominion_lead_rounds'
  | 'hero_dominion_orbital_mk2'
  | 'hero_dominion_flak_mk2'
  | 'hero_dominion_bunker_mk2'
  | 'hero_dominion_spawner_mk2'
  | 'hero_dominion_drill_mk2'
  | 'hero_dominion_support_mk2'
  | 'hero_dominion_turret_damage_1'
  | 'hero_dominion_turret_damage_2'
  | 'hero_dominion_turret_range_1'
  | 'hero_dominion_turret_range_2'
  | 'hero_dominion_turret_rof_1'
  | 'hero_dominion_turret_rof_2'
  | 'hero_nova_core'
  | 'hero_nova_unlock_advanced_weaponry'
  | 'hero_nova_unlock_forcefield'
  | 'hero_nova_shield_implosion'
  | 'hero_nova_energized_power_bank'
  | 'hero_nova_fission_blast'
  | 'hero_nova_stasis_surge'
  | 'hero_nova_gravity_well_mk2'
  | 'hero_nova_photon_s_mk2'
  | 'hero_nova_photon_l_mk2'
  | 'hero_nova_shockwave_mk2'
  | 'hero_nova_forcefield_mk2'
  | 'hero_nova_power_bank_mk2'
  | 'hero_nova_energy_damage_1'
  | 'hero_nova_energy_damage_2'
  | 'hero_nova_energy_range_1'
  | 'hero_nova_energy_range_2'
  | 'hero_nova_energy_cycle_1'
  | 'hero_nova_energy_cycle_2'
  | 'hero_citadel_core'
  | 'hero_citadel_struct_grid_1'
  | 'hero_citadel_struct_grid_2'
  | 'hero_citadel_command_fortress'
  | 'hero_citadel_conduit_integrity'
  | 'hero_citadel_supply_lines'
  | 'hero_citadel_industrial_shell'
  | 'hero_citadel_repair_conduit_mk2'
  | 'hero_citadel_construction_conduit_mk2'
  | 'hero_citadel_defense_conduit_mk2'
  | 'hero_citadel_attack_conduit_mk2'
  | 'hero_citadel_efficiency_conduit_mk2'
  | 'hero_citadel_range_conduit_mk2'
  | 'hero_citadel_defense_centers'
  | 'hero_citadel_enhanced_conductivity'
  | 'hero_citadel_sophisticated_repairs'
  | 'hero_citadel_last_stand'
  | 'hero_citadel_focused_power'
  | 'hero_citadel_unlock_advanced_conduits'
  | 'hero_jupiter_core'
  | 'hero_jupiter_unlock_support_machines'
  | 'hero_jupiter_unlock_advanced_electrical'
  | 'hero_jupiter_unlock_arc_thrower'
  | 'hero_jupiter_grid_tuning_1'
  | 'hero_jupiter_grid_tuning_2'
  | 'hero_jupiter_capacitance_1'
  | 'hero_jupiter_capacitance_2'
  | 'hero_jupiter_transmission_lines'
  | 'hero_jupiter_emergency_shunts'
  | 'hero_jupiter_induction_weave'
  | 'hero_jupiter_mass_relay_mk2'
  | 'hero_jupiter_arc_thrower_mk2'
  | 'hero_jupiter_overclock_mk2'
  | 'hero_jupiter_radar_mk2'
  | 'hero_jupiter_recon_drone_mk2'
  | 'hero_jupiter_battery_complex_mk2'
  | 'hero_jupiter_enhanced_pinging'
  | 'hero_jupiter_emergency_generator'
  | 'hero_jupiter_arc_supercharge'
  | 'hero_kingpin_core'
  | 'hero_kingpin_unlock_advanced_economic_solutions'
  | 'hero_kingpin_unlock_production_enhancements'
  | 'hero_kingpin_unlock_slag_cannon'
  | 'hero_kingpin_factory_dividends_1'
  | 'hero_kingpin_factory_dividends_2'
  | 'hero_kingpin_refinery_contracts_1'
  | 'hero_kingpin_refinery_contracts_2'
  | 'hero_kingpin_venture_capital'
  | 'hero_kingpin_energy_arbitrage'
  | 'hero_kingpin_data_array_mk2'
  | 'hero_kingpin_investment_complex_mk2'
  | 'hero_kingpin_cryptographic_decoder_mk2'
  | 'hero_kingpin_indoctrinated_labor_mk2'
  | 'hero_kingpin_mineral_processor_mk2'
  | 'hero_kingpin_slag_cannon_mk2'
  | 'hero_kingpin_hazard_pay'
  | 'hero_kingpin_insider_discounts'
  | 'hero_kingpin_scavenging'
  | 'hero_kingpin_compound_interest'
  | 'hero_kingpin_signal_amplification'
  | 'hero_kingpin_scrap_futures'

type BuildingModifier = {
  rangeAdd?: number
  damageAdd?: number
  fireRateMul?: number
  creditPayoutMul?: number
  powerGenMul?: number
  projectileSpeedMul?: number

  powerDrainMul?: number
  aoeRadiusMul?: number
  maxHpMul?: number

  shieldCapacityMul?: number
  shieldRechargeMul?: number

  supplyCapAddMul?: number
  powerCapAddMul?: number
  creditIntervalSecMul?: number
  shotCreditCostMul?: number
}

export type UpgradeDef = {
  id: UpgradeId
  label: string
  category: BuildingCategory
  heroId?: HeroId
  creditCost: number
  description: string
  prereqIds?: UpgradeId[]
  unlockBuildingIds?: BuildingId[]
  modifiers?: Partial<Record<BuildingId, BuildingModifier>>
}

/** Origin-centered playable grid: BOARD_SIZE × BOARD_SIZE cells (odd → integer cell coordinates). */
const BOARD_SIZE = Math.max(3, Math.round(101 * 0.8) | 1) // ~20% smaller than legacy 101×101
const HALF = Math.floor(BOARD_SIZE / 2)

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v))
const key = (x: number, z: number) => `${x}:${z}`

// Balance variables: edit these to globally tune pacing.
const VARS = {
  C: 1, // credit costs scale
  P: 1, // power rates scale
  S: 1, // supply scale
  E: 1, // economy outputs scale
  /** Multiplier on base asteroid kill credits (before per-wave scaling). */
  asteroidKillCreditMul: 1.45,
}

/** Min horizontal (XZ) tiles from the **plane** to an asteroid to allow targeting/attacks (not measured from the base). */
const ARCHANGEL_MIN_TARGET_TILE_DIST = 8
/** Airfield gunships and Starport bombers use this flight speed (world units/s); missile speeds still use each building's `projectileSpeed`. */
const ARCHANGEL_PLANE_FLIGHT_SPEED = 40

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
    range: 25.5,
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
    range: 30,
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
    range: 60,
    fireRate: 0.33,
    damage: 260,
    wheelDetails: () => ['Long-range slow artillery', 'High single-target damage'],
  },
  {
    id: 'heavy_siege_gun',
    label: 'Heavy Siege Cannon',
    category: 'turrets',
    color: 0xf97316,
    size: { w: 3, h: 3 },
    maxHp: 980,
    creditCost: Math.round(620 * VARS.C),
    supplyCost: 10,
    powerDrainPerSec: 1.4 * VARS.P,
    kind: 'hitscan',
    range: 66,
    fireRate: 0.24,
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
    range: 105,
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
    damage: 200,
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
    damage: 280,
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
    damage: 600,
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
    damage: 1000,
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
    damage: 2200,
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
    damage: 120,
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
    powerDrainPerSec: 0,
    shieldCapacityMul: 1,
    shieldRechargeMul: 1,
    shieldUpkeepPowerPerSec: 3.6 * VARS.P,
    shieldRegenPowerPerSec: 5.8 * VARS.P,
    shieldBarWidth: 3.5,
    wheelDetails: () => ['Own dome + shield HP bar', 'Upkeep keeps it online; regen costs extra power'],
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
    powerDrainPerSec: 0,
    shieldCapacityMul: 1,
    shieldRechargeMul: 1,
    shieldUpkeepPowerPerSec: 7.6 * VARS.P,
    shieldRegenPowerPerSec: 11.5 * VARS.P,
    shieldBarWidth: 5.2,
    wheelDetails: () => ['Stronger dome + larger shield bar', 'Higher upkeep/regen draw than medium'],
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
  {
    id: 'archangel_airfield',
    label: 'Airfield',
    heroId: 'archangel',
    category: 'hero',
    color: 0xa855f7,
    size: { w: 3, h: 3 },
    maxHp: 920,
    creditCost: Math.round(780 * VARS.C),
    supplyCost: 14,
    powerDrainPerSec: 0.15 * VARS.P,
    range: 42,
    fireRate: 14,
    damage: 9.2,
    projectileSpeed: 24,
    wheelDetails: () => ['Deploys gunships (two with Tight Shift)', 'Long-range bullet stream; needs fuel & bullets'],
  },
  {
    id: 'archangel_starport',
    label: 'Starport',
    heroId: 'archangel',
    category: 'hero',
    color: 0xa855f7,
    size: { w: 3, h: 3 },
    maxHp: 1050,
    creditCost: Math.round(1020 * VARS.C),
    supplyCost: 16,
    powerDrainPerSec: 0.2 * VARS.P,
    range: 36,
    fireRate: 0.19,
    damage: 302,
    aoeRadius: 13.5,
    projectileSpeed: 56,
    wheelDetails: () => ['Deploys bombers (two with Tight Shift)', 'Slow huge missiles; needs fuel & missile ordnance'],
  },
  {
    id: 'archangel_fueling_station',
    label: 'Fueling Station',
    heroId: 'archangel',
    category: 'hero',
    color: 0xa855f7,
    size: { w: 2, h: 2 },
    maxHp: 420,
    creditCost: Math.round(340 * VARS.C),
    supplyCost: 6,
    powerDrainPerSec: 0.48 * VARS.P,
    wheelDetails: () => ['Fuels planes on pad during active waves', 'More stations = faster; needs power'],
  },
  {
    id: 'archangel_bulk_fueling_station',
    label: 'Bulk Fueling Station',
    heroId: 'archangel',
    category: 'hero',
    color: 0xa855f7,
    size: { w: 4, h: 4 },
    maxHp: 980,
    creditCost: Math.round(820 * VARS.C),
    supplyCost: 14,
    powerDrainPerSec: 1.15 * VARS.P,
    wheelDetails: () => ['Heavy pad fueling during waves', 'Unlock via research; high power draw'],
  },
  {
    id: 'archangel_munitions_plant',
    label: 'Munitions Plant',
    heroId: 'archangel',
    category: 'hero',
    color: 0xa855f7,
    size: { w: 2, h: 2 },
    maxHp: 400,
    creditCost: Math.round(290 * VARS.C),
    supplyCost: 5,
    wheelDetails: () => ['Loads gunships on pad during waves', 'More plants = faster bullet transfer'],
  },
  {
    id: 'archangel_missile_factory',
    label: 'Missile Factory',
    heroId: 'archangel',
    category: 'hero',
    color: 0xa855f7,
    size: { w: 2, h: 2 },
    maxHp: 440,
    creditCost: Math.round(360 * VARS.C),
    supplyCost: 6,
    wheelDetails: () => ['Arms bombers on pad during waves', 'Slightly faster load than munitions plants'],
  },
  {
    id: 'dominion_orbital_cannon',
    label: 'Orbital Cannon',
    heroId: 'dominion',
    category: 'hero',
    color: 0xa855f7,
    size: { w: 5, h: 5 },
    maxHp: 2400,
    creditCost: Math.round(2400 * VARS.C),
    supplyCost: 24,
    range: 9999,
    fireRate: 0.2,
    damage: 560,
    aoeRadius: 15,
    kind: 'hitscan',
    wheelDetails: () => ['Huge single shot every 5s', 'Global reach; power-hungry blast + shrapnel'],
  },
  {
    id: 'dominion_flak_gun',
    label: 'Flak Gun',
    heroId: 'dominion',
    category: 'hero',
    color: 0xa855f7,
    size: { w: 2, h: 2 },
    maxHp: 520,
    creditCost: Math.round(420 * VARS.C),
    supplyCost: 5,
    powerDrainPerSec: 0.55 * VARS.P,
    range: 82,
    fireRate: 9,
    damage: 108,
    aoeRadius: 2.2,
    kind: 'hitscan',
    wheelDetails: () => ['Long range; high in sky only', 'Min ground range 15; flak shards on hit'],
  },
  {
    id: 'dominion_seeker_drone_spawner',
    label: 'Seeker Drone Spawner',
    heroId: 'dominion',
    category: 'hero',
    color: 0xa855f7,
    size: { w: 3, h: 3 },
    maxHp: 720,
    creditCost: Math.round(680 * VARS.C),
    supplyCost: 8,
    powerDrainPerSec: 0.35 * VARS.P,
    fireRate: 0.25,
    damage: 2.4,
    projectileSpeed: 17,
    wheelDetails: () => ['Launches a drone every 4s', 'Drone slows & damages attached asteroid'],
  },
  {
    id: 'dominion_defensive_bunker',
    label: 'Defensive Bunker',
    heroId: 'dominion',
    category: 'hero',
    color: 0xa855f7,
    size: { w: 3, h: 3 },
    maxHp: 1950,
    creditCost: Math.round(720 * VARS.C),
    supplyCost: 10,
    powerDrainPerSec: 0.42 * VARS.P,
    range: 38,
    fireRate: 5.5,
    damage: 38,
    kind: 'hitscan',
    wheelDetails: () => ['Very durable emplacement', 'Solid all-round ballistic fire'],
  },
  {
    id: 'dominion_laser_drill',
    label: 'Laser Drill',
    heroId: 'dominion',
    category: 'hero',
    color: 0xa855f7,
    size: { w: 2, h: 2 },
    maxHp: 480,
    creditCost: Math.round(590 * VARS.C),
    supplyCost: 6,
    powerDrainPerSec: 1.1 * VARS.P,
    range: 44,
    fireRate: 2.2,
    damage: 52,
    kind: 'hitscan',
    wheelDetails: () => ['Mining laser pays credits while firing', '1s delay before retarget'],
  },
  {
    id: 'dominion_support_bay',
    label: 'Support Bay',
    heroId: 'dominion',
    category: 'hero',
    color: 0xa855f7,
    size: { w: 3, h: 3 },
    maxHp: 920,
    creditCost: Math.round(820 * VARS.C),
    supplyCost: 8,
    powerDrainPerSec: 0.28 * VARS.P,
    damage: 72,
    fireRate: 0.143,
    projectileSpeed: 11,
    wheelDetails: () => ['One dropship (two with upgrade)', 'Large-area heal, faster than drones'],
  },
  {
    id: 'nova_gravity_well',
    label: 'Gravity Well',
    heroId: 'nova',
    category: 'hero',
    color: 0xa855f7,
    size: { w: 5, h: 5 },
    maxHp: 1420,
    creditCost: Math.round(980 * VARS.C),
    supplyCost: 10,
    powerDrainPerSec: 0.38 * VARS.P,
    wheelDetails: () => ['Each well rolls to pull new asteroids toward it', 'Floating spear + orbiting energy'],
  },
  {
    id: 'nova_photon_projector_s',
    label: 'Photon Projector (S)',
    heroId: 'nova',
    category: 'hero',
    color: 0xa855f7,
    size: { w: 2, h: 2 },
    maxHp: 520,
    creditCost: Math.round(720 * VARS.C),
    supplyCost: 6,
    powerDrainPerSec: 0.95 * VARS.P,
    range: 58,
    fireRate: 0.13,
    damage: 220,
    projectileSpeed: 13,
    aoeRadius: 14,
    kind: 'hitscan',
    wheelDetails: () => ['Slow piercing plasma orb + trail burn', 'Long range, low cadence'],
  },
  {
    id: 'nova_photon_projector_l',
    label: 'Photon Projector (L)',
    heroId: 'nova',
    category: 'hero',
    color: 0xa855f7,
    size: { w: 3, h: 3 },
    maxHp: 780,
    creditCost: Math.round(940 * VARS.C),
    supplyCost: 8,
    powerDrainPerSec: 1.1 * VARS.P,
    range: 72,
    fireRate: 0.1,
    damage: 310,
    projectileSpeed: 11,
    aoeRadius: 17,
    kind: 'hitscan',
    wheelDetails: () => ['Larger variant: heavier orb and trail', 'Pierces all targets along the path'],
  },
  {
    id: 'nova_shockwave_pulsar',
    label: 'Shockwave Pulsar',
    heroId: 'nova',
    category: 'hero',
    color: 0xa855f7,
    size: { w: 3, h: 3 },
    maxHp: 680,
    creditCost: Math.round(760 * VARS.C),
    supplyCost: 7,
    powerDrainPerSec: 0.52 * VARS.P,
    range: 68,
    fireRate: 0.17,
    damage: 16,
    aoeRadius: 24,
    kind: 'hitscan',
    wheelDetails: () => ['Periodic wide shockwave', 'Slows struck asteroids; upgrade can stasis'],
  },
  {
    id: 'nova_universal_forcefield',
    label: 'Universal Forcefield',
    heroId: 'nova',
    category: 'hero',
    color: 0xa855f7,
    size: { w: 5, h: 5 },
    maxHp: 2200,
    creditCost: Math.round(1680 * VARS.C),
    supplyCost: 14,
    powerDrainPerSec: 0,
    range: 86,
    kind: 'shield',
    shieldCapacityMul: 1,
    shieldRechargeMul: 1,
    shieldUpkeepPowerPerSec: 1.58 * VARS.P,
    shieldRegenPowerPerSec: 3.3 * VARS.P,
    shieldBarWidth: 8.5,
    wheelDetails: () => ['Stackable; one shared map bubble at HQ', 'Low flat dome; survives if any generator lives'],
  },
  {
    id: 'nova_power_bank',
    label: 'Power Bank',
    heroId: 'nova',
    category: 'hero',
    color: 0xa855f7,
    size: { w: 2, h: 2 },
    maxHp: 420,
    creditCost: Math.round(520 * VARS.C),
    supplyCost: 4,
    powerDrainPerSec: 0.12 * VARS.P,
    range: 12,
    wheelDetails: () => ['Aura: weapons nearby pay less shot power', 'Upgrade adds a small damage boost'],
  },
  {
    id: 'citadel_repair_conduit',
    label: 'Repair Conduit',
    heroId: 'citadel',
    category: 'hero',
    color: 0x14b8a6,
    size: { w: 2, h: 2 },
    maxHp: 560,
    creditCost: Math.round(520 * VARS.C),
    supplyCost: 3,
    powerDrainPerSec: 0,
    range: 14,
    fireRate: 0.25,
    damage: 38,
    citadelConduit: { kind: 'repair', radius: 14, strength: 38 },
    wheelDetails: () => ['Larger support hub', 'Pulse heals allies in radius; costs power per pulse'],
  },
  {
    id: 'citadel_construction_conduit',
    label: 'Construction Conduit',
    heroId: 'citadel',
    category: 'hero',
    color: 0x0d9488,
    size: { w: 3, h: 3 },
    maxHp: 920,
    creditCost: Math.round(980 * VARS.C),
    supplyCost: 6,
    powerDrainPerSec: 0.35 * VARS.P,
    citadelConduit: { kind: 'construction', radius: 16, strength: 0.14 },
    wheelDetails: () => ['Industrial coordinator', 'New builds centered in aura pay fewer credits'],
  },
  {
    id: 'citadel_defense_conduit',
    label: 'Defense Conduit',
    heroId: 'citadel',
    category: 'hero',
    color: 0x5eead4,
    size: { w: 1, h: 1 },
    maxHp: 220,
    creditCost: Math.round(220 * VARS.C),
    supplyCost: 1,
    powerDrainPerSec: 0.08 * VARS.P,
    citadelConduit: { kind: 'defense', radius: 5.5, strength: 0.12 },
    wheelDetails: () => ['Warding lattice', 'Buildings in aura take less impact damage'],
  },
  {
    id: 'citadel_attack_conduit',
    label: 'Attack Conduit',
    heroId: 'citadel',
    category: 'hero',
    color: 0x2dd4bf,
    size: { w: 1, h: 1 },
    maxHp: 210,
    creditCost: Math.round(240 * VARS.C),
    supplyCost: 2,
    powerDrainPerSec: 0.2 * VARS.P,
    citadelConduit: { kind: 'attack', radius: 5.5, strength: 0.12 },
    wheelDetails: () => ['Targeting relay', 'Defenses in aura deal more damage'],
  },
  {
    id: 'citadel_efficiency_conduit',
    label: 'Efficiency Conduit',
    heroId: 'citadel',
    category: 'hero',
    color: 0x99f6e4,
    size: { w: 1, h: 1 },
    maxHp: 200,
    creditCost: Math.round(260 * VARS.C),
    supplyCost: 2,
    powerDrainPerSec: 0.15 * VARS.P,
    citadelConduit: { kind: 'efficiency', radius: 5.5, strength: 0.12 },
    wheelDetails: () => ['Cycle harmonizer', 'Defenses in aura fire faster'],
  },
  {
    id: 'citadel_range_conduit',
    label: 'Range Conduit',
    heroId: 'citadel',
    category: 'hero',
    color: 0xccfbf1,
    size: { w: 1, h: 1 },
    maxHp: 200,
    creditCost: Math.round(230 * VARS.C),
    supplyCost: 2,
    powerDrainPerSec: 0.12 * VARS.P,
    citadelConduit: { kind: 'range', radius: 5.5, strength: 4 },
    wheelDetails: () => ['Sensor mast', 'Defenses in aura gain reach'],
  },
  {
    id: 'jupiter_mass_relay',
    label: 'Mass Relay',
    heroId: 'jupiter',
    category: 'hero',
    color: 0xc4b5fd,
    size: { w: 3, h: 3 },
    maxHp: 820,
    creditCost: Math.round(980 * VARS.C),
    supplyCost: 5,
    powerGenPerSec: 0,
    powerDrainPerSec: 0.15 * VARS.P,
    wheelDetails: () => ['Network hub', 'Shares one health pool across all relays; links relays for power'],
  },
  {
    id: 'jupiter_arc_thrower',
    label: 'Arc Thrower',
    heroId: 'jupiter',
    category: 'hero',
    color: 0x818cf8,
    size: { w: 2, h: 2 },
    maxHp: 640,
    creditCost: Math.round(1100 * VARS.C),
    supplyCost: 8,
    powerDrainPerSec: 0,
    kind: 'hitscan',
    range: 56,
    fireRate: 0.42,
    damage: 88,
    wheelDetails: () => ['Chaining lightning', 'Stronger draws chain farther when you have stored energy'],
  },
  {
    id: 'jupiter_overclock_augment',
    label: 'Overclock Augment',
    heroId: 'jupiter',
    category: 'hero',
    color: 0xfbbf24,
    size: { w: 1, h: 1 },
    maxHp: 210,
    creditCost: Math.round(340 * VARS.C),
    supplyCost: 2,
    powerDrainPerSec: 0,
    wheelDetails: () => ['Burn power', 'Adjacent defenses fire much faster while energized'],
  },
  {
    id: 'jupiter_radar_station',
    label: 'Radar Station',
    heroId: 'jupiter',
    category: 'hero',
    color: 0x38bdf8,
    size: { w: 3, h: 3 },
    maxHp: 780,
    creditCost: Math.round(860 * VARS.C),
    supplyCost: 6,
    powerDrainPerSec: 0,
    range: 46,
    wheelDetails: () => ['Paints threats', 'Marked rocks take more hurt and refund energy when destroyed'],
  },
  {
    id: 'jupiter_recon_drone',
    label: 'Recon Drone',
    heroId: 'jupiter',
    category: 'hero',
    color: 0x94a3b8,
    size: { w: 1, h: 1 },
    maxHp: 190,
    creditCost: Math.round(420 * VARS.C),
    supplyCost: 3,
    powerDrainPerSec: 0.42 * VARS.P,
    kind: 'hitscan',
    range: 22,
    fireRate: 12,
    damage: 4.4,
    wheelDetails: () => ['High orbit coil', 'Medium-range Tesla-style arcs; boosts power from buildings below'],
  },
  {
    id: 'jupiter_battery_complex',
    label: 'Battery Complex',
    heroId: 'jupiter',
    category: 'hero',
    color: 0xeab308,
    size: { w: 4, h: 4 },
    maxHp: 1100,
    creditCost: Math.round(1180 * VARS.C),
    supplyCost: 4,
    powerCapAdd: Math.round(220 * VARS.P),
    powerGenPerSec: 2.8 * VARS.P,
    powerDrainPerSec: 0.08 * VARS.P,
    wheelDetails: () => ['Strategic reserve', 'Slow trickle charge; stronger when the grid is near empty'],
  },
  {
    id: 'kingpin_data_array',
    label: 'Data Array',
    heroId: 'kingpin',
    category: 'hero',
    color: 0xa855f7,
    size: { w: 2, h: 2 },
    maxHp: 260,
    creditCost: Math.round(520 * VARS.C),
    supplyCost: 4,
    powerDrainPerSec: 0.55 * VARS.P,
    creditPayout: Math.round(520 * VARS.E),
    creditIntervalSec: 34,
    wheelDetails: () => ['Fragile uplink', 'Long batch time, very large credit dump'],
  },
  {
    id: 'kingpin_investment_complex',
    label: 'Investment Complex',
    heroId: 'kingpin',
    category: 'hero',
    color: 0xc084fc,
    size: { w: 3, h: 3 },
    maxHp: 720,
    creditCost: Math.round(780 * VARS.C),
    supplyCost: 6,
    powerDrainPerSec: 0.4 * VARS.P,
    creditPayout: 12,
    wheelDetails: () => ['Wealth engine', 'Passive credits; rate rises with banked balance'],
  },
  {
    id: 'kingpin_cryptographic_decoder',
    label: 'Cryptographic Decoder',
    heroId: 'kingpin',
    category: 'hero',
    color: 0xe879f9,
    size: { w: 2, h: 2 },
    maxHp: 520,
    creditCost: Math.round(640 * VARS.C),
    supplyCost: 5,
    powerDrainPerSec: 0.22 * VARS.P,
    range: 11,
    wheelDetails: () => ['Refinery aura', 'Nearby refineries export more per tick'],
  },
  {
    id: 'kingpin_indoctrinated_labor',
    label: 'Indoctrinated Labor',
    heroId: 'kingpin',
    category: 'hero',
    color: 0x7c3aed,
    size: { w: 2, h: 2 },
    maxHp: 560,
    creditCost: Math.round(680 * VARS.C),
    supplyCost: 5,
    powerDrainPerSec: 0.28 * VARS.P,
    range: 11,
    wheelDetails: () => ['Factory aura', 'Nearby factories draw no idle power'],
  },
  {
    id: 'kingpin_mineral_processor',
    label: 'Mineral Processor',
    heroId: 'kingpin',
    category: 'hero',
    color: 0xf472b6,
    size: { w: 3, h: 3 },
    maxHp: 840,
    creditCost: Math.round(920 * VARS.C),
    supplyCost: 7,
    powerDrainPerSec: 0.35 * VARS.P,
    range: 13,
    wheelDetails: () => ['Salvage routing', 'Combat kills near linked turrets pay credits'],
  },
  {
    id: 'kingpin_slag_cannon',
    label: 'Slag Cannon',
    heroId: 'kingpin',
    category: 'hero',
    color: 0xf43f5e,
    size: { w: 3, h: 3 },
    maxHp: 920,
    creditCost: Math.round(720 * VARS.C),
    supplyCost: 11,
    powerDrainPerSec: 1.25 * VARS.P,
    kind: 'hitscan',
    range: 64,
    fireRate: 0.36,
    damage: 360,
    shotCreditCost: Math.round(24 * VARS.C),
    wheelDetails: () => ['Heavy breacher', 'Faster than siege heavy; each shot spends credits'],
  },
]

const UPGRADES_RAW: UpgradeDef[] = [
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
    description: 'Unlocks larger and specialized turret/cannon platforms.',
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
    label: 'Heavy Siege Cannon Level 2',
    category: 'turrets',
    creditCost: 1250,
    description: 'Heavy Siege Cannons gain range and heavy-shot damage.',
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
  {
    id: 'hero_archangel_core',
    label: 'Archangel Logistic Core',
    heroId: 'archangel',
    category: 'hero',
    creditCost: 0,
    description:
      'Unlocks Airfield, Starport, Fueling Station, Munitions Plant, and Missile Factory. Bulk Fueling requires a separate unlock.',
    unlockBuildingIds: [
      'archangel_airfield',
      'archangel_starport',
      'archangel_fueling_station',
      'archangel_munitions_plant',
      'archangel_missile_factory',
    ],
  },
  {
    id: 'hero_archangel_unlock_bulk_fueling',
    label: 'Unlock Bulk Fueling Station',
    heroId: 'archangel',
    category: 'hero',
    creditCost: 520,
    description: 'Unlocks the large Bulk Fueling Station for faster pad refueling.',
    prereqIds: ['hero_archangel_core'],
    unlockBuildingIds: ['archangel_bulk_fueling_station'],
  },
  {
    id: 'hero_archangel_fuel_efficiency_1',
    label: 'Increase Fuel Efficiency I',
    heroId: 'archangel',
    category: 'hero',
    creditCost: 420,
    description: 'Fueling stations transfer aviation fuel to landed planes faster.',
    prereqIds: ['hero_archangel_core'],
  },
  {
    id: 'hero_archangel_fuel_efficiency_2',
    label: 'Increase Fuel Efficiency II',
    heroId: 'archangel',
    category: 'hero',
    creditCost: 620,
    description: 'Further improves fuel transfer rate to aircraft on the pad.',
    prereqIds: ['hero_archangel_fuel_efficiency_1'],
  },
  {
    id: 'hero_archangel_armor_piercing',
    label: 'Armor Piercing Rounds',
    heroId: 'archangel',
    category: 'hero',
    creditCost: 520,
    description: 'Increases Airfield gunship damage.',
    prereqIds: ['hero_archangel_core'],
    modifiers: {
      archangel_airfield: { damageAdd: 1.4 },
    },
  },
  {
    id: 'hero_archangel_quick_reload',
    label: 'Quick Reload',
    heroId: 'archangel',
    category: 'hero',
    creditCost: 560,
    description: 'Starport bombers reload volleys faster (shorter gap between missiles and between volleys).',
    prereqIds: ['hero_archangel_core'],
  },
  {
    id: 'hero_archangel_tight_shift',
    label: 'Tight Shift',
    heroId: 'archangel',
    category: 'hero',
    creditCost: 780,
    description: 'Each Airfield and Starport runs two planes: more sorties and overlapping refuel cycles.',
    prereqIds: ['hero_archangel_core'],
  },
  {
    id: 'hero_archangel_airfield_mk2',
    label: 'Airfield Level 2',
    heroId: 'archangel',
    category: 'hero',
    creditCost: 720,
    description: 'Gunship platform: more range, damage, and rate of fire.',
    prereqIds: ['hero_archangel_core'],
    modifiers: {
      archangel_airfield: { rangeAdd: 4, damageAdd: 0.9, fireRateMul: 1.08, projectileSpeedMul: 1.06 },
    },
  },
  {
    id: 'hero_archangel_starport_mk2',
    label: 'Starport Level 2',
    heroId: 'archangel',
    category: 'hero',
    creditCost: 880,
    description: 'Bomber platform: heavier warheads and slightly faster launches.',
    prereqIds: ['hero_archangel_core'],
    modifiers: {
      archangel_starport: { damageAdd: 38, aoeRadiusMul: 1.1, fireRateMul: 1.06 },
    },
  },
  {
    id: 'hero_archangel_fueling_mk2',
    label: 'Fueling Station Level 2',
    heroId: 'archangel',
    category: 'hero',
    creditCost: 480,
    description: 'Small fuel stations fuel landed aircraft faster.',
    prereqIds: ['hero_archangel_core'],
  },
  {
    id: 'hero_archangel_bulk_fueling_mk2',
    label: 'Bulk Fueling Level 2',
    heroId: 'archangel',
    category: 'hero',
    creditCost: 920,
    description: 'Bulk fuel stations fuel landed aircraft faster.',
    prereqIds: ['hero_archangel_unlock_bulk_fueling'],
  },
  {
    id: 'hero_archangel_munitions_mk2',
    label: 'Munitions Plant Level 2',
    heroId: 'archangel',
    category: 'hero',
    creditCost: 460,
    description: 'Munitions plants convert credits into gunship rounds faster while planes are on the pad.',
    prereqIds: ['hero_archangel_core'],
  },
  {
    id: 'hero_archangel_missile_factory_mk2',
    label: 'Missile Factory Level 2',
    heroId: 'archangel',
    category: 'hero',
    creditCost: 540,
    description: 'Missile factories load bomber ordnance faster while bombers are on the pad.',
    prereqIds: ['hero_archangel_core'],
  },
  {
    id: 'hero_archangel_missile_damage_1',
    label: 'Missile Doctrine: Damage I',
    heroId: 'archangel',
    category: 'hero',
    creditCost: 580,
    description: 'Increases damage for standard missile buildings (S/M silos, portable, silo, nuclear, Hydra).',
    prereqIds: ['hero_archangel_core'],
    modifiers: {
      missile_launcher_s: { damageAdd: 10 },
      missile_launcher_m: { damageAdd: 14 },
      portable_silo: { damageAdd: 28 },
      missile_silo: { damageAdd: 42 },
      nuclear_silo: { damageAdd: 95 },
      hydra_launcher: { damageAdd: 8 },
    },
  },
  {
    id: 'hero_archangel_missile_damage_2',
    label: 'Missile Doctrine: Damage II',
    heroId: 'archangel',
    category: 'hero',
    creditCost: 980,
    description: 'Further increases missile damage across the missile line.',
    prereqIds: ['hero_archangel_missile_damage_1'],
    modifiers: {
      missile_launcher_s: { damageAdd: 14 },
      missile_launcher_m: { damageAdd: 20 },
      portable_silo: { damageAdd: 40 },
      missile_silo: { damageAdd: 62 },
      nuclear_silo: { damageAdd: 140 },
      hydra_launcher: { damageAdd: 12 },
    },
  },
  {
    id: 'hero_archangel_missile_range_1',
    label: 'Missile Doctrine: Range I',
    heroId: 'archangel',
    category: 'hero',
    creditCost: 520,
    description: 'Increases engagement range for missile platforms.',
    prereqIds: ['hero_archangel_core'],
    modifiers: {
      missile_launcher_s: { rangeAdd: 3 },
      missile_launcher_m: { rangeAdd: 4 },
      portable_silo: { rangeAdd: 4 },
      missile_silo: { rangeAdd: 5 },
      nuclear_silo: { rangeAdd: 6 },
      hydra_launcher: { rangeAdd: 2 },
    },
  },
  {
    id: 'hero_archangel_missile_range_2',
    label: 'Missile Doctrine: Range II',
    heroId: 'archangel',
    category: 'hero',
    creditCost: 900,
    description: 'Further increases missile range.',
    prereqIds: ['hero_archangel_missile_range_1'],
    modifiers: {
      missile_launcher_s: { rangeAdd: 4 },
      missile_launcher_m: { rangeAdd: 5 },
      portable_silo: { rangeAdd: 5 },
      missile_silo: { rangeAdd: 6 },
      nuclear_silo: { rangeAdd: 8 },
      hydra_launcher: { rangeAdd: 3 },
    },
  },
  {
    id: 'hero_archangel_missile_payload_1',
    label: 'Missile Doctrine: Payload I',
    heroId: 'archangel',
    category: 'hero',
    creditCost: 560,
    description: 'Improves blast radius for missile buildings (Hydra gains fire rate).',
    prereqIds: ['hero_archangel_core'],
    modifiers: {
      missile_launcher_s: { aoeRadiusMul: 1.12 },
      missile_launcher_m: { aoeRadiusMul: 1.12 },
      portable_silo: { aoeRadiusMul: 1.1 },
      missile_silo: { aoeRadiusMul: 1.1 },
      nuclear_silo: { aoeRadiusMul: 1.08 },
      hydra_launcher: { fireRateMul: 1.08 },
    },
  },
  {
    id: 'hero_archangel_missile_payload_2',
    label: 'Missile Doctrine: Payload II',
    heroId: 'archangel',
    category: 'hero',
    creditCost: 940,
    description: 'Further improves payload radius and adds a touch of damage.',
    prereqIds: ['hero_archangel_missile_payload_1'],
    modifiers: {
      missile_launcher_s: { aoeRadiusMul: 1.12, damageAdd: 8 },
      missile_launcher_m: { aoeRadiusMul: 1.12, damageAdd: 12 },
      portable_silo: { aoeRadiusMul: 1.1, damageAdd: 22 },
      missile_silo: { aoeRadiusMul: 1.1, damageAdd: 35 },
      nuclear_silo: { aoeRadiusMul: 1.08, damageAdd: 70 },
      hydra_launcher: { fireRateMul: 1.1, damageAdd: 10 },
    },
  },
  {
    id: 'hero_dominion_core',
    label: 'Dominion Command Mandate',
    heroId: 'dominion',
    category: 'hero',
    creditCost: 0,
    description: 'Unlocks the Defensive Bunker and Support Bay.',
    unlockBuildingIds: ['dominion_defensive_bunker', 'dominion_support_bay'],
  },
  {
    id: 'hero_dominion_unlock_elite_weaponry',
    label: 'Unlock Elite Weaponry',
    heroId: 'dominion',
    category: 'hero',
    creditCost: 680,
    description: 'Unlocks the Orbital Cannon and Flak Gun.',
    prereqIds: ['hero_dominion_core'],
    unlockBuildingIds: ['dominion_orbital_cannon', 'dominion_flak_gun'],
  },
  {
    id: 'hero_dominion_unlock_advanced_tech',
    label: 'Unlock Advanced Tech',
    heroId: 'dominion',
    category: 'hero',
    creditCost: 720,
    description: 'Unlocks the Seeker Drone Spawner and Laser Drill.',
    prereqIds: ['hero_dominion_core'],
    unlockBuildingIds: ['dominion_seeker_drone_spawner', 'dominion_laser_drill'],
  },
  {
    id: 'hero_dominion_extended_support',
    label: 'Extended Support',
    heroId: 'dominion',
    category: 'hero',
    creditCost: 560,
    description: 'Support Bays can deploy up to two dropships at once.',
    prereqIds: ['hero_dominion_core'],
  },
  {
    id: 'hero_dominion_enhanced_power',
    label: 'Enhanced Power',
    heroId: 'dominion',
    category: 'hero',
    creditCost: 520,
    description: 'All Dominion structures deal additional damage.',
    prereqIds: ['hero_dominion_core'],
    modifiers: {
      dominion_orbital_cannon: { damageAdd: 55 },
      dominion_flak_gun: { damageAdd: 14 },
      dominion_defensive_bunker: { damageAdd: 8 },
      dominion_laser_drill: { damageAdd: 12 },
      dominion_seeker_drone_spawner: { damageAdd: 0.5 },
      dominion_support_bay: { damageAdd: 12 },
    },
  },
  {
    id: 'hero_dominion_reinforced_plating',
    label: 'Reinforced Plating',
    heroId: 'dominion',
    category: 'hero',
    creditCost: 540,
    description: 'All Dominion structures gain increased maximum health.',
    prereqIds: ['hero_dominion_core'],
    modifiers: {
      dominion_orbital_cannon: { maxHpMul: 1.14 },
      dominion_flak_gun: { maxHpMul: 1.14 },
      dominion_seeker_drone_spawner: { maxHpMul: 1.14 },
      dominion_defensive_bunker: { maxHpMul: 1.14 },
      dominion_laser_drill: { maxHpMul: 1.14 },
      dominion_support_bay: { maxHpMul: 1.14 },
    },
  },
  {
    id: 'hero_dominion_lead_rounds',
    label: 'Lead Rounds',
    heroId: 'dominion',
    category: 'hero',
    creditCost: 480,
    description: 'Orbital and Flak shrapnel counts are 50% higher (18 and 6 shards).',
    prereqIds: ['hero_dominion_unlock_elite_weaponry'],
  },
  {
    id: 'hero_dominion_orbital_mk2',
    label: 'Orbital Cannon Level 2',
    heroId: 'dominion',
    category: 'hero',
    creditCost: 1100,
    description: 'Larger blast, harder hit, slightly faster cycle.',
    prereqIds: ['hero_dominion_unlock_elite_weaponry'],
    modifiers: {
      dominion_orbital_cannon: { damageAdd: 90, aoeRadiusMul: 1.08, fireRateMul: 1.12 },
    },
  },
  {
    id: 'hero_dominion_flak_mk2',
    label: 'Flak Gun Level 2',
    heroId: 'dominion',
    category: 'hero',
    creditCost: 520,
    description: 'More range, damage, and rate of fire.',
    prereqIds: ['hero_dominion_unlock_elite_weaponry'],
    modifiers: {
      dominion_flak_gun: { rangeAdd: 6, damageAdd: 18, fireRateMul: 1.1 },
    },
  },
  {
    id: 'hero_dominion_bunker_mk2',
    label: 'Defensive Bunker Level 2',
    heroId: 'dominion',
    category: 'hero',
    creditCost: 620,
    description: 'Bunker gains durability and punch.',
    prereqIds: ['hero_dominion_core'],
    modifiers: {
      dominion_defensive_bunker: { damageAdd: 10, rangeAdd: 3, maxHpMul: 1.08 },
    },
  },
  {
    id: 'hero_dominion_spawner_mk2',
    label: 'Seeker Spawner Level 2',
    heroId: 'dominion',
    category: 'hero',
    creditCost: 640,
    description: 'Drones launch faster and hit harder.',
    prereqIds: ['hero_dominion_unlock_advanced_tech'],
    modifiers: {
      dominion_seeker_drone_spawner: { fireRateMul: 1.15, maxHpMul: 1.1, projectileSpeedMul: 1.12 },
    },
  },
  {
    id: 'hero_dominion_drill_mk2',
    label: 'Laser Drill Level 2',
    heroId: 'dominion',
    category: 'hero',
    creditCost: 580,
    description: 'Stronger beam and longer reach.',
    prereqIds: ['hero_dominion_unlock_advanced_tech'],
    modifiers: {
      dominion_laser_drill: { damageAdd: 16, rangeAdd: 5, fireRateMul: 1.08 },
    },
  },
  {
    id: 'hero_dominion_support_mk2',
    label: 'Support Bay Level 2',
    heroId: 'dominion',
    category: 'hero',
    creditCost: 740,
    description: 'Dropships heal faster and fly quicker.',
    prereqIds: ['hero_dominion_core'],
    modifiers: {
      dominion_support_bay: { damageAdd: 22, fireRateMul: 1.12, projectileSpeedMul: 1.1 },
    },
  },
  {
    id: 'hero_dominion_turret_damage_1',
    label: 'Turret Battery: Damage I',
    heroId: 'dominion',
    category: 'hero',
    creditCost: 520,
    description: 'Increases damage for standard turrets.',
    prereqIds: ['hero_dominion_core'],
    modifiers: {
      auto_turret: { damageAdd: 4 },
      auto_turret_large: { damageAdd: 6 },
      siege_cannon: { damageAdd: 55 },
      heavy_siege_gun: { damageAdd: 85 },
      aa_gun: { damageAdd: 12 },
      railgun: { damageAdd: 140 },
    },
  },
  {
    id: 'hero_dominion_turret_damage_2',
    label: 'Turret Battery: Damage II',
    heroId: 'dominion',
    category: 'hero',
    creditCost: 920,
    description: 'Further increases turret damage.',
    prereqIds: ['hero_dominion_turret_damage_1'],
    modifiers: {
      auto_turret: { damageAdd: 5 },
      auto_turret_large: { damageAdd: 8 },
      siege_cannon: { damageAdd: 80 },
      heavy_siege_gun: { damageAdd: 120 },
      aa_gun: { damageAdd: 16 },
      railgun: { damageAdd: 200 },
    },
  },
  {
    id: 'hero_dominion_turret_range_1',
    label: 'Turret Battery: Range I',
    heroId: 'dominion',
    category: 'hero',
    creditCost: 480,
    description: 'Increases engagement range for turrets.',
    prereqIds: ['hero_dominion_core'],
    modifiers: {
      auto_turret: { rangeAdd: 3 },
      auto_turret_large: { rangeAdd: 4 },
      siege_cannon: { rangeAdd: 4 },
      heavy_siege_gun: { rangeAdd: 4 },
      aa_gun: { rangeAdd: 3 },
      railgun: { rangeAdd: 5 },
    },
  },
  {
    id: 'hero_dominion_turret_range_2',
    label: 'Turret Battery: Range II',
    heroId: 'dominion',
    category: 'hero',
    creditCost: 860,
    description: 'Further increases turret range.',
    prereqIds: ['hero_dominion_turret_range_1'],
    modifiers: {
      auto_turret: { rangeAdd: 4 },
      auto_turret_large: { rangeAdd: 5 },
      siege_cannon: { rangeAdd: 5 },
      heavy_siege_gun: { rangeAdd: 5 },
      aa_gun: { rangeAdd: 4 },
      railgun: { rangeAdd: 6 },
    },
  },
  {
    id: 'hero_dominion_turret_rof_1',
    label: 'Turret Battery: Cycle I',
    heroId: 'dominion',
    category: 'hero',
    creditCost: 500,
    description: 'Increases turret rate of fire.',
    prereqIds: ['hero_dominion_core'],
    modifiers: {
      auto_turret: { fireRateMul: 1.1 },
      auto_turret_large: { fireRateMul: 1.1 },
      siege_cannon: { fireRateMul: 1.08 },
      heavy_siege_gun: { fireRateMul: 1.08 },
      aa_gun: { fireRateMul: 1.1 },
      railgun: { fireRateMul: 1.05 },
    },
  },
  {
    id: 'hero_dominion_turret_rof_2',
    label: 'Turret Battery: Cycle II',
    heroId: 'dominion',
    category: 'hero',
    creditCost: 880,
    description: 'Further increases turret cadence.',
    prereqIds: ['hero_dominion_turret_rof_1'],
    modifiers: {
      auto_turret: { fireRateMul: 1.1 },
      auto_turret_large: { fireRateMul: 1.1 },
      siege_cannon: { fireRateMul: 1.08 },
      heavy_siege_gun: { fireRateMul: 1.08 },
      aa_gun: { fireRateMul: 1.1 },
      railgun: { fireRateMul: 1.06 },
    },
  },
  {
    id: 'hero_nova_core',
    label: 'Nova Command Mandate',
    heroId: 'nova',
    category: 'hero',
    creditCost: 0,
    description: 'Unlocks Gravity Well, Photon Projector (S), and Power Bank.',
    unlockBuildingIds: ['nova_gravity_well', 'nova_photon_projector_s', 'nova_power_bank'],
  },
  {
    id: 'hero_nova_unlock_advanced_weaponry',
    label: 'Unlock Advanced Weaponry',
    heroId: 'nova',
    category: 'hero',
    creditCost: 640,
    description: 'Unlocks Photon Projector (L) and the Shockwave Pulsar.',
    prereqIds: ['hero_nova_core'],
    unlockBuildingIds: ['nova_photon_projector_l', 'nova_shockwave_pulsar'],
  },
  {
    id: 'hero_nova_unlock_forcefield',
    label: 'Unlock Universal Forcefield',
    heroId: 'nova',
    category: 'hero',
    creditCost: 1180,
    description: 'Unlocks the map-wide Universal Forcefield (one per run).',
    prereqIds: ['hero_nova_core'],
    unlockBuildingIds: ['nova_universal_forcefield'],
  },
  {
    id: 'hero_nova_shield_implosion',
    label: 'Shield Implosion',
    heroId: 'nova',
    category: 'hero',
    creditCost: 720,
    description:
      'When a shield generator or Universal Forcefield bubble is fully depleted by an asteroid, it releases a huge low-damage pulse.',
    prereqIds: ['hero_nova_core'],
  },
  {
    id: 'hero_nova_energized_power_bank',
    label: 'Energized Power Bank',
    heroId: 'nova',
    category: 'hero',
    creditCost: 560,
    description: 'Power Banks also grant a small damage bonus to weapons in their aura.',
    prereqIds: ['hero_nova_core'],
  },
  {
    id: 'hero_nova_fission_blast',
    label: 'Fission Blast',
    heroId: 'nova',
    category: 'hero',
    creditCost: 680,
    description: 'Photon orbs detonate in a large blast when their flight time ends.',
    prereqIds: ['hero_nova_unlock_advanced_weaponry'],
  },
  {
    id: 'hero_nova_stasis_surge',
    label: 'Stasis Surge',
    heroId: 'nova',
    category: 'hero',
    creditCost: 620,
    description: 'Shockwave Pulsar hits briefly lock asteroids in place.',
    prereqIds: ['hero_nova_unlock_advanced_weaponry'],
  },
  {
    id: 'hero_nova_gravity_well_mk2',
    label: 'Gravity Well Level 2',
    heroId: 'nova',
    category: 'hero',
    creditCost: 980,
    description: 'Sturdier well core; slightly lower idle power draw.',
    prereqIds: ['hero_nova_core'],
    modifiers: {
      nova_gravity_well: { maxHpMul: 1.14, powerDrainMul: 0.9 },
    },
  },
  {
    id: 'hero_nova_photon_s_mk2',
    label: 'Photon Projector (S) Level 2',
    heroId: 'nova',
    category: 'hero',
    creditCost: 860,
    description: 'Tighter emitter cycle, harder hits, and longer reach for the small projector.',
    prereqIds: ['hero_nova_core'],
    modifiers: {
      nova_photon_projector_s: { damageAdd: 38, rangeAdd: 6, fireRateMul: 1.1, projectileSpeedMul: 1.08 },
    },
  },
  {
    id: 'hero_nova_photon_l_mk2',
    label: 'Photon Projector (L) Level 2',
    heroId: 'nova',
    category: 'hero',
    creditCost: 1020,
    description: 'Heavy orb variant: more damage, wider trail burn, and punch-through speed.',
    prereqIds: ['hero_nova_unlock_advanced_weaponry'],
    modifiers: {
      nova_photon_projector_l: { damageAdd: 55, rangeAdd: 8, fireRateMul: 1.08, aoeRadiusMul: 1.1, projectileSpeedMul: 1.06 },
    },
  },
  {
    id: 'hero_nova_shockwave_mk2',
    label: 'Shockwave Pulsar Level 2',
    heroId: 'nova',
    category: 'hero',
    creditCost: 920,
    description: 'Wider concussion front with a faster pulse cadence.',
    prereqIds: ['hero_nova_unlock_advanced_weaponry'],
    modifiers: {
      nova_shockwave_pulsar: { damageAdd: 6, aoeRadiusMul: 1.12, fireRateMul: 1.12 },
    },
  },
  {
    id: 'hero_nova_forcefield_mk2',
    label: 'Universal Forcefield Level 2',
    heroId: 'nova',
    category: 'hero',
    creditCost: 1380,
    description: 'Raises global barrier capacity and slightly extends coverage.',
    prereqIds: ['hero_nova_unlock_forcefield'],
    modifiers: {
      nova_universal_forcefield: { maxHpMul: 1.12, rangeAdd: 6, shieldCapacityMul: 1.12, powerDrainMul: 0.94 },
    },
  },
  {
    id: 'hero_nova_power_bank_mk2',
    label: 'Power Bank Level 2',
    heroId: 'nova',
    category: 'hero',
    creditCost: 720,
    description: 'Larger coupling field: wider efficiency aura and tougher hardware.',
    prereqIds: ['hero_nova_core'],
    modifiers: {
      nova_power_bank: { maxHpMul: 1.15, rangeAdd: 3, powerDrainMul: 0.88 },
    },
  },
  {
    id: 'hero_nova_energy_damage_1',
    label: 'Energy Doctrine: Yield I',
    heroId: 'nova',
    category: 'energy',
    creditCost: 540,
    description: 'Boosts output from Tesla towers, plasma lasers, and Nova energy weapons.',
    prereqIds: ['hero_nova_core'],
    modifiers: {
      tesla_tower: { damageAdd: 7 },
      plasma_laser_s: { damageAdd: 22 },
      plasma_laser_m: { damageAdd: 32 },
      plasma_laser_l: { damageAdd: 44 },
      nova_photon_projector_s: { damageAdd: 28 },
      nova_photon_projector_l: { damageAdd: 36 },
      nova_shockwave_pulsar: { damageAdd: 4 },
    },
  },
  {
    id: 'hero_nova_energy_damage_2',
    label: 'Energy Doctrine: Yield II',
    heroId: 'nova',
    category: 'energy',
    creditCost: 920,
    description: 'Further raises energy-weapon damage across the grid.',
    prereqIds: ['hero_nova_energy_damage_1'],
    modifiers: {
      tesla_tower: { damageAdd: 9 },
      plasma_laser_s: { damageAdd: 28 },
      plasma_laser_m: { damageAdd: 40 },
      plasma_laser_l: { damageAdd: 55 },
      nova_photon_projector_s: { damageAdd: 34 },
      nova_photon_projector_l: { damageAdd: 44 },
      nova_shockwave_pulsar: { damageAdd: 5 },
    },
  },
  {
    id: 'hero_nova_energy_range_1',
    label: 'Energy Doctrine: Reach I',
    heroId: 'nova',
    category: 'energy',
    creditCost: 580,
    description: 'Extends range on standard energy turrets and Nova emitters.',
    prereqIds: ['hero_nova_core'],
    modifiers: {
      tesla_tower: { rangeAdd: 5 },
      plasma_laser_s: { rangeAdd: 6 },
      plasma_laser_m: { rangeAdd: 7 },
      plasma_laser_l: { rangeAdd: 8 },
      nova_photon_projector_s: { rangeAdd: 7 },
      nova_photon_projector_l: { rangeAdd: 9 },
      nova_shockwave_pulsar: { rangeAdd: 4 },
    },
  },
  {
    id: 'hero_nova_energy_range_2',
    label: 'Energy Doctrine: Reach II',
    heroId: 'nova',
    category: 'energy',
    creditCost: 980,
    description: 'Additional reach for Tesla, plasma, and Nova platforms.',
    prereqIds: ['hero_nova_energy_range_1'],
    modifiers: {
      tesla_tower: { rangeAdd: 6 },
      plasma_laser_s: { rangeAdd: 7 },
      plasma_laser_m: { rangeAdd: 9 },
      plasma_laser_l: { rangeAdd: 10 },
      nova_photon_projector_s: { rangeAdd: 9 },
      nova_photon_projector_l: { rangeAdd: 11 },
      nova_shockwave_pulsar: { rangeAdd: 5 },
    },
  },
  {
    id: 'hero_nova_energy_cycle_1',
    label: 'Energy Doctrine: Cycle I',
    heroId: 'nova',
    category: 'energy',
    creditCost: 620,
    description: 'Improves fire rate on directed energy and shock systems.',
    prereqIds: ['hero_nova_core'],
    modifiers: {
      tesla_tower: { fireRateMul: 1.08 },
      plasma_laser_s: { fireRateMul: 1.1 },
      plasma_laser_m: { fireRateMul: 1.1 },
      plasma_laser_l: { fireRateMul: 1.08 },
      nova_photon_projector_s: { fireRateMul: 1.08 },
      nova_photon_projector_l: { fireRateMul: 1.06 },
      nova_shockwave_pulsar: { fireRateMul: 1.1 },
    },
  },
  {
    id: 'hero_nova_energy_cycle_2',
    label: 'Energy Doctrine: Cycle II',
    heroId: 'nova',
    category: 'energy',
    creditCost: 1040,
    description: 'Further tightens energy-weapon cadence.',
    prereqIds: ['hero_nova_energy_cycle_1'],
    modifiers: {
      tesla_tower: { fireRateMul: 1.1 },
      plasma_laser_s: { fireRateMul: 1.12 },
      plasma_laser_m: { fireRateMul: 1.12 },
      plasma_laser_l: { fireRateMul: 1.1 },
      nova_photon_projector_s: { fireRateMul: 1.1 },
      nova_photon_projector_l: { fireRateMul: 1.08 },
      nova_shockwave_pulsar: { fireRateMul: 1.12 },
    },
  },

  {
    id: 'hero_citadel_core',
    label: 'Citadel Mandate',
    heroId: 'citadel',
    category: 'hero',
    creditCost: 0,
    description: 'Deploy basic conduits: Defense, Attack, and Range.',
    unlockBuildingIds: ['citadel_defense_conduit', 'citadel_attack_conduit', 'citadel_range_conduit'],
  },
  {
    id: 'hero_citadel_unlock_advanced_conduits',
    label: 'Unlock Advanced Conduits',
    heroId: 'citadel',
    category: 'hero',
    creditCost: 720,
    description: 'Unlocks Repair, Construction, and Efficiency Conduits.',
    prereqIds: ['hero_citadel_core'],
    unlockBuildingIds: ['citadel_repair_conduit', 'citadel_construction_conduit', 'citadel_efficiency_conduit'],
  },
  {
    id: 'hero_citadel_struct_grid_1',
    label: 'Citadel Structural Grid I',
    heroId: 'citadel',
    category: 'structural',
    creditCost: 460,
    description: 'Hardens core support structures.',
    prereqIds: ['hero_citadel_core'],
    modifiers: {
      support_node: { maxHpMul: 1.1 },
      repair_bay: { maxHpMul: 1.1 },
      reconstruction_yard: { maxHpMul: 1.1 },
    },
  },
  {
    id: 'hero_citadel_struct_grid_2',
    label: 'Citadel Structural Grid II',
    heroId: 'citadel',
    category: 'structural',
    creditCost: 780,
    description: 'Further reinforces support infrastructure.',
    prereqIds: ['hero_citadel_struct_grid_1'],
    modifiers: {
      support_node: { maxHpMul: 1.12 },
      repair_bay: { maxHpMul: 1.12 },
      reconstruction_yard: { maxHpMul: 1.12 },
    },
  },
  {
    id: 'hero_citadel_command_fortress',
    label: 'Command Fortress',
    heroId: 'citadel',
    category: 'structural',
    creditCost: 620,
    description: 'Command Centers gain significantly more max health.',
    prereqIds: ['hero_citadel_core'],
    modifiers: { command_center: { maxHpMul: 1.15 } },
  },
  {
    id: 'hero_citadel_conduit_integrity',
    label: 'Conduit Integrity',
    heroId: 'citadel',
    category: 'structural',
    creditCost: 540,
    description: 'All Citadel Conduits are harder to destroy.',
    prereqIds: ['hero_citadel_core'],
    modifiers: {
      citadel_repair_conduit: { maxHpMul: 1.14 },
      citadel_construction_conduit: { maxHpMul: 1.14 },
      citadel_defense_conduit: { maxHpMul: 1.14 },
      citadel_attack_conduit: { maxHpMul: 1.14 },
      citadel_efficiency_conduit: { maxHpMul: 1.14 },
      citadel_range_conduit: { maxHpMul: 1.14 },
    },
  },
  {
    id: 'hero_citadel_supply_lines',
    label: 'Supply Lines',
    heroId: 'citadel',
    category: 'structural',
    creditCost: 500,
    description: 'Improves supply depots for expanded logistics.',
    prereqIds: ['hero_citadel_core'],
    modifiers: {
      supply_depot_s: { supplyCapAddMul: 1.18 },
      supply_depot_l: { supplyCapAddMul: 1.18 },
    },
  },
  {
    id: 'hero_citadel_industrial_shell',
    label: 'Industrial Shell',
    heroId: 'citadel',
    category: 'economy',
    creditCost: 560,
    description: 'Reinforces early economy buildings.',
    prereqIds: ['hero_citadel_core'],
    modifiers: {
      factory_business: { maxHpMul: 1.12 },
      factory_factory: { maxHpMul: 1.1 },
      refinery: { maxHpMul: 1.12 },
    },
  },
  {
    id: 'hero_citadel_repair_conduit_mk2',
    label: 'Repair Conduit Level 2',
    heroId: 'citadel',
    category: 'hero',
    creditCost: 640,
    description: 'Repair Conduits pulse faster and heal more per pulse.',
    prereqIds: ['hero_citadel_unlock_advanced_conduits'],
    modifiers: { citadel_repair_conduit: { rangeAdd: 2, fireRateMul: 1.18, damageAdd: 14 } },
  },
  {
    id: 'hero_citadel_construction_conduit_mk2',
    label: 'Construction Conduit Level 2',
    heroId: 'citadel',
    category: 'hero',
    creditCost: 820,
    description: 'Larger discount aura and wider coordination radius (tuned in conduit logic).',
    prereqIds: ['hero_citadel_unlock_advanced_conduits'],
    modifiers: { citadel_construction_conduit: { maxHpMul: 1.08, powerDrainMul: 0.9 } },
  },
  {
    id: 'hero_citadel_defense_conduit_mk2',
    label: 'Defense Conduit Level 2',
    heroId: 'citadel',
    category: 'hero',
    creditCost: 520,
    description: 'Stronger damage reduction and wider ward (tuned in conduit logic).',
    prereqIds: ['hero_citadel_core'],
    modifiers: { citadel_defense_conduit: { maxHpMul: 1.12 } },
  },
  {
    id: 'hero_citadel_attack_conduit_mk2',
    label: 'Attack Conduit Level 2',
    heroId: 'citadel',
    category: 'hero',
    creditCost: 540,
    description: 'Higher damage amp for nearby defenses (tuned in conduit logic).',
    prereqIds: ['hero_citadel_core'],
    modifiers: { citadel_attack_conduit: { maxHpMul: 1.1 } },
  },
  {
    id: 'hero_citadel_efficiency_conduit_mk2',
    label: 'Efficiency Conduit Level 2',
    heroId: 'citadel',
    category: 'hero',
    creditCost: 560,
    description: 'Faster cadence boost for surrounding weapons (tuned in conduit logic).',
    prereqIds: ['hero_citadel_unlock_advanced_conduits'],
    modifiers: { citadel_efficiency_conduit: { maxHpMul: 1.1 } },
  },
  {
    id: 'hero_citadel_range_conduit_mk2',
    label: 'Range Conduit Level 2',
    heroId: 'citadel',
    category: 'hero',
    creditCost: 510,
    description: 'Additional reach granted to covered defenses (tuned in conduit logic).',
    prereqIds: ['hero_citadel_core'],
    modifiers: { citadel_range_conduit: { maxHpMul: 1.1 } },
  },
  {
    id: 'hero_citadel_defense_centers',
    label: 'Defense Centers',
    heroId: 'citadel',
    category: 'hero',
    creditCost: 880,
    description: 'Each Command Center mounts an integrated turret (~2× Auto Turret), no power draw.',
    prereqIds: ['hero_citadel_core'],
  },
  {
    id: 'hero_citadel_enhanced_conductivity',
    label: 'Enhanced Conductivity',
    heroId: 'citadel',
    category: 'hero',
    creditCost: 720,
    description: 'Increases the aura radius of all Citadel Conduits.',
    prereqIds: ['hero_citadel_core'],
  },
  {
    id: 'hero_citadel_sophisticated_repairs',
    label: 'Sophisticated Repairs',
    heroId: 'citadel',
    category: 'hero',
    creditCost: 680,
    description: 'All healing sources are more potent (nodes, conduits, drones, hangar ops).',
    prereqIds: ['hero_citadel_core'],
  },
  {
    id: 'hero_citadel_last_stand',
    label: 'Last Stand',
    heroId: 'citadel',
    category: 'hero',
    creditCost: 940,
    description: 'When only one Command Center remains, it takes less damage and regenerates slowly.',
    prereqIds: ['hero_citadel_command_fortress'],
  },
  {
    id: 'hero_citadel_focused_power',
    label: 'Focused Power',
    heroId: 'citadel',
    category: 'hero',
    creditCost: 860,
    description: 'Multiple conduits of the same type can stack their benefits (capped).',
    prereqIds: ['hero_citadel_core'],
  },

  {
    id: 'hero_jupiter_core',
    label: 'Jupiter Directive',
    heroId: 'jupiter',
    category: 'hero',
    creditCost: 0,
    description: 'Jupiter structures are gated behind specialized unlock research.',
  },
  {
    id: 'hero_jupiter_unlock_support_machines',
    label: 'Unlock Support Machines',
    heroId: 'jupiter',
    category: 'hero',
    creditCost: 420,
    description: 'Unlocks Overclock Augment, Radar Station, and Recon Drone.',
    prereqIds: ['hero_jupiter_core'],
    unlockBuildingIds: ['jupiter_overclock_augment', 'jupiter_radar_station', 'jupiter_recon_drone'],
  },
  {
    id: 'hero_jupiter_unlock_advanced_electrical',
    label: 'Unlock Advanced Electrical Solutions',
    heroId: 'jupiter',
    category: 'hero',
    creditCost: 620,
    description: 'Unlocks Mass Relay and Battery Complex.',
    prereqIds: ['hero_jupiter_core'],
    unlockBuildingIds: ['jupiter_mass_relay', 'jupiter_battery_complex'],
  },
  {
    id: 'hero_jupiter_unlock_arc_thrower',
    label: 'Unlock Arc Thrower',
    heroId: 'jupiter',
    category: 'hero',
    creditCost: 780,
    description: 'Unlocks the Arc Thrower.',
    prereqIds: ['hero_jupiter_core'],
    unlockBuildingIds: ['jupiter_arc_thrower'],
  },
  {
    id: 'hero_jupiter_grid_tuning_1',
    label: 'Grid Tuning I',
    heroId: 'jupiter',
    category: 'electrical',
    creditCost: 480,
    description: 'Generators and Mass Relays run a little cleaner.',
    prereqIds: ['hero_jupiter_core'],
    modifiers: {
      generator_small: { powerGenMul: 1.08 },
      generator_large: { powerGenMul: 1.08 },
      jupiter_mass_relay: { powerDrainMul: 0.92 },
    },
  },
  {
    id: 'hero_jupiter_grid_tuning_2',
    label: 'Grid Tuning II',
    heroId: 'jupiter',
    category: 'electrical',
    creditCost: 740,
    description: 'Further improves baseline electrical output.',
    prereqIds: ['hero_jupiter_grid_tuning_1'],
    modifiers: {
      generator_small: { powerGenMul: 1.06 },
      generator_large: { powerGenMul: 1.06 },
      nuclear_plant: { powerGenMul: 1.05 },
    },
  },
  {
    id: 'hero_jupiter_capacitance_1',
    label: 'Capacitance Matrix I',
    heroId: 'jupiter',
    category: 'electrical',
    creditCost: 460,
    description: 'Batteries and the Battery Complex store more headroom.',
    prereqIds: ['hero_jupiter_core'],
    modifiers: {
      battery_small: { powerCapAddMul: 1.12 },
      battery_large: { powerCapAddMul: 1.12 },
      jupiter_battery_complex: { powerCapAddMul: 1.1 },
    },
  },
  {
    id: 'hero_jupiter_capacitance_2',
    label: 'Capacitance Matrix II',
    heroId: 'jupiter',
    category: 'electrical',
    creditCost: 720,
    description: 'Adds even more grid reserve.',
    prereqIds: ['hero_jupiter_capacitance_1'],
    modifiers: {
      battery_small: { powerCapAddMul: 1.1 },
      battery_large: { powerCapAddMul: 1.1 },
      jupiter_battery_complex: { powerCapAddMul: 1.12 },
    },
  },
  {
    id: 'hero_jupiter_transmission_lines',
    label: 'Transmission Lines',
    heroId: 'jupiter',
    category: 'electrical',
    creditCost: 520,
    description: 'Pylon network bonus is stronger (global pylon synergy).',
    prereqIds: ['hero_jupiter_core'],
    modifiers: { pylon: { powerGenMul: 1.22 } },
  },
  {
    id: 'hero_jupiter_emergency_shunts',
    label: 'Emergency Shunts',
    heroId: 'jupiter',
    category: 'electrical',
    creditCost: 540,
    description: 'Radar and Arc Thrower shot draws are slightly cheaper.',
    prereqIds: ['hero_jupiter_core'],
    modifiers: {
      jupiter_radar_station: { powerDrainMul: 0.88 },
      jupiter_arc_thrower: { maxHpMul: 1.04 },
    },
  },
  {
    id: 'hero_jupiter_induction_weave',
    label: 'Induction Weave',
    heroId: 'jupiter',
    category: 'electrical',
    creditCost: 510,
    description: 'Recon Drone coil is more efficient; Overclock draws a little less.',
    prereqIds: ['hero_jupiter_core'],
    modifiers: {
      jupiter_recon_drone: { powerDrainMul: 0.86 },
      jupiter_overclock_augment: { maxHpMul: 1.08 },
    },
  },
  {
    id: 'hero_jupiter_mass_relay_mk2',
    label: 'Mass Relay Level 2',
    heroId: 'jupiter',
    category: 'hero',
    creditCost: 680,
    description: 'Relays are tougher and idle draw drops further.',
    prereqIds: ['hero_jupiter_unlock_advanced_electrical'],
    modifiers: { jupiter_mass_relay: { maxHpMul: 1.15, powerDrainMul: 0.85 } },
  },
  {
    id: 'hero_jupiter_arc_thrower_mk2',
    label: 'Arc Thrower Level 2',
    heroId: 'jupiter',
    category: 'hero',
    creditCost: 860,
    description: 'Arc thrower reaches farther and hits harder per tier.',
    prereqIds: ['hero_jupiter_unlock_arc_thrower'],
    modifiers: { jupiter_arc_thrower: { maxHpMul: 1.12, rangeAdd: 6, damageAdd: 18 } },
  },
  {
    id: 'hero_jupiter_overclock_mk2',
    label: 'Overclock Augment Level 2',
    heroId: 'jupiter',
    category: 'hero',
    creditCost: 560,
    description: 'Stronger fire-rate boost to neighbors.',
    prereqIds: ['hero_jupiter_unlock_support_machines'],
    modifiers: { jupiter_overclock_augment: { maxHpMul: 1.1 } },
  },
  {
    id: 'hero_jupiter_radar_mk2',
    label: 'Radar Station Level 2',
    heroId: 'jupiter',
    category: 'hero',
    creditCost: 740,
    description: 'Wider scan volume.',
    prereqIds: ['hero_jupiter_unlock_support_machines'],
    modifiers: { jupiter_radar_station: { maxHpMul: 1.1, rangeAdd: 5 } },
  },
  {
    id: 'hero_jupiter_recon_drone_mk2',
    label: 'Recon Drone Level 2',
    heroId: 'jupiter',
    category: 'hero',
    creditCost: 620,
    description: 'More reach and coil damage; stronger induction below.',
    prereqIds: ['hero_jupiter_unlock_support_machines'],
    modifiers: { jupiter_recon_drone: { rangeAdd: 4, damageAdd: 2 } },
  },
  {
    id: 'hero_jupiter_battery_complex_mk2',
    label: 'Battery Complex Level 2',
    heroId: 'jupiter',
    category: 'hero',
    creditCost: 920,
    description: 'Larger reserve and stronger low-power production curve.',
    prereqIds: ['hero_jupiter_unlock_advanced_electrical'],
    modifiers: { jupiter_battery_complex: { maxHpMul: 1.12, powerCapAddMul: 1.15, powerGenMul: 1.18 } },
  },
  {
    id: 'hero_jupiter_enhanced_pinging',
    label: 'Enhanced Pinging Systems',
    heroId: 'jupiter',
    category: 'hero',
    creditCost: 780,
    description: 'Radar Station marks more targets and keeps paint up longer.',
    prereqIds: ['hero_jupiter_unlock_support_machines'],
  },
  {
    id: 'hero_jupiter_emergency_generator',
    label: 'Emergency Generator',
    heroId: 'jupiter',
    category: 'hero',
    creditCost: 840,
    description: 'When your stored energy hits empty, Battery Complex output surges briefly.',
    prereqIds: ['hero_jupiter_unlock_advanced_electrical'],
  },
  {
    id: 'hero_jupiter_arc_supercharge',
    label: 'Arc Supercharge',
    heroId: 'jupiter',
    category: 'hero',
    creditCost: 920,
    description: 'Arc Thrower can spend extreme energy for a devastating top-tier chain.',
    prereqIds: ['hero_jupiter_unlock_arc_thrower'],
  },

  {
    id: 'hero_kingpin_core',
    label: 'Kingpin Directive',
    heroId: 'kingpin',
    category: 'hero',
    creditCost: 0,
    description: 'Syndicate structures are gated behind specialized unlock research.',
  },
  {
    id: 'hero_kingpin_unlock_advanced_economic_solutions',
    label: 'Unlock Advanced Economic Solutions',
    heroId: 'kingpin',
    category: 'hero',
    creditCost: 410,
    description: 'Unlocks the Data Array and Investment Complex.',
    prereqIds: ['hero_kingpin_core'],
    unlockBuildingIds: ['kingpin_data_array', 'kingpin_investment_complex'],
  },
  {
    id: 'hero_kingpin_unlock_production_enhancements',
    label: 'Unlock Production Enhancements',
    heroId: 'kingpin',
    category: 'hero',
    creditCost: 520,
    description: 'Unlocks the Cryptographic Decoder, Indoctrinated Labor, and Mineral Processor.',
    prereqIds: ['hero_kingpin_core'],
    unlockBuildingIds: [
      'kingpin_cryptographic_decoder',
      'kingpin_indoctrinated_labor',
      'kingpin_mineral_processor',
    ],
  },
  {
    id: 'hero_kingpin_unlock_slag_cannon',
    label: 'Unlock Slag Cannon',
    heroId: 'kingpin',
    category: 'hero',
    creditCost: 690,
    description: 'Unlocks the Slag Cannon.',
    prereqIds: ['hero_kingpin_core'],
    unlockBuildingIds: ['kingpin_slag_cannon'],
  },
  {
    id: 'hero_kingpin_factory_dividends_1',
    label: 'Preferred Stock I',
    heroId: 'kingpin',
    category: 'economy',
    creditCost: 460,
    description: 'Factory output adds more credits per payout.',
    prereqIds: ['hero_kingpin_core'],
    modifiers: {
      factory_business: { creditPayoutMul: 1.1 },
      factory_factory: { creditPayoutMul: 1.1 },
    },
  },
  {
    id: 'hero_kingpin_factory_dividends_2',
    label: 'Preferred Stock II',
    heroId: 'kingpin',
    category: 'economy',
    creditCost: 640,
    description: 'Megacomplex lines and smaller factories scale further.',
    prereqIds: ['hero_kingpin_factory_dividends_1'],
    modifiers: {
      factory_business: { creditPayoutMul: 1.06 },
      factory_factory: { creditPayoutMul: 1.06 },
      factory_megacomplex: { creditPayoutMul: 1.12 },
    },
  },
  {
    id: 'hero_kingpin_refinery_contracts_1',
    label: 'Commodity Futures I',
    heroId: 'kingpin',
    category: 'economy',
    creditCost: 470,
    description: 'Standard refineries ship more product.',
    prereqIds: ['hero_kingpin_core'],
    modifiers: { refinery: { creditPayoutMul: 1.12 } },
  },
  {
    id: 'hero_kingpin_refinery_contracts_2',
    label: 'Commodity Futures II',
    heroId: 'kingpin',
    category: 'economy',
    creditCost: 630,
    description: 'Mega refineries catch up to premium contracts.',
    prereqIds: ['hero_kingpin_refinery_contracts_1'],
    modifiers: { mega_refinery: { creditPayoutMul: 1.11 } },
  },
  {
    id: 'hero_kingpin_venture_capital',
    label: 'Venture Capital',
    heroId: 'kingpin',
    category: 'economy',
    creditCost: 590,
    description: 'Command dividend ticks are stronger.',
    prereqIds: ['hero_kingpin_core'],
    modifiers: { command_center: { creditPayoutMul: 1.14 } },
  },
  {
    id: 'hero_kingpin_energy_arbitrage',
    label: 'Energy Arbitrage',
    heroId: 'kingpin',
    category: 'electrical',
    creditCost: 540,
    description: 'Generators and pylon networks squeeze out a little more juice.',
    prereqIds: ['hero_kingpin_core'],
    modifiers: {
      generator_small: { powerGenMul: 1.08 },
      generator_large: { powerGenMul: 1.08 },
      pylon: { powerGenMul: 1.12 },
    },
  },
  {
    id: 'hero_kingpin_data_array_mk2',
    label: 'Data Array Level 2',
    heroId: 'kingpin',
    category: 'hero',
    creditCost: 620,
    description: 'Tougher arrays with faster cycles and sharper payouts.',
    prereqIds: ['hero_kingpin_unlock_advanced_economic_solutions'],
    modifiers: {
      kingpin_data_array: { maxHpMul: 1.18, creditPayoutMul: 1.22, creditIntervalSecMul: 0.82 },
    },
  },
  {
    id: 'hero_kingpin_investment_complex_mk2',
    label: 'Investment Complex Level 2',
    heroId: 'kingpin',
    category: 'hero',
    creditCost: 740,
    description: 'Larger footprint yields; modest efficiency gain.',
    prereqIds: ['hero_kingpin_unlock_advanced_economic_solutions'],
    modifiers: { kingpin_investment_complex: { maxHpMul: 1.12, creditPayoutMul: 1.18, powerDrainMul: 0.88 } },
  },
  {
    id: 'hero_kingpin_cryptographic_decoder_mk2',
    label: 'Cryptographic Decoder Level 2',
    heroId: 'kingpin',
    category: 'hero',
    creditCost: 560,
    description: 'Wider decoding field with stronger refinery yield.',
    prereqIds: ['hero_kingpin_unlock_production_enhancements'],
    modifiers: { kingpin_cryptographic_decoder: { maxHpMul: 1.1, rangeAdd: 2 } },
  },
  {
    id: 'hero_kingpin_indoctrinated_labor_mk2',
    label: 'Indoctrinated Labor Level 2',
    heroId: 'kingpin',
    category: 'hero',
    creditCost: 580,
    description: 'Labor camps reach farther across the factory floor.',
    prereqIds: ['hero_kingpin_unlock_production_enhancements'],
    modifiers: { kingpin_indoctrinated_labor: { maxHpMul: 1.1, rangeAdd: 2 } },
  },
  {
    id: 'hero_kingpin_mineral_processor_mk2',
    label: 'Mineral Processor Level 2',
    heroId: 'kingpin',
    category: 'hero',
    creditCost: 820,
    description: 'Longer salvage reach for asteroid kills.',
    prereqIds: ['hero_kingpin_unlock_production_enhancements'],
    modifiers: { kingpin_mineral_processor: { maxHpMul: 1.1, rangeAdd: 3 } },
  },
  {
    id: 'hero_kingpin_slag_cannon_mk2',
    label: 'Slag Cannon Level 2',
    heroId: 'kingpin',
    category: 'hero',
    creditCost: 860,
    description: 'Heavier slugs with a touch more cadence; marginally cheaper ammunition.',
    prereqIds: ['hero_kingpin_unlock_slag_cannon'],
    modifiers: {
      kingpin_slag_cannon: { maxHpMul: 1.08, damageAdd: 70, fireRateMul: 1.08, shotCreditCostMul: 0.88 },
    },
  },
  {
    id: 'hero_kingpin_hazard_pay',
    label: 'Hazard Pay',
    heroId: 'kingpin',
    category: 'hero',
    creditCost: 720,
    description: 'Clearing waves grants credits; bonus grows with waves completed.',
    prereqIds: ['hero_kingpin_core'],
  },
  {
    id: 'hero_kingpin_insider_discounts',
    label: 'Insider Discounts',
    heroId: 'kingpin',
    category: 'hero',
    creditCost: 680,
    description: 'All new construction invoices are slightly reduced.',
    prereqIds: ['hero_kingpin_core'],
  },
  {
    id: 'hero_kingpin_scavenging',
    label: 'Scavenging',
    heroId: 'kingpin',
    category: 'hero',
    creditCost: 750,
    description: 'Destroyed structures refund part of their build value (not manual sells).',
    prereqIds: ['hero_kingpin_core'],
  },
  {
    id: 'hero_kingpin_compound_interest',
    label: 'Compound Interest',
    heroId: 'kingpin',
    category: 'hero',
    creditCost: 780,
    description: 'Investment Complex scales harder with your credit balance.',
    prereqIds: ['hero_kingpin_unlock_advanced_economic_solutions'],
  },
  {
    id: 'hero_kingpin_signal_amplification',
    label: 'Signal Amplification',
    heroId: 'kingpin',
    category: 'hero',
    creditCost: 700,
    description: 'Cryptographic Decoders grant refineries a larger export multiplier.',
    prereqIds: ['hero_kingpin_unlock_production_enhancements'],
  },
  {
    id: 'hero_kingpin_scrap_futures',
    label: 'Scrap Futures',
    heroId: 'kingpin',
    category: 'hero',
    creditCost: 760,
    description: 'Mineral Processor bounty per asteroid kill is increased.',
    prereqIds: ['hero_kingpin_unlock_production_enhancements'],
  },
]

// Globally reduce upgrade credit costs (5-10% target).
export const UPGRADES: UpgradeDef[] = UPGRADES_RAW.map((u) => {
  if (u.creditCost <= 0) return u
  return { ...u, creditCost: Math.round(u.creditCost * 0.93) }
})

export class BaseDefenseGame {
  private readonly canvas: HTMLCanvasElement
  private readonly mode: 'normal' | 'sandbox'
  private readonly difficulty: GameDifficulty
  /** `null` = no commander; neutral buildings and global tree only. */
  private readonly heroId: HeroId | null
  private renderer!: THREE.WebGLRenderer
  private scene!: THREE.Scene
  private camera!: THREE.PerspectiveCamera
  private clock = new THREE.Clock()
  private raf = 0
  private ro!: ResizeObserver

  /** Jupiter Mass Relays share this pool HP (sum of per-relay max contributes to maxHp). */
  private jupiterRelayPool: { hp: number; maxHp: number } | null = null
  /** Suppress Kingpin Scavenging proc when selling (player already gets a sell refund). */
  private suppressKingpinScavenge = false
  /** Brief surge for Battery Complex when grid hits empty (Emergency Generator). */
  private jupiterBatteryEmergencyTimer = 0

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
  private credits = 1550
  private supplyCap = 0
  private supplyUsed = 0
  private powerCap = 20
  private powerStored = 20

  // Wave control
  private wave = 0
  private firstWaveStarted = false
  private waveInProgress = false
  private paused = false
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
  /** One map-wide bubble shared by all Universal Forcefield buildings. */
  private universalShield: ShieldField | null = null
  /** Applied to `maxHp * 5.8 * capacityMul` contribution per generator (balance: lower pool than legacy). */
  private readonly universalShieldMaxHpMul = 0.8
  private readonly ballistics: Ballistic[] = []
  private readonly repairDrones: RepairDrone[] = []
  private readonly dominionShrapnel: DominionShrapnel[] = []
  /** Shared mesh data for Dominion shrapnel (cone projectiles); avoids per-spawn geometry allocation. */
  private dominionShrapnelConeGeo: THREE.ConeGeometry | null = null
  private dominionShrapnelMatOrbital: THREE.MeshStandardMaterial | null = null
  private dominionShrapnelMatFlak: THREE.MeshStandardMaterial | null = null
  private readonly dominionShrapnelConeAxis = new THREE.Vector3(0, 1, 0)
  /** Cap active shards so long fights do not accumulate unbounded meshes. */
  private static readonly DOMINION_SHRAPNEL_MAX_ACTIVE = 96
  private readonly dominionSeekerDrones: DominionSeekerDrone[] = []
  private readonly dominionDropships: DominionDropship[] = []
  private readonly archangelPlanes: ArchangelPlane[] = []
  private readonly novaPhotons: NovaPhotonOrb[] = []
  private planeIdSeed = 0
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

  /** Run statistics for end-of-game summary (reset each `resetRun`). */
  private statsMoneyEarned = 0
  private statsMoneySpent = 0
  private statsPowerProduced = 0
  private statsAsteroidsKilled = 0
  private readonly statsBuildingPlacements = new Map<BuildingId, number>()

  private applyCreditDelta(delta: number) {
    if (delta > 0) this.statsMoneyEarned += delta
    else if (delta < 0) this.statsMoneySpent += -delta
    this.credits = Math.max(0, this.credits + delta)
  }

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
    heroId: HeroId | null
    runStats: {
      moneyEarned: number
      moneySpent: number
      powerProduced: number
      asteroidsKilled: number
      mostCommonBuildingLabel: string
    }
    unlockedBuildingIds: BuildingId[]
    purchasedUpgradeIds: UpgradeId[]
    refundableUpgradeIds: UpgradeId[]
    selected: BuildingId
    gameOver: boolean
  }) => void

  onAudio?: (e: GameAudioEvent) => void

  private emitAudio(e: GameAudioEvent) {
    this.onAudio?.(e)
  }

  constructor(canvas: HTMLCanvasElement, opts?: { mode?: 'normal' | 'sandbox'; difficulty?: GameDifficulty; heroId?: HeroId | null }) {
    this.canvas = canvas
    this.mode = opts?.mode ?? 'normal'
    this.difficulty = opts?.difficulty ?? 'hard'
    this.heroId = opts?.heroId !== undefined ? opts.heroId : null
  }

  private getDifficultyScale() {
    switch (this.difficulty) {
      case 'easy':
        return { countMul: 0.72, hpMul: 0.72, damageMul: 0.75, speedMul: 0.82, spawnIntervalMul: 1.22 }
      case 'medium':
        return { countMul: 0.86, hpMul: 0.86, damageMul: 0.9, speedMul: 0.92, spawnIntervalMul: 1.1 }
      case 'brutal':
        return { countMul: 1.22, hpMul: 1.2, damageMul: 1.2, speedMul: 1.12, spawnIntervalMul: 0.9 }
      case 'deadly':
        return { countMul: 1.48, hpMul: 1.45, damageMul: 1.45, speedMul: 1.24, spawnIntervalMul: 0.8 }
      case 'hard':
      default:
        return { countMul: 1, hpMul: 1, damageMul: 1, speedMul: 1, spawnIntervalMul: 1 }
    }
  }

  /**
   * Scales how fast enemy stats react to the displayed wave number (linear + power terms).
   * Lower difficulties use a smaller factor so power ramps noticeably slower across the run.
   */
  private getEnemyWaveProgressK(): number {
    switch (this.difficulty) {
      case 'easy':
        return 0.5
      case 'medium':
        return 0.64
      case 'hard':
        return 0.82
      case 'brutal':
        return 0.94
      case 'deadly':
        return 1
      default:
        return 0.82
    }
  }

  /** Effective wave index for enemy scaling: `adj` for linear terms, `powT` for exponentials. */
  private getEnemyScalingWave(): { adj: number; powT: number } {
    const k = this.getEnemyWaveProgressK()
    const powT = Math.max(0, this.wave - 1) * k
    const adj = 1 + powT
    return { adj, powT }
  }

  /** Per-wave spawn-count growth after the early game; lower = smaller jumps on easier modes. */
  private getEnemySpawnBurstExponent(): number {
    switch (this.difficulty) {
      case 'easy':
        return 1.1
      case 'medium':
        return 1.135
      case 'hard':
        return 1.16
      case 'brutal':
        return 1.172
      case 'deadly':
        return 1.18
      default:
        return 1.16
    }
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

  /** Freeze simulation and input (used by pause menu). */
  setPaused(p: boolean) {
    this.paused = p
    if (p) {
      this.moveKeys.clear()
      this.draggingBuild = false
      this.draggingSell = false
    }
  }

  purchaseUpgrade(id: UpgradeId) {
    if (this.isLost) return
    const up = UPGRADES.find((u) => u.id === id)
    if (!up) return
    if (up.heroId && (this.heroId == null || up.heroId !== this.heroId)) return
    if (this.purchasedUpgradeIds.has(id)) return
    if (this.credits < up.creditCost) return

    this.applyCreditDelta(-up.creditCost)
    this.purchasedUpgradeIds.add(id)
    this.purchasedUpgradePhase.set(id, this.currentInactivePhase)
    this.recomputeUnlockedBuildingIds()
    if (id === 'hero_citadel_defense_centers') {
      for (const b of this.buildings) {
        if (b.hp > 0 && b.defId === 'command_center') this.ensureCitadelCcTurretAim(b)
      }
    }
    this.emitAudio({ type: 'upgrade_purchase' })
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

    this.applyCreditDelta(up.creditCost)
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
    this.emitAudio({ type: 'upgrade_refund' })
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
          this.applyCreditDelta(up.creditCost)
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
    const diff = this.getDifficultyScale()
    const { adj } = this.getEnemyScalingWave()
    const spawnBurst = this.getEnemySpawnBurstExponent()
    // Earlier waves should be calmer; after effective wave ~5 spawn pressure ramps (tempered on lower difficulties).
    const baseCount = 10 + adj * 3.5
    const extra = adj > 5 ? 6 * Math.pow(spawnBurst, adj - 5) : 0
    this.toSpawn = Math.max(1, Math.round((baseCount + extra) * diff.countMul))
    this.spawnTimer = 0

    // Approximate how long spawning will last so the UI circle matches the spawn window.
    const spawnIntervalBase = Math.max(0.06, 0.34 - adj * 0.015)
    const lateMult = adj > 5 ? Math.pow(0.93, adj - 5) : 1
    const spawnInterval = Math.max(0.035, spawnIntervalBase * lateMult * diff.spawnIntervalMul)
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
    for (const sf of this.shieldFields.values()) {
      sf.bubble.removeFromParent()
      this.world.remove(sf.shieldBar.group)
    }
    this.shieldFields.clear()
    if (this.universalShield) {
      this.world.remove(this.universalShield.bubble)
      this.world.remove(this.universalShield.shieldBar.group)
      this.universalShield = null
    }
    for (const b of this.ballistics) this.projectiles.remove(b.mesh)
    for (const d of this.repairDrones) this.world.remove(d.mesh)
    for (const s of this.dominionShrapnel) this.projectiles.remove(s.mesh)
    for (const d of this.dominionSeekerDrones) this.world.remove(d.mesh)
    for (const d of this.dominionDropships) this.world.remove(d.mesh)
    for (const o of this.novaPhotons) this.projectiles.remove(o.mesh)
    this.novaPhotons.length = 0
    this.dominionShrapnel.length = 0
    this.dominionSeekerDrones.length = 0
    this.dominionDropships.length = 0
    this.buildings.length = 0
    this.asteroids.length = 0
    this.missiles.length = 0
    this.ballistics.length = 0
    this.repairDrones.length = 0
    this.occupied.clear()

    this.isLost = false
    this.statsMoneyEarned = 0
    this.statsMoneySpent = 0
    this.statsPowerProduced = 0
    this.statsAsteroidsKilled = 0
    this.statsBuildingPlacements.clear()
    // Early game starts faster: more money, more power, more supply from the Command Center.
    this.credits = 1550
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
    if (this.heroId === 'archangel') this.purchasedUpgradeIds.add('hero_archangel_core')
    if (this.heroId === 'dominion') this.purchasedUpgradeIds.add('hero_dominion_core')
    if (this.heroId === 'nova') this.purchasedUpgradeIds.add('hero_nova_core')
    if (this.heroId === 'citadel') this.purchasedUpgradeIds.add('hero_citadel_core')
    if (this.heroId === 'jupiter') this.purchasedUpgradeIds.add('hero_jupiter_core')
    if (this.heroId === 'kingpin') this.purchasedUpgradeIds.add('hero_kingpin_core')
    this.purchasedUpgradePhase.clear()
    this.purchasedUpgradePhase.set('core_protocol', -1)
    if (this.heroId === 'archangel') this.purchasedUpgradePhase.set('hero_archangel_core', -1)
    if (this.heroId === 'dominion') this.purchasedUpgradePhase.set('hero_dominion_core', -1)
    if (this.heroId === 'nova') this.purchasedUpgradePhase.set('hero_nova_core', -1)
    if (this.heroId === 'citadel') this.purchasedUpgradePhase.set('hero_citadel_core', -1)
    if (this.heroId === 'jupiter') this.purchasedUpgradePhase.set('hero_jupiter_core', -1)
    if (this.heroId === 'kingpin') this.purchasedUpgradePhase.set('hero_kingpin_core', -1)
    this.jupiterRelayPool = null
    this.jupiterBatteryEmergencyTimer = 0
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
      new THREE.PlaneGeometry(BOARD_SIZE, BOARD_SIZE),
      new THREE.MeshStandardMaterial({ color: 0x0f172a, roughness: 0.95, metalness: 0.02 }),
    )
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    this.world.add(ground)

    // One world unit per cell; lines align to integer cell centers.
    const grid = new THREE.GridHelper(BOARD_SIZE, BOARD_SIZE, 0x1e3a8a, 0x1e293b)
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
    if (this.paused) {
      const rect = this.canvas.getBoundingClientRect()
      this.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      this.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      return
    }

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
    if (this.paused) return
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
    if (this.paused) return
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
    if (!this.paused) this.update(dt)
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
    if (this.heroId === 'jupiter' && this.waveInProgress && this.jupiterBatteryEmergencyTimer > 0) {
      this.jupiterBatteryEmergencyTimer = Math.max(0, this.jupiterBatteryEmergencyTimer - dt)
    }
    this.updateShieldLayers(dt)
    this.updateWave(dt)
    this.updateAsteroids(dt)
    this.updateDefenses(dt)
    this.updateSupportSystems(dt)
    this.tickCitadelLastStand(dt)
    this.updateArchangelPlanes(dt)
    this.updateProjectiles(dt)
    this.updateNovaGravityWells(dt)
    this.tickCitadelConduitVisuals(dt)
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

  private getBuildingMaxHp(b: PlacedBuilding): number {
    return (this.getEffectiveDef(b.defId) ?? b.def).maxHp
  }

  private getRadarMarkedDamageMul(a: Asteroid): number {
    if (this.heroId !== 'jupiter' || a.radarMarkTimer <= 0) return 1
    return 1.32
  }

  private cellInsideBuildingFootprint(px: number, pz: number, b: PlacedBuilding): boolean {
    return (
      px >= b.origin.x &&
      px <= b.origin.x + b.def.size.w - 1 &&
      pz >= b.origin.z &&
      pz <= b.origin.z + b.def.size.h - 1
    )
  }

  private buildingFootprintsEdgeAdjacent(a: PlacedBuilding, b: PlacedBuilding): boolean {
    const ax0 = a.origin.x
    const ax1 = a.origin.x + a.def.size.w
    const az0 = a.origin.z
    const az1 = a.origin.z + a.def.size.h
    const bx0 = b.origin.x
    const bx1 = b.origin.x + b.def.size.w
    const bz0 = b.origin.z
    const bz1 = b.origin.z + b.def.size.h
    const overlap = ax0 < bx1 && ax1 > bx0 && az0 < bz1 && az1 > bz0
    if (overlap) return false
    const gapX = Math.max(ax0 - bx1, bx0 - ax1, 0)
    const gapZ = Math.max(az0 - bz1, bz0 - az1, 0)
    return Math.max(gapX, gapZ) <= 1
  }

  private syncJupiterMassRelayHpFromPool() {
    if (!this.jupiterRelayPool || this.jupiterRelayPool.maxHp <= 0) return
    const ratio = clamp(this.jupiterRelayPool.hp / this.jupiterRelayPool.maxHp, 0, 1)
    for (const r of this.buildings) {
      if (r.hp <= 0 || r.defId !== 'jupiter_mass_relay') continue
      const cap = this.getBuildingMaxHp(r)
      r.hp = cap * ratio
    }
  }

  private getJupiterReconPowerGenMulForBuilding(target: PlacedBuilding): number {
    if (this.heroId !== 'jupiter') return 1
    let mul = 1
    const per = this.purchasedUpgradeIds.has('hero_jupiter_recon_drone_mk2') ? 1.16 : 1.12
    for (const d of this.buildings) {
      if (d.hp <= 0 || d.defId !== 'jupiter_recon_drone') continue
      if (!this.cellInsideBuildingFootprint(d.origin.x, d.origin.z, target)) continue
      mul *= per
    }
    return Math.min(mul, 1.55)
  }

  private isJupiterOverclockTarget(b: PlacedBuilding): boolean {
    if (b.hp <= 0) return false
    const d = this.getEffectiveDef(b.defId) ?? b.def
    if (d.kind === 'shield') return false
    if ((d.damage ?? 0) <= 0 || !d.range) return false
    if (d.category === 'turrets' || d.category === 'missile' || d.category === 'energy') return true
    const hid = b.defId
    if (
      hid === 'dominion_orbital_cannon' ||
      hid === 'dominion_flak_gun' ||
      hid === 'dominion_laser_drill' ||
      hid === 'dominion_defensive_bunker'
    )
      return true
    if (hid === 'nova_photon_projector_s' || hid === 'nova_photon_projector_l' || hid === 'nova_shockwave_pulsar') return true
    return (
      hid === 'tesla_tower' || hid === 'jupiter_arc_thrower' || hid === 'jupiter_recon_drone' || hid === 'kingpin_slag_cannon'
    )
  }

  private getJupiterOverclockFireRateMul(b: PlacedBuilding): number {
    if (this.heroId !== 'jupiter' || !this.isJupiterOverclockTarget(b)) return 1
    let best = 1
    const mk2 = this.purchasedUpgradeIds.has('hero_jupiter_overclock_mk2') ? 1.08 : 1
    for (const oc of this.buildings) {
      if (oc.hp <= 0 || oc.defId !== 'jupiter_overclock_augment') continue
      if (!this.buildingFootprintsEdgeAdjacent(b, oc)) continue
      if (this.powerStored <= 0.001) continue
      best = Math.max(best, 1.72 * mk2)
    }
    return best
  }

  private getHealingPotencyMul(): number {
    return this.heroId === 'citadel' && this.purchasedUpgradeIds.has('hero_citadel_sophisticated_repairs') ? 1.35 : 1
  }

  /** Resolved conduit aura (radius + strength) after upgrades / MK2 / conductivity. */
  private getCitadelConduitResolved(b: PlacedBuilding): { kind: CitadelConduitKind; radius: number; strength: number } | null {
    if (this.heroId !== 'citadel') return null
    const base = this.getBaseDef(b.defId)
    const c = base?.citadelConduit
    if (!c) return null
    const eff = this.getEffectiveDef(b.defId) ?? base
    let radius = c.radius
    let strength = c.strength
    if (c.kind === 'repair') {
      radius = eff.range ?? radius
      strength = eff.damage ?? strength
    }
    if (b.defId === 'citadel_construction_conduit' && this.purchasedUpgradeIds.has('hero_citadel_construction_conduit_mk2')) {
      radius += 2.4
      strength *= 1.25
    }
    if (b.defId === 'citadel_defense_conduit' && this.purchasedUpgradeIds.has('hero_citadel_defense_conduit_mk2')) {
      radius += 1.8
      strength = Math.min(0.26, strength * 1.35)
    }
    if (b.defId === 'citadel_attack_conduit' && this.purchasedUpgradeIds.has('hero_citadel_attack_conduit_mk2')) {
      radius += 1.8
      strength = Math.min(0.28, strength * 1.4)
    }
    if (b.defId === 'citadel_efficiency_conduit' && this.purchasedUpgradeIds.has('hero_citadel_efficiency_conduit_mk2')) {
      radius += 1.8
      strength = Math.min(0.28, strength * 1.35)
    }
    if (b.defId === 'citadel_range_conduit' && this.purchasedUpgradeIds.has('hero_citadel_range_conduit_mk2')) {
      radius += 1.5
      strength += 2.2
    }
    if (this.purchasedUpgradeIds.has('hero_citadel_enhanced_conductivity')) radius *= 1.28
    return { kind: c.kind, radius, strength }
  }

  private eachCitadelConduitInRange(
    wx: number,
    wz: number,
    kind: CitadelConduitKind,
    fn: (strength: number, radius: number) => void,
  ) {
    for (const b of this.buildings) {
      if (b.hp <= 0) continue
      const spec = this.getCitadelConduitResolved(b)
      if (!spec || spec.kind !== kind) continue
      const cx = b.origin.x + (b.def.size.w - 1) / 2
      const cz = b.origin.z + (b.def.size.h - 1) / 2
      if (Math.hypot(wx - cx, wz - cz) > spec.radius) continue
      fn(spec.strength, spec.radius)
    }
  }

  private aggregateCitadelStrength(wx: number, wz: number, kind: CitadelConduitKind, cap: number): number {
    const vals: number[] = []
    this.eachCitadelConduitInRange(wx, wz, kind, (s) => vals.push(s))
    if (vals.length === 0) return 0
    const stack = this.purchasedUpgradeIds.has('hero_citadel_focused_power')
    const sum = stack ? vals.reduce((a, v) => a + v, 0) : Math.max(...vals)
    return Math.min(cap, sum)
  }

  private getPlacementDiscountAt(wx: number, wz: number): number {
    if (this.heroId !== 'citadel') return 0
    return this.aggregateCitadelStrength(wx, wz, 'construction', 0.5)
  }

  private getCitadelDefenseReductionAt(wx: number, wz: number): number {
    if (this.heroId !== 'citadel') return 0
    return this.aggregateCitadelStrength(wx, wz, 'defense', 0.55)
  }

  private getCitadelAttackBonusAt(wx: number, wz: number): number {
    if (this.heroId !== 'citadel') return 0
    return this.aggregateCitadelStrength(wx, wz, 'attack', 0.65)
  }

  private getCitadelEfficiencyBonusAt(wx: number, wz: number): number {
    if (this.heroId !== 'citadel') return 0
    return this.aggregateCitadelStrength(wx, wz, 'efficiency', 0.7)
  }

  private getCitadelRangeBonusAt(wx: number, wz: number): number {
    if (this.heroId !== 'citadel') return 0
    return this.aggregateCitadelStrength(wx, wz, 'range', 28)
  }

  private placementCreditCost(def: BuildingDef, ox: number, oz: number): number {
    const cx = ox + (def.size.w - 1) / 2
    const cz = oz + (def.size.h - 1) / 2
    const disc = this.getPlacementDiscountAt(cx, cz)
    let cost = Math.max(1, Math.round(def.creditCost * (1 - disc)))
    if (this.heroId === 'kingpin' && this.purchasedUpgradeIds.has('hero_kingpin_insider_discounts')) {
      cost = Math.max(1, Math.round(cost * 0.93))
    }
    return cost
  }

  private isCitadelCombatBuffTarget(b: PlacedBuilding): boolean {
    if (this.heroId !== 'citadel') return false
    const d = this.getEffectiveDef(b.defId) ?? b.def
    if (d.kind === 'shield') return false
    if (b.defId.startsWith('citadel_')) return false
    if (b.defId === 'command_center') return this.purchasedUpgradeIds.has('hero_citadel_defense_centers')
    if (d.category === 'turrets' || d.category === 'missile' || d.category === 'energy') return true
    const hid = b.defId
    if (
      hid === 'dominion_orbital_cannon' ||
      hid === 'dominion_flak_gun' ||
      hid === 'dominion_laser_drill' ||
      hid === 'dominion_defensive_bunker' ||
      hid === 'dominion_seeker_drone_spawner'
    )
      return true
    if (hid === 'nova_photon_projector_s' || hid === 'nova_photon_projector_l' || hid === 'nova_shockwave_pulsar') return true
    return hid === 'kingpin_slag_cannon'
  }

  private augmentDefForCitadelCombat(b: PlacedBuilding, d: BuildingDef): BuildingDef {
    if (!this.isCitadelCombatBuffTarget(b)) return d
    const wx = b.origin.x + (b.def.size.w - 1) / 2
    const wz = b.origin.z + (b.def.size.h - 1) / 2
    const atk = 1 + this.getCitadelAttackBonusAt(wx, wz)
    const eff = 1 + this.getCitadelEfficiencyBonusAt(wx, wz)
    const rng = this.getCitadelRangeBonusAt(wx, wz)
    const out = { ...d }
    if (out.damage != null) out.damage *= atk
    if (out.fireRate != null) out.fireRate *= eff
    if (out.range != null) out.range += rng
    return out
  }

  private incomingDamageFactorForBuilding(b: PlacedBuilding): number {
    let mul = 1
    const cx = b.origin.x + (b.def.size.w - 1) / 2
    const cz = b.origin.z + (b.def.size.h - 1) / 2
    if (this.heroId === 'citadel') {
      const red = this.getCitadelDefenseReductionAt(cx, cz)
      mul *= Math.max(0.12, 1 - red)
    }
    if (
      this.heroId === 'citadel' &&
      this.purchasedUpgradeIds.has('hero_citadel_last_stand') &&
      b.defId === 'command_center'
    ) {
      const ncc = this.buildings.filter((x) => x.hp > 0 && x.defId === 'command_center').length
      if (ncc === 1) mul *= 0.72
    }
    return mul
  }

  private applyDamageToBuilding(b: PlacedBuilding, raw: number) {
    const hpLoss = raw * this.incomingDamageFactorForBuilding(b)
    if (b.defId === 'jupiter_mass_relay' && this.heroId === 'jupiter' && this.jupiterRelayPool) {
      this.jupiterRelayPool.hp -= hpLoss
      if (this.jupiterRelayPool.hp <= 0) {
        this.jupiterRelayPool.hp = 0
        const toKill = [...this.buildings].filter((r) => r.hp > 0 && r.defId === 'jupiter_mass_relay')
        this.jupiterRelayPool = null
        for (const r of toKill) {
          r.hp = 0
          this.destroyBuilding(r)
        }
      } else {
        this.syncJupiterMassRelayHpFromPool()
      }
      return
    }
    b.hp -= hpLoss
    if (b.hp <= 0) {
      b.hp = 0
      this.destroyBuilding(b)
    }
  }

  /** Weak regen on the last living Command Center when Last Stand is owned. */
  private tickCitadelLastStand(dt: number) {
    if (!this.waveInProgress || this.isLost) return
    if (this.heroId !== 'citadel' || !this.purchasedUpgradeIds.has('hero_citadel_last_stand')) return
    const ccs = this.buildings.filter((b) => b.hp > 0 && b.defId === 'command_center')
    if (ccs.length !== 1) return
    const b = ccs[0]
    const tMax = this.getBuildingMaxHp(b)
    if (b.hp >= tMax - 0.01) return
    const regen = 5.5 * this.getHealingPotencyMul() * dt
    b.hp = Math.min(tMax, b.hp + regen)
  }

  private ensureCitadelCcTurretAim(b: PlacedBuilding) {
    if ((b.mesh.userData as { citadelCcAimReady?: boolean }).citadelCcAimReady) return
    const yawPivot = new THREE.Group()
    yawPivot.position.set(0, 3.35, 0)
    const pitchPivot = new THREE.Group()
    yawPivot.add(pitchPivot)
    const barrel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.07, 0.09, 0.52, 8),
      new THREE.MeshStandardMaterial({ color: 0xf97316, metalness: 0.22, roughness: 0.42 }),
    )
    barrel.rotation.x = Math.PI / 2
    barrel.position.z = 0.26
    pitchPivot.add(barrel)
    const muzzle = new THREE.Object3D()
    muzzle.position.set(0, 0, 0.52)
    pitchPivot.add(muzzle)
    b.mesh.add(yawPivot)
    const aim: WeaponAim = { yaw: yawPivot, pitch: pitchPivot, muzzle }
    b.mesh.userData.aim = aim
    ;(b.mesh.userData as { citadelCcAimReady?: boolean }).citadelCcAimReady = true
  }

  /** Integrated Command Center turret: ~2× Auto Turret damage, no power draw. */
  private tickCitadelCommandCenterTurrets(dt: number) {
    if (this.heroId !== 'citadel' || !this.purchasedUpgradeIds.has('hero_citadel_defense_centers')) return
    if (!this.waveInProgress) return
    const autoBase = this.getBaseDef('auto_turret')
    if (!autoBase) return

    for (const b of this.buildings) {
      if (b.hp <= 0 || b.defId !== 'command_center') continue
      this.ensureCitadelCcTurretAim(b)
      const syn: BuildingDef = {
        ...autoBase,
        damage: (autoBase.damage ?? 11) * 2,
        powerDrainPerSec: 0,
      }
      const d = this.augmentDefForCitadelCombat(b, syn)
      if (!d.range || d.damage == null) continue

      b.cooldown -= dt
      if (b.cooldown > 0) continue

      const baseOrigin = new THREE.Vector3(b.origin.x + (b.def.size.w - 1) / 2, 3.5, b.origin.z + (b.def.size.h - 1) / 2)
      const aim = (b.mesh.userData as { aim?: WeaponAim }).aim
      let target: Asteroid | null = null
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
      if (!target) continue

      const wc = this.weaponFootprintCenter(b)
      const novaMul = this.getNovaWeaponDamageMul(b)
      b.cooldown = 1 / Math.max(0.04, d.fireRate ?? 1)
      const origin = baseOrigin.clone()
      if (aim?.muzzle) origin.copy(aim.muzzle.getWorldPosition(this.tmpAimPos))

      if (aim?.yaw && aim?.pitch) {
        aim.yaw.getWorldPosition(this.tmpAimPos)
        this.tmpAimVec.copy(target.mesh.position).sub(this.tmpAimPos)
        const yaw = Math.atan2(this.tmpAimVec.x, this.tmpAimVec.z)
        aim.yaw.rotation.y = yaw
        const pitchDist = Math.hypot(this.tmpAimVec.x, this.tmpAimVec.z)
        const pitch = Math.atan2(this.tmpAimVec.y, pitchDist)
        const limit = Math.PI / 3
        aim.pitch.rotation.x = -clamp(pitch, -limit, limit)
      } else if (aim?.yaw) {
        aim.yaw.getWorldPosition(this.tmpAimPos)
        this.tmpAimVec.copy(target.mesh.position).sub(this.tmpAimPos)
        aim.yaw.rotation.y = Math.atan2(this.tmpAimVec.x, this.tmpAimVec.z)
      }

      if (!this.tryConsumeShotPower(d, 1, wc)) continue
      target.hp -= (d.damage ?? 0) * novaMul * this.getRadarMarkedDamageMul(target)
      this.spawnShot(origin, target.mesh.position, 0xf97316)
      if (target.hp <= 0) {
        target.alive = false
        this.handleAsteroidDeath(target, 'combat', b)
        this.world.remove(target.mesh)
        this.world.remove(target.healthBar.group)
        this.spawnExplosion(target.mesh.position, 1.25, 0xf97316)
      }
    }
  }

  private tickJupiterRadarStations(dt: number) {
    if (this.heroId !== 'jupiter') return
    for (const b of this.buildings) {
      if (b.hp <= 0 || b.defId !== 'jupiter_radar_station') continue
      const d = this.getEffectiveDef(b.defId) ?? b.def
      const cost = 11 * VARS.P * dt
      if (this.powerStored < cost) continue
      this.powerStored -= cost
      const cx = b.origin.x + (b.def.size.w - 1) / 2
      const cz = b.origin.z + (b.def.size.h - 1) / 2
      const R = d.range ?? 46
      let maxMarks = 4
      let markDur = 3.25
      if (this.purchasedUpgradeIds.has('hero_jupiter_enhanced_pinging')) {
        maxMarks = 8
        markDur = 5.85
      }
      const cand = this.asteroids
        .filter((a) => a.alive && Math.hypot(a.mesh.position.x - cx, a.mesh.position.z - cz) <= R)
        .sort(
          (a, b2) =>
            Math.hypot(a.mesh.position.x - cx, a.mesh.position.z - cz) -
            Math.hypot(b2.mesh.position.x - cx, b2.mesh.position.z - cz),
        )
      const n = Math.min(maxMarks, cand.length)
      for (let i = 0; i < n; i++) cand[i].radarMarkTimer = Math.max(cand[i].radarMarkTimer, markDur)
    }
  }

  private tickJupiterArcThrower(b: PlacedBuilding, dt: number) {
    const d = this.augmentDefForCitadelCombat(b, this.getEffectiveDef(b.defId) ?? b.def)
    b.cooldown -= dt
    if (b.cooldown > 0) return
    const origin = new THREE.Vector3(b.origin.x + (d.size.w - 1) / 2, 4.5, b.origin.z + (d.size.h - 1) / 2)
    let best: Asteroid | null = null
    let bestD = Infinity
    for (const a of this.asteroids) {
      if (!a.alive) continue
      const dist = origin.distanceTo(a.mesh.position)
      if (dist > (d.range ?? 56)) continue
      if (dist < bestD) {
        bestD = dist
        best = a
      }
    }
    if (!best) return

    const supercharge = this.purchasedUpgradeIds.has('hero_jupiter_arc_supercharge')
    type ArcTier = { cost: number; chains: number; dmg: number; hopR: number }
    const tiers: ArcTier[] = [
      { cost: 9 * VARS.P, chains: 2, dmg: 52, hopR: 14 },
      { cost: 26 * VARS.P, chains: 4, dmg: 112, hopR: 17 },
      { cost: 58 * VARS.P, chains: 6, dmg: 205, hopR: 20 },
    ]
    if (supercharge) tiers.push({ cost: 96 * VARS.P, chains: 9, dmg: 320, hopR: 24 })

    let pick: ArcTier | null = null
    for (let i = tiers.length - 1; i >= 0; i--) {
      if (this.powerStored >= tiers[i].cost) {
        pick = tiers[i]
        break
      }
    }
    if (!pick) return
    this.powerStored -= pick.cost
    b.cooldown = 1 / Math.max(0.08, (d.fireRate ?? 0.42) * this.getJupiterOverclockFireRateMul(b))

    const hitIds = new Set<string>()
    let cur: Asteroid | null = best
    let from = origin.clone()
    let jumps = 0
    while (cur && jumps < pick.chains) {
      hitIds.add(cur.id)
      const mulNm = this.getNovaWeaponDamageMul(b)
      cur.hp -= pick.dmg * mulNm * this.getRadarMarkedDamageMul(cur)
      this.spawnShot(from, cur.mesh.position, 0xa78bfa)
      jumps++
      from.copy(cur.mesh.position)
      if (cur.hp <= 0) {
        cur.alive = false
        this.handleAsteroidDeath(cur, 'combat', b)
        this.world.remove(cur.mesh)
        this.world.remove(cur.healthBar.group)
        cur = null
        break
      }
      let next: Asteroid | null = null
      let nd = Infinity
      for (const a of this.asteroids) {
        if (!a.alive || hitIds.has(a.id)) continue
        const dd = a.mesh.position.distanceTo(from)
        if (dd <= pick.hopR && dd < nd) {
          nd = dd
          next = a
        }
      }
      cur = next
    }
    if (jumps > 0) this.spawnExplosion(origin.clone(), 1.05, 0xc4b5fd)
  }

  private tickJupiterReconDrone(b: PlacedBuilding, dt: number) {
    const d0 = this.getEffectiveDef(b.defId) ?? b.def
    const d = this.augmentDefForCitadelCombat(b, d0)
    const anchor = (b.mesh.userData as { reconOrbAnchor?: THREE.Object3D }).reconOrbAnchor
    const origin = anchor
      ? anchor.getWorldPosition(this.tmpAimPos)
      : new THREE.Vector3(b.origin.x + (d.size.w - 1) / 2, 10.2, b.origin.z + (d.size.h - 1) / 2)
    const dps = (d.damage ?? 4.4) * this.getJupiterOverclockFireRateMul(b)
    const targets: Asteroid[] = []
    for (const a of this.asteroids) {
      if (!a.alive) continue
      if (origin.distanceTo(a.mesh.position) > (d.range ?? 22)) continue
      targets.push(a)
    }
    if (targets.length === 0) return
    const wc = this.weaponFootprintCenter(b)
    if (!this.tryConsumeShotPower(d, dt, wc)) return
    const novaMul = this.getNovaWeaponDamageMul(b)
    let hitAny = false
    for (const a of targets) {
      a.hp -= dps * dt * novaMul * this.getRadarMarkedDamageMul(a)
      this.spawnShot(origin, a.mesh.position, 0x94a3b8)
      hitAny = true
      if (a.hp <= 0) {
        a.alive = false
        this.handleAsteroidDeath(a, 'combat', b)
        this.world.remove(a.mesh)
        this.world.remove(a.healthBar.group)
        this.spawnExplosion(a.mesh.position, 0.95, 0xcbd5e1)
      }
    }
    if (hitAny) this.spawnExplosion(origin.clone(), 0.35, 0x818cf8)
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
      if (mod.projectileSpeedMul) out.projectileSpeed = (out.projectileSpeed ?? 0) * mod.projectileSpeedMul
      if (mod.powerDrainMul) out.powerDrainPerSec = (out.powerDrainPerSec ?? 0) * mod.powerDrainMul
      if (mod.aoeRadiusMul) out.aoeRadius = (out.aoeRadius ?? 0) * mod.aoeRadiusMul
      if (mod.maxHpMul) out.maxHp *= mod.maxHpMul
      if (mod.shieldCapacityMul) out.shieldCapacityMul = (out.shieldCapacityMul ?? 1) * mod.shieldCapacityMul
      if (mod.shieldRechargeMul) out.shieldRechargeMul = (out.shieldRechargeMul ?? 1) * mod.shieldRechargeMul
      if (mod.supplyCapAddMul) out.supplyCapAdd = (out.supplyCapAdd ?? 0) * mod.supplyCapAddMul
      if (mod.powerCapAddMul) out.powerCapAdd = (out.powerCapAdd ?? 0) * mod.powerCapAddMul
      if (mod.creditIntervalSecMul) out.creditIntervalSec = (out.creditIntervalSec ?? 0) * mod.creditIntervalSecMul
      if (mod.shotCreditCostMul && out.shotCreditCost != null)
        out.shotCreditCost = Math.max(1, Math.round(out.shotCreditCost * mod.shotCreditCostMul))
    }
    return out
  }

  private getPassivePowerDrainPerSec(def: BuildingDef, b?: PlacedBuilding): number {
    // Turrets/missiles only draw when firing; railgun draws while charging.
    if (def.kind === 'railgun') return 0
    if (def.category === 'turrets' || def.category === 'missile') return 0
    // Commander Slag Cannon is category `hero` but bills power per shot like a turret.
    if (def.id === 'kingpin_slag_cannon') return 0
    // Nova photon / pulsar bill per shot in defense logic, not as passive drain.
    if (def.id === 'nova_photon_projector_s' || def.id === 'nova_photon_projector_l' || def.id === 'nova_shockwave_pulsar') return 0
    // Arc Thrower only spends energy on chained bursts.
    if (def.id === 'jupiter_arc_thrower') return 0
    if (def.id === 'jupiter_radar_station') return 0
    if (
      b &&
      this.heroId === 'kingpin' &&
      (b.defId === 'factory_business' || b.defId === 'factory_factory' || b.defId === 'factory_megacomplex') &&
      this.isNearKingpinIndoctrinatedLabor(b)
    )
      return 0
    return def.powerDrainPerSec ?? 0
  }

  private isNearKingpinIndoctrinatedLabor(f: PlacedBuilding): boolean {
    if (this.heroId !== 'kingpin') return false
    const wx = f.origin.x + (f.def.size.w - 1) / 2
    const wz = f.origin.z + (f.def.size.h - 1) / 2
    for (const lab of this.buildings) {
      if (lab.hp <= 0 || lab.defId !== 'kingpin_indoctrinated_labor') continue
      const ed = this.getEffectiveDef(lab.defId) ?? lab.def
      const r = ed.range ?? 11
      const cx = lab.origin.x + (lab.def.size.w - 1) / 2
      const cz = lab.origin.z + (lab.def.size.h - 1) / 2
      if (Math.hypot(wx - cx, wz - cz) <= r) return true
    }
    return false
  }

  private getKingpinDecoderRefineryMul(ref: PlacedBuilding): number {
    if (this.heroId !== 'kingpin') return 1
    const amp = this.purchasedUpgradeIds.has('hero_kingpin_signal_amplification')
    const mk2 = this.purchasedUpgradeIds.has('hero_kingpin_cryptographic_decoder_mk2')
    let perStack = amp ? 1.32 : 1.26
    if (mk2) perStack *= 1.065
    let mul = 1
    const wx = ref.origin.x + (ref.def.size.w - 1) / 2
    const wz = ref.origin.z + (ref.def.size.h - 1) / 2
    for (const dec of this.buildings) {
      if (dec.hp <= 0 || dec.defId !== 'kingpin_cryptographic_decoder') continue
      const ed = this.getEffectiveDef(dec.defId) ?? dec.def
      const r = ed.range ?? 11
      const cx = dec.origin.x + (dec.def.size.w - 1) / 2
      const cz = dec.origin.z + (dec.def.size.h - 1) / 2
      if (Math.hypot(wx - cx, wz - cz) <= r) mul *= perStack
    }
    return Math.min(mul, 2.45)
  }

  private isKingpinTurretForMineral(b: PlacedBuilding): boolean {
    if (b.hp <= 0) return false
    const d = this.getEffectiveDef(b.defId) ?? b.def
    if (d.kind === 'shield') return false
    if (d.category === 'turrets' || d.category === 'missile') return true
    if (d.category === 'energy') return true
    const hid = b.defId
    if (
      hid === 'dominion_orbital_cannon' ||
      hid === 'dominion_flak_gun' ||
      hid === 'dominion_laser_drill' ||
      hid === 'dominion_defensive_bunker' ||
      hid === 'dominion_seeker_drone_spawner'
    )
      return true
    if (hid === 'nova_photon_projector_s' || hid === 'nova_photon_projector_l' || hid === 'nova_shockwave_pulsar') return true
    return hid === 'jupiter_arc_thrower' || hid === 'jupiter_recon_drone' || hid === 'kingpin_slag_cannon'
  }

  private hasKingpinTurretNearProcessor(proc: PlacedBuilding, procRadius: number): boolean {
    const pcx = proc.origin.x + (proc.def.size.w - 1) / 2
    const pcz = proc.origin.z + (proc.def.size.h - 1) / 2
    for (const t of this.buildings) {
      if (!this.isKingpinTurretForMineral(t)) continue
      const tx = t.origin.x + (t.def.size.w - 1) / 2
      const tz = t.origin.z + (t.def.size.h - 1) / 2
      if (Math.hypot(tx - pcx, tz - pcz) <= procRadius + 0.5) return true
    }
    return false
  }

  private tryKingpinMineralProcessorPayout(pos: THREE.Vector3, killer?: PlacedBuilding) {
    if (this.heroId !== 'kingpin') return
    const ax = pos.x
    const az = pos.z
    const scrapFutures = this.purchasedUpgradeIds.has('hero_kingpin_scrap_futures')
    let paid = false
    for (const proc of this.buildings) {
      if (paid) break
      if (proc.hp <= 0 || proc.defId !== 'kingpin_mineral_processor') continue
      const ed = this.getEffectiveDef(proc.defId) ?? proc.def
      const r = ed.range ?? 13
      const cx = proc.origin.x + (proc.def.size.w - 1) / 2
      const cz = proc.origin.z + (proc.def.size.h - 1) / 2
      if (Math.hypot(ax - cx, az - cz) > r) continue
      let ok = false
      if (killer && this.isKingpinTurretForMineral(killer)) {
        const kx = killer.origin.x + (killer.def.size.w - 1) / 2
        const kz = killer.origin.z + (killer.def.size.h - 1) / 2
        ok = Math.hypot(kx - cx, kz - cz) <= r + 1
      }
      if (!ok) ok = this.hasKingpinTurretNearProcessor(proc, r)
      if (!ok) continue
      const base = scrapFutures ? 48 : 34
      this.applyCreditDelta(Math.round(base * VARS.E * (1 + this.wave * 0.024)))
      paid = true
    }
  }

  private weaponFootprintCenter(b: PlacedBuilding): { x: number; z: number } {
    return { x: b.origin.x + (b.def.size.w - 1) / 2, z: b.origin.z + (b.def.size.h - 1) / 2 }
  }

  /** Per-bank multipliers stack: each Power Bank in aura reduces shot power cost. */
  private getNovaPowerBankShotMulAt(wx: number, wz: number): number {
    if (this.heroId !== 'nova') return 1
    let mul = 1
    for (const pb of this.buildings) {
      if (pb.hp <= 0 || pb.defId !== 'nova_power_bank') continue
      const ed = this.getEffectiveDef(pb.defId) ?? pb.def
      const r = ed.range ?? 12
      const cx = pb.origin.x + (pb.def.size.w - 1) / 2
      const cz = pb.origin.z + (pb.def.size.h - 1) / 2
      if (Math.hypot(wx - cx, wz - cz) <= r) mul *= 0.74
    }
    return mul
  }

  private isNovaBankDamageEligible(b: PlacedBuilding): boolean {
    if (this.heroId !== 'nova') return false
    if (b.defId === 'nova_power_bank' || b.defId === 'nova_gravity_well') return false
    const d = this.getEffectiveDef(b.defId) ?? b.def
    if (d.kind === 'shield') return false
    if (d.category === 'turrets' || d.category === 'missile' || d.category === 'energy') return true
    if (d.category !== 'hero') return false
    if (
      b.defId === 'dominion_support_bay' ||
      b.defId === 'archangel_airfield' ||
      b.defId === 'archangel_starport' ||
      b.defId === 'archangel_munitions_plant' ||
      b.defId === 'archangel_missile_factory' ||
      b.defId === 'archangel_fueling_station' ||
      b.defId === 'archangel_bulk_fueling_station'
    )
      return false
    if (b.defId === 'dominion_seeker_drone_spawner') return true
    if (b.defId === 'nova_photon_projector_s' || b.defId === 'nova_photon_projector_l' || b.defId === 'nova_shockwave_pulsar') return true
    return (d.damage ?? 0) > 0 && (d.kind === 'hitscan' || d.kind === 'missiles' || d.kind === 'ballistic' || d.kind === 'railgun')
  }

  private getNovaWeaponDamageMul(b: PlacedBuilding): number {
    if (!this.purchasedUpgradeIds.has('hero_nova_energized_power_bank') || !this.isNovaBankDamageEligible(b)) return 1
    const wx = b.origin.x + (b.def.size.w - 1) / 2
    const wz = b.origin.z + (b.def.size.h - 1) / 2
    let mul = 1
    for (const pb of this.buildings) {
      if (pb.hp <= 0 || pb.defId !== 'nova_power_bank') continue
      const ed = this.getEffectiveDef(pb.defId) ?? pb.def
      const r = ed.range ?? 12
      const cx = pb.origin.x + (pb.def.size.w - 1) / 2
      const cz = pb.origin.z + (pb.def.size.h - 1) / 2
      if (Math.hypot(wx - cx, wz - cz) <= r) mul *= 1.07
    }
    return mul
  }

  private tryConsumeShotPower(def: BuildingDef, scale: number = 1, weaponSite?: { x: number; z: number }): boolean {
    let cost = Math.max(0, (def.powerDrainPerSec ?? 0) * POWER_DRAIN_GLOBAL_MUL * scale)
    if (weaponSite) cost *= this.getNovaPowerBankShotMulAt(weaponSite.x, weaponSite.z)
    if (cost <= 0) return true
    if (this.powerStored < cost) return false
    this.powerStored -= cost
    return true
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
      let gLine = (d.powerGenPerSec ?? 0) * this.getJupiterReconPowerGenMulForBuilding(b)
      if (b.defId === 'jupiter_battery_complex') {
        const low = clamp(1 - this.powerStored / Math.max(this.powerCap > 0 ? this.powerCap : powerCap, 1), 0, 1)
        gLine *= 1 + low * 2.25
        if (this.jupiterBatteryEmergencyTimer > 0) gLine *= 2.95
      }
      gen += gLine
      drain += this.getPassivePowerDrainPerSec(d, b) * POWER_DRAIN_GLOBAL_MUL
    }

    if (this.heroId === 'jupiter') {
      for (const oc of this.buildings) {
        if (oc.hp <= 0 || oc.defId !== 'jupiter_overclock_augment') continue
        let on = false
        for (const t of this.buildings) {
          if (t.hp <= 0 || !this.isJupiterOverclockTarget(t)) continue
          if (!this.buildingFootprintsEdgeAdjacent(t, oc)) continue
          on = true
          break
        }
        if (on) drain += 5.4 * VARS.P * POWER_DRAIN_GLOBAL_MUL
      }
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

    const relays = this.buildings.filter((b) => b.hp > 0 && b.defId === 'jupiter_mass_relay')
    if (relays.length > 1) {
      gen += relays.length * (relays.length - 1) * 0.52 * VARS.P
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
    this.statsPowerProduced += gen * dt
    this.powerStored = clamp(this.powerStored + gen * dt - drain * dt, 0, this.powerCap)

    if (this.heroId === 'jupiter' && this.purchasedUpgradeIds.has('hero_jupiter_emergency_generator')) {
      if (this.powerStored <= 0.001) this.jupiterBatteryEmergencyTimer = Math.max(this.jupiterBatteryEmergencyTimer, 4.8)
    }

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
        let payout = d.creditPayout
        if (this.heroId === 'kingpin' && (b.defId === 'refinery' || b.defId === 'mega_refinery')) {
          payout *= this.getKingpinDecoderRefineryMul(b)
        }
        this.applyCreditDelta(payout)
      }
    }

    if (this.heroId === 'kingpin') {
      for (const b of this.buildings) {
        if (b.hp <= 0 || b.defId !== 'kingpin_investment_complex') continue
        const d = this.getEffectiveDef(b.defId) ?? b.def
        if ((d.powerDrainPerSec ?? 0) > 0 && this.powerStored <= 0.001) continue
        const baseRate = (d.creditPayout ?? 12) * 0.065
        const wealthBonus = 1 + Math.min(2.35, this.credits / 3200)
        let add = baseRate * wealthBonus * dt
        if (this.purchasedUpgradeIds.has('hero_kingpin_compound_interest')) add *= 1.24
        this.applyCreditDelta(add)
      }
    }

  }

  private getArchangelEconomyMods() {
    let fuelRestockMul = 1
    if (this.purchasedUpgradeIds.has('hero_archangel_fuel_efficiency_1')) fuelRestockMul *= 1.14
    if (this.purchasedUpgradeIds.has('hero_archangel_fuel_efficiency_2')) fuelRestockMul *= 1.14
    const fuelStationMul = this.purchasedUpgradeIds.has('hero_archangel_fueling_mk2') ? 1.16 : 1
    const bulkStationMul = this.purchasedUpgradeIds.has('hero_archangel_bulk_fueling_mk2') ? 1.2 : 1
    const munitionsMul = this.purchasedUpgradeIds.has('hero_archangel_munitions_mk2') ? 1.22 : 1
    const missileFactoryMul = this.purchasedUpgradeIds.has('hero_archangel_missile_factory_mk2') ? 1.22 : 1
    return { fuelRestockMul, fuelStationMul, bulkStationMul, munitionsMul, missileFactoryMul }
  }

  /** Archangel producers that need power are skipped when the grid is empty. */
  private countActiveArchangelSuppliers(defId: BuildingId): number {
    let n = 0
    for (const b of this.buildings) {
      if (b.hp <= 0 || b.defId !== defId) continue
      const d = this.getEffectiveDef(b.defId) ?? b.def
      if ((d.powerDrainPerSec ?? 0) > 0 && this.powerStored <= 0.001) continue
      n++
    }
    return n
  }

  private syncArchangelPlanes() {
    if (this.heroId !== 'archangel') return
    const tight = this.purchasedUpgradeIds.has('hero_archangel_tight_shift')
    const slotsPerHome = tight ? 2 : 1
    const allowed = new Set(
      this.buildings
        .filter((b) => b.hp > 0 && (b.defId === 'archangel_airfield' || b.defId === 'archangel_starport'))
        .map((b) => b.id),
    )
    for (const id of allowed) {
      for (let slot = 0; slot < slotsPerHome; slot++) {
        const s = slot as 0 | 1
        if (!this.archangelPlanes.some((p) => p.homeId === id && p.slot === s)) {
          const home = this.buildings.find((b) => b.id === id)
          if (home) this.archangelPlanes.push(this.createArchangelPlane(home, s))
        }
      }
    }
    for (const p of [...this.archangelPlanes]) {
      if (!allowed.has(p.homeId) || p.slot >= slotsPerHome) {
        this.world.remove(p.hud.group)
        this.world.remove(p.mesh)
        this.archangelPlanes.splice(this.archangelPlanes.indexOf(p), 1)
      }
    }
  }

  private makeArchangelJetMesh(role: 'gunship' | 'bomber'): THREE.Group {
    const g = new THREE.Group()
    const mat = new THREE.MeshStandardMaterial({
      color: role === 'gunship' ? 0xc4b5fd : 0xe879f9,
      metalness: 0.22,
      roughness: 0.52,
    })
    const fuselage = new THREE.Mesh(new THREE.ConeGeometry(0.34, 1.55, 8), mat)
    fuselage.rotation.x = Math.PI / 2
    fuselage.position.z = 0.18
    g.add(fuselage)
    const wing = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.07, 0.36), mat)
    wing.position.y = 0.06
    g.add(wing)
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.38, 0.24), mat)
    tail.position.set(0, 0.14, -0.62)
    g.add(tail)
    return g
  }

  private createArchangelPlane(home: PlacedBuilding, slot: 0 | 1): ArchangelPlane {
    const role = home.defId === 'archangel_airfield' ? 'gunship' : 'bomber'
    const mesh = this.makeArchangelJetMesh(role)
    const cx = home.origin.x + (home.def.size.w - 1) / 2
    const cz = home.origin.z + (home.def.size.h - 1) / 2
    const ox = slot === 0 ? -0.55 : 0.55
    const oz = slot === 0 ? 0.32 : -0.32
    mesh.position.set(cx + ox, 2.1, cz + oz)
    this.world.add(mesh)
    const maxFuel = role === 'gunship' ? 19 : 23
    const maxBullets = role === 'gunship' ? 44 : 0
    const maxMissiles = role === 'bomber' ? 5 : 0
    const hud = this.createPlaneHudBars()
    return {
      id: `archangel-plane-${++this.planeIdSeed}`,
      mesh,
      homeId: home.id,
      slot,
      role,
      state: 'refuel',
      fuel: 0,
      maxFuel,
      bullets: 0,
      maxBullets,
      missiles: 0,
      maxMissiles,
      targetId: null,
      evadeTimer: 0,
      bomberBurstLeft: 0,
      bomberBurstGapTimer: 0,
      bomberBurstRestTimer: 0,
      hud,
    }
  }

  private updateArchangelPlanes(dt: number) {
    if (this.heroId !== 'archangel') return
    this.syncArchangelPlanes()
    const waveOn = this.waveInProgress
    const anyAsteroids = this.asteroids.some((a) => a.alive)
    const PLANE_ALT = 11.2
    const GROUND_Y = 2.05
    const HOME_RZ = 2.35
    const AVOID_DIST = 5
    const quickReload = this.purchasedUpgradeIds.has('hero_archangel_quick_reload')
    const BOMBER_BURST_GAP = 0.5 * (quickReload ? 0.72 : 1)
    const BOMBER_BURST_REST = 2 * (quickReload ? 0.75 : 1)
    const m = this.getArchangelEconomyMods()

    for (const p of this.archangelPlanes) {
      const home = this.buildings.find((b) => b.id === p.homeId && b.hp > 0)
      if (!home) continue
      if (!waveOn && p.state === 'patrol') {
        p.state = 'return'
        p.targetId = null
        p.evadeTimer = 0
      }
      const eff = this.getEffectiveDef(home.defId) ?? home.def
      const speed = ARCHANGEL_PLANE_FLIGHT_SPEED
      const cx = home.origin.x + (home.def.size.w - 1) / 2
      const cz = home.origin.z + (home.def.size.h - 1) / 2
      const hx = p.slot === 0 ? -0.55 : 0.55
      const hz = p.slot === 0 ? 0.32 : -0.32
      const burn = p.role === 'gunship' ? 0.62 : 0.71

      if (waveOn && p.evadeTimer > 0) p.evadeTimer -= dt
      if (waveOn && p.role === 'bomber') {
        p.bomberBurstRestTimer = Math.max(0, p.bomberBurstRestTimer - dt)
      }

      if (p.state === 'refuel') {
        p.targetId = null
        p.mesh.position.lerp(new THREE.Vector3(cx + hx, GROUND_Y, cz + hz), 1 - Math.exp(-dt * 5.5))
        p.mesh.rotation.set(0, p.mesh.rotation.y * Math.max(0, 1 - dt * 4), 0)
        // Fuel and ordnance transfer only during an active wave (not the inactive build phase).
        if (waveOn) {
          const fuelSmall = this.countActiveArchangelSuppliers('archangel_fueling_station')
          const fuelBulk = this.countActiveArchangelSuppliers('archangel_bulk_fueling_station')
          const fuelPerSec =
            fuelSmall * 0.58 * m.fuelRestockMul * m.fuelStationMul +
            fuelBulk * 1.55 * m.fuelRestockMul * m.bulkStationMul
          if (p.fuel < p.maxFuel - 1e-3 && fuelPerSec > 0) {
            p.fuel = Math.min(p.maxFuel, p.fuel + fuelPerSec * dt)
          }
          if (p.role === 'gunship') {
            const plants = this.countActiveArchangelSuppliers('archangel_munitions_plant')
            if (plants > 0 && p.bullets < p.maxBullets - 1e-3 && this.credits > 1e-4) {
              const creditBudget = 0.82 * plants * dt * m.munitionsMul
              const spend = Math.min(creditBudget, this.credits)
              this.applyCreditDelta(-spend)
              const room = p.maxBullets - p.bullets
              p.bullets = Math.min(p.maxBullets, p.bullets + Math.min(room, spend * 1.42))
            }
          } else {
            const factories = this.countActiveArchangelSuppliers('archangel_missile_factory')
            // Starport bombers: blue (missile) bar fills slightly faster than gunship bullet loading.
            if (factories > 0 && p.missiles < p.maxMissiles - 1e-4 && this.credits > 1e-4) {
              const creditBudget = 1.05 * factories * dt * m.missileFactoryMul
              const spend = Math.min(creditBudget, this.credits)
              this.applyCreditDelta(-spend)
              const room = p.maxMissiles - p.missiles
              p.missiles = Math.min(p.maxMissiles, p.missiles + Math.min(room, spend * 0.056))
            }
          }
        }
        const fuelFull = p.fuel >= p.maxFuel - 0.02
        const ordFull =
          p.role === 'gunship' ? p.bullets >= p.maxBullets - 0.35 : p.missiles >= p.maxMissiles - 0.04
        if (fuelFull && ordFull) {
          if (waveOn && anyAsteroids) {
            if (p.padLaunchStagger === undefined) p.padLaunchStagger = Math.random() * 1.05
            p.padLaunchStagger -= dt
            if (p.padLaunchStagger > 0) {
              continue
            }
            p.padLaunchStagger = undefined
          }
          p.fuel = p.maxFuel
          if (p.role === 'gunship') p.bullets = p.maxBullets
          else p.missiles = p.maxMissiles
          if (waveOn && anyAsteroids) p.state = 'patrol'
        }
        continue
      }

      p.fuel -= burn * dt
      if (p.fuel <= 0) {
        p.fuel = 0
        p.state = 'return'
        p.targetId = null
        if (p.role === 'bomber' && p.bomberBurstLeft > 0) {
          p.bomberBurstLeft = 0
          p.bomberBurstGapTimer = 0
        }
      }

      if (p.state === 'return') {
        const dest = new THREE.Vector3(cx + hx, PLANE_ALT, cz + hz)
        const toHome = this.tmpAimVec.copy(dest).sub(p.mesh.position)
        const lenHome = toHome.length()
        if (lenHome < HOME_RZ && Math.abs(p.mesh.position.y - PLANE_ALT) < 1.6) {
          p.state = 'refuel'
          p.padLaunchStagger = undefined
          continue
        }
        const stepHome = Math.min(speed * dt, lenHome)
        if (lenHome > 0.001) {
          toHome.normalize().multiplyScalar(stepHome)
          p.mesh.position.add(toHome)
          p.mesh.lookAt(dest)
        }
        continue
      }

      if (!waveOn) continue

      const frGun = eff.fireRate ?? 12
      const outOfAmmo =
        p.role === 'gunship'
          ? p.bullets < Math.max(0.15, frGun * dt * 0.5)
          : p.missiles < 1 && p.bomberBurstLeft <= 0
      if (outOfAmmo) {
        p.state = 'return'
        p.targetId = null
        continue
      }

      let target = p.targetId ? this.asteroids.find((a) => a.id === p.targetId && a.alive) : null
      if (target) {
        const hDist = Math.hypot(
          target.mesh.position.x - p.mesh.position.x,
          target.mesh.position.z - p.mesh.position.z,
        )
        if (hDist <= ARCHANGEL_MIN_TARGET_TILE_DIST) {
          p.targetId = null
          target = null
          if (p.role === 'bomber' && p.bomberBurstLeft > 0) {
            p.bomberBurstLeft = 0
            p.bomberBurstGapTimer = 0
            p.bomberBurstRestTimer = Math.max(p.bomberBurstRestTimer, BOMBER_BURST_REST)
          }
        }
      }
      if (!target && p.evadeTimer <= 0) {
        target = this.pickRandomEngageTarget(p.mesh.position)
        p.targetId = target?.id ?? null
      }
      if (p.evadeTimer > 0) {
        target = null
      }

      if (target) {
        const tp = target.mesh.position
        const toT = this.tmpAimPos.copy(tp).sub(p.mesh.position)
        const dist = toT.length()
        if (dist < AVOID_DIST) {
          if (p.evadeTimer <= 0) p.evadeTimer = 0.42
          p.targetId = null
          if (p.role === 'bomber' && p.bomberBurstLeft > 0) {
            p.bomberBurstLeft = 0
            p.bomberBurstGapTimer = 0
            p.bomberBurstRestTimer = Math.max(p.bomberBurstRestTimer, BOMBER_BURST_REST)
          }
          if (dist > 0.001) {
            const stepEv = Math.min(speed * dt, 3.2)
            toT.normalize().multiplyScalar(-stepEv)
            p.mesh.position.add(toT)
            this.tmpV3.copy(toT).normalize().multiplyScalar(3).add(p.mesh.position)
            p.mesh.lookAt(this.tmpV3)
          }
        } else {
          if (dist > 0.12) {
            const stepCh = Math.min(speed * dt, dist)
            toT.normalize().multiplyScalar(stepCh)
            p.mesh.position.add(toT)
            p.mesh.lookAt(tp)
          }
          const weaponRange = eff.range ?? 32
          if (dist <= weaponRange) {
            if (p.role === 'gunship') {
              const fr = eff.fireRate ?? 12
              const dmg = eff.damage ?? 5
              const burstCost = fr * dt
              if (p.bullets >= burstCost) {
                p.bullets -= burstCost
                target.hp -= dmg * fr * dt * this.getRadarMarkedDamageMul(target)
                if (Math.random() < 0.5) this.spawnShot(p.mesh.position.clone(), tp.clone(), 0xfde047)
                if (target.hp <= 0) {
                  target.alive = false
                  this.handleAsteroidDeath(target, 'combat')
                  this.world.remove(target.mesh)
                  this.world.remove(target.healthBar.group)
                  p.targetId = null
                }
              }
            } else {
              const fireBomberMissile = () => {
                if (p.missiles < 1) return false
                p.missiles -= 1
                this.spawnArchangelPlaneMissile(
                  p.mesh.position.clone(),
                  target,
                  eff.damage ?? 180,
                  eff.aoeRadius ?? 12,
                  eff.projectileSpeed ?? 52,
                )
                return true
              }
              if (p.bomberBurstLeft > 0) {
                p.bomberBurstGapTimer -= dt
                while (p.bomberBurstGapTimer <= 0 && p.bomberBurstLeft > 0 && target.alive) {
                  if (!fireBomberMissile()) {
                    p.bomberBurstLeft = 0
                    p.bomberBurstRestTimer = BOMBER_BURST_REST
                    break
                  }
                  p.bomberBurstLeft -= 1
                  if (p.bomberBurstLeft > 0) p.bomberBurstGapTimer += BOMBER_BURST_GAP
                  else p.bomberBurstRestTimer = BOMBER_BURST_REST
                }
              } else if (p.bomberBurstRestTimer <= 0) {
                if (fireBomberMissile()) {
                  p.bomberBurstLeft = 3
                  p.bomberBurstGapTimer = BOMBER_BURST_GAP
                }
              }
            }
          }
        }
      } else if (anyAsteroids) {
        const wander = this.pickRandomEngageTarget(p.mesh.position)
        if (wander) {
          const wp = wander.mesh.position
          const toW = this.tmpAimVec.copy(wp).sub(p.mesh.position)
          const wl = toW.length()
          if (wl > 0.2) {
            const stepW = Math.min(speed * 0.7 * dt, wl)
            toW.normalize().multiplyScalar(stepW)
            p.mesh.position.add(toW)
            p.mesh.lookAt(wp)
          }
        }
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
          const { adj } = this.getEnemyScalingWave()
          const spawnIntervalBase = Math.max(0.06, 0.34 - adj * 0.015)
          const lateMult = adj > 5 ? Math.pow(0.93, adj - 5) : 1
          const spawnInterval = Math.max(0.035, spawnIntervalBase * lateMult * this.getDifficultyScale().spawnIntervalMul)
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
        if (this.heroId === 'kingpin' && this.purchasedUpgradeIds.has('hero_kingpin_hazard_pay')) {
          this.applyCreditDelta(Math.round((72 + this.wave * 20) * VARS.E))
        }
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

  private handleAsteroidDeath(a: Asteroid, reason: 'impact' | 'shield' | 'combat', killer?: PlacedBuilding) {
    const pos = a.mesh.position.clone()

    if (reason === 'impact') {
      this.emitAudio({ type: 'asteroid_impact' })
    } else if (reason === 'shield') {
      this.emitAudio({ type: 'asteroid_destroyed', variant: a.variant, reason: 'shield' })
    } else {
      this.emitAudio({ type: 'asteroid_destroyed', variant: a.variant, reason: 'combat' })
    }

    // Player-caused kills grant credits by asteroid type.
    if (reason !== 'impact') {
      this.applyCreditDelta(
        Math.round(this.getAsteroidKillReward(a) * VARS.asteroidKillCreditMul * (1 + this.wave * 0.025)),
      )
      this.statsAsteroidsKilled += 1
    }

    if (reason === 'combat' && this.heroId === 'jupiter' && a.radarMarkTimer > 0) {
      this.powerStored = Math.min(this.powerCap, this.powerStored + Math.round(26 * VARS.P))
    }

    if (reason === 'combat') this.tryKingpinMineralProcessorPayout(pos, killer)

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
        this.emitAudio({ type: 'aoe_pop' })
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
      this.emitAudio({ type: 'emp_pulse' })
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
      pulsarSlowTimer: 0,
      stasisTimer: 0,
      radarMarkTimer: 0,
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
      pulsarSlowTimer: 0,
      stasisTimer: 0,
      radarMarkTimer: 0,
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

    const gravityWells = this.buildings.filter((b) => b.hp > 0 && b.defId === 'nova_gravity_well')
    if (gravityWells.length > 0) {
      const pulled: PlacedBuilding[] = []
      for (const w of gravityWells) {
        if (Math.random() < 0.058) pulled.push(w)
      }
      if (pulled.length > 0) {
        const w = pulled[Math.floor(Math.random() * pulled.length)]
        const gx = w.origin.x + (w.def.size.w - 1) / 2
        const gz = w.origin.z + (w.def.size.h - 1) / 2
        target.set(gx, 0, gz)
      }
    }

    // Stronger scaling: gets significantly harder over time (rate depends on difficulty via getEnemyScalingWave).
    const { adj, powT } = this.getEnemyScalingWave()
    const diff = this.getDifficultyScale()
    // Global asteroid health nerf to keep waves killable.
    const ASTEROID_HP_GLOBAL_MUL = 0.78
    const baseHp = Math.round((100 + adj * 26 + Math.pow(powT, 1.3) * 14) * diff.hpMul * ASTEROID_HP_GLOBAL_MUL)
    const baseDamage = Math.round((360 + adj * 42 + Math.pow(powT, 1.22) * 16) * diff.damageMul)
    const baseSpeed = (15 + adj * 0.9 + Math.pow(powT, 1.08) * 0.18) * diff.speedMul

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
      pulsarSlowTimer: 0,
      stasisTimer: 0,
      radarMarkTimer: 0,
    })
    this.registerAsteroidDiscovery(pick.variant)
  }

  private registerAsteroidDiscovery(variant: AsteroidVariant) {
    if (this.discoveredAsteroidVariants.has(variant)) return
    this.discoveredAsteroidVariants.add(variant)
    this.activeAsteroidDiscovery = variant
    this.asteroidDiscoveryTimerSec = 5
    this.emitAudio({ type: 'asteroid_discovery', variant })
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

      a.stasisTimer = Math.max(0, a.stasisTimer - dt)
      a.pulsarSlowTimer = Math.max(0, a.pulsarSlowTimer - dt)
      a.radarMarkTimer = Math.max(0, a.radarMarkTimer - dt)
      const frozen = a.stasisTimer > 0
      const slowMul = a.pulsarSlowTimer > 0 ? 0.52 : 1

      // Spawner asteroids periodically spawn fast blue meteors.
      if (a.variant === 'spawner' && !frozen) {
        a.spawnCooldown -= dt
        if (a.spawnCooldown <= 0) {
          this.spawnMeteorFromSpawner(a)
          const { adj } = this.getEnemyScalingWave()
          const next = Math.max(2.2, 5.2 - adj * 0.12)
          a.spawnCooldown += next
        }
      }

      // Seekers constantly steer toward the closest live building.
      if (a.variant === 'seeker' && !frozen) {
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

      if (!frozen) {
        a.mesh.position.addScaledVector(a.velocity, dt * slowMul)
      }
      a.mesh.rotation.x += dt * 1.1
      a.mesh.rotation.y += dt * 1.3

      // Shield interception: symmetrical HP trade; asteroid may survive and pass through.
      const shield = this.getActiveShieldHit(a.mesh.position)
      if (shield) {
        const prevShieldHp = shield.hp
        const transfer = Math.min(a.impactDamage, shield.hp, a.hp)
        shield.hp = Math.max(0, shield.hp - transfer)
        a.hp -= transfer * this.getRadarMarkedDamageMul(a)

        const isUniversal = shield.generatorId === '__universal__'
        const genB = isUniversal
          ? this.buildings.find((x) => x.hp > 0 && x.defId === 'nova_universal_forcefield')
          : this.buildings.find((x) => x.id === shield.generatorId)

        if (
          this.purchasedUpgradeIds.has('hero_nova_shield_implosion') &&
          genB &&
          (genB.defId === 'shield_generator_m' ||
            genB.defId === 'shield_generator_l' ||
            genB.defId === 'nova_universal_forcefield') &&
          prevShieldHp > 0.001 &&
          shield.hp <= 0.001
        ) {
          const gcx = isUniversal ? 0 : genB.origin.x + (genB.def.size.w - 1) / 2
          const gcz = isUniversal ? 0 : genB.origin.z + (genB.def.size.h - 1) / 2
          this.explodeAt(new THREE.Vector3(gcx, 1.2, gcz), 52, 34, 0xc084fc)
        }

        if (shield.hp < shield.maxHp * 0.1) shield.lowHpOffline = true
        if (shield.hp >= shield.maxHp - 0.001) shield.lowHpOffline = false
        shield.bubble.visible = !shield.noPower && shield.hp > 0.001 && !shield.lowHpOffline
        if (transfer > 0.001) {
          this.emitAudio({ type: 'shield_hit' })
        }
        this.spawnExplosion(a.mesh.position, 1.5, 0x38bdf8)

        if (a.hp <= 0) {
          this.handleAsteroidDeath(a, 'shield')
          a.alive = false
          this.world.remove(a.mesh)
          this.world.remove(a.healthBar.group)
        }
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

    this.tickCitadelCommandCenterTurrets(dt)

    for (const b of this.buildings) {
      if (b.hp <= 0) continue
      const d = this.getEffectiveDef(b.defId) ?? b.def

      // Shield: visible bubble + active only if has power
      if (d.kind === 'shield') {
        // nothing else here; interception handled in asteroid update
        continue
      }
      if (b.defId === 'jupiter_arc_thrower') {
        this.tickJupiterArcThrower(b, dt)
        continue
      }
      if (b.defId === 'jupiter_recon_drone') {
        this.tickJupiterReconDrone(b, dt)
        continue
      }
      if (b.defId === 'dominion_orbital_cannon') {
        this.tickDominionOrbitalCannon(b, dt)
        continue
      }
      if (b.defId === 'dominion_flak_gun') {
        this.tickDominionFlakGun(b, dt)
        continue
      }
      if (b.defId === 'dominion_laser_drill') {
        this.tickDominionLaserDrill(b, dt)
        continue
      }
      if (b.defId === 'nova_photon_projector_s' || b.defId === 'nova_photon_projector_l') {
        this.tickNovaPhotonProjector(b, dt)
        continue
      }
      if (b.defId === 'nova_shockwave_pulsar') {
        this.tickNovaShockwavePulsar(b, dt)
        continue
      }
      if (b.defId === 'tesla_tower') {
        const dT = this.augmentDefForCitadelCombat(b, d)
        const anchor = (b.mesh.userData as any)?.teslaAnchor as THREE.Object3D | undefined
        const origin = anchor
          ? anchor.getWorldPosition(this.tmpAimPos)
          : new THREE.Vector3(b.origin.x + (d.size.w - 1) / 2, 2.8, b.origin.z + (d.size.h - 1) / 2)
        const dps = dT.damage ?? 0
        const targets: Asteroid[] = []
        for (const a of this.asteroids) {
          if (!a.alive) continue
          const dist = origin.distanceTo(a.mesh.position)
          if (dist > (dT.range ?? 0)) continue
          targets.push(a)
        }
        if (targets.length === 0) continue
        // Energy weapons: constant drain handled in resources, plus extra while firing.
        const wc = this.weaponFootprintCenter(b)
        if (!this.tryConsumeShotPower(dT, dt, wc)) continue
        const novaMul = this.getNovaWeaponDamageMul(b)
        let hitAny = false
        for (const a of targets) {
          a.hp -= dps * dt * novaMul * this.getJupiterOverclockFireRateMul(b)
          this.spawnShot(origin, a.mesh.position, 0x67e8f9)
          hitAny = true
          if (a.hp <= 0) {
            a.alive = false
            this.handleAsteroidDeath(a, 'combat', b)
            this.world.remove(a.mesh)
            this.world.remove(a.healthBar.group)
            this.spawnExplosion(a.mesh.position, 1.1, 0x67e8f9)
          }
        }
        if (hitAny) this.spawnExplosion(origin, 0.45, 0x22d3ee)
        continue
      }

      const dCombat = this.augmentDefForCitadelCombat(b, d)
      if (dCombat.fireRate != null) dCombat.fireRate *= this.getJupiterOverclockFireRateMul(b)
      if (!dCombat.range || !dCombat.damage) continue
      // if out of power and the building drains power, it pauses
      if (dCombat.kind !== 'railgun' && (dCombat.powerDrainPerSec ?? 0) > 0 && this.powerStored <= 0.001) continue

      const isPlasma = b.defId === 'plasma_laser_s' || b.defId === 'plasma_laser_m' || b.defId === 'plasma_laser_l'
      if (dCombat.kind !== 'railgun') {
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
          } else if (baseOrigin.distanceTo(locked.mesh.position) <= dCombat.range) {
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
            if (dist > dCombat.range) continue
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
          if (dist > dCombat.range) continue
          if (dist < best) {
            best = dist
            target = a
          }
        }
      }
      if (!target) continue

      const wc = this.weaponFootprintCenter(b)
      const novaMul = this.getNovaWeaponDamageMul(b)

      if (dCombat.kind !== 'railgun' && !isPlasma) b.cooldown = 1 / (dCombat.fireRate ?? 1)
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

      if (dCombat.kind === 'hitscan') {
        if (isPlasma) {
          // Energy weapons: constant drain handled in resources, plus extra while firing.
          if (!this.tryConsumeShotPower(dCombat, dt, wc)) continue
          target.hp -=
            (dCombat.damage ?? 0) * dt * novaMul * this.getRadarMarkedDamageMul(target)
          this.spawnShot(origin, target.mesh.position, 0x22d3ee)
          if (target.hp <= 0) {
            target.alive = false
            this.handleAsteroidDeath(target, 'combat', b)
            this.world.remove(target.mesh)
            this.world.remove(target.healthBar.group)
            this.spawnExplosion(target.mesh.position, 1.0, 0x22d3ee)
            b.plasmaTargetId = undefined
            b.cooldown = Math.max(b.cooldown, 0.5)
          }
          continue
        }
        if (b.defId === 'kingpin_slag_cannon') {
          const edShot = this.getEffectiveDef(b.defId) ?? dCombat
          const shotC = Math.max(1, edShot.shotCreditCost ?? 22)
          if (this.credits < shotC) {
            b.cooldown = Math.max(b.cooldown, 0.16)
            continue
          }
          this.applyCreditDelta(-shotC)
        }
        if (!this.tryConsumeShotPower(dCombat, 1, wc)) continue
        if ((dCombat.aoeRadius ?? 0) > 0.01) {
          this.explodeAt(target.mesh.position, dCombat.aoeRadius ?? 2, (dCombat.damage ?? 0) * novaMul, dCombat.color)
          this.spawnShot(origin, target.mesh.position, dCombat.color)
        } else {
          target.hp -= (dCombat.damage ?? 0) * novaMul * this.getRadarMarkedDamageMul(target)
          this.spawnShot(origin, target.mesh.position, dCombat.color)
          if (target.hp <= 0) {
            target.alive = false
            this.handleAsteroidDeath(target, 'combat', b)
            this.world.remove(target.mesh)
            this.world.remove(target.healthBar.group)
            this.spawnExplosion(target.mesh.position, 1.4, 0x38bdf8)
          }
        }
      } else if (dCombat.kind === 'missiles') {
        const isHydra = b.defId === 'hydra_launcher'
        const isDeathLoc = b.defId === 'missile_launcher_s' || b.defId === 'missile_launcher_m'
        const mode: 'death_location' | 'retarget' = isDeathLoc ? 'death_location' : 'retarget'
        const burst = dCombat.burst ?? 1
        if (isHydra && burst > 1) {
          const volleyId = `v_${this.volleyIdSeed++}`
          this.pendingMissileBursts.push({
            origin: origin.clone(),
            target,
            def: dCombat,
            remaining: burst,
            interval: 0.1,
            timer: 0,
            mode,
            noSplash: true,
            volleyId,
            powerSite: wc,
            damageScale: novaMul,
          })
        } else {
          this.spawnMissile(origin, target, dCombat, mode, false, null, wc, novaMul)
        }
      } else if (dCombat.kind === 'ballistic') {
        this.spawnBallistic(origin, target.mesh.position, dCombat, wc, novaMul)
      } else if (dCombat.kind === 'railgun') {
        const chargeCap = 120
        const maxDrawPerSec = 24
        const drawn = Math.min(this.powerStored, maxDrawPerSec * dt)
        this.powerStored -= drawn
        b.charge += drawn
        if (b.charge < chargeCap) continue
        b.charge = 0
        this.fireRailgun(origin, target.mesh.position, dCombat.range, (dCombat.damage ?? 600) * novaMul)
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
        a.hp -= damage * this.getRadarMarkedDamageMul(a)
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

  private getDominionShrapnelCount(orbital: boolean): number {
    const base = orbital ? 12 : 4
    return this.purchasedUpgradeIds.has('hero_dominion_lead_rounds') ? Math.round(base * 1.5) : base
  }

  private ensureDominionShrapnelAssets() {
    if (this.dominionShrapnelConeGeo) return
    this.dominionShrapnelConeGeo = new THREE.ConeGeometry(0.12, 0.58, 8)
    this.dominionShrapnelMatOrbital = new THREE.MeshStandardMaterial({
      color: 0xe879f9,
      emissive: 0xe879f9,
      emissiveIntensity: 0.42,
      roughness: 0.36,
      metalness: 0.12,
    })
    this.dominionShrapnelMatFlak = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xfbbf24,
      emissiveIntensity: 0.42,
      roughness: 0.36,
      metalness: 0.12,
    })
  }

  /**
   * Flak / orbital secondary damage: small cone projectiles (missile-like), random azimuth,
   * shallow elevation — not free-floating “particles” and capped for performance.
   */
  private spawnDominionShrapnel(origin: THREE.Vector3, damage: number, color: number) {
    this.ensureDominionShrapnelAssets()
    while (this.dominionShrapnel.length >= BaseDefenseGame.DOMINION_SHRAPNEL_MAX_ACTIVE) {
      const old = this.dominionShrapnel.shift()!
      this.projectiles.remove(old.mesh)
    }
    const mat =
      color === 0xe879f9 ? this.dominionShrapnelMatOrbital! : this.dominionShrapnelMatFlak!
    const mesh = new THREE.Mesh(this.dominionShrapnelConeGeo!, mat)
    mesh.castShadow = true
    const azimuth = Math.random() * Math.PI * 2
    const elevation = 0.04 + Math.random() * 0.14
    this.tmpAimVec
      .set(Math.cos(azimuth) * Math.cos(elevation), Math.sin(elevation), Math.sin(azimuth) * Math.cos(elevation))
      .normalize()
    const speed = 40 + Math.random() * 18
    const vel = new THREE.Vector3().copy(this.tmpAimVec).multiplyScalar(speed)
    mesh.position.copy(origin)
    mesh.position.y += 0.15
    mesh.quaternion.setFromUnitVectors(this.dominionShrapnelConeAxis, this.tmpAimVec)
    this.projectiles.add(mesh)
    this.dominionShrapnel.push({ mesh, velocity: vel, ttl: 2.5, damage })
  }

  private updateDominionShrapnel(dt: number) {
    for (const sh of [...this.dominionShrapnel]) {
      sh.ttl -= dt
      sh.mesh.position.addScaledVector(sh.velocity, dt)
      let hit = false
      for (const a of this.asteroids) {
        if (!a.alive) continue
        if (sh.mesh.position.distanceTo(a.mesh.position) < 1.15) {
          a.hp -= sh.damage * this.getRadarMarkedDamageMul(a)
          hit = true
          if (a.hp <= 0) {
            a.alive = false
            this.handleAsteroidDeath(a, 'combat')
            this.world.remove(a.mesh)
            this.world.remove(a.healthBar.group)
          }
          break
        }
      }
      if (hit || sh.ttl <= 0) {
        this.projectiles.remove(sh.mesh)
        this.dominionShrapnel.splice(this.dominionShrapnel.indexOf(sh), 1)
      }
    }
  }

  private tickDominionOrbitalCannon(b: PlacedBuilding, dt: number) {
    const d = this.augmentDefForCitadelCombat(b, this.getEffectiveDef(b.defId) ?? b.def)
    b.cooldown -= dt
    if (b.cooldown > 0) return
    const origin = new THREE.Vector3(b.origin.x + (d.size.w - 1) / 2, 5.4, b.origin.z + (d.size.h - 1) / 2)
    const aim = (b.mesh.userData as any)?.aim as WeaponAim | undefined
    let target: Asteroid | null = null
    let bestD = Infinity
    for (const a of this.asteroids) {
      if (!a.alive) continue
      const dist = origin.distanceTo(a.mesh.position)
      if (dist < bestD) {
        bestD = dist
        target = a
      }
    }
    if (!target) return
    const powerShot = 52 * VARS.P * POWER_DRAIN_GLOBAL_MUL
    if (this.powerStored < powerShot) return
    this.powerStored -= powerShot
    const rof = (d.fireRate ?? 0.2) * this.getJupiterOverclockFireRateMul(b)
    b.cooldown = 1 / Math.max(0.04, rof)
    if (aim?.yaw) {
      this.tmpAimVec.copy(target.mesh.position).sub(origin)
      const yaw = Math.atan2(this.tmpAimVec.x, this.tmpAimVec.z)
      aim.yaw.rotation.y = yaw
    }
    const dmg = (d.damage ?? 560) * this.getNovaWeaponDamageMul(b)
    const aoe = d.aoeRadius ?? 15
    this.explodeAt(target.mesh.position, aoe, dmg, 0xa78bfa)
    const n = this.getDominionShrapnelCount(true)
    const sd = dmg * 0.5
    const burstFrom = target.mesh.position.clone()
    for (let i = 0; i < n; i++) this.spawnDominionShrapnel(burstFrom, sd, 0xe879f9)
  }

  private tickDominionFlakGun(b: PlacedBuilding, dt: number) {
    const d = this.augmentDefForCitadelCombat(b, this.getEffectiveDef(b.defId) ?? b.def)
    if ((d.powerDrainPerSec ?? 0) > 0 && this.powerStored <= 0.001) return
    b.cooldown -= dt
    if (b.cooldown > 0) return
    const baseOrigin = new THREE.Vector3(b.origin.x + (d.size.w - 1) / 2, 2.9, b.origin.z + (d.size.h - 1) / 2)
    const aim = (b.mesh.userData as any)?.aim as WeaponAim | undefined
    const origin = baseOrigin.clone()
    if (aim?.muzzle) aim.muzzle.getWorldPosition(this.tmpAimPos), origin.copy(this.tmpAimPos)
    const minR = 15
    const maxR = d.range ?? 82
    let target: Asteroid | null = null
    let best = Infinity
    for (const a of this.asteroids) {
      if (!a.alive) continue
      const ap = a.mesh.position
      const horiz = Math.hypot(ap.x - origin.x, ap.z - origin.z)
      if (horiz < minR || horiz > maxR) continue
      const to = new THREE.Vector3().subVectors(ap, origin)
      const len = to.length()
      if (len < 0.001) continue
      to.multiplyScalar(1 / len)
      // Wider sky cone than 45° from vertical (~0.707): ~65° half-angle (cos ≈ 0.42).
      if (to.y < 0.42) continue
      if (len < best) {
        best = len
        target = a
      }
    }
    if (!target) return
    const wc = this.weaponFootprintCenter(b)
    if (!this.tryConsumeShotPower(d, 1, wc)) return
    b.cooldown = 1 / Math.max(0.2, (d.fireRate ?? 9) * this.getJupiterOverclockFireRateMul(b))
    if (aim?.yaw && aim?.pitch) {
      this.tmpAimVec.copy(target.mesh.position).sub(origin)
      const yaw = Math.atan2(this.tmpAimVec.x, this.tmpAimVec.z)
      aim.yaw.rotation.y = yaw
      const pitchDist = Math.hypot(this.tmpAimVec.x, this.tmpAimVec.z)
      const pitch = Math.atan2(this.tmpAimVec.y, pitchDist)
      aim.pitch.rotation.x = -clamp(pitch, -Math.PI / 2.2, Math.PI / 2.2)
    } else if (aim?.yaw) {
      this.tmpAimVec.copy(target.mesh.position).sub(origin)
      aim.yaw.rotation.y = Math.atan2(this.tmpAimVec.x, this.tmpAimVec.z)
    }
    const mainDmg = (d.damage ?? 108) * this.getNovaWeaponDamageMul(b)
    target.hp -= mainDmg * this.getRadarMarkedDamageMul(target)
    this.spawnShot(origin, target.mesh.position, d.color)
    if (target.hp <= 0) {
      target.alive = false
      this.handleAsteroidDeath(target, 'combat')
      this.world.remove(target.mesh)
      this.world.remove(target.healthBar.group)
    }
    const n = this.getDominionShrapnelCount(false)
    const burstFrom = target.mesh.position.clone()
    for (let i = 0; i < n; i++) this.spawnDominionShrapnel(burstFrom, mainDmg * 0.5, 0xfbbf24)
  }

  private tickDominionLaserDrill(b: PlacedBuilding, dt: number) {
    const d = this.augmentDefForCitadelCombat(b, this.getEffectiveDef(b.defId) ?? b.def)
    if ((d.powerDrainPerSec ?? 0) > 0 && this.powerStored <= 0.001) return
    const baseOrigin = new THREE.Vector3(b.origin.x + (d.size.w - 1) / 2, 2.4, b.origin.z + (d.size.h - 1) / 2)
    const aim = (b.mesh.userData as any)?.aim as WeaponAim | undefined
    const origin = baseOrigin.clone()
    if (aim?.muzzle) aim.muzzle.getWorldPosition(this.tmpAimPos), origin.copy(this.tmpAimPos)

    let target: Asteroid | null = null
    if (b.plasmaTargetId) {
      const locked = this.asteroids.find((a) => a.id === b.plasmaTargetId && a.alive) ?? null
      if (!locked || baseOrigin.distanceTo(locked.mesh.position) > (d.range ?? 44)) {
        b.plasmaTargetId = undefined
        b.econTimer = 1
      } else {
        target = locked
      }
    }
    if (!target) {
      if (b.econTimer > 0) {
        b.econTimer -= dt
        return
      }
      let best = Infinity
      for (const a of this.asteroids) {
        if (!a.alive) continue
        const dist = baseOrigin.distanceTo(a.mesh.position)
        if (dist > (d.range ?? 44)) continue
        if (dist < best) {
          best = dist
          target = a
        }
      }
      if (!target) return
      b.plasmaTargetId = target.id
    }

    const wc = this.weaponFootprintCenter(b)
    if (!this.tryConsumeShotPower(d, dt, wc)) return
    if (aim?.yaw && aim?.pitch) {
      this.tmpAimVec.copy(target.mesh.position).sub(origin)
      const yaw = Math.atan2(this.tmpAimVec.x, this.tmpAimVec.z)
      aim.yaw.rotation.y = yaw
      const pitchDist = Math.hypot(this.tmpAimVec.x, this.tmpAimVec.z)
      const pitch = Math.atan2(this.tmpAimVec.y, pitchDist)
      aim.pitch.rotation.x = -clamp(pitch, -Math.PI / 2.5, Math.PI / 2.5)
    }
    const dmg =
      (d.damage ?? 52) * dt * this.getNovaWeaponDamageMul(b) * this.getJupiterOverclockFireRateMul(b)
    target.hp -= dmg * this.getRadarMarkedDamageMul(target)
    this.applyCreditDelta(dmg * 0.092)
    this.spawnShot(origin, target.mesh.position, 0xf472b6)
    if (target.hp <= 0) {
      target.alive = false
      this.handleAsteroidDeath(target, 'combat')
      this.world.remove(target.mesh)
      this.world.remove(target.healthBar.group)
      b.plasmaTargetId = undefined
      b.econTimer = 1
    }
  }

  private tickNovaPhotonProjector(b: PlacedBuilding, dt: number) {
    const d = this.augmentDefForCitadelCombat(b, this.getEffectiveDef(b.defId) ?? b.def)
    if ((d.powerDrainPerSec ?? 0) > 0 && this.powerStored <= 0.001) return
    b.cooldown -= dt
    if (b.cooldown > 0) return
    const baseOrigin = new THREE.Vector3(b.origin.x + (d.size.w - 1) / 2, 2.2, b.origin.z + (d.size.h - 1) / 2)
    const aim = (b.mesh.userData as any)?.aim as WeaponAim | undefined
    const origin = baseOrigin.clone()
    if (aim?.muzzle) aim.muzzle.getWorldPosition(this.tmpAimPos), origin.copy(this.tmpAimPos)
    let target: Asteroid | null = null
    let best = Infinity
    for (const a of this.asteroids) {
      if (!a.alive) continue
      const dist = origin.distanceTo(a.mesh.position)
      if (dist > (d.range ?? 60)) continue
      if (dist < best) {
        best = dist
        target = a
      }
    }
    if (!target) return
    const wc = this.weaponFootprintCenter(b)
    if (!this.tryConsumeShotPower(d, 1, wc)) return
    b.cooldown = 1 / Math.max(0.05, (d.fireRate ?? 0.12) * this.getJupiterOverclockFireRateMul(b))
    if (aim?.yaw && aim?.pitch) {
      this.tmpAimVec.copy(target.mesh.position).sub(origin)
      const yaw = Math.atan2(this.tmpAimVec.x, this.tmpAimVec.z)
      aim.yaw.rotation.y = yaw
      const pitchDist = Math.hypot(this.tmpAimVec.x, this.tmpAimVec.z)
      const pitch = Math.atan2(this.tmpAimVec.y, pitchDist)
      aim.pitch.rotation.x = -clamp(pitch, -Math.PI / 2.2, Math.PI / 2.2)
    } else if (aim?.yaw) {
      this.tmpAimVec.copy(target.mesh.position).sub(origin)
      aim.yaw.rotation.y = Math.atan2(this.tmpAimVec.x, this.tmpAimVec.z)
    }
    const dir = new THREE.Vector3().subVectors(target.mesh.position, origin)
    if (dir.lengthSq() < 0.0001) return
    dir.normalize()
    this.spawnNovaPhotonOrb(origin, dir, d, this.getNovaWeaponDamageMul(b))
  }

  private tickNovaShockwavePulsar(b: PlacedBuilding, dt: number) {
    const d = this.augmentDefForCitadelCombat(b, this.getEffectiveDef(b.defId) ?? b.def)
    if ((d.powerDrainPerSec ?? 0) > 0 && this.powerStored <= 0.001) return
    b.cooldown -= dt
    if (b.cooldown > 0) return
    const cx = b.origin.x + (d.size.w - 1) / 2
    const cz = b.origin.z + (d.size.h - 1) / 2
    const wc = this.weaponFootprintCenter(b)
    if (!this.tryConsumeShotPower(d, 1, wc)) return
    b.cooldown = 1 / Math.max(0.06, (d.fireRate ?? 0.17) * this.getJupiterOverclockFireRateMul(b))
    const radius = Math.max(d.aoeRadius ?? 24, d.range ?? 0)
    const baseDmg = (d.damage ?? 16) * this.getNovaWeaponDamageMul(b)
    const center = new THREE.Vector3(cx, 1.0, cz)
    for (const a of this.asteroids) {
      if (!a.alive) continue
      const ap = a.mesh.position
      const dist = Math.hypot(ap.x - cx, ap.z - cz)
      if (dist > radius) continue
      const falloff = 1 - dist / radius
      a.hp -= baseDmg * (0.5 + 0.5 * falloff) * this.getRadarMarkedDamageMul(a)
      a.pulsarSlowTimer = Math.max(a.pulsarSlowTimer, 2.8)
      if (this.purchasedUpgradeIds.has('hero_nova_stasis_surge')) {
        a.stasisTimer = Math.max(a.stasisTimer, 0.52)
      }
      if (a.hp <= 0) {
        a.alive = false
        this.handleAsteroidDeath(a, 'combat')
        this.world.remove(a.mesh)
        this.world.remove(a.healthBar.group)
      }
    }
    this.spawnExplosion(center, Math.min(14, radius * 0.45), 0xa78bfa)
  }

  private spawnNovaPhotonOrb(muzzle: THREE.Vector3, dir: THREE.Vector3, d: BuildingDef, damageMul: number) {
    const mat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      emissive: 0x22d3ee,
      emissiveIntensity: 1.1,
      roughness: 0.35,
      transparent: true,
      opacity: 0.92,
    })
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(0.72, 16, 12), mat)
    mesh.position.copy(muzzle)
    mesh.castShadow = true
    this.projectiles.add(mesh)
    const speed = d.projectileSpeed ?? 13
    const vel = dir.clone().multiplyScalar(speed)
    const hitDamage = (d.damage ?? 220) * damageMul
    const travelDps = 360 * damageMul
    const travelRadius = Math.max(16, (d.aoeRadius ?? 14) * 1.35)
    this.novaPhotons.push({
      mesh,
      velocity: vel,
      ttl: 5.1,
      hitDamage,
      travelDps,
      travelRadius,
      pierceHitIds: new Set(),
      fissionOnExpire: this.purchasedUpgradeIds.has('hero_nova_fission_blast'),
      fissionRadius: (d.aoeRadius ?? 14) * 1.35,
      fissionDamage: hitDamage * 0.55,
    })
  }

  private updateNovaPhotons(dt: number) {
    for (const o of [...this.novaPhotons]) {
      o.ttl -= dt
      o.mesh.position.addScaledVector(o.velocity, dt)
      const pos = o.mesh.position
      for (const a of this.asteroids) {
        if (!a.alive) continue
        if (pos.distanceTo(a.mesh.position) <= o.travelRadius) {
          a.hp -= o.travelDps * dt * this.getRadarMarkedDamageMul(a)
          if (a.hp <= 0) {
            a.alive = false
            this.handleAsteroidDeath(a, 'combat')
            this.world.remove(a.mesh)
            this.world.remove(a.healthBar.group)
          }
        }
      }
      for (const a of this.asteroids) {
        if (!a.alive || o.pierceHitIds.has(a.id)) continue
        if (pos.distanceTo(a.mesh.position) < 1.22) {
          o.pierceHitIds.add(a.id)
          a.hp -= o.hitDamage * this.getRadarMarkedDamageMul(a)
          this.spawnExplosion(a.mesh.position, 0.95, 0x67e8f9)
          if (a.hp <= 0) {
            a.alive = false
            this.handleAsteroidDeath(a, 'combat')
            this.world.remove(a.mesh)
            this.world.remove(a.healthBar.group)
          }
        }
      }
      if (o.ttl <= 0) {
        if (o.fissionOnExpire) {
          this.explodeAt(pos.clone(), o.fissionRadius, o.fissionDamage, 0xe879f9)
        }
        this.projectiles.remove(o.mesh)
        const mat = o.mesh.material as THREE.MeshStandardMaterial
        mat.dispose()
        o.mesh.geometry.dispose()
        this.novaPhotons.splice(this.novaPhotons.indexOf(o), 1)
      }
    }
  }

  private updateNovaGravityWells(dt: number) {
    for (const b of this.buildings) {
      if (b.hp <= 0 || b.defId !== 'nova_gravity_well') continue
      const ring = (b.mesh.userData as any)?.novaGravitySpin as THREE.Group | undefined
      if (ring) ring.rotation.y += dt * 1.85
    }
  }

  private tickCitadelConduitVisuals(dt: number) {
    for (const b of this.buildings) {
      if (b.hp <= 0 || b.defId !== 'citadel_efficiency_conduit') continue
      const rotor = (b.mesh.userData as { citadelEfficiencySpin?: THREE.Group }).citadelEfficiencySpin
      if (rotor) rotor.rotation.y += dt * 2.85
    }
  }

  private spawnDominionSeekerDrone(spawner: PlacedBuilding): DominionSeekerDrone | null {
    let best: Asteroid | null = null
    let bestD = Infinity
    const ox = spawner.origin.x + (spawner.def.size.w - 1) / 2
    const oz = spawner.origin.z + (spawner.def.size.h - 1) / 2
    const o = new THREE.Vector3(ox, 4, oz)
    for (const a of this.asteroids) {
      if (!a.alive) continue
      const dist = o.distanceTo(a.mesh.position)
      if (dist < bestD) {
        bestD = dist
        best = a
      }
    }
    if (!best) return null
    const mesh = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.38, 0),
      new THREE.MeshStandardMaterial({ color: 0x818cf8, emissive: 0x4338ca, emissiveIntensity: 0.55, roughness: 0.25 }),
    )
    mesh.position.copy(o)
    this.world.add(mesh)
    return { mesh, spawnerId: spawner.id, state: 'flying', targetId: best.id }
  }

  private spawnDominionDropship(bay: PlacedBuilding, focus: PlacedBuilding): DominionDropship {
    const mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.35, 0.85),
      new THREE.MeshStandardMaterial({ color: 0x34d399, emissive: 0x059669, emissiveIntensity: 0.35, roughness: 0.3 }),
    )
    const bx = bay.origin.x + (bay.def.size.w - 1) / 2
    const bz = bay.origin.z + (bay.def.size.h - 1) / 2
    mesh.position.set(bx + (Math.random() * 0.8 - 0.4), 6.2, bz + (Math.random() * 0.8 - 0.4))
    this.world.add(mesh)
    const fx = focus.origin.x + (focus.def.size.w - 1) / 2
    const fz = focus.origin.z + (focus.def.size.h - 1) / 2
    return { mesh, bayId: bay.id, state: 'outbound', focusX: fx, focusZ: fz, healElapsed: 0 }
  }

  private updateSupportSystems(dt: number) {
    if (!this.waveInProgress) return

    this.tickJupiterRadarStations(dt)

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
            const heal = perDroneHeal * dt * this.getHealingPotencyMul()
            const powerCost = (heal / 10) * VARS.P
            const tMax = this.getBuildingMaxHp(target)
            if (this.powerStored >= powerCost && target.hp < tMax) {
              this.powerStored -= powerCost
              target.hp = Math.min(tMax, target.hp + heal)
            }
            if (target.hp >= tMax - 0.01) d.state = 'returning'
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

    // Dominion Seeker Drone Spawner
    for (const sp of this.buildings) {
      if (sp.hp <= 0 || sp.defId !== 'dominion_seeker_drone_spawner') continue
      const sd = this.getEffectiveDef(sp.defId) ?? sp.def
      const spawnInterval = 1 / Math.max(0.08, sd.fireRate ?? 0.25)
      sp.cooldown -= dt
      if (sp.cooldown <= 0) {
        const drone = this.spawnDominionSeekerDrone(sp)
        if (drone) this.dominionSeekerDrones.push(drone)
        sp.cooldown += spawnInterval
      }
    }

    // Dominion Support Bay — limited concurrent dropships
    for (const bay of this.buildings) {
      if (bay.hp <= 0 || bay.defId !== 'dominion_support_bay') continue
      const bd = this.getEffectiveDef(bay.defId) ?? bay.def
      const spawnInterval = 1 / Math.max(0.05, bd.fireRate ?? 0.143)
      const maxShips = this.purchasedUpgradeIds.has('hero_dominion_extended_support') ? 2 : 1
      bay.cooldown -= dt
      if (bay.cooldown <= 0) {
        const active = this.dominionDropships.filter((x) => x.bayId === bay.id).length
        if (active < maxShips) {
          const target = this.findLowestHpBuilding()
          if (target) this.dominionDropships.push(this.spawnDominionDropship(bay, target))
        }
        bay.cooldown += spawnInterval
      }
    }

    for (const d of [...this.dominionSeekerDrones]) {
      const sp = this.buildings.find((b) => b.id === d.spawnerId && b.hp > 0)
      if (!sp) {
        this.world.remove(d.mesh)
        this.dominionSeekerDrones.splice(this.dominionSeekerDrones.indexOf(d), 1)
        continue
      }
      const ast = d.targetId ? (this.asteroids.find((a) => a.id === d.targetId && a.alive) ?? null) : null
      if (!ast) {
        this.world.remove(d.mesh)
        this.dominionSeekerDrones.splice(this.dominionSeekerDrones.indexOf(d), 1)
        continue
      }
      const spDef = this.getEffectiveDef(sp.defId) ?? sp.def
      const droneSpeed = spDef.projectileSpeed ?? 17
      const dotDps = (spDef.damage ?? 2.4) * 2.35

      if (d.state === 'flying') {
        const ap = ast.mesh.position.clone().add(new THREE.Vector3(0, 0.65, 0))
        const dir = ap.clone().sub(d.mesh.position)
        const len = dir.length()
        if (len > 0.4) {
          dir.normalize().multiplyScalar(Math.min(droneSpeed * dt, len))
          d.mesh.position.add(dir)
        } else {
          d.state = 'attached'
        }
      } else {
        d.mesh.position.lerp(ast.mesh.position.clone().add(new THREE.Vector3(0.5, 0.9, 0.15)), 0.2)
        const sizeRef = Math.max(65, ast.maxHp)
        const brake = (90 / sizeRef) * dt
        ast.speed = Math.max(2.1, ast.speed - brake * 26)
        if (ast.velocity.lengthSq() > 0.0001) ast.velocity.normalize().multiplyScalar(ast.speed)
        const scx = sp.origin.x + (sp.def.size.w - 1) / 2
        const scz = sp.origin.z + (sp.def.size.h - 1) / 2
        const px = ast.mesh.position.x - scx
        const pz = ast.mesh.position.z - scz
        const horiz = Math.hypot(px, pz)
        if (horiz > 0.35) {
          const push = new THREE.Vector3(px / horiz, 0, pz / horiz).multiplyScalar(3.1 * dt)
          ast.mesh.position.add(push)
        }
        ast.hp -= dotDps * dt * this.getRadarMarkedDamageMul(ast)
        if (ast.hp <= 0) {
          ast.alive = false
          this.handleAsteroidDeath(ast, 'combat')
          this.world.remove(ast.mesh)
          this.world.remove(ast.healthBar.group)
          this.world.remove(d.mesh)
          this.dominionSeekerDrones.splice(this.dominionSeekerDrones.indexOf(d), 1)
        }
      }
    }

    for (const ds of [...this.dominionDropships]) {
      const bay = this.buildings.find((b) => b.id === ds.bayId && b.hp > 0)
      if (!bay) {
        this.world.remove(ds.mesh)
        this.dominionDropships.splice(this.dominionDropships.indexOf(ds), 1)
        continue
      }
      const bd = this.getEffectiveDef(bay.defId) ?? bay.def
      const speed = bd.projectileSpeed ?? 11
      const healPerSec = (bd.damage ?? 72) * 2.1
      const bayPos = new THREE.Vector3(bay.origin.x + (bay.def.size.w - 1) / 2, 6.4, bay.origin.z + (bay.def.size.h - 1) / 2)
      const hover = new THREE.Vector3(ds.focusX, 7.8, ds.focusZ)

      if (ds.state === 'outbound') {
        const dir = hover.clone().sub(ds.mesh.position)
        const len = dir.length()
        if (len > 0.75) {
          dir.normalize().multiplyScalar(Math.min(speed * dt, len))
          ds.mesh.position.add(dir)
        } else {
          ds.state = 'healing'
          ds.healElapsed = 0
        }
      } else if (ds.state === 'healing') {
        ds.healElapsed += dt
        ds.mesh.position.lerp(hover, 0.08)
        const hx = ds.mesh.position.x
        const hz = ds.mesh.position.z
        const healR = 11
        for (const t of this.buildings) {
          if (t.hp <= 0) continue
          const tx = t.origin.x + (t.def.size.w - 1) / 2
          const tz = t.origin.z + (t.def.size.h - 1) / 2
          if (Math.hypot(tx - hx, tz - hz) > healR) continue
          const tMax = this.getBuildingMaxHp(t)
          if (t.hp >= tMax - 0.02) continue
          const h = healPerSec * dt * this.getHealingPotencyMul()
          const pCost = (h / 5.5) * VARS.P
          if (this.powerStored < pCost) continue
          this.powerStored -= pCost
          t.hp = Math.min(tMax, t.hp + h)
        }
        if (ds.healElapsed >= 4.2) ds.state = 'returning'
      } else {
        const dir = bayPos.clone().sub(ds.mesh.position)
        const len = dir.length()
        if (len > 0.65) {
          dir.normalize().multiplyScalar(Math.min(speed * 1.05 * dt, len))
          ds.mesh.position.add(dir)
        } else {
          this.world.remove(ds.mesh)
          this.dominionDropships.splice(this.dominionDropships.indexOf(ds), 1)
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
          const amt = (d.damage ?? 25) * this.getHealingPotencyMul()
          t.hp = Math.min(this.getBuildingMaxHp(t), t.hp + amt)
        }
      }
      this.spawnExplosion(new THREE.Vector3(cx, 0.2, cz), 1.0, 0x60a5fa)
    }

    // Citadel Repair Conduit pulses (larger radius / stronger than Support Node baseline).
    for (const b of this.buildings) {
      if (b.hp <= 0 || b.defId !== 'citadel_repair_conduit') continue
      const spec = this.getCitadelConduitResolved(b)
      if (!spec || spec.kind !== 'repair') continue
      const d = this.getEffectiveDef(b.defId) ?? b.def
      b.cooldown -= dt
      if (b.cooldown > 0) continue
      b.cooldown = 2.5 / Math.max(0.25, (d.fireRate ?? 0.25) / 0.4)
      const pulseRange = spec.radius
      const pulseHeal = spec.strength * this.getHealingPotencyMul()
      const pulseCost = 16 * VARS.P
      if (this.powerStored < pulseCost) continue
      this.powerStored -= pulseCost
      const cx = b.origin.x + (b.def.size.w - 1) / 2
      const cz = b.origin.z + (b.def.size.h - 1) / 2
      for (const t of this.buildings) {
        if (t.hp <= 0) continue
        const tx = t.origin.x + (t.def.size.w - 1) / 2
        const tz = t.origin.z + (t.def.size.h - 1) / 2
        if (Math.hypot(tx - cx, tz - cz) <= pulseRange) {
          t.hp = Math.min(this.getBuildingMaxHp(t), t.hp + pulseHeal)
        }
      }
      this.spawnExplosion(new THREE.Vector3(cx, 0.25, cz), 1.35, 0x14b8a6)
    }

    // Structural upgrade: passive auto-repair up to 50% health.
    if (this.purchasedUpgradeIds.has('structural_auto_repair')) {
      const regenPerSec = 18 * this.getHealingPotencyMul()
      for (const b of this.buildings) {
        if (b.hp <= 0) continue
        const minHp = this.getBuildingMaxHp(b) * 0.5
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
          this.applyDamageToBuilding(b, dps)
        }
      }
    }

  }

  /** Shield upkeep/regen runs during active waves (grid power ticks then too). */
  private updateShieldLayers(dt: number) {
    if (!this.waveInProgress) return
    for (const b of this.buildings) {
      if (b.hp <= 0) continue
      if (b.defId !== 'shield_generator_m' && b.defId !== 'shield_generator_l') continue
      const sf = this.shieldFields.get(b.id)
      if (!sf) continue
      const eff = this.getEffectiveDef(b.defId) ?? b.def
      const capMul = eff.shieldCapacityMul ?? 1
      const rechargeMul = eff.shieldRechargeMul ?? 1
      const desiredMaxHp = b.def.maxHp * 2.2 * capMul
      const ratio = sf.maxHp > 0 ? sf.hp / sf.maxHp : 1
      sf.maxHp = desiredMaxHp
      sf.hp = clamp(ratio * sf.maxHp, 0, sf.maxHp)
      sf.radius = eff.range ?? sf.radius
      const cx = b.origin.x + (b.def.size.w - 1) / 2
      const cz = b.origin.z + (b.def.size.h - 1) / 2
      sf.bubble.position.set(cx, 0, cz)
      sf.bubble.scale.set(sf.radius, sf.radius * sf.scaleY, sf.radius)

      const mul = this.getShieldPowerDrainMul(b.defId)
      const upkeepCost = (eff.shieldUpkeepPowerPerSec ?? 0) * mul * dt
      if (upkeepCost <= 0 || this.powerStored >= upkeepCost) {
        if (upkeepCost > 0) this.powerStored -= upkeepCost
        sf.noPower = false
      } else {
        sf.noPower = true
      }

      if (!sf.noPower && sf.hp < sf.maxHp - 0.001) {
        const regenHpPerSec = sf.maxHp * 0.24 * rechargeMul
        const wantHp = regenHpPerSec * dt
        const regenCost = (eff.shieldRegenPowerPerSec ?? 0) * mul * dt
        const frac = regenCost <= 0 ? 1 : Math.min(1, this.powerStored / regenCost)
        const heal = wantHp * frac
        if (heal > 0) this.powerStored = Math.max(0, this.powerStored - regenCost * frac)
        sf.hp = Math.min(sf.maxHp, sf.hp + heal)
      }

      if (sf.hp < sf.maxHp * 0.1) sf.lowHpOffline = true
      if (sf.hp >= sf.maxHp - 0.001) sf.lowHpOffline = false
      sf.bubble.visible = !sf.noPower && sf.hp > 0.001 && !sf.lowHpOffline
    }

    this.tickUniversalShield(dt)
  }

  /** Upgrade `powerDrainMul` also scales shield upkeep and regen draw. */
  private getShieldPowerDrainMul(defId: BuildingId): number {
    let mul = 1
    for (const upId of this.purchasedUpgradeIds) {
      const up = UPGRADES.find((u) => u.id === upId)
      const m = up?.modifiers?.[defId]?.powerDrainMul
      if (m) mul *= m
    }
    return mul
  }

  /** First Universal Forcefield placement creates the shared HQ-centered bubble. */
  private syncUniversalShieldFromBuildings() {
    const gens = this.buildings.filter((b) => b.hp > 0 && b.defId === 'nova_universal_forcefield')
    if (gens.length === 0) return
    if (this.universalShield) return

    let maxHp = 0
    let radius = 0
    let barW = 6
    for (const b of gens) {
      const eff = this.getEffectiveDef(b.defId) ?? b.def
      maxHp += b.def.maxHp * 5.8 * (eff.shieldCapacityMul ?? 1) * this.universalShieldMaxHpMul
      radius = Math.max(radius, eff.range ?? 86)
      barW = Math.max(barW, eff.shieldBarWidth ?? 8.5)
    }
    const scaleY = 0.5
    const bubble = new THREE.Mesh(
      new THREE.SphereGeometry(1, 28, 20),
      new THREE.MeshBasicMaterial({ color: 0xd8b4fe, transparent: true, opacity: 0.065, depthWrite: false }),
    )
    bubble.position.set(0, 0, 0)
    this.world.add(bubble)
    const shieldBar = this.createHealthBar(barW, 0.28)
    shieldBar.group.position.set(0, 8.5, 0)
    this.world.add(shieldBar.group)
    this.universalShield = {
      generatorId: '__universal__',
      hp: maxHp,
      maxHp,
      radius,
      bubble,
      noPower: false,
      lowHpOffline: false,
      shieldBar,
      scaleY,
    }
    this.universalShield.bubble.scale.set(radius, radius * scaleY, radius)
  }

  private tickUniversalShield(dt: number) {
    const gens = this.buildings.filter((b) => b.hp > 0 && b.defId === 'nova_universal_forcefield')
    if (gens.length === 0) {
      if (this.universalShield) {
        this.world.remove(this.universalShield.bubble)
        this.world.remove(this.universalShield.shieldBar.group)
        this.universalShield = null
      }
      return
    }
    if (!this.universalShield) this.syncUniversalShieldFromBuildings()
    if (!this.universalShield) return

    let maxHp = 0
    let radius = 0
    let maxRecharge = 1
    let upkeep = 0
    let regenPow = 0
    for (const b of gens) {
      const eff = this.getEffectiveDef(b.defId) ?? b.def
      const mul = this.getShieldPowerDrainMul(b.defId)
      maxHp += b.def.maxHp * 5.8 * (eff.shieldCapacityMul ?? 1) * this.universalShieldMaxHpMul
      radius = Math.max(radius, eff.range ?? 86)
      maxRecharge = Math.max(maxRecharge, eff.shieldRechargeMul ?? 1)
      upkeep += (eff.shieldUpkeepPowerPerSec ?? 0) * mul
      regenPow += (eff.shieldRegenPowerPerSec ?? 0) * mul
    }

    const u = this.universalShield
    const ratio = u.maxHp > 0 ? u.hp / u.maxHp : 1
    u.maxHp = maxHp
    u.hp = clamp(ratio * maxHp, 0, maxHp)
    u.radius = radius
    u.bubble.scale.set(u.radius, u.radius * u.scaleY, u.radius)

    const upkeepCost = upkeep * dt
    if (upkeepCost <= 0 || this.powerStored >= upkeepCost) {
      if (upkeepCost > 0) this.powerStored -= upkeepCost
      u.noPower = false
    } else {
      u.noPower = true
    }

    if (!u.noPower && u.hp < u.maxHp - 0.001) {
      // Slower fractional regen than dome shields (0.24); max HP is reduced via universalShieldMaxHpMul.
      const regenHpPerSec = u.maxHp * 0.192 * maxRecharge
      const wantHp = regenHpPerSec * dt
      const regenCost = regenPow * dt
      const frac = regenCost <= 0 ? 1 : Math.min(1, this.powerStored / regenCost)
      const heal = wantHp * frac
      if (heal > 0) this.powerStored = Math.max(0, this.powerStored - regenCost * frac)
      u.hp = Math.min(u.maxHp, u.hp + heal)
    }

    if (u.hp < u.maxHp * 0.1) u.lowHpOffline = true
    if (u.hp >= u.maxHp - 0.001) u.lowHpOffline = false
    u.bubble.visible = !u.noPower && u.hp > 0.001 && !u.lowHpOffline
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
      const ratio = b.hp / this.getBuildingMaxHp(b)
      if (ratio < bestRatio) {
        bestRatio = ratio
        best = b
      }
    }
    return best
  }

  private updateProjectiles(dt: number) {
    this.updateNovaPhotons(dt)
    this.updateDominionShrapnel(dt)
    for (const p of [...this.pendingMissileBursts]) {
      p.timer -= dt
      while (p.remaining > 0 && p.timer <= 0) {
        this.spawnMissile(p.origin, p.target, p.def, p.mode, p.noSplash, p.volleyId, p.powerSite, p.damageScale ?? 1)
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
            m.target.hp -= dmg * this.getRadarMarkedDamageMul(m.target)
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
      a.hp -= damage * (0.45 + 0.55 * falloff) * this.getRadarMarkedDamageMul(a)
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
      this.applyDamageToBuilding(b, damage * (0.35 + 0.65 * falloff))
    }

    // lose if all command centers dead
    const anyCC = this.buildings.some((b) => b.hp > 0 && b.defId === 'command_center')
    if (!anyCC) {
      this.isLost = true
      this.emitAudio({ type: 'game_over' })
    }
  }

  private destroyBuilding(b: PlacedBuilding) {
    const destroyedOrigin = { ...b.origin }
    const destroyedCenter = {
      x: b.origin.x + (b.def.size.w - 1) / 2,
      z: b.origin.z + (b.def.size.h - 1) / 2,
    }
    const destroyedDef = b.def
    if (
      this.heroId === 'kingpin' &&
      this.purchasedUpgradeIds.has('hero_kingpin_scavenging') &&
      !this.suppressKingpinScavenge &&
      destroyedDef.id !== 'command_center'
    ) {
      this.applyCreditDelta(Math.round(destroyedDef.creditCost * 0.22))
    }
    if (destroyedDef.id === 'jupiter_mass_relay' && this.jupiterRelayPool) {
      const contrib = this.getBuildingMaxHp(b)
      const frac = this.jupiterRelayPool.hp / Math.max(1e-6, this.jupiterRelayPool.maxHp)
      this.jupiterRelayPool.maxHp = Math.max(0, this.jupiterRelayPool.maxHp - contrib)
      this.jupiterRelayPool.hp = this.jupiterRelayPool.maxHp * frac
      const remaining = this.buildings.filter(
        (x) => x.id !== b.id && x.hp > 0 && x.defId === 'jupiter_mass_relay',
      ).length
      if (remaining === 0) this.jupiterRelayPool = null
      else this.syncJupiterMassRelayHpFromPool()
    }
    const wasPylon = b.defId === 'pylon'
    for (const p of [...this.archangelPlanes]) {
      if (p.homeId !== b.id) continue
      this.world.remove(p.hud.group)
      this.world.remove(p.mesh)
      this.archangelPlanes.splice(this.archangelPlanes.indexOf(p), 1)
    }
    for (const d of [...this.dominionSeekerDrones]) {
      if (d.spawnerId !== b.id) continue
      this.world.remove(d.mesh)
      this.dominionSeekerDrones.splice(this.dominionSeekerDrones.indexOf(d), 1)
    }
    for (const d of [...this.dominionDropships]) {
      if (d.bayId !== b.id) continue
      this.world.remove(d.mesh)
      this.dominionDropships.splice(this.dominionDropships.indexOf(d), 1)
    }
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
      this.world.remove(sf.shieldBar.group)
      this.shieldFields.delete(b.id)
    }
    if (destroyedDef.id === 'nova_universal_forcefield') {
      const stillHas =
        this.buildings.some(
          (x) => x.id !== b.id && x.hp > 0 && x.defId === 'nova_universal_forcefield',
        ) || false
      if (!stillHas && this.universalShield) {
        this.world.remove(this.universalShield.bubble)
        this.world.remove(this.universalShield.shieldBar.group)
        this.universalShield = null
      }
    }

    // Reconstruction Yard: auto-rebuild nearby destroyed buildings at 50% cost.
    if (this.waveInProgress) {
      const canRebuild = this.findReconstructionYardNear(destroyedCenter.x, destroyedCenter.z)
      if (canRebuild && this.credits >= destroyedDef.creditCost * 0.5) {
        this.applyCreditDelta(-destroyedDef.creditCost * 0.5)
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
      this.applyDamageToBuilding(b, damage)
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
    this.applyCreditDelta(fullRefund ? top.def.creditCost : Math.floor(top.def.creditCost * 0.5))
    this.emitAudio({ type: 'build_sell' })
    top.hp = 0
    this.suppressKingpinScavenge = true
    this.destroyBuilding(top)
    this.suppressKingpinScavenge = false
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
    const placeCost = this.placementCreditCost(def, ox, oz)
    if (this.credits < placeCost) return
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
    this.applyCreditDelta(-placeCost)
    this.placeBuilding(def, ox, oz, false)
    this.emitAudio({ type: 'build_place' })
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

    // Shield field entity (bubble is not selectable — buildingId cleared on bubble only)
    if (def.id === 'shield_generator_m' || def.id === 'shield_generator_l') {
      const effective = this.getEffectiveDef(def.id) ?? def
      const radius = effective.range ?? (def.range ?? 8)
      const capMul = effective.shieldCapacityMul ?? 1
      const barW = effective.shieldBarWidth ?? 3.2
      const gcx = ox + (def.size.w - 1) / 2
      const gcz = oz + (def.size.h - 1) / 2
      const bubble = new THREE.Mesh(
        new THREE.SphereGeometry(1, 26, 18),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8, transparent: true, opacity: 0.09, depthWrite: false }),
      )
      bubble.position.set(gcx, 0, gcz)
      bubble.scale.set(radius, radius, radius)
      this.world.add(bubble)
      const shieldBar = this.createHealthBar(barW, 0.24)
      shieldBar.group.position.set(gcx, 5.2 + radius * 0.08, gcz)
      this.world.add(shieldBar.group)
      this.shieldFields.set(id, {
        generatorId: id,
        hp: def.maxHp * 2.2 * capMul,
        maxHp: def.maxHp * 2.2 * capMul,
        radius,
        bubble,
        noPower: false,
        lowHpOffline: false,
        shieldBar,
        scaleY: 1,
      })
    }

    if (def.id === 'nova_universal_forcefield') {
      this.syncUniversalShieldFromBuildings()
    }

    const effMaxHp = (this.getEffectiveDef(def.id) ?? def).maxHp
    const placed: PlacedBuilding = {
      id,
      defId: def.id,
      def,
      origin: { x: ox, z: oz },
      builtInInactivePhase: free ? -1 : this.currentInactivePhase,
      hp: effMaxHp,
      mesh,
      healthBar: hb,
      refundSprite,
      cooldown: 0,
      charge: 0,
      econTimer: 0,
    }
    this.buildings.push(placed)
    this.statsBuildingPlacements.set(def.id, (this.statsBuildingPlacements.get(def.id) ?? 0) + 1)
    if (def.id === 'jupiter_mass_relay') {
      const m = this.getBuildingMaxHp(placed)
      if (!this.jupiterRelayPool) {
        this.jupiterRelayPool = { hp: m, maxHp: m }
      } else {
        const r = this.jupiterRelayPool.hp / Math.max(1e-6, this.jupiterRelayPool.maxHp)
        this.jupiterRelayPool.maxHp += m
        this.jupiterRelayPool.hp = this.jupiterRelayPool.maxHp * r
      }
      this.syncJupiterMassRelayHpFromPool()
    }
    if (def.id === 'jupiter_recon_drone') {
      mesh.position.y = 7.6
      hb.group.position.set(mesh.position.x, 3.8 + def.size.h * 0.2 + mesh.position.y, mesh.position.z)
    }
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

    if (def.id === 'citadel_repair_conduit') {
      const { baseH } = addBase(1.35, def.color)
      for (const [sx, sz] of [
        [-w * 0.22, -h * 0.22],
        [w * 0.22, -h * 0.22],
        [-w * 0.22, h * 0.22],
        [w * 0.22, h * 0.22],
      ] as const) {
        const col = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.14, baseH + 0.4, 10), mkEmat(0x2dd4bf, 0.45, 0.35))
        col.position.set(sx, (baseH + 0.4) / 2, sz)
        group.add(col)
      }
      const hub = new THREE.Mesh(new THREE.SphereGeometry(0.32, 14, 10), mkEmat(def.color, 0.5, 0.3))
      hub.position.y = baseH + 0.65
      group.add(hub)
      return group
    }

    if (def.id === 'citadel_construction_conduit') {
      const { baseH } = addBase(1.05, def.color)
      const ring = new THREE.Mesh(new THREE.TorusGeometry(Math.max(w, h) * 0.28, 0.12, 8, 24), mkMat(0x0f766e, 0.12, 0.55))
      ring.rotation.x = Math.PI / 2
      ring.position.y = baseH + 0.2
      group.add(ring)
      const crane = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.8, 0.16), mkMat(0xe2e8f0, 0.2, 0.48))
      crane.position.set(-w * 0.32, baseH + 0.95, 0)
      group.add(crane)
      const boom = new THREE.Mesh(new THREE.BoxGeometry(w * 0.55, 0.12, 0.12), mkMat(0xe2e8f0, 0.18, 0.5))
      boom.position.set(0, baseH + 1.55, 0)
      group.add(boom)
      return group
    }

    if (def.id === 'citadel_defense_conduit') {
      const { baseH } = addBase(1.15, def.color)
      const shield = new THREE.Mesh(new THREE.OctahedronGeometry(0.38, 0), mkEmat(0x5eead4, 0.55, 0.28))
      shield.position.y = baseH + 0.85
      group.add(shield)
      return group
    }

    if (def.id === 'citadel_attack_conduit') {
      const { baseH } = addBase(1.0, def.color)
      const cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.55, 8), mkEmat(0xf97316, 0.65, 0.32))
      cone.position.y = baseH + 0.55
      group.add(cone)
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.9, 8), mkMat(0xe2e8f0, 0.2, 0.5))
      post.position.y = baseH + 0.45
      group.add(post)
      return group
    }

    if (def.id === 'citadel_efficiency_conduit') {
      const { baseH } = addBase(0.95, def.color)
      const rotor = new THREE.Group()
      rotor.position.y = baseH + 0.55
      for (let i = 0; i < 3; i++) {
        const blade = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.12), mkEmat(0x14b8a6, 0.4, 0.4))
        blade.rotation.y = (i / 3) * Math.PI * 2
        blade.position.y = i * 0.02
        rotor.add(blade)
      }
      group.add(rotor)
      group.userData.citadelEfficiencySpin = rotor
      return group
    }

    if (def.id === 'citadel_range_conduit') {
      const { baseH } = addBase(0.88, def.color)
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.07, 2.1, 8), mkMat(0xe2e8f0, 0.22, 0.48))
      mast.position.y = baseH + 1.05
      group.add(mast)
      const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.06, 14), mkEmat(def.color, 0.5, 0.35))
      disc.position.y = baseH + 2.05
      group.add(disc)
      return group
    }

    if (def.id === 'kingpin_data_array') {
      const { baseH } = addBase(0.72, def.color)
      const rack = new THREE.Mesh(new THREE.BoxGeometry(w * 0.88, 1.35, h * 0.2), mkMat(0x1e1b4b, 0.06, 0.92))
      rack.position.set(0, baseH + 0.72, 0)
      group.add(rack)
      for (let i = 0; i < 4; i++) {
        const led = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 0.06), mkEmat(0xe879f9, 0.85, 0.28))
        led.position.set(-w * 0.28 + (i % 2) * w * 0.56, baseH + 0.55 + Math.floor(i / 2) * 0.35, h * 0.12)
        group.add(led)
      }
      return group
    }

    if (def.id === 'kingpin_investment_complex') {
      const { baseH } = addBase(1.05, def.color)
      const vault = new THREE.Mesh(new THREE.BoxGeometry(w * 0.55, 1.15, h * 0.55), mkMat(0x312e81, 0.1, 0.55))
      vault.position.set(0, baseH + 0.65, 0)
      group.add(vault)
      const band = new THREE.Mesh(new THREE.TorusGeometry(Math.min(w, h) * 0.22, 0.06, 8, 20), mkEmat(0xfbbf24, 0.55, 0.35))
      band.rotation.x = Math.PI / 2
      band.position.y = baseH + 1.15
      group.add(band)
      return group
    }

    if (def.id === 'kingpin_cryptographic_decoder') {
      const { baseH } = addBase(0.85, def.color)
      const prism = new THREE.Mesh(new THREE.OctahedronGeometry(0.42, 0), mkEmat(0xa855f7, 0.65, 0.3))
      prism.position.y = baseH + 0.65
      group.add(prism)
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 8, 24), mkMat(0x0f172a, 0.04, 0.95))
      ring.rotation.x = Math.PI / 2
      ring.position.y = baseH + 0.25
      group.add(ring)
      return group
    }

    if (def.id === 'kingpin_indoctrinated_labor') {
      const { baseH } = addBase(0.78, def.color)
      for (let i = 0; i < 3; i++) {
        const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.09, 1.25, 8), mkMat(0x94a3b8, 0.12, 0.55))
        pole.position.set((i - 1) * w * 0.32, baseH + 0.65, 0)
        group.add(pole)
      }
      const cap = new THREE.Mesh(new THREE.BoxGeometry(w * 0.92, 0.12, h * 0.92), mkEmat(0x7c3aed, 0.45, 0.4))
      cap.position.y = baseH + 1.25
      group.add(cap)
      return group
    }

    if (def.id === 'kingpin_mineral_processor') {
      const { baseH } = addBase(0.95, def.color)
      const hopper = new THREE.Mesh(
        new THREE.CylinderGeometry(Math.max(w, h) * 0.38, Math.max(w, h) * 0.32, 0.55, 16, 1, true),
        mkMat(0x4a044e, 0.1, 0.52),
      )
      hopper.position.y = baseH + 0.55
      group.add(hopper)
      const auger = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.12, 1.4, 10), mkMat(0xe2e8f0, 0.2, 0.48))
      auger.position.set(0, baseH + 0.95, 0)
      group.add(auger)
      return group
    }

    if (def.id === 'jupiter_mass_relay') {
      const { baseH } = addBase(1.15, def.color)
      const ring = new THREE.Mesh(new THREE.TorusGeometry(Math.max(w, h) * 0.32, 0.14, 8, 28), mkEmat(0xc4b5fd, 0.45, 0.35))
      ring.rotation.x = Math.PI / 2
      ring.position.y = baseH + 0.35
      group.add(ring)
      for (const [sx, sz] of [
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ] as const) {
        const sp = new THREE.Mesh(new THREE.SphereGeometry(0.22, 10, 8), mkEmat(0xa78bfa, 0.55, 0.3))
        sp.position.set(sx * w * 0.38, baseH + 0.55, sz * h * 0.38)
        group.add(sp)
      }
      return group
    }

    if (def.id === 'jupiter_arc_thrower') {
      const { baseH } = addBase(1.85, def.color)
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.12, 8, 20), mkEmat(0x818cf8, 0.6, 0.32))
      coil.rotation.x = Math.PI / 2
      coil.position.y = baseH + 0.5
      group.add(coil)
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.55, 8), mkEmat(0xe879f9, 0.75, 0.28))
      tip.position.set(0, baseH + 1.15, 0)
      tip.rotation.x = -Math.PI / 2
      group.add(tip)
      return group
    }

    if (def.id === 'jupiter_overclock_augment') {
      const { baseH } = addBase(0.92, def.color)
      const fins = new THREE.Mesh(new THREE.OctahedronGeometry(0.4, 0), mkEmat(0xfbbf24, 0.7, 0.3))
      fins.position.y = baseH + 0.55
      group.add(fins)
      return group
    }

    if (def.id === 'jupiter_radar_station') {
      const { baseH } = addBase(1.05, def.color)
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 2.4, 10), mkMat(0xe2e8f0, 0.2, 0.48))
      mast.position.y = baseH + 1.25
      group.add(mast)
      const dish = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.45, 0.08, 18), mkEmat(0x38bdf8, 0.5, 0.35))
      dish.rotation.x = Math.PI / 2.8
      dish.position.set(0.35, baseH + 2.35, 0)
      group.add(dish)
      return group
    }

    if (def.id === 'jupiter_recon_drone') {
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.38, 0.1, 10), mkMat(0x475569, 0.1, 0.55))
      pad.position.y = 0.05
      group.add(pad)
      const orb = new THREE.Mesh(new THREE.IcosahedronGeometry(0.34, 0), mkEmat(0x818cf8, 0.75, 0.28))
      orb.position.y = 0.88
      group.add(orb)
      group.userData.reconOrbAnchor = orb
      return group
    }

    if (def.id === 'jupiter_battery_complex') {
      const { baseH } = addBase(1.15, def.color)
      const span = Math.max(w, h) * 0.38
      for (let i = 0; i < 5; i++) {
        const t = i / 4
        const cell = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.85, 0.52), mkMat(i % 2 === 0 ? 0xeab308 : 0xfde047, 0.12, 0.52))
        cell.position.set(-span + t * span * 2, baseH + 0.48, (i % 3) * 0.15 - 0.15)
        group.add(cell)
      }
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
      def.id === 'kingpin_slag_cannon' ||
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
      const isSiege = def.id === 'siege_cannon' || def.id === 'heavy_siege_gun' || def.id === 'kingpin_slag_cannon'
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

    if (def.id === 'archangel_airfield') {
      const { baseH } = addBase(1.5, def.color)
      const strip = new THREE.Mesh(new THREE.BoxGeometry(w * 0.88, 0.12, h * 0.92), mkMat(0x0b1220, 0.02, 0.95))
      strip.position.y = baseH + 0.06
      group.add(strip)
      for (let i = -1; i <= 1; i++) {
        const hangar = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.85, 0.7), glass)
        hangar.position.set(i * w * 0.22, baseH + 0.52, 0)
        group.add(hangar)
      }
      const tower = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 1.1, 10), mkMat(0xe2e8f0, 0.22, 0.5))
      tower.position.set(-w * 0.32, baseH + 0.55, -h * 0.25)
      group.add(tower)
      return group
    }

    if (def.id === 'archangel_starport') {
      const { baseH } = addBase(1.55, def.color)
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(Math.max(w, h) * 0.36, Math.max(w, h) * 0.4, 0.14, 18), mkMat(0x0b1220, 0.02, 0.95))
      pad.position.y = baseH + 0.08
      group.add(pad)
      const gantry = new THREE.Mesh(new THREE.BoxGeometry(0.2, 2.1, 0.2), mkMat(0xe2e8f0, 0.22, 0.5))
      gantry.position.set(w * 0.28, baseH + 1.05, 0)
      group.add(gantry)
      const arm = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.12, 0.12), mkEmat(def.color, 0.35, 0.4))
      arm.position.set(0, baseH + 1.85, 0)
      group.add(arm)
      return group
    }

    if (def.id === 'archangel_fueling_station') {
      const { baseH } = addBase(1.65, def.color)
      const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.62, 1.1, 14), mkMat(def.color, 0.18, 0.48))
      tank.position.set(0, baseH + 0.55, 0)
      group.add(tank)
      const cap = new THREE.Mesh(new THREE.SphereGeometry(0.3, 12, 10), mkEmat(def.color, 0.4, 0.35))
      cap.position.set(0, baseH + 1.15, 0)
      group.add(cap)
      return group
    }

    if (def.id === 'archangel_bulk_fueling_station') {
      const { baseH } = addBase(1.9, def.color)
      for (let i = 0; i < 3; i++) {
        const tx = (i - 1) * w * 0.22
        const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.5, 1.35, 14), mkMat(def.color, 0.16, 0.46))
        tank.position.set(tx, baseH + 0.68, 0)
        group.add(tank)
      }
      const pipe = new THREE.Mesh(new THREE.BoxGeometry(w * 0.75, 0.1, 0.14), mkMat(0x0b1220, 0.02, 0.95))
      pipe.position.set(0, baseH + 0.14, 0)
      group.add(pipe)
      return group
    }

    if (def.id === 'archangel_munitions_plant') {
      const { baseH } = addBase(1.55, def.color)
      const belt = new THREE.Mesh(new THREE.BoxGeometry(w * 0.85, 0.1, h * 0.85), mkMat(def.color, 0.12, 0.55))
      belt.position.y = baseH + 0.05
      group.add(belt)
      const crate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.45, 0.5), mkMat(def.color, 0.15, 0.52))
      crate.position.set(-0.25, baseH + 0.35, 0.2)
      group.add(crate)
      return group
    }

    if (def.id === 'archangel_missile_factory') {
      const { baseH } = addBase(1.7, def.color)
      const rack = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.4, w * 0.75), mkMat(def.color, 0.14, 0.5))
      rack.position.set(0, baseH + 0.7, 0)
      group.add(rack)
      for (let i = -2; i <= 2; i++) {
        const m = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.1, 0.55, 10), mkEmat(def.color, 0.25, 0.42))
        m.rotation.z = Math.PI / 2
        m.position.set(i * 0.22, baseH + 0.9, 0.35)
        group.add(m)
      }
      return group
    }

    if (def.id === 'dominion_orbital_cannon') {
      const { baseH } = addBase(2.4, def.color)
      const scale = Math.max(w, h)
      const sphere = new THREE.Mesh(new THREE.SphereGeometry(scale * 0.3, 22, 18), mkMat(def.color, 0.2, 0.38))
      sphere.position.set(0, baseH + scale * 0.34, 0)
      group.add(sphere)
      const yaw = new THREE.Group()
      yaw.position.set(0, baseH + scale * 0.34, 0)
      group.add(yaw)
      const pitch = new THREE.Group()
      yaw.add(pitch)
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.42, scale * 1.1, 14), mkEmat(def.color, 0.3, 0.36))
      barrel.rotation.x = Math.PI / 2
      barrel.position.set(0, 0, scale * 0.55)
      pitch.add(barrel)
      const muzzle = new THREE.Group()
      muzzle.position.set(0, 0, scale * 1.08)
      pitch.add(muzzle)
      aim.yaw = yaw
      aim.pitch = pitch
      aim.muzzle = muzzle
      group.userData.aim = aim
      return group
    }

    if (def.id === 'dominion_flak_gun') {
      const { baseH } = addBase(2.05, def.color)
      const yaw = new THREE.Group()
      yaw.position.set(0, baseH + 0.95, 0)
      group.add(yaw)
      const pitch = new THREE.Group()
      yaw.add(pitch)
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 1.95, 10), mkMat(def.color, 0.28, 0.42))
      barrel.rotation.x = Math.PI / 2
      barrel.position.z = 0.98
      pitch.add(barrel)
      const muzzle = new THREE.Group()
      muzzle.position.z = 1.88
      pitch.add(muzzle)
      aim.yaw = yaw
      aim.pitch = pitch
      aim.muzzle = muzzle
      group.userData.aim = aim
      return group
    }

    if (def.id === 'dominion_seeker_drone_spawner') {
      const { baseH } = addBase(2.05, def.color)
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.42, w * 0.48, 0.14, 18), mkMat(def.color, 0.14, 0.48))
      pad.position.y = baseH + 0.07
      group.add(pad)
      const tower = new THREE.Mesh(new THREE.BoxGeometry(0.5, 1.55, 0.5), mkMat(def.color, 0.12, 0.52))
      tower.position.set(0, baseH + 0.9, 0)
      group.add(tower)
      const dish = new THREE.Mesh(new THREE.ConeGeometry(0.32, 0.22, 12, 1, true), mkMat(def.color, 0.2, 0.4))
      dish.position.set(0, baseH + 1.55, 0)
      group.add(dish)
      return group
    }

    if (def.id === 'dominion_defensive_bunker') {
      const { baseH } = addBase(3.0, def.color)
      const slab = new THREE.Mesh(new THREE.BoxGeometry(w * 0.95, 0.35, h * 0.55), mkMat(def.color, 0.16, 0.55))
      slab.position.set(0, baseH + 0.2, -h * 0.12)
      group.add(slab)
      const yaw = new THREE.Group()
      yaw.position.set(0, baseH + 1.35, h * 0.28)
      group.add(yaw)
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.15, 1.55, 9), mkMat(def.color, 0.35, 0.42))
      barrel.rotation.x = Math.PI / 2
      barrel.position.z = 0.78
      yaw.add(barrel)
      const muzzle = new THREE.Group()
      muzzle.position.z = 1.48
      yaw.add(muzzle)
      aim.yaw = yaw
      aim.muzzle = muzzle
      group.userData.aim = aim
      return group
    }

    if (def.id === 'dominion_laser_drill') {
      const { baseH } = addBase(1.85, def.color)
      const yaw = new THREE.Group()
      yaw.position.set(0, baseH + 1.0, 0)
      group.add(yaw)
      const pitch = new THREE.Group()
      yaw.add(pitch)
      const lens = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.22, 0.42, 12), mkEmat(def.color, 0.6, 0.32))
      lens.rotation.x = Math.PI / 2
      lens.position.z = 0.55
      pitch.add(lens)
      const muzzle = new THREE.Group()
      muzzle.position.z = 0.78
      pitch.add(muzzle)
      aim.yaw = yaw
      aim.pitch = pitch
      aim.muzzle = muzzle
      group.userData.aim = aim
      return group
    }

    if (def.id === 'dominion_support_bay') {
      const { baseH } = addBase(2.65, def.color)
      const roof = new THREE.Mesh(new THREE.BoxGeometry(w * 0.95, 0.12, h * 0.95), mkMat(def.color, 0.12, 0.55))
      roof.position.y = baseH + 1.35
      group.add(roof)
      const bay = new THREE.Mesh(new THREE.BoxGeometry(w * 0.75, 0.9, h * 0.55), mkMat(def.color, 0.08, 0.58))
      bay.position.set(0, baseH + 0.65, h * 0.15)
      group.add(bay)
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(w * 0.95, 0.08, 0.12), mkEmat(def.color, 0.35, 0.45))
      stripe.position.set(0, baseH + 0.45, h * 0.46)
      group.add(stripe)
      return group
    }

    if (def.id === 'nova_gravity_well') {
      const { baseH } = addBase(1.0, def.color)
      const magStem = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.1, w * 0.16, 0.5, 12), mkMat(def.color, 0.18, 0.5))
      magStem.position.y = baseH + 0.25
      group.add(magStem)
      const spear = new THREE.Group()
      spear.position.set(0, baseH + 2.65, 0)
      group.add(spear)
      const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 2.35, 10), mkEmat(def.color, 0.5, 0.32))
      shaft.rotation.x = Math.PI / 2
      shaft.rotation.z = -0.22
      shaft.position.set(0, 0.35, 0.15)
      spear.add(shaft)
      const blade = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.55, 8), mkEmat(def.color, 0.82, 0.26))
      blade.rotation.x = -Math.PI / 2
      blade.position.set(0, 0.35, 1.35)
      spear.add(blade)
      const spin = new THREE.Group()
      const orbitR = Math.max(w, h) * 0.36
      spin.position.y = baseH + 1.45
      group.add(spin)
      group.userData.novaGravitySpin = spin
      const pMat = mkEmat(def.color, 1.0, 0.22)
      const nOrb = 16
      for (let i = 0; i < nOrb; i++) {
        const t = (i / nOrb) * Math.PI * 2
        const bob = Math.sin(i * 1.13) * 0.22
        const orb = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), pMat)
        orb.position.set(Math.cos(t) * orbitR, bob, Math.sin(t) * orbitR)
        spin.add(orb)
      }
      const halo = new THREE.Mesh(new THREE.TorusGeometry(orbitR * 0.92, 0.04, 8, 40), mkMat(def.color, 0.2, 0.48))
      halo.rotation.x = Math.PI / 2
      spin.add(halo)
      return group
    }

    if (def.id === 'nova_photon_projector_s' || def.id === 'nova_photon_projector_l') {
      const large = def.id === 'nova_photon_projector_l'
      const { baseH } = addBase(large ? 2.1 : 1.75, def.color)
      const yawPivot = new THREE.Group()
      yawPivot.position.set(0, baseH + 0.3, 0)
      group.add(yawPivot)
      const pitchPivot = new THREE.Group()
      pitchPivot.position.set(0, 0.18, 0)
      yawPivot.add(pitchPivot)
      const housing = new THREE.Mesh(new THREE.SphereGeometry(large ? 0.52 : 0.4, 16, 12), mkEmat(def.color, 0.55, 0.28))
      pitchPivot.add(housing)
      const iris = new THREE.Mesh(
        new THREE.TorusGeometry(large ? 0.58 : 0.45, 0.055, 10, 28),
        mkMat(def.color, 0.22, 0.42),
      )
      iris.rotation.x = Math.PI / 2
      iris.position.z = 0.06
      pitchPivot.add(iris)
      const muzzle = new THREE.Object3D()
      muzzle.position.set(0, 0, large ? 0.58 : 0.46)
      pitchPivot.add(muzzle)
      aim.yaw = yawPivot
      aim.pitch = pitchPivot
      aim.muzzle = muzzle
      group.userData.aim = aim
      return group
    }

    if (def.id === 'nova_shockwave_pulsar') {
      const { baseH } = addBase(2.05, def.color)
      const stage = new THREE.Mesh(new THREE.CylinderGeometry(w * 0.4, w * 0.46, 0.22, 18), mkMat(def.color, 0.14, 0.52))
      stage.position.y = baseH + 0.11
      group.add(stage)
      const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.52, 0.55, 16), mkEmat(def.color, 0.4, 0.34))
      bell.position.y = baseH + 0.55
      group.add(bell)
      const emitter = new THREE.Mesh(new THREE.SphereGeometry(0.38, 14, 12), mkEmat(def.color, 0.65, 0.28))
      emitter.position.y = baseH + 1.05
      group.add(emitter)
      const ribs = new THREE.Mesh(new THREE.TorusGeometry(0.62, 0.05, 8, 32), mkMat(def.color, 0.18, 0.48))
      ribs.position.y = baseH + 0.92
      ribs.rotation.x = Math.PI / 2
      group.add(ribs)
      return group
    }

    if (def.id === 'nova_universal_forcefield') {
      const { baseH } = addBase(2.35, def.color)
      for (let i = 0; i < 3; i++) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.85, 0.22), mkMat(def.color, 0.16, 0.5))
        const ox = (i - 1) * w * 0.26
        leg.position.set(ox, baseH + 0.92, 0)
        group.add(leg)
      }
      const bridge = new THREE.Mesh(new THREE.BoxGeometry(w * 0.88, 0.14, h * 0.35), mkMat(def.color, 0.14, 0.52))
      bridge.position.y = baseH + 1.65
      group.add(bridge)
      const core = new THREE.Mesh(new THREE.OctahedronGeometry(0.48, 0), mkEmat(def.color, 0.45, 0.3))
      core.position.y = baseH + 2.05
      group.add(core)
      return group
    }

    if (def.id === 'nova_power_bank') {
      const { baseH } = addBase(1.45, def.color)
      const spine = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.14, 0.32), mkMat(def.color, 0.12, 0.55))
      spine.position.y = baseH + 0.07
      group.add(spine)
      for (let i = 0; i < 3; i++) {
        const stack = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.55, 0.42), mkEmat(def.color, 0.4, 0.38))
        stack.position.set((i - 1) * 0.48, baseH + 0.42, 0)
        group.add(stack)
      }
      const coil = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.06, 10, 24), mkMat(def.color, 0.2, 0.45))
      coil.position.y = baseH + 0.82
      coil.rotation.x = Math.PI / 2
      group.add(coil)
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

    const placeCost = this.placementCreditCost(def, ox, oz)
    if (this.credits < placeCost) {
      this.hoverValid = false
      return
    }
    const ignoresSupplyLock =
      def.id === 'command_center' || def.id === 'supply_depot_s' || def.id === 'supply_depot_l'
    if (!ignoresSupplyLock && this.supplyUsed + def.supplyCost > this.supplyCap) {
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

  /** Shield bubbles always show their own HP bar while the field has capacity. */
  private setShieldHealthBar(bar: HealthBar, hp: number, maxHp: number) {
    const t = Math.max(0, Math.min(1, maxHp <= 0 ? 0 : hp / maxHp))
    bar.group.visible = maxHp > 0 && hp > 0
    bar.fill.scale.x = t
    bar.fill.position.x = (t - 1) * 0.5
    const mat = bar.fill.material as THREE.MeshBasicMaterial
    mat.color.setHex(t > 0.6 ? 0x38bdf8 : t > 0.3 ? 0xfbbf24 : 0xf97316)
    ;(bar.bg.material as THREE.MeshBasicMaterial).opacity = hp <= 0 ? 0 : 0.88
    mat.opacity = hp <= 0 ? 0 : 0.95
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

  private createPlaneHudBars(): ArchangelPlaneHud {
    const w = 1.35
    const h = 0.1
    const gap = 0.13
    const group = new THREE.Group()
    const mkRow = (y: number, fillHex: number) => {
      const bg = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ color: 0x0f172a, transparent: true, opacity: 0.88 }),
      )
      bg.position.y = y
      const fill = new THREE.Mesh(
        new THREE.PlaneGeometry(w - 0.07, h - 0.05),
        new THREE.MeshBasicMaterial({ color: fillHex, transparent: true, opacity: 0.95 }),
      )
      fill.position.y = y
      bg.renderOrder = 72
      fill.renderOrder = 73
      group.add(bg)
      group.add(fill)
      return fill
    }
    const fuelFill = mkRow(gap * 0.5, 0xfbbf24)
    const ammoFill = mkRow(-gap * 0.5, 0x38bdf8)
    this.world.add(group)
    return { group, fuelFill, ammoFill }
  }

  private setPlaneHudBarFill(fill: THREE.Mesh, t: number) {
    const k = clamp(t, 0, 1)
    fill.scale.x = k
    fill.position.x = (k - 1) * 0.5
  }

  private updateArchangelPlaneHud(p: ArchangelPlane) {
    const fuelT = p.maxFuel > 0 ? p.fuel / p.maxFuel : 0
    const ammoT =
      p.role === 'gunship'
        ? p.maxBullets > 0
          ? p.bullets / p.maxBullets
          : 0
        : p.maxMissiles > 0
          ? p.missiles / p.maxMissiles
          : 0
    this.setPlaneHudBarFill(p.hud.fuelFill, fuelT)
    this.setPlaneHudBarFill(p.hud.ammoFill, ammoT)
    const ff = p.hud.fuelFill.material as THREE.MeshBasicMaterial
    const af = p.hud.ammoFill.material as THREE.MeshBasicMaterial
    ff.color.setHex(fuelT > 0.35 ? 0xfbbf24 : 0xef4444)
    af.color.setHex(ammoT > 0.25 ? 0x38bdf8 : 0xf97316)
  }

  private updateHealthBars() {
    for (const b of this.buildings) {
      this.setHealthBar(b.healthBar, b.hp, this.getBuildingMaxHp(b))
      const yLift = b.defId === 'jupiter_recon_drone' ? 7.6 : 0
      b.healthBar.group.position.set(
        b.origin.x + (b.def.size.w - 1) / 2,
        4.2 + b.def.size.h * 0.2 + yLift,
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
    for (const [, sf] of this.shieldFields) {
      this.setShieldHealthBar(sf.shieldBar, sf.hp, sf.maxHp)
      const b = this.buildings.find((x) => x.id === sf.generatorId && x.hp > 0)
      if (b) {
        const cx = b.origin.x + (b.def.size.w - 1) / 2
        const cz = b.origin.z + (b.def.size.h - 1) / 2
        sf.shieldBar.group.position.set(cx, 5.85 + sf.radius * 0.12, cz)
      }
      sf.shieldBar.group.quaternion.copy(this.camera.quaternion)
    }
    if (this.universalShield) {
      const u = this.universalShield
      this.setShieldHealthBar(u.shieldBar, u.hp, u.maxHp)
      u.shieldBar.group.position.set(0, 9.4 + u.radius * 0.05, 0)
      u.shieldBar.group.quaternion.copy(this.camera.quaternion)
    }
    if (this.heroId === 'archangel') {
      for (const p of this.archangelPlanes) {
        this.updateArchangelPlaneHud(p)
        p.hud.group.position.copy(p.mesh.position).add(new THREE.Vector3(0, 1.45, 0))
        p.hud.group.quaternion.copy(this.camera.quaternion)
      }
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
    powerSite?: { x: number; z: number },
    damageScale: number = 1,
  ) {
    if (!this.tryConsumeShotPower(def, 1, powerSite)) return
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
      damage: (def.damage ?? 30) * damageScale,
      aoeRadius: def.aoeRadius ?? 3,
    })
  }

  /** Bomber plane missile: no building shot-power cost; pays from the bomber's on-board magazine. */
  private spawnArchangelPlaneMissile(
    origin: THREE.Vector3,
    target: Asteroid | null,
    damage: number,
    aoeRadius: number,
    speed: number,
  ) {
    const geo = new THREE.ConeGeometry(0.22, 1.05, 10)
    const mat = new THREE.MeshStandardMaterial({ color: 0xf5f3ff, emissive: 0xc026d3, emissiveIntensity: 0.45 })
    const mesh = new THREE.Mesh(geo, mat)
    mesh.position.copy(origin)
    mesh.position.y += 0.6
    mesh.rotation.x = Math.PI / 2
    mesh.castShadow = true
    this.projectiles.add(mesh)
    this.missiles.push({
      mesh,
      target,
      targetId: target?.id ?? null,
      mode: 'death_location',
      noSplash: false,
      volleyId: null,
      lastKnownTargetPos: target ? target.mesh.position.clone() : origin.clone(),
      launchUpTime: 0.28,
      launchUpSpeed: 32,
      speed,
      ttl: 5.5,
      damage,
      aoeRadius,
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

  /** Prefer a random rock among the nearest few so Archangel planes do not stack on one target. `pos` is the plane position. */
  private pickRandomEngageTarget(pos: THREE.Vector3): Asteroid | null {
    const alive = this.asteroids.filter((a) => a.alive)
    if (alive.length === 0) return null
    const hz = (a: Asteroid) => Math.hypot(a.mesh.position.x - pos.x, a.mesh.position.z - pos.z)
    const farEnough = alive.filter((a) => hz(a) > ARCHANGEL_MIN_TARGET_TILE_DIST)
    let candidates: Asteroid[]
    if (farEnough.length > 0) {
      candidates = [...farEnough].sort((a, b) => hz(a) - hz(b))
    } else {
      // Every rock is within min distance of this plane — pick among the farthest from the plane so it still has a job.
      candidates = [...alive].sort((a, b) => hz(b) - hz(a))
    }
    if (candidates.length === 1) return candidates[0]
    const pool = candidates.slice(0, Math.min(14, candidates.length))
    return pool[Math.floor(Math.random() * pool.length)] ?? candidates[0]
  }

  private spawnBallistic(
    origin: THREE.Vector3,
    targetPos: THREE.Vector3,
    def: BuildingDef,
    powerSite?: { x: number; z: number },
    damageScale: number = 1,
  ) {
    if (!this.tryConsumeShotPower(def, 1, powerSite)) return
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
      damage: (def.damage ?? 800) * damageScale,
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
    if (this.universalShield) {
      const u = this.universalShield
      if (!u.noPower && !u.lowHpOffline && u.hp > 0.001) {
        const rx = u.radius
        const ry = u.radius * u.scaleY
        const rz = u.radius
        const dx = pos.x / rx
        const dy = pos.y / ry
        const dz = pos.z / rz
        if (dx * dx + dy * dy + dz * dz <= 1) return u
      }
    }
    for (const [, sf] of this.shieldFields) {
      const b = this.buildings.find((x) => x.id === sf.generatorId && x.hp > 0)
      if (!b) continue
      if (sf.noPower || sf.lowHpOffline || sf.hp <= 0.001) continue
      const cx = b.origin.x + (b.def.size.w - 1) / 2
      const cz = b.origin.z + (b.def.size.h - 1) / 2
      const dx = pos.x - cx
      const dy = pos.y
      const dz = pos.z - cz
      const r = sf.radius
      if ((dx * dx + dy * dy + dz * dz) / (r * r) <= 1) return sf
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
    let mostCommonBuildingLabel = '—'
    let bestPlaced = 0
    for (const [bid, n] of this.statsBuildingPlacements) {
      if (n > bestPlaced) {
        bestPlaced = n
        mostCommonBuildingLabel = BUILDINGS.find((b) => b.id === bid)?.label ?? bid
      }
    }
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
      heroId: this.heroId,
      runStats: {
        moneyEarned: Math.round(this.statsMoneyEarned),
        moneySpent: Math.round(this.statsMoneySpent),
        powerProduced: Math.round(this.statsPowerProduced),
        asteroidsKilled: this.statsAsteroidsKilled,
        mostCommonBuildingLabel,
      },
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

