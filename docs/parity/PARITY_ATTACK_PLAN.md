# Godot ↔ Web Parity Attack Plan

**Source of truth (frozen):** `src/game/BaseDefenseGame.ts`, `src/App.tsx`, `src/highScores.ts`, `src/audio/*`. **Port target:** `godot/` only — **do not edit web** for parity unless explicitly approved.

**Scale:** Web sim is ~10k lines (`BaseDefenseGame` + React shell). Godot is a **thin prototype** (`scripts/main.gd`, `systems/*.gd`, `autoloads/WebParityDefs.gd`, `data/parity_web_*.json`) growing toward behavioral parity.

---

## 1) High-level gap summary

| Area | Web (reference) | Godot (current) |
|------|-----------------|-----------------|
| **Runtime core** | `BaseDefenseGame`: `buildings[]`, `occupied` grid, per-building HP/mesh, shields, missiles, volleys, heroes, discovery, commander hooks | **CC mesh** + **`turrets[]`** + **`economy_buildings[]`** + **`supply_depots[]`** + **`nuclear_plants[]`**, **`asteroids[]`**, **`projectiles[]`**; no full catalog |
| **Build** | Full `BUILDINGS`, wheel, unlocks, `tryPlace` (credits, supply, bounds, padding) | **`auto_turret`** + **`factory_business`** + depots + **`nuclear_plant`** (research **N** → **`unlock_nuclear_plant`**); **B** cycles; supply gate; **no full unlock graph** |
| **Economy** | `updateResources`: power cap from batteries, CC + factory drains, payouts gated by wave + power | **CC** + **`factory_business`** + **`nuclear_plant`** gen ( **`credits > 0`** only ); passive drain × **`POWER_DRAIN_GLOBAL_MUL`**; **kill mul**; pylons / full loop TBD |
| **Combat** | `updateDefenses`: `kind` hitscan/missiles/ballistic/railgun/shield, `tryConsumeShotPower`, EMP | **Projectile stub** + per-shot power for prototype turret |
| **Waves** | `updateWave`, pools, hero/upgrade modifiers | **`WaveSystem`** + **`WaveScaling`** core math; **no hero modifiers** |
| **Meta** | Full `UPGRADES`, phase, refunds, `computeRunScore` | **U / I / O / N** research: labels + **×0.93** from **`parity_web_defs.json`**; prototype gameplay effects; menu **`GameDifficulty`**; **`computeRunScore`** + **`powerProduced`**; sandbox score **0** |
| **UI** | Rich HUD, wheel, research, gameover stats | Menu (**difficulty** dropdown) / pause / gameover + wave ring + **Fac / Dep / Nuc** counts + **Diff** + **sandbox** + **sell refund** hint + commander on gameover |
| **Audio** | `useGameAudio` / bus mix | **`AudioService`**: optional **`res://audio/game_over.wav`** + **`res://audio/sfx/*.ogg`**; **wave_start** / **wave_cleared** edges; combat/build/upgrade SFX hooks; music buses TBD |

### 1.1) Godot prototype snapshot (rolling)

Single place to see what the port **actually runs** today (see **§3** for checkbox detail):

- **Session:** menu → play → pause/gameover; **Sandbox**; **`start_run`** / **`end_run`** / **`go_to_menu`** on **`main.gd`**; teardown inside **`_start_new_run`**; **`WebParityDefs`** baselines each run.
- **Build (B):** turret; **I** → factory; **O** → depot S/L; **N** → nuclear plant (4×4); **B** cycles unlocked modes; sell RMB (100%/50% by inactive phase).
- **Combat:** projectile turret, per-shot power; kill credits **`balanceVars.asteroidKillCreditMul`** + wave scale + factory upgrade bonus; asteroid variants / AOE / EMP hooks (partial).
- **Economy:** CC + factory payouts (wave only, factory starves at 0 power if draining); **nuclear** gen only if **`credits > 0`**; supply cap CC + depots; **`POWER_DRAIN_GLOBAL_MUL`** on economy passive + shots.
- **Waves:** **`WaveSystem`** + **`WaveScaling`** (difficulty from menu); timer ring; F3 diagnostics.
- **Score:** web **`computeRunScore`** coefficients + difficulty mul; **`power_produced`** tracks gross gen.
- **Data:** **`parity_web_defs.json`** + **`WebParityDefs`** readers (**`read_building_footprint`**, etc.); research **`prereqIds`** for the four slots; **`balanceVars`** keys present (often **1** — extractor bakes **`VARS.C/P/S/E`** into building numbers).

