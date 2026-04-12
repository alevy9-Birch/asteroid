# Godot ↔ Web Parity Attack Plan

**Source of truth (frozen):** `src/game/BaseDefenseGame.ts`, `src/App.tsx`, `src/highScores.ts`, `src/audio/*`. **Port target:** `godot/` only — **do not edit web** for parity unless explicitly approved.

**Scale:** Web sim is ~10k lines (`BaseDefenseGame` + React shell). Godot is a **thin prototype** (`scripts/main.gd`, `systems/*.gd`, `autoloads/WebParityDefs.gd`, `data/parity_web_*.json`) growing toward behavioral parity.

---

## 1) High-level gap summary

| Area | Web (reference) | Godot (current) |
|------|-----------------|-----------------|
| **Runtime core** | `BaseDefenseGame`: `buildings[]`, `occupied` grid, per-building HP/mesh, shields, missiles, volleys, heroes, discovery, commander hooks | **Single CC mesh** + **`turrets[]`**, **`asteroids[]`**, **`projectiles[]`**; no full building catalog |
| **Build** | Full `BUILDINGS`, wheel, unlocks, `tryPlace` (credits, supply, bounds, padding) | **`auto_turret`** + **`BuildSystem`** footprint; supply gate; **no unlock graph** |
| **Economy** | `updateResources`: power cap from batteries, CC + factory drains, payouts gated by wave + power | **CC `powerGenPerSec`**, **CC `creditPayout`/`creditIntervalSec` during wave**; **kill credits** use **`balanceVars.asteroidKillCreditMul`**; no factories / nuclear / pylons |
| **Combat** | `updateDefenses`: `kind` hitscan/missiles/ballistic/railgun/shield, `tryConsumeShotPower`, EMP | **Projectile stub** + per-shot power for prototype turret |
| **Waves** | `updateWave`, pools, hero/upgrade modifiers | **`WaveSystem`** + **`WaveScaling`** core math; **no hero modifiers** |
| **Meta** | Full `UPGRADES`, phase, refunds, `computeRunScore` | **3 placeholder upgrades**; simplified **`ScoreSystem`** |
| **UI** | Rich HUD, wheel, research, gameover stats | Menu / pause / gameover + wave ring + compact HUD |
| **Audio** | `useGameAudio` / bus mix | **`AudioService`** stub |

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
- [ ] A.2 **`GameState`** owns run scalars and mutators; **`main.gd`** delegates (thin controller).
- [ ] A.3 Single **`start_run` / `end_run` / `go_to_menu`** API mirroring web phase transitions.
- [x] A.4 Headless / editor smoke documented (**Appendix A**).
- [x] A.5 **`dev/HeadlessSmoke.tscn`** — asserts **`WebParityDefs.ok`**, exits 0.
- [ ] A.6 Optional: CI job runs extract + Godot smoke on PR.

### B — Data pipeline (TS → JSON → Godot)

- [x] B.1 **`WEB_DATA_INVENTORY.md`**, **`parity_web_manifest.json`**, **`parity_web_defs.json`** (BUILDINGS slice ends before upgrades raw).
- [ ] B.2 Robust extractor (AST/parser); retire brittle regex where possible.
- [ ] B.3 **`npm run`** / CI check: regenerate defs + diff gate.
- [ ] B.4 Extract full **upgrade `modifiers`**, phase, refund rules, hero gates.
- [x] B.5 **`WebParityDefs`**: `buildings_by_id`, `upgrades_by_id`, **`balanceVars`**.
- [x] B.6 Prototype readers: **`command_center`** + **`auto_turret`** (HP, costs, range, damage, fireRate→cooldown, footprint, supply, power gen/drain, **CC creditPayout/interval**).
- [ ] B.7 Mirror **`getDifficultyScale` / `GameDifficulty`** tables beyond current presets.
- [ ] B.8 **`HeroId`**: building allowlists + unlock rules in data + loader.

### C — Session, lifecycle, defeat

- [-] C.1 **`resetRun` scalars**: credits, power cap/stored, supply; **CC maxHp** from defs; power/econ only during **`wave_combat_active`** (web **`waveInProgress`**); inactive power clamp.
- [-] C.2 **Teardown on new run**: clear turrets/asteroids/projectiles/pool/CC; **`_parity_apply_building_baseline`** each start; **`_sync_game_state_runtime`**; extend when missiles/shields exist.
- [-] C.3 **Defeat**: CC HP ≤ 0 → game over; verify **impact + AOE** paths.
- [ ] C.4 **`game_over`** audio wired to real buses.
- [ ] C.5 **Gameover UI**: waves survived, stats grid, commander, leaderboard hooks.
- [ ] C.6 **Sandbox**: flag + “score not saved” behavior.

