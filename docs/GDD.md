# Meteor Base Defense — Game Design Document (GDD)

Living reference for structure IDs, upgrade IDs, and high-level design. **Implementation source of truth** remains `src/game/BaseDefenseGame.ts` (and `src/App.tsx` for UI).

---

## Naming note: “Mega-Complex” vs “Mega Factory”

- **Upgrade** `factory_megacomplex_mk2` is labeled **“Mega-Complex Level 2”** in the skill tree.
- It modifies the building **`factory_megacomplex`**, whose **wheel / HUD label** is **“Mega Factory”** (tier-3 credit factory: Business → Factory → **Mega Factory**).
- **Unlock** `unlock_megacomplex` describes unlocking the “Mega-Complex” building — same entity as **Mega Factory**.

**Recommendation:** Rename the upgrade (and unlock copy) to **“Mega Factory Level 2”** (or “Mega Factory MK2”) everywhere player-facing so it matches the build wheel.

---

## 1. High concept

Top-down / first-person hybrid **base builder** and **tower defense** against **asteroid waves**. Players place structures on a grid during **inactive** phases; **active waves** spawn asteroids that damage the base on impact. **Command centers** are the lose condition: when none remain, the run ends.

---

## 2. Core loop

1. **Inactive phase** — Build, sell (RMB), open build wheel (C), skill tree (U), commander research (R), purchase/refund upgrades.
2. **Start wave** — Space (manual) or timer (auto); **combat phase** begins.
3. **Active wave** — Spawning + combat; economy and power tick; placement/sell typically disabled during wave (per game rules).
4. **Wave clear** — All asteroids destroyed after spawn window; return to inactive or game over.

---

## 3. Resources

| Resource | Role |
|----------|------|
| **Credits** | Build costs, some hero mechanics (e.g., Slag shots, Kingpin investment scaling). |
| **Supply** | Cap on placed structures; depots raise cap. |
| **Power** | Stored energy; generation vs. drain; many producers/consumers require power during waves. |

---

## 4. Commanders (`HeroId`)

| ID | Theme (short) |
|----|----------------|
| `archangel` | Air units: gunships, bombers, fueling, munitions. |
| `dominion` | Heavy weapons, orbital, flak, drones, support bay. |
| `nova` | Gravity well, photon projectors, shockwave pulsar, forcefield, power banks. |
| `citadel` | Conduit auras affecting repair, build discount, defense, attack, efficiency, range. |
| `jupiter` | Mass relays, arc thrower, radar, recon drone, battery complex, overclock. |
| `kingpin` | Economic structures, refinery auras, mineral salvage, credit-fired Slag Cannon. |

Commander-specific **buildings** use `category: 'hero'` and `heroId`. Neutral buildings omit `heroId`.

---

## 5. Building categories (build wheel)

Order in UI: **structural → economy → electrical → turrets → missile → energy → hero** (hero tab label shows current commander).

---

## 6. Structures — complete list

All entries are `BuildingId` values. **Label** is the primary player-facing name in `BUILDINGS`.

### 6.1 Neutral (no `heroId`)

| ID | Label (typical) | Category |
|----|------------------|----------|
| `command_center` | Command Center | structural |
| `supply_depot_s` | Supply Depo (S) | structural |
| `supply_depot_l` | Supply Depo (L) | structural |
| `repair_bay` | Repair Bay | structural |
| `support_node` | Support Node | structural |
| `reconstruction_yard` | Reconstruction Yard | structural |
| `factory_business` | Business | economy |
| `factory_factory` | Factory | economy |
| `factory_megacomplex` | **Mega Factory** | economy |
| `refinery` | Refinery | economy |
| `mega_refinery` | Mega Refinery | economy |
| `chemical_installation` | Chemical Installation | economy |
| `generator_small` | Generator (S) | electrical |
| `generator_large` | Generator (L) | electrical |
| `battery_small` | Battery (S) | electrical |
| `battery_large` | Battery (L) | electrical |
| `pylon` | Pylon | electrical |
| `nuclear_plant` | Nuclear Plant | electrical |
| `auto_turret` | Auto-Turret | turrets |
| `auto_turret_large` | Auto-Turret (L) | turrets |
| `siege_cannon` | Siege Cannon | turrets |
| `heavy_siege_gun` | Heavy Siege Cannon | turrets |
| `aa_gun` | AA Gun | turrets |
| `railgun` | Railgun | turrets |
| `missile_launcher_s` | Missile Launcher (S) | missile |
| `missile_launcher_m` | Missile Launcher (M) | missile |
| `portable_silo` | Portable Silo | missile |
| `missile_silo` | Missile Silo | missile |
| `nuclear_silo` | Nuclear Silo | missile |
| `hydra_launcher` | Hydra Launcher | missile |
| `shield_generator_m` | Shield Generator (M) | energy |
| `shield_generator_l` | Shield Generator (L) | energy |
| `tesla_tower` | Tesla Tower | energy |
| `plasma_laser_s` | Plasma Laser (S) | energy |
| `plasma_laser_m` | Plasma Laser (M) | energy |
| `plasma_laser_l` | Plasma Laser (L) | energy |

