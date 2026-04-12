# Godot ↔ Web Parity Attack Plan

**Source of truth:** web only — `src/game/BaseDefenseGame.ts`, `src/App.tsx`, `src/highScores.ts`, `src/audio/*`. **Godot** (`godot/`) is the port target; **do not change web** for parity unless explicitly approved.

**Scale:** Web sim is ~10k lines with full building/upgrades/power/supply/heroes/combat. Godot is a **thin prototype** (`main.gd` + `systems/*` + `WebParityDefs`) gradually absorbing web behavior.

---

## Live gap summary (web vs Godot)

| Area | Web (reference) | Godot (current) |
|------|-----------------|-----------------|
| **State** | `BaseDefenseGame` + `App` state: credits, power, supply, buildings[], occupied grid, shields, missiles, heroes | Credits, CC HP, wave timers, turrets, asteroids, projectiles; **power**: CC gen during wave; **turret** draw via **`tryConsumeShotPower`** (not passive tick); inactive clamp to cap; **supply** from defs; **no full catalog** |
| **Build** | Full `BUILDINGS`, wheel, unlocks, multi-cell; **supply** at place; **no power check** at place (web `tryPlace`) | **auto_turret** prototype; **supply** build gate; placement **not** blocked by power (matches web) |
| **Combat** | Per-weapon `kind`, missiles, ballistics, railgun, shields, AOE layers | Hitscan-style projectile stub; **no weapon kinds** |
| **Waves** | `updateWave`, `startNextWave`, variant pools, hero modifiers | `WaveSystem` + `WaveScaling` aligned on core formulas; **no hero wave modifiers** |
| **Economy** | `updateResources`, building payouts, drains | Passive credits tick; **kill credits** partially aligned; **no building economy** |
| **Upgrades** | Full `UPGRADES` graph, phase, refunds | Three placeholder upgrades; JSON lists upgrades, **not driven by defs** |
| **UI / flow** | Rich HUD, wheel, research, gameover stats + leaderboard hooks | Menu/pause/gameover + wave ring + research panel; **simpler gameover** |
| **Audio** | `useGameAudio` / engine events | `AudioService` stub (**events no-op** until bus/assets) |

---

## Rules of engagement

- [ ] No new Godot gameplay logic without a mapped checkbox below (or add a checkbox first).
- [ ] Each merged slice includes **validation evidence** (see `VALIDATION_PROTOCOL.md`).
- [ ] Prefer **small commits**; grow `systems/*` and autoloads, shrink `main.gd` over time.
- [ ] Any intentional difference vs web must be **documented and approved** (see Phase F).

---

## Phase A — Architecture & tooling

- [x] A.0.1 Freeze Godot prototype as baseline reference.
- [x] A.0.2 Parity tracker (`PARITY_TRACKER.md`).
- [x] A.0.3 Target architecture (`ARCHITECTURE_TARGET.md`).
- [x] A.0.4 Validation protocol (`VALIDATION_PROTOCOL.md`).
- [ ] A.1.1 Move run orchestration from `main.gd` into **`GameState`** mutators (credits, wave, phase, HP).
- [ ] A.1.2 Single entry to start/pause/end run (mirror web `startNewRun` / phase transitions).
- [x] A.2.1 Document Godot **smoke / headless** steps (see **Appendix A** below).
- [x] A.2.2 Optional: scripted scene that asserts invariants (defs loaded) and calls `get_tree().quit(0)` — `dev/HeadlessSmoke.tscn` (see Appendix A).

---

## Phase B — Data pipeline & consumption

### B.1 Extractors (Node scripts → `godot/data/`)

- [x] B.1.1 Inventory script → `WEB_DATA_INVENTORY.md`.
- [x] B.1.2 ID manifest → `parity_web_manifest.json`.
- [x] B.1.3 Structured defs → `parity_web_defs.json` (**BUILDINGS** slice ends before `UPGRADES_RAW`).
- [ ] B.1.4 Harden extractors (AST or parser; avoid brittle regex on TS).
- [ ] B.1.5 CI / `npm run` check mode for `extract_web_defs.mjs`.
- [ ] B.1.6 Extract **upgrade `modifiers`** (and other nested fields) into JSON for B.2.2.

### B.2 Godot runtime data