---

## 2) Rules of engagement

- [ ] No new Godot gameplay logic without a matching checkbox in **§3** (or add the checkbox first).
- [ ] Each merged slice: note evidence per **`VALIDATION_PROTOCOL.md`**.
- [ ] Prefer small commits; grow **`systems/*`** and autoloads; shrink **`main.gd`** over time.
- [ ] Document **approved intentional differences** in **`ARCHITECTURE_TARGET.md`** / Phase F.

---

## 3) Master parity checklist (comprehensive)

Checkboxes track **Godot** work unless marked *(web only)*.

### A — Architecture & orchestration

- [x] A.1 Baseline prototype frozen; parity docs present (`PARITY_TRACKER.md`, `ARCHITECTURE_TARGET.md`, `VALIDATION_PROTOCOL.md`).
- [-] A.2 **`GameState`** owns run scalars and mutators; **`main.gd`** delegates (thin controller). **Partial:** **`_sync_game_state_runtime`** mirrors wave/resources/upgrades (incl. **N**); **`main`** still owns sim loops and placement.
- [x] A.3 Single **`start_run` / `end_run` / `go_to_menu`** API on **`main.gd`** (menu/gameover/start + CC defeat/dev shortcut). Pause **PLAYING ↔ PAUSED** still **`apply_phase`**.
- [x] A.4 Headless / editor smoke documented (**Appendix A**).
- [x] A.5 **`dev/HeadlessSmoke.tscn`** — asserts **`WebParityDefs.ok`**, exits 0.
- [ ] A.6 Optional: CI job runs extract + Godot smoke on PR.

### B — Data pipeline (TS → JSON → Godot)

- [x] B.1 **`WEB_DATA_INVENTORY.md`**, **`parity_web_manifest.json`**, **`parity_web_defs.json`** (BUILDINGS slice ends before upgrades raw).
- [ ] B.2 Robust extractor (AST/parser); retire brittle regex where possible.
- [ ] B.3 **`npm run`** / CI check: regenerate defs + diff gate.
- [ ] B.4 Extract full **upgrade `modifiers`**, phase, refund rules, hero gates.
- [x] B.5 **`WebParityDefs`**: `buildings_by_id`, `upgrades_by_id`, **`balanceVars`**.
- [x] B.6 Prototype readers: **`command_center`** + **`auto_turret`** + **`factory_business`** + depots + **`nuclear_plant`** (+ **CC creditPayout/interval**, costs, footprints, power fields).
- [x] B.7 Mirror **`getDifficultyScale` / `GameDifficulty`** tables beyond current presets. **`WaveScaling.difficulty_scale`** + related helpers cover **easy → deadly**; **`balanceVars`** in JSON are typically **1** (building stats pre-baked from **`VARS`** in extract).
- [ ] B.8 **`HeroId`**: building allowlists + unlock rules in data + loader.

### C — Session, lifecycle, defeat

- [-] C.1 **`resetRun` scalars**: credits, power cap/stored, supply; **CC maxHp** from defs; power/econ only during **`wave_combat_active`** (web **`waveInProgress`**); inactive power clamp.
- [-] C.2 **Teardown on new run**: clear turrets/**economy/factory**/depots/**nuclear**/asteroids/projectiles/pool/CC; **`_parity_apply_building_baseline`** each start; **`_sync_game_state_runtime`**; extend when missiles/shields exist.
- [-] C.3 **Defeat**: CC HP ≤ 0 → game over; verify **impact + AOE** paths.
- [-] C.4 **`game_over`** optional **`AudioStreamPlayer`** clip at **`res://audio/game_over.wav`**; full bus mix / catalog TBD.
- [-] C.5 **Gameover UI**: waves survived, stats grid, commander, leaderboard hooks. **Partial:** hint line includes **commander** id; full stats grid / leaderboard TBD.
- [-] C.6 **Sandbox**: **Sandbox** menu run sets flag; **no `save_best_score`** on game over; HUD + gameover copy; **Play Again** keeps sandbox/normal mode.

### D — Input, camera, shell UX

- [x] D.1 **InputSystem** / **CameraSystem**; fullscreen + capture.
- [ ] D.2 Pointer lock loss/recovery vs **`App.tsx`**.
- [ ] D.3 Virtual cursor menu hit testing parity (`pickMenuHitTarget` analog).
- [ ] D.4 **Build wheel**, research overlay, shortcuts.
- [ ] D.5 Camera clamps & sensitivity vs web **`updateCamera`**.
- [x] D.6 Menu / pause / gameover controllers (polish ongoing). Includes **Difficulty** **`OptionButton`** (**`GameDifficulty`**).