### D — Input, camera, shell UX

- [x] D.1 **InputSystem** / **CameraSystem**; fullscreen + capture.
- [ ] D.2 Pointer lock loss/recovery vs **`App.tsx`**.
- [ ] D.3 Virtual cursor menu hit testing parity (`pickMenuHitTarget` analog).
- [ ] D.4 **Build wheel**, research overlay, shortcuts.
- [ ] D.5 Camera clamps & sensitivity vs web **`updateCamera`**.
- [x] D.6 Menu / pause / gameover controllers (polish ongoing).

### E — Build, grid, sell

- [x] E.1 **BuildSystem**: snap, footprint, occupancy, sell pick.
- [x] E.2 Block build/sell during wave combat / cleanup (after first wave).
- [-] E.3 **Footprint from defs** for prototype turret; generalize to all **`BuildingId`** sizes.
- [-] E.4 **Supply** gate + sell returns **`build_supply_cost`**; **unlock** graph missing.
- [-] E.5 Sell refund **100% / 50%** by inactive phase; **`build_credit_cost`** per placement.
- [ ] E.6 Refund affordance UI (inactive-only hints).
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
- [-] G.2 Kill reward uses **`balanceVars.asteroidKillCreditMul`** (+ wave scale + upgrade flat bonus).
- [ ] G.3 Weapon **`kind`**: hitscan (instant), missiles, ballistic, railgun, shield.
- [ ] G.4 Missiles: lock, modes, volleys, splash.
- [ ] G.5 Ballistics/railgun charge; AOE hits; **`auraDamagePerSec`**; **`shotCreditCost`**.
- [ ] G.6 Shields: bubble, interception, upkeep/regen power.
- [ ] G.7 Turret aim rigs (yaw/pitch/muzzle) vs web meshes.
- [-] G.8 **Per-shot power** (`tryConsumeShotPower` analog); turret freeze at 0 stored; **passive drain** for factories/shields/CC-only gen in tick.

### H — Economy & resources (sim)

- [x] H.1 **EconomySystem** helpers (`add_income` / `spend`).
- [-] H.2 **CC credits**: **`creditPayout` / `creditIntervalSec`** from defs, **only during wave combat** (replaces generic passive tick).
- [ ] H.3 **Factory / refinery** payouts + **`powerDrainPerSec`** starvation (web **`updateResources`** loop).
- [ ] H.4 **Power cap** from **`powerCapAdd`** buildings + batteries; not just **`RESET_RUN_POWER_CAP`**.
- [-] H.5 **Supply**: cap from CC **`supplyCapAdd`**; depots increase cap dynamically.
- [ ] H.6 **`POWER_DRAIN_GLOBAL_MUL`** on all passive drains + shot costs (verify every path).
- [ ] H.7 Nuclear plant “no credits → no gen” rule; Kingpin/Jupiter economy hooks.

### I — Upgrades, research, commanders

- [x] I.1 **UpgradeSystem** placeholder + 3 keys.
- [ ] I.2 Full graph: costs, prereqs, phase, refund, **`getEffectiveDef`** modifiers.
- [x] I.3 **CommanderSystem** scaffold + menu selection string.
- [ ] I.4 Commander-specific sim + UI (each **`HeroId`**).

### J — UI / HUD

- [-] J.1 Gameplay info: credits, CC HP, wave, spawn line, **P/S**, **`waveReady`**.
- [ ] J.2 Discovery / toast / wheel categories / stats cards.
- [ ] J.3 Research panel driven by **`upgrades`** JSON (not hard-coded labels).

### K — Audio

- [x] K.1 **AudioService** API + call sites stubbed.
- [ ] K.2 Map web events 1:1 + buses + assets.

### L — Score, persistence, validation

- [x] L.1 **ScoreSystem** simplified + best score file.
- [ ] L.2 **`highScores.ts`** `computeRunScore` parity + difficulty multipliers.
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

---

## Appendix B — Quick file map

| Area | Web | Godot |
|------|-----|--------|
| Core sim | `src/game/BaseDefenseGame.ts` | `godot/scripts/main.gd`, `godot/systems/*.gd` |
| UI / phases | `src/App.tsx` | `godot/scripts/main.gd`, `godot/ui/*.gd` |
| Score | `src/highScores.ts` | `godot/systems/ScoreSystem.gd` |
| Audio | `src/audio/*` | `godot/autoloads/AudioService.gd` |
| Parity data | (generated) | `godot/data/parity_web_*.json`, `WebParityDefs.gd` |