- [x] B.2.1 **`WebParityDefs` autoload**: load JSON, `buildings_by_id` / `upgrades_by_id`, `balanceVars`.
- [x] B.2.2a Prototype combat/build stats from **`command_center`** + **`auto_turret`** (`maxHp`, `creditCost`, `range`, `damage`, `fireRate`→cooldown).
- [x] B.2.2b **`auto_turret.size` {w,h}** → placement footprint in `BuildSystem` (rectangular cells).
- [-] B.2.3 **UPGRADES** in JSON: ids, costs (×0.93), prereqs, unlocks, descriptions; **modifiers / phase / refund** not fully extracted.
- [ ] B.2.4 Godot **research UI** driven by `upgrades` data (graph, buy/refund).
- [ ] B.2.5 **`getDifficultyScale` / `GameDifficulty`** tables mirrored (beyond current `WaveScaling` presets).
- [ ] B.2.6 **HeroId**: per-hero building subsets + unlock rules in Godot.

---

## Phase C — Simulation parity

### C.1 Session / lifecycle

- [-] C.1.1 **Starting credits** + **power/supply defaults** from `WebParityDefs` (`RESET_RUN_*` = web `resetRun()`); **CC max HP** from defs; **power** gen/drain only while **`wave_combat_active`** (web `waveInProgress`); inactive: clamp stored to cap; **supply** build gate; **no power-at-place** (web parity).
- [-] C.1.2 Clear **all** runtime arrays on new run (mirrors web `resetRun`: buildings, missiles, shields, timers, discovery, …). **Prototype:** `_clear_entities` wipes turrets/asteroids/projectiles/pool + CC; **`_parity_apply_building_baseline`** each **`_start_new_run`**; **`_sync_game_state_runtime`** before play; missiles/shields/discovery N/A until ported.
- [-] C.1.3 **Defeat:** CC HP ≤ 0 → finalize score, **game over phase**; **all damage paths** (impact + AOE to CC) must trigger defeat.
- [ ] C.1.4 **Audio** event on defeat (web `gameOver`); Godot `AudioService.emit_event("game_over")` **wired when buses exist**.
- [ ] C.1.5 **Gameover UI**: waves survived, stats grid, commander, leaderboard hooks (mirror `App.tsx` snapshot).
- [ ] C.1.6 **Sandbox** flag and “score not saved” behavior.

### C.2 Waves

- [x] C.2.1 `WaveSystem` tick + intermission.
- [x] C.2.2 First wave manual (`first_wave_started`).
- [x] C.2.3 Spawn window elapsed/duration/ended + HUD + **ring** (`WaveTimerRing`).
- [-] C.2.4 `toSpawn` + intervals in `WaveScaling`; **hero/upgrade** wave pool modifiers missing.
- [x] C.2.5 Inactive 60s + ring fill `inactiveTimeLeftSec / duration`.
- [x] C.2.6 `waveReady`, Space early-start, auto-start at 0.

### C.3 Asteroids

- [x] C.3.1 `AsteroidSystem` + variant hooks.
- [ ] C.3.2 Full behaviors: splitter/explosive/meteor/seeker/planet/gold/spawner/emp/colossus **match web tuning**.
- [ ] C.3.3 Movement: seeker steering, pulsar slow, stasis, radar mark.
- [-] C.3.4 Impact radius/damage per variant; **CC distance** still approximate vs web grid.
- [ ] C.3.5 Discovery toast / reveal rules.

### C.4 Build / placement / sell

- [x] C.4.1 `BuildSystem` + sell pick.
- [x] C.4.2 Block build/sell during active wave (`wave_combat_active` / cleanup).
- [-] C.4.3 Multi-cell **footprint** for prototype turret from defs; **all** `BuildingId` sizes later.
- [-] C.4.4 **Supply** build gate + sell returns **supply** (stored `build_supply_cost`); **unlocks** still missing; **power**: web does **not** gate placement — Godot matches; grid bounds as before.
- [-] C.4.5 Sell refund 100% / 50% by inactive phase; **per-placement** `build_credit_cost` on each turret (web `creditCost` at build time); **multiple building types** still future work.
- [ ] C.4.6 Refund affordance UI (inactive-only hints).
- [ ] C.4.7 Pointer drag build/sell timing vs web.

### C.5 Combat

- [x] C.5.1 `CombatSystem` + projectiles (stub).
- [ ] C.5.2 Weapon **`kind`** branches: hitscan, missiles, ballistic, shield, railgun.
- [ ] C.5.3 Missiles: lock, modes, volleys, splash.
- [ ] C.5.4 Ballistics/railgun; AOE; `auraDamagePerSec`; `shotCreditCost`.
- [ ] C.5.5 Shields: bubble, upkeep, regen power.
- [ ] C.5.6 Turret aim rigs (yaw/pitch/muzzle).

### C.6 Economy / power / supply