### 6.2 Archangel

| ID | Label |
|----|--------|
| `archangel_airfield` | Airfield |
| `archangel_starport` | Starport |
| `archangel_fueling_station` | Fueling Station |
| `archangel_bulk_fueling_station` | Bulk Fueling Station |
| `archangel_munitions_plant` | Munitions Plant |
| `archangel_missile_factory` | Missile Factory |

### 6.3 Dominion

| ID | Label |
|----|--------|
| `dominion_orbital_cannon` | Orbital Cannon |
| `dominion_flak_gun` | Flak Gun |
| `dominion_seeker_drone_spawner` | Seeker Drone Spawner |
| `dominion_defensive_bunker` | Defensive Bunker |
| `dominion_laser_drill` | Laser Drill |
| `dominion_support_bay` | Support Bay |

### 6.4 Nova

| ID | Label |
|----|--------|
| `nova_gravity_well` | Gravity Well |
| `nova_photon_projector_s` | Photon Projector (S) |
| `nova_photon_projector_l` | Photon Projector (L) |
| `nova_shockwave_pulsar` | Shockwave Pulsar |
| `nova_universal_forcefield` | Universal Forcefield |
| `nova_power_bank` | Power Bank |

### 6.5 Citadel

| ID | Label |
|----|--------|
| `citadel_repair_conduit` | Repair Conduit |
| `citadel_construction_conduit` | Construction Conduit |
| `citadel_defense_conduit` | Defense Conduit |
| `citadel_attack_conduit` | Attack Conduit |
| `citadel_efficiency_conduit` | Efficiency Conduit |
| `citadel_range_conduit` | Range Conduit |

### 6.6 Jupiter

| ID | Label |
|----|--------|
| `jupiter_mass_relay` | Mass Relay |
| `jupiter_arc_thrower` | Arc Thrower |
| `jupiter_overclock_augment` | Overclock Augment |
| `jupiter_radar_station` | Radar Station |
| `jupiter_recon_drone` | Recon Drone |
| `jupiter_battery_complex` | Battery Complex |

### 6.7 Kingpin

| ID | Label |
|----|--------|
| `kingpin_data_array` | Data Array |
| `kingpin_investment_complex` | Investment Complex |
| `kingpin_cryptographic_decoder` | Cryptographic Decoder |
| `kingpin_indoctrinated_labor` | Indoctrinated Labor |
| `kingpin_mineral_processor` | Mineral Processor |
| `kingpin_slag_cannon` | Slag Cannon |

---

## 7. Upgrades — complete ID list

**Global** upgrades have no `heroId`. **Commander** upgrades include `heroId` and appear only for that hero’s research panel.

Exact **labels, costs, descriptions, prerequisites, unlocks, and numeric modifiers** live in `UPGRADES_RAW` / `UPGRADES` in code. Below is the **exhaustive ID inventory** from `UpgradeId`.

### 7.1 Global — core progression

