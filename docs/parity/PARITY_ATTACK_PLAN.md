# Godot ↔ Web Parity Attack Plan

Execution contract: **the web game is the source of truth** (`src/game/BaseDefenseGame.ts`, `src/App.tsx`, `src/highScores.ts`, `src/audio/*`). **Only the Godot project is changed** for parity unless you explicitly approve a web fix.

**Primary web surface area:** ~9.9k-line simulation + building catalog in `BaseDefenseGame.ts` (dozens of `BuildingId` types, power/supply/shields, full combat kinds, hero commanders, waves with spawn windows + inactive phases). **Godot today:** simplified prototype in `godot/scripts/main.gd` plus extracted `godot/systems/*` (single “turret” defense, flat upgrades, partial asteroid variants).

---

## Rules of engagement

- [ ] No new Godot gameplay logic without a mapped checkbox below (or add a checkbox first).
- [ ] Each merged slice includes **validation evidence** (see `VALIDATION_PROTOCOL.md`).
- [ ] Prefer **small commits**; keep extending modular systems, not `main.gd` monolith growth.
- [ ] Any intentional difference vs web must be **documented and approved**.

---

## Phase A — Baseline, architecture, tracking

- [x] Freeze Godot prototype as baseline reference.
- [x] Parity tracker with feature categories (`PARITY_TRACKER.md`).
- [x] Target architecture (`ARCHITECTURE_TARGET.md`).
- [x] Validation protocol (`VALIDATION_PROTOCOL.md`).
- [ ] **A.1** Move remaining orchestration out of `main.gd` into `GameState` ownership (canonical run fields + mutators).
- [ ] **A.2** Add headless or scripted regression entry (Godot `--headless` scenario list in repo docs).

---

## Phase B — Data parity (buildings, upgrades, difficulty, heroes)

### B.1 Extraction pipeline (from web TS)

- [x] Script: inventory / IDs from web (`scripts/parity/extract_data_inventory.mjs` → `WEB_DATA_INVENTORY.md`).
- [x] Script: ID manifest (`scripts/parity/generate_godot_id_manifest.mjs` → `godot/data/parity_web_manifest.json`).
- [x] Script: structured defs (`scripts/parity/extract_web_defs.mjs` → `godot/data/parity_web_defs.json`).
- [ ] **B.1.1** Harden extractors against TS refactors (parse exports / AST instead of fragile regex).
- [ ] **B.1.2** CI or npm script: `node scripts/parity/extract_web_defs.mjs` in check mode.

### B.2 Godot data consumption

- [x] **B.2.1** Import `parity_web_defs.json` at runtime — **`WebParityDefs` autoload** indexes buildings/upgrades by `id`; JSON includes **size, color, maxHp, costs, supply/power/economy/combat scalars, kind/weaponKind** per extractor (re-run `extract_web_defs.mjs` after TS changes). **Prototype sim** reads **`command_center.maxHp`** + **`auto_turret`** `creditCost`, `range`, `damage`, `fireRate`→cooldown (`1/max(0.04, fireRate)` per web).
- [-] **B.2.2** **UPGRADES** in JSON: **id, label, category, creditCost** (×0.93 like web `UPGRADES` map), **prereqIds, unlockBuildingIds, description, heroId** — **modifiers / phase locks / refunds** not in JSON yet; Godot skill tree not driven by defs.
- [ ] **B.2.3** Difficulty tables: mirror `getDifficultyScale` / wave scaling / `GameDifficulty` effects.
- [ ] **B.2.4** Hero (`HeroId`) unlocks and per-hero building families.

---

## Phase C — Core simulation parity

### C.1 Session / run lifecycle

- [-] **C.1.1** Initial credits / power / supply / upgrades on new run match `resetRun()` (**credits 1550** in Godot + `GameState`; **command center max HP** from `WebParityDefs` / `command_center`; power/supply/upgrades still web-only).
- [ ] **C.1.2** Session reset parity: all runtime arrays, timers, discovery, shields, projectiles cleared like web `resetRun()`.
- [ ] **C.1.3** Defeat condition: command center destroyed → same transitions/audio/state as web.
- [ ] **C.1.4** Post-defeat and menu flow matches `App.tsx` phase machine.