- [x] C.6.1 `EconomySystem` passive helper.
- [-] C.6.2 Kill credits (combat-only); **logistics bonus** still simplified.
- [-] C.6.3 Power cap, stored, generation, drain — **tick only while `wave_combat_active`**: CC **`powerGenPerSec`** (passive); turrets **`category === 'turrets'`** → **no passive drain** on web — Godot: **`_try_consume_shot_power`** per shot (`powerDrainPerSec × POWER_DRAIN_GLOBAL_MUL`); turret **pause** if `stored ≤ 0`; full **`getPassivePowerDrainPerSec`** / factories / shields still missing.
- [-] C.6.4 Supply cap / `supplyUsed` / per-building costs — **enforced** for prototype turret (`supply_used` + `auto_turret.supplyCost`); cap from **CC `supplyCapAdd`**; depots / dynamic cap still missing.
- [ ] C.6.5 Building `creditPayout` / intervals.
- [ ] C.6.6 **`updateResources`** parity (modifiers, difficulty).

### C.7 Hero / support systems

- [ ] C.7.1 Repair bay, fabrication, reconstruction yard.
- [ ] C.7.2 Commander-specific: Archangel, Dominion, Nova, Citadel, Jupiter, Kingpin, …

---

## Phase D — Input, camera, UX

- [x] D.1 `InputSystem` / `CameraSystem`; fullscreen + capture.
- [ ] D.2 Pointer lock loss/recovery parity.
- [ ] D.3 Virtual cursor menu hit testing (`pickMenuHitTarget`).
- [ ] D.4 Build wheel / upgrade / research overlays + shortcuts.
- [ ] D.5 Camera clamps & sensitivity vs web `updateCamera`.
- [x] D.6 Menu / pause / gameover controllers (polish ongoing).

---

## Phase E — Meta (score, audio, commanders)

- [x] E.1 `UpgradeSystem` placeholder.
- [ ] E.2 Full upgrade purchase/refund/prereq/phase.
- [x] E.3 `CommanderSystem` scaffold.
- [ ] E.4 Commander-specific content in sim + UI.
- [x] E.5 `ScoreSystem` simplified.
- [ ] E.6 **`highScores.ts`** `computeRunScore` parity + difficulty multipliers.
- [ ] E.7 Leaderboard persistence/ordering.
- [x] E.8 `AudioService` API (stub).
- [ ] E.9 Map web audio events 1:1 + assets/buses.

---

## Phase F — Validation & cutover

- [ ] F.1 Run full matrix (`PARITY_TRACKER.md` §1–15).
- [ ] F.2 Document **approved intentional differences**.
- [ ] F.3 Performance, save/load, export smoke test.
- [ ] F.4 Release milestone tag when critical subset is `[x]`.

---

## Delivery checklist (each iteration)

- [ ] Update `PARITY_TRACKER.md` for touched rows.
- [ ] Note evidence (command log, scenario, screenshot).
- [ ] Respect `ARCHITECTURE_TARGET.md` boundaries.
- [ ] Git commit + push (`migration/godot`).

---

## Appendix A — Godot smoke / headless (A.2.1)

From repo **`space-ship`** with **Godot 4.x** on `PATH`:

1. **Editor load:** `godot --path godot` — project must open without script errors (check Output / stderr).
2. **Headless run:** `godot --path godot --headless` — runs `run/main_scene` with no window; stop with Ctrl+C or wrap in a timeout (e.g. `timeout 8 godot ...` on Linux, or PowerShell `Wait-Process` with a limit). Scan stderr for `SCRIPT ERROR` / `Parse Error`.
3. **Defs smoke (A.2.2):** `godot --path godot --headless res://dev/HeadlessSmoke.tscn` — loads autoloads, asserts `WebParityDefs.ok`, exits **0** on success (**1** if JSON missing/empty). Check `%ERRORLEVEL%` / `$LASTEXITCODE`.
4. **Data:** After TS changes, run `node scripts/parity/extract_web_defs.mjs` so `godot/data/parity_web_defs.json` stays current.

---

## Quick reference: source files

| Area | Web | Godot |
|------|-----|--------|
| Core sim | `src/game/BaseDefenseGame.ts` | `godot/scripts/main.gd` + `godot/systems/*.gd` |
| UI / phases | `src/App.tsx` | `godot/scripts/main.gd` + `godot/ui/*.gd` |
| Score | `src/highScores.ts` | `godot/systems/ScoreSystem.gd` |
| Audio | `src/audio/*`, `useGameAudio` | `godot/autoloads/AudioService.gd` |
| Parity data | (generated from TS) | `godot/data/parity_web_*.json`, `WebParityDefs.gd` |