`core_protocol`, `unlock_factory`, `unlock_megacomplex`, `turret_targeting`, `generator_efficiency`, `unlock_turret_t2`, `unlock_railgun`, `turret_range_1`, `turret_range_2`, `turret_damage_1`, `turret_damage_2`, `unlock_missile_silos`, `unlock_nuclear_silo`, `unlock_hydra_launcher`, `missile_payload_1`, `missile_payload_2`, `unlock_shields`, `unlock_shield_large`, `shield_capacity_1`, `shield_capacity_2`, `shield_recharge_1`, `plasma_focus_1`, `plasma_focus_2`, `tesla_coils_1`, `logistics_1`, `logistics_2`, `command_autonomy_1`, `structural_fortification_1`, `structural_fortification_2`, `structural_auto_repair`, `battery_capacity_1`, `battery_capacity_2`, `power_distribution_1`, `power_distribution_2`, `nuclear_overclock_1`, `economy_optimization_1`, `economy_optimization_2`, `unlock_refinery`, `unlock_mega_refinery`, `unlock_repair_infra`, `unlock_reconstruction_yard`, `unlock_grid_expansion`, `unlock_pylon`, `unlock_nuclear_plant`.

### 7.2 Global — structure MK2 line

`command_center_mk2`, `supply_depot_s_mk2`, `supply_depot_l_mk2`, `repair_bay_mk2`, `support_node_mk2`, `reconstruction_yard_mk2`, `factory_business_mk2`, `factory_factory_mk2`, **`factory_megacomplex_mk2`**, `refinery_mk2`, `mega_refinery_mk2`, `chemical_installation_mk2`, `generator_small_mk2`, `generator_large_mk2`, `battery_small_mk2`, `battery_large_mk2`, `pylon_mk2`, `nuclear_plant_mk2`, `auto_turret_mk2`, `auto_turret_large_mk2`, `siege_cannon_mk2`, `heavy_siege_gun_mk2`, `aa_gun_mk2`, `railgun_mk2`, `missile_launcher_s_mk2`, `missile_launcher_m_mk2`, `portable_silo_mk2`, `missile_silo_mk2`, `nuclear_silo_mk2`, `hydra_launcher_mk2`, `shield_generator_m_mk2`, `shield_generator_l_mk2`, `tesla_tower_mk2`, `plasma_laser_s_mk2`, `plasma_laser_m_mk2`, `plasma_laser_l_mk2`.

### 7.3 Archangel (`hero_archangel_*`)

`hero_archangel_core`, `hero_archangel_unlock_bulk_fueling`, `hero_archangel_fuel_efficiency_1`, `hero_archangel_fuel_efficiency_2`, `hero_archangel_armor_piercing`, `hero_archangel_quick_reload`, `hero_archangel_tight_shift`, `hero_archangel_airfield_mk2`, `hero_archangel_starport_mk2`, `hero_archangel_fueling_mk2`, `hero_archangel_bulk_fueling_mk2`, `hero_archangel_munitions_mk2`, `hero_archangel_missile_factory_mk2`, `hero_archangel_missile_damage_1`, `hero_archangel_missile_damage_2`, `hero_archangel_missile_range_1`, `hero_archangel_missile_range_2`, `hero_archangel_missile_payload_1`, `hero_archangel_missile_payload_2`.

### 7.4 Dominion (`hero_dominion_*`)

`hero_dominion_core`, `hero_dominion_unlock_elite_weaponry`, `hero_dominion_unlock_advanced_tech`, `hero_dominion_extended_support`, `hero_dominion_enhanced_power`, `hero_dominion_reinforced_plating`, `hero_dominion_lead_rounds`, `hero_dominion_orbital_mk2`, `hero_dominion_flak_mk2`, `hero_dominion_bunker_mk2`, `hero_dominion_spawner_mk2`, `hero_dominion_drill_mk2`, `hero_dominion_support_mk2`, `hero_dominion_turret_damage_1`, `hero_dominion_turret_damage_2`, `hero_dominion_turret_range_1`, `hero_dominion_turret_range_2`, `hero_dominion_turret_rof_1`, `hero_dominion_turret_rof_2`.

### 7.5 Nova (`hero_nova_*`)

