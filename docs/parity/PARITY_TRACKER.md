# Three.js -> Godot Parity Tracker

Status legend:
- `[ ]` Missing
- `[-]` Partial
- `[x]` Match

## 1) Boot / Session Flow

- [-] App phase flow (`menu -> playing -> gameover`)  
  Web ref: `src/App.tsx` (`phase`, `setPhase`)  
  Godot ref: `godot/scripts/main.gd` (`AppPhase`, `apply_phase`, `_check_command_center_defeat`)  
  Notes: CC death from **impact + AOE** ends run; **Sandbox** runs skip best-score save; gameover hint includes **commander**; full web gameover stats/leaderboard still TBD.

- [-] Session reset parity (all runtime fields, unlocks, wave state, per-run stats)  
  Web ref: `src/App.tsx` (`startNewRun`, `goToMenu`, `INITIAL_STATE`)  
  Godot ref: `main.gd` **`_start_new_run`** — **`_clear_entities`** (turrets/asteroids/projectiles/pool/CC), **`_parity_apply_building_baseline`**, scalar wave/credits/upgrades reset, **`_sync_game_state_runtime`**; **`GameState.reset_run`** aligned for supply/CC max HP from defs. Full web surface (missiles, shields, discovery, unlocks graph) still future.

## 2) Input / Cursor / Fullscreen / Pointer Lock

- [-] Fullscreen + pointer capture on primary gesture  
  Web ref: `src/App.tsx` (`onPointerDownCapture`, relock handlers)  
  Godot ref: `godot/scripts/main.gd` (`_ensure_fullscreen_and_capture`)  
  Notes: Present, but recovery edge cases need strict parity checks.

- [-] Run **difficulty** selection vs web run config  
  Web ref: `App.tsx` / `runConfigRef` **`difficulty`**  
  Godot ref: main menu **`MenuDifficultyOption`** → **`game_difficulty`** (**`WaveScaling`**, **`ScoreSystem.difficulty_score_mul`**); HUD / F3 show current diff

- [-] Virtual cursor for menu/pause/gameover  
  Web ref: `src/App.tsx` (`pickMenuHitTarget`, menu cursor state)  
  Godot ref: `godot/scripts/main.gd` (menu cursor + highlights)  
  Notes: Functional, not yet behavior-identical for all hit-target cases.

- [ ] Wheel/research virtual interaction parity  
  Web ref: `src/App.tsx` (`wheelOpen`, `upgradeOpen`, `researchOpen`)  
  Godot target: dedicated UI controllers

## 3) Camera + Movement

- [-] FPS-like mouse look + WASD/QE camera movement  
  Web ref: `src/game/BaseDefenseGame.ts` (`onPointerMove`, `updateCamera`)  
  Godot ref: `godot/scripts/main.gd` (`_update_camera_motion`)  
  Notes: Present but tuned differently; clamps/bounds feel mismatch.

## 4) Build / Placement / Selling

- [-] Grid scale and footprint rules for all building sizes  
  Web ref: `src/game/BaseDefenseGame.ts` (cell placement logic)  
  Godot ref: `godot/systems/BuildSystem.gd` — **w×h footprint** from **`auto_turret`** + **`factory_business`** + **`supply_depot_s`** / **`supply_depot_l`** defs; shared occupancy via **`_placed_for_build()`**; **B** cycles turret/factory/**depot S**/**depot L** when unlocked; more **`BuildingId`** types TBD

- [-] Placement legality parity (wave restrictions, occupancy, command center constraints)  
  Web ref: `src/game/BaseDefenseGame.ts` (`tryPlace`: credits, supply, bounds — **no power check**)  
  Godot ref: occupancy + center exclusion; **build/sell blocked during active wave/cleanup**; **supply** gate; **power** not checked at place (web parity); **unlocks** pending

- [-] Sell/refund parity by building type and state  
  Web ref: `src/game/BaseDefenseGame.ts`  
  Godot ref: **100% vs 50%** by inactive phase; refund uses **`build_credit_cost`** stored at placement (web cost-at-build pattern); multiple building IDs still pending