### C.2 Wave state machine

- [x] **C.2.1** Extract `WaveSystem.gd` (spawn tick + intermission).
- [x] **C.2.2** **First wave manual only** (web `firstWaveStarted`); no intermission auto-start until then. *(Implemented: `first_wave_started` + `WaveSystem` gate.)*
- [x] **C.2.3** Spawn **window** duration (`spawnWindowDurationSec`, `spawnWindowElapsedSec`, `spawnWindowEnded`) — `WaveSystem.gd` + bottom HUD % + **top-center ring** (`WaveTimerRing.gd` / `HudController.wave_timer_progress`, matches web `waveSpawnProgress`).
- [-] **C.2.4** `toSpawn` count + spawn interval formulas — implemented in `WaveScaling.gd` (difficulty presets + `getEnemyScalingWave` / burst analogs); **hero / upgrade modifiers** to wave pool not yet mirrored.
- [x] **C.2.5** Inactive phase timer (`inactiveDurationSec` = 60s, `inactiveTimeLeftSec` in `WaveSystem` + HUD + **same ring** fills by `inactiveTimeLeftSec / inactiveDurationSec`; caption matches web `wave-timer-text`).
- [x] **C.2.6** Early-start rules: **manual Space only while inactive timer > 0** (after wave 1+); **auto-start when timer hits 0**. **`waveReady`** mirrored in `main.gd` (`_compute_wave_ready`) + `GameState.wave_ready` + HUD `Space:ready|wait`.

### C.3 Asteroids

- [x] **C.3.1** Extract `AsteroidSystem.gd`; variant hooks (splitter, explosive, spawner, emp, colossus, …).
- [ ] **C.3.2** Full variant list parity: `normal | splitter | explosive | meteor | seeker | planet | gold | spawner | emp | colossus` behaviors + tuning.
- [ ] **C.3.3** Movement: seeker steering, pulsar slow, stasis, radar mark — match web fields on `Asteroid` type.
- [-] **C.3.4** Impact radii / damage parity — Godot stores **`impact_radius`** / **`impact_damage`** per rock from web `baseDamage` × variant mul + web radius scaled to arena (`2.6/4.6` vs normal 4.6). Command-center **distance scale** still approximate vs full web grid.
- [ ] **C.3.5** Discovery toast / variant reveal rules.

### C.4 Build, placement, footprint, occupancy

- [x] **C.4.1** Extract `BuildSystem.gd` (placement checks, sell pick).
- [x] **C.4.2** **Block build/sell during active wave** (web: `waveInProgress`; Godot: while spawning or any asteroids remain after first wave start). *(Implemented: `_is_wave_combat_active()`.)*
- [ ] **C.4.3** Multi-cell footprints for all `BuildingDef.size` `{w,h}`.
- [ ] **C.4.4** Placement rules: unlocked IDs, credit + **supply** cost, power cap, grid bounds, overlap command center.
- [-] **C.4.5** **Sell refund** for prototype turret: **100%** if `built_in_inactive_phase == current_inactive_phase` and not in combat, else **`floor(cost * 0.5)`** (web `sellLookedAt`). Build/sell **cost** uses **`auto_turret.creditCost`** from `WebParityDefs` when JSON loads; multiple building types still pending.
- [ ] **C.4.6** Refund sprite / sell affordance visibility during inactive only.
- [ ] **C.4.7** Drag-build and drag-sell timing parity (web pointer handlers).

### C.5 Combat / weapons / projectiles

- [x] **C.5.1** Extract `CombatSystem.gd` (targeting + projectile step).
- [ ] **C.5.2** Weapon **kinds** parity: `hitscan | missiles | ballistic | shield | railgun` per building.
- [ ] **C.5.3** Missiles: lock-on, modes (`death_location` / `retarget`), volleys, splash/noSplash.
- [ ] **C.5.4** Ballistics / railgun piercing; AOE; `auraDamagePerSec`; Kingpin `shotCreditCost`.
- [ ] **C.5.5** Shield layers / bubbles / upkeep + regen power draw.
- [ ] **C.5.6** Turret aim bones (yaw/pitch/muzzle) where applicable.