`hero_nova_core`, `hero_nova_unlock_advanced_weaponry`, `hero_nova_unlock_forcefield`, `hero_nova_shield_implosion`, `hero_nova_energized_power_bank`, `hero_nova_fission_blast`, `hero_nova_stasis_surge`, `hero_nova_gravity_well_mk2`, `hero_nova_photon_s_mk2`, `hero_nova_photon_l_mk2`, `hero_nova_shockwave_mk2`, `hero_nova_forcefield_mk2`, `hero_nova_power_bank_mk2`, `hero_nova_energy_damage_1`, `hero_nova_energy_damage_2`, `hero_nova_energy_range_1`, `hero_nova_energy_range_2`, `hero_nova_energy_cycle_1`, `hero_nova_energy_cycle_2`.

### 7.6 Citadel (`hero_citadel_*`)

`hero_citadel_core`, `hero_citadel_struct_grid_1`, `hero_citadel_struct_grid_2`, `hero_citadel_command_fortress`, `hero_citadel_conduit_integrity`, `hero_citadel_supply_lines`, `hero_citadel_industrial_shell`, `hero_citadel_repair_conduit_mk2`, `hero_citadel_construction_conduit_mk2`, `hero_citadel_defense_conduit_mk2`, `hero_citadel_attack_conduit_mk2`, `hero_citadel_efficiency_conduit_mk2`, `hero_citadel_range_conduit_mk2`, `hero_citadel_defense_centers`, `hero_citadel_enhanced_conductivity`, `hero_citadel_sophisticated_repairs`, `hero_citadel_last_stand`, `hero_citadel_focused_power`, `hero_citadel_unlock_advanced_conduits`.

### 7.7 Jupiter (`hero_jupiter_*`)

`hero_jupiter_core`, `hero_jupiter_unlock_support_machines`, `hero_jupiter_unlock_advanced_electrical`, `hero_jupiter_unlock_arc_thrower`, `hero_jupiter_grid_tuning_1`, `hero_jupiter_grid_tuning_2`, `hero_jupiter_capacitance_1`, `hero_jupiter_capacitance_2`, `hero_jupiter_transmission_lines`, `hero_jupiter_emergency_shunts`, `hero_jupiter_induction_weave`, `hero_jupiter_mass_relay_mk2`, `hero_jupiter_arc_thrower_mk2`, `hero_jupiter_overclock_mk2`, `hero_jupiter_radar_mk2`, `hero_jupiter_recon_drone_mk2`, `hero_jupiter_battery_complex_mk2`, `hero_jupiter_enhanced_pinging`, `hero_jupiter_emergency_generator`, `hero_jupiter_arc_supercharge`.

### 7.8 Kingpin (`hero_kingpin_*`)

`hero_kingpin_core`, `hero_kingpin_unlock_advanced_economic_solutions`, `hero_kingpin_unlock_production_enhancements`, `hero_kingpin_unlock_slag_cannon`, `hero_kingpin_factory_dividends_1`, `hero_kingpin_factory_dividends_2`, `hero_kingpin_refinery_contracts_1`, `hero_kingpin_refinery_contracts_2`, `hero_kingpin_venture_capital`, `hero_kingpin_energy_arbitrage`, `hero_kingpin_data_array_mk2`, `hero_kingpin_investment_complex_mk2`, `hero_kingpin_cryptographic_decoder_mk2`, `hero_kingpin_indoctrinated_labor_mk2`, `hero_kingpin_mineral_processor_mk2`, `hero_kingpin_slag_cannon_mk2`, `hero_kingpin_hazard_pay`, `hero_kingpin_insider_discounts`, `hero_kingpin_scavenging`, `hero_kingpin_compound_interest`, `hero_kingpin_signal_amplification`, `hero_kingpin_scrap_futures`.

---

## 8. Asteroid variants (reference)

`normal`, `splitter`, `explosive`, `meteor`, `seeker`, `planet`, `gold`, `spawner`, `emp`, `colossus` — behaviors and rewards are implemented in `BaseDefenseGame.ts`.

---

## 9. Related docs

- `docs/BALANCE_AND_EXCEL.md` — balance philosophy and external tooling.
- `docs/BALANCE_PIPELINE.md` — how we can move numbers to data files in safe phases.
- `docs/PERFORMANCE_PLAN.md` — runtime optimization roadmap.