### E — Build, grid, sell

- [x] E.1 **BuildSystem**: snap, footprint, occupancy, sell pick.
- [x] E.2 Block build/sell during wave combat / cleanup (after first wave).
- [x] E.3 **Footprint from defs**: **`WebParityDefs.read_building_footprint`** + prototype building readers (**`auto_turret`** / factory / depots / nuclear); future **`BuildingId`** use same helper.
- [-] E.4 **Supply** gate + sell returns **`build_supply_cost`**; **unlock** graph missing.
- [-] E.5 Sell refund **100% / 50%** by inactive phase; **`build_credit_cost`** per placement.
- [-] E.6 Refund affordance UI (inactive-only hints). **Partial:** gameplay bar shows **100% sell** hint during inactive between waves.
- [ ] E.7 Drag build/sell timing vs web.

### F — Waves & asteroids

- [x] F.1 **WaveSystem** intermission + spawn window + **`toSpawn`** / intervals (**`WaveScaling`**).
- [x] F.2 First wave manual; inactive **60s**; **`waveReady`**; Space early-start.
- [x] F.3 Wave timer **ring** + captions (**`WaveTimerRing`**).
- [-] F.4 Hero/upgrade wave pool modifiers.
- [x] F.5 **AsteroidSystem** + variants hook + scaling.
- [ ] F.6 Variant behaviors: splitter/explosive/meteor/seeker/planet/gold/spawner/emp/colossus tuning parity.
- [ ] F.7 Movement: seeker steering, pulsar slow, stasis, radar mark.
- [-] F.8 Impact radius/damage; CC distance vs web grid.
- [ ] F.9 Discovery toast / reveal rules.

### G — Combat & weapons

- [x] G.1 **CombatSystem** + projectile step + kill payout hook.
- [x] G.2 Kill reward uses **`balanceVars.asteroidKillCreditMul`** (+ wave scale + **`kill_credit_bonus`** from factory research).
- [ ] G.3 Weapon **`kind`**: hitscan (instant), missiles, ballistic, railgun, shield.
- [ ] G.4 Missiles: lock, modes, volleys, splash.
- [ ] G.5 Ballistics/railgun charge; AOE hits; **`auraDamagePerSec`**; **`shotCreditCost`**.
- [ ] G.6 Shields: bubble, interception, upkeep/regen power.
- [ ] G.7 Turret aim rigs (yaw/pitch/muzzle) vs web meshes.
- [-] G.8 **Per-shot power** (`tryConsumeShotPower` analog); turret freeze at 0 stored; **passive drain** for **`factory_business`** (× **`POWER_DRAIN_GLOBAL_MUL`**) in power tick; shields / full **`getPassivePowerDrainPerSec`** TBD.

### H — Economy & resources (sim)

- [x] H.1 **EconomySystem** helpers (`add_income` / `spend`).
- [-] H.2 **CC credits**: **`creditPayout` / `creditIntervalSec`** from defs, **only during wave combat** (replaces generic passive tick).
- [-] H.3 **Factory / refinery** payouts + **`powerDrainPerSec`** starvation (web **`updateResources`** loop). **Partial:** **`factory_business`** place/sell, wave-only **`creditPayout`/`creditIntervalSec`**, timer freeze + no payout at 0 power; **B** after **I**; refineries TBD.
- [-] H.4 **Power cap** recomputed: **`RESET_RUN_POWER_CAP`** + CC + turret + factory + **`nuclear_plant`** **`powerCapAdd`** counts; clamp **`power_stored`** on place/sell/new run.
- [-] H.5 **Supply**: cap from CC **`supplyCapAdd`**; **`supply_depot_s`** / **`supply_depot_l`** add **`supplyCapAdd`** via **`_recompute_supply_cap()`**; place/sell + occupancy + **B** cycles **`depot_s` → `depot_l`** after **O**; **mk2** depots TBD.
- [x] H.6 **`POWER_DRAIN_GLOBAL_MUL`** on **economy passive drain** + **shot costs**; nuclear has **no** passive drain in prototype.
- [-] H.7 Nuclear plant “no credits → no gen” rule; Kingpin/Jupiter economy hooks. **Partial:** **`nuclear_plant`** place/sell, **`powerGenPerSec`** in power tick only when **`credits > 0`**; research **N** (`unlock_nuclear_plant`, ×0.93); no credit upkeep / mk2 / silo TBD.