## 5) Waves / Asteroids

- [-] Wave state machine (ready/in-progress/spawn progress/cleanup)  
  Web ref: `src/game/BaseDefenseGame.ts` (`waveReady`, `waveInProgress`, timers)  
  Godot ref: **`wave_combat_active`** (spawn window + cleanup); **spawn window elapsed/duration/ended** + **`toSpawn`** from `WaveScaling.gd` (web formulas, default **hard**); first wave manual; 60s inactive; auto/Space rules; **`wave_ready`**; **top-center wave timer** (`WaveTimerRing.gd`, web `waveSpawnProgress` / inactive ÷ 60 + captions).

- [-] Asteroid variants and behavior parity  
  Web ref: `src/game/BaseDefenseGame.ts` (`AsteroidVariant`, variant logic)  
  Godot ref: **base HP / damage / speed** from `WaveScaling.asteroid_base_stats` (difficulty + `adj`/`powT` + global 0.78 HP mul); per-rock **`move_speed`**, **`impact_damage`**, **`impact_radius`** via `AsteroidSystem.compute_spawn_kinematics` (web variant muls + radius scale). Splitter child HP/speed approximations; **seeker targeting / gravity wells** still missing.

## 6) Combat / Projectiles / Effects

- [-] All weapon types parity (hitscan, missiles, ballistic, railgun, shield, specials)  
  Web ref: `src/game/BaseDefenseGame.ts` (`kind`, missile/projectile systems)  
  Godot ref: single turret + simple projectile; **kill payout** uses web variant table + 1.45 × wave scale (`WaveScaling` + `CombatSystem`)

- [ ] AOE, splash, special interactions parity  
  Web ref: `src/game/BaseDefenseGame.ts`  
  Godot ref: missing

## 7) Economy / Power / Supply

- [-] Credits/supply/power full parity  
  Web ref: `src/App.tsx` state + `src/game/BaseDefenseGame.ts` resource update loops  
  Godot ref: **`WebParityDefs.RESET_RUN_*`** + power tick (CC gen only during wave) + per-shot power; **`power_cap`** = base + CC/turret **`powerCapAdd`** (prototype sums); **CC `creditPayout` / `creditIntervalSec`** during wave; kill mul **`balanceVars.asteroidKillCreditMul`**; **`supply_cap`** = CC base + sum of placed depot **`supplyCapAdd`** (**`supply_depot_s`** / **`supply_depot_l`**); **supply** gate; full **`updateResources`** / building catalog still partial; F3 diagnostics

- [-] Building economy production parity  
  Web ref: `src/game/BaseDefenseGame.ts` (`creditPayout`, intervals, drains)  
  Godot ref: **CC** + **`factory_business`** during wave (timer freezes at 0 power if draining); passive drain × **`POWER_DRAIN_GLOBAL_MUL`**; supply depots raise cap only (no payout); refineries / full building set TBD

## 8) Upgrades / Research

- [-] Full research graph parity + prerequisites + refundability  
  Web ref: `src/App.tsx`, `src/game/BaseDefenseGame.ts`, `UPGRADES`  
  Godot ref: 3 slots — **HUD + purchase cost** from **`parity_web_defs.json`** (×0.93); mapped ids `turret_targeting` / `unlock_factory` / `generator_efficiency`; **effects** still prototype; wave combat purchase guard preserved

- [ ] Hero research split parity  
  Web ref: `src/App.tsx` (normal vs hero research)  
  Godot ref: missing

## 9) Commander Systems

- [ ] Commander-specific building families and abilities  
  Web ref: `src/game/BaseDefenseGame.ts` (`HeroId` families)  
  Godot ref: missing

## 10) UI / HUD