### C.6 Economy, power, supply

- [x] **C.6.1** Extract `EconomySystem.gd` (passive tick helpers).
- [-] **C.6.1b** Asteroid **kill credits** (combat only): `getAsteroidKillReward` × `asteroidKillCreditMul` (1.45) × `(1 + wave*0.025)` in `WaveScaling.asteroid_kill_payout`; Godot **logistics kill_credit_bonus** still additive flat (web upgrade parity later). **Impact deaths** still no payout (web `reason !== 'impact'`).
- [ ] **C.6.2** Power cap, stored power, generation (`solar`, generators), drain order, throttling when starved.
- [ ] **C.6.3** Supply cap / `supplyUsed` / per-building `supplyCost` + `supplyCapAdd`.
- [ ] **C.6.4** Building payout intervals (`creditPayout`, `creditIntervalSec`).
- [ ] **C.6.5** Passive income / difficulty / upgrade modifiers match web `updateResources`.

### C.7 Support / hero-specific combat systems

- [ ] **C.7.1** Repair bay, fabrication, reconstruction yard behaviors.
- [ ] **C.7.2** Archangel planes, Dominion drones/dropships/shrapnel, Nova gravity wells / photons, Citadel conduits, Jupiter radar/battery emergency, Kingpin economy procs — as in web.

---

## Phase D — Input, camera, UX

- [x] **D.1** Extract `InputSystem.gd`, `CameraSystem.gd`; basic fullscreen + capture.
- [ ] **D.2** Pointer lock recovery and edge cases (`onPointerLockChange` parity).
- [ ] **D.3** Virtual cursor + menu hit testing parity (`pickMenuHitTarget` semantics).
- [ ] **D.4** Research / build wheel / overlay keyboard + wheel interaction (web `wheelOpen`, `upgradeOpen`, `researchOpen`).
- [ ] **D.5** Camera clamps, sensitivity, Q/E vertical — match `updateCamera` feel.
- [x] **D.6** Menu / pause / gameover controllers extracted (polish pending).

---

## Phase E — Meta systems (upgrades, commanders, score, audio)

- [x] **E.1** Extract `UpgradeSystem.gd` (placeholder three-upgrade model).
- [ ] **E.2** Full **UPGRADES** array parity: purchase, refund, prereq chains, phase locks.
- [x] **E.3** Extract `CommanderSystem.gd` scaffold.
- [ ] **E.4** Per-commander buildings, passives, and research splits.
- [x] **E.5** Extract `ScoreSystem.gd` (simplified formula).
- [ ] **E.6** `computeRunScore` parity with `src/highScores.ts` + difficulty multipliers.
- [ ] **E.7** Leaderboard records / ordering / persistence parity.
- [x] **E.8** `AudioService.gd` stub wired to some events.
- [ ] **E.9** Map `gameAudioEngine.ts` / `useGameAudio.ts` events 1:1.

---

## Phase F — Validation and cutover

- [ ] **F.1** Run full parity matrix from `PARITY_TRACKER.md` sections 1–15.
- [ ] **F.2** Record approved intentional differences (section at end of this file or separate note).
- [ ] **F.3** Cutover checklist: performance, saves, builds, Godot export smoke test.
- [ ] **F.4** Tag release milestone when critical gameplay subset hits `[x]`.

---

## Delivery checklist (every iteration)

- [ ] `PARITY_TRACKER.md` status updated for touched rows.
- [ ] Evidence noted (command output, checklist, or scenario).
- [ ] Module boundaries respected (`ARCHITECTURE_TARGET.md`).
- [ ] Git commit + push (branch policy per team).

---

## Quick reference: source files

| Area | Web | Godot |
|------|-----|--------|
| Core sim | `src/game/BaseDefenseGame.ts` | `godot/scripts/main.gd` + `godot/systems/*.gd` |
| UI phases / overlays | `src/App.tsx` | `godot/scripts/main.gd` + `godot/ui/*.gd` |
| Score | `src/highScores.ts` | `godot/systems/ScoreSystem.gd` |
| Audio | `src/audio/*.ts` | `godot/autoloads/AudioService.gd` |
| Parity data | (generated from TS) | `godot/data/parity_web_*.json` |