### I — Upgrades, research, commanders

- [x] I.1 **UpgradeSystem** placeholder + **U / I / O / N** keys (**`buy_upgrade_*`** + **`InputSystem`**).
- [-] I.2 Full graph: costs, prereqs, phase, refund, **`getEffectiveDef`** modifiers. **Partial:** purchase costs + HUD lines from **`parity_web_defs.json`** (web ×0.93); slots U/I/O/N → ids in **`UpgradeSystem`**; **`prereqIds`** enforced via **`WebParityDefs.prototype_upgrade_prereqs_satisfied`** (unmapped nodes satisfied by their JSON chain — e.g. **N** requires **O** through **`unlock_grid_expansion`**); phase/refund/modifiers TBD; gameplay effects not web-identical.
- [x] I.3 **CommanderSystem** scaffold + menu selection string.
- [ ] I.4 Commander-specific sim + UI (each **`HeroId`**).

### J — UI / HUD

- [-] J.1 Gameplay info: credits, CC HP, wave, spawn line, **P/S**, **`waveReady`**, **Diff** (from menu **`GameDifficulty`**).
- [ ] J.2 Discovery / toast / wheel categories / stats cards.
- [-] J.3 Research panel driven by **`upgrades`** JSON (labels/descriptions + discounted costs for **four** lines U/I/O/N); **`prototype_research_prereq_hint`** suffix when locked; full tree UI TBD.

### K — Audio

- [-] K.1 **AudioService** API + call sites; **`game_over`** optional one-shot clip.
- [-] K.2 Map web events 1:1 + buses + assets. **Partial:** **`emit_event`** + optional **`godot/audio/sfx/`** (web filenames); **wave_start** / **wave_cleared** on **`wave_combat_active`** edges via **`_apply_wave_state`**; combat/build/upgrade/impact SFX; **game_over** fallback **`metal_impact.ogg`**; music / master bus parity TBD.

### L — Score, persistence, validation

- [x] L.1 **ScoreSystem** simplified + best score file.
- [-] L.2 **`highScores.ts`** `computeRunScore` parity + difficulty multipliers. **Partial:** same coefficients + **`powerProduced`** + easy/medium/hard/brutal/deadly mul; main menu **`OptionButton`** sets **`game_difficulty`** (waves + score); commander boards / full record shape TBD.
- [ ] L.3 Leaderboard ordering + persistence parity.
- [ ] L.4 Full **`PARITY_TRACKER.md`** matrix pass.
- [ ] L.5 Document **approved intentional differences** + release milestone tag.

---

## 4) Delivery checklist (each PR)

- [ ] Update **`PARITY_TRACKER.md`** for touched rows.
- [ ] Note validation evidence (commands, scenario).
- [ ] **`git commit`** + **`push`** branch **`migration/godot`**.

---

## Appendix A — Godot smoke / headless

From repo **`space-ship`** with **Godot 4.x** on `PATH`:

1. **Editor load:** `godot --path godot` — no script errors in Output / stderr.
2. **Headless main:** `godot --path godot --headless` — stop with timeout; scan for `SCRIPT ERROR` / `Parse Error`.
3. **Defs smoke:** `godot --path godot --headless res://dev/HeadlessSmoke.tscn` — exit **0** if **`WebParityDefs.ok`**.
4. **Regenerate data:** `node scripts/parity/extract_web_defs.mjs` after TS changes.

**Optional assets (C.4 / K.1 / K.2):** `godot/audio/game_over.wav` for defeat; copy web **`public/audio/sfx/*.ogg`** → **`godot/audio/sfx/`** for build/emp/AOE/upgrades/lasers/impacts (see **`AudioService.gd`** map).

---

## Appendix B — Quick file map

| Area | Web | Godot |
|------|-----|--------|
| Core sim | `src/game/BaseDefenseGame.ts` | `godot/scripts/main.gd`, `godot/systems/*.gd`, `godot/autoloads/GameState.gd` (synced mirror) |
| UI / phases | `src/App.tsx` | `godot/scripts/main.gd`, `godot/ui/*.gd` |
| Score | `src/highScores.ts` | `godot/systems/ScoreSystem.gd` |
| Audio | `src/audio/*` | `godot/autoloads/AudioService.gd` |
| Parity data | (generated) | `godot/data/parity_web_*.json`, `WebParityDefs.gd` |