- [-] Full HUD parity (**wave timer ring** done; discovery toast, wheel categories, stats cards pending)  
  Web ref: `src/App.tsx` JSX overlays  
  Godot ref: partial HUD; **inactive sell 100%** hint; **sandbox** banner when applicable; **Diff:** in gameplay bar during run

## 11) Audio

- [-] Audio event parity and music phase behavior  
  Web ref: `src/audio/gameAudioEngine.ts`, `src/audio/useGameAudio.ts`  
  Godot ref: **`AudioService`** — optional **`res://audio/sfx/`** (web OGG names) for **wave_start** / **wave_cleared** (edge-detected in **`_apply_wave_state`**), **build_place/sell**, **aoe_pop**, **emp_pulse**, **upgrade_purchase**, **asteroid_impact**, **asteroid_destroyed**; **`game_over.wav`** or fallback **`metal_impact.ogg`**; music phases / Howler-style master volume TBD

## 12) Score / Persistence

- [-] `computeRunScore` parity by difficulty multipliers  
  Web ref: `src/highScores.ts` (`computeRunScore`)  
  Godot ref: **`ScoreSystem.compute_run_score`** — web coefficients (wave×180, kills×12, money ±, power×0.08), **`difficulty_score_mul`**, **`power_produced`** (CC gross gen during wave combat); sandbox final score **0**; in-run **`game_difficulty`** defaults **hard** until UI exposes other modes

- [ ] Leaderboard persistence and ordering parity  
  Web ref: `src/highScores.ts` (`addScoreRecord`, sort/top rules)  
  Godot ref: best-score only

## 13) Module Refactor Tracker

- [-] `autoloads/GameState.gd` (created, phase + runtime sync wiring added; full state ownership pending)
- [-] `systems/InputSystem.gd` (created, action-map wiring moved)
- [-] `systems/CameraSystem.gd` (created, camera/look/world-targeting moved)
- [-] `systems/WaveSystem.gd` (spawn window + inactive + `startNextWave` parity core)
- [-] `systems/WaveScaling.gd` (difficulty + `toSpawn` + spawn interval + window duration helpers)
- [-] `systems/AsteroidSystem.gd` (created; movement/impact detection + variant scaffold moved)
- [-] `systems/BuildSystem.gd` (created; placement/sell target checks moved)
- [-] `systems/CombatSystem.gd` (created; target select + projectile step/hit orchestration moved)
- [-] `systems/UpgradeSystem.gd` (created; upgrade purchase + label generation moved)
- [-] `systems/EconomySystem.gd` (created; passive income + spend/income helpers moved)
- [-] `systems/CommanderSystem.gd` (created; commander ID validation/default hooks added)
- [-] `systems/ScoreSystem.gd` (created; run score calc + best-score persistence moved)
- [-] `ui/MainMenuController.gd` (created; visibility + hover/activate + virtual cursor motion moved)
- [-] `ui/PauseController.gd` (created; overlay visibility + pause-toggle helper moved)
- [-] `ui/GameOverController.gd` (created; overlay visibility + hint formatting moved)
- [-] `ui/HudController.gd` (created; HUD info/look/HP updates moved)

## 14) Data Extraction Progress

- [x] Web ID inventory generated (`docs/parity/WEB_DATA_INVENTORY.md`)  
  Source: `src/game/BaseDefenseGame.ts`
- [x] Godot **`WebParityDefs`** loads `godot/data/parity_web_defs.json` (72 buildings, 198 upgrades + `balanceVars`); extractor fixed so **BUILDINGS** slice ends at `UPGRADES_RAW` (no upgrade bleed). **Prototype** uses **`command_center.maxHp`** + **`auto_turret`** cost/range/damage/`fireRate`→cooldown from defs (`main.gd` + `WebParityDefs` helpers).
- [-] Upgrade **modifiers / refund / phase** parity — JSON has graph edges (`prereqIds`, `unlockBuildingIds`); full **UPGRADES** object graph + hero trees pending in Godot.

## 15) Audio Service Progress

- [-] AudioService API created and wired to build/sell/upgrade events
