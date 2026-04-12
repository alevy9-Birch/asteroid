# Godot Target Architecture (Parity-Driven)

This defines the intended modular structure and ownership boundaries for parity work.

## Core Principle

Each module owns one concern. Cross-module communication happens through `GameState` + events/signals, not ad-hoc direct state mutation.

## Module Layout

## `autoloads/GameState.gd`

Responsibilities:
- Canonical run state (`phase`, resources, wave state, run stats, unlock state)
- Immutable-like update API (named mutator functions)
- Emits state-change signals for UI/systems

Checklist:
- [ ] Defines full state model mapped from `src/App.tsx` + `BaseDefenseGame.ts`
- [ ] Emits granular signals (`phase_changed`, `resources_changed`, `wave_changed`, etc.)
- [ ] No gameplay logic beyond state transitions

## `systems/InputSystem.gd`

Responsibilities:
- Input mapping (actions), pointer/fullscreen policy, virtual cursor movement
- Dispatches intent events (build, sell, open menu, toggle pause, etc.)

Checklist:
- [ ] Mirrors web shortcut map and gesture behavior
- [ ] No direct combat/economy logic

## `systems/CameraSystem.gd`

Responsibilities:
- Camera look/movement, clamps, bounds, feel tuning
- Raycasts for center reticle/world targeting

Checklist:
- [ ] Tunable config for sensitivity/speeds/clamps
- [ ] Exposes target query API for Build/Combat systems

## `systems/WaveSystem.gd`

Responsibilities:
- Wave state machine, spawn progression, timers, intermission

Checklist:
- [ ] States match web semantics
- [ ] Emits wave lifecycle events

## `systems/AsteroidSystem.gd`

Responsibilities:
- Asteroid spawning, variant behavior, movement, impacts, lifecycle

Checklist:
- [ ] Variant behavior map parity
- [ ] Object pooling and cleanup

## `systems/BuildSystem.gd`

Responsibilities:
- Grid occupancy, placement legality, footprints, sell logic

Checklist:
- [ ] Multi-size footprints parity
- [ ] Restriction parity (wave phase, collisions, center constraints)

## `systems/CombatSystem.gd`

Responsibilities:
- Targeting, fire loops, projectile/hitscan resolution, AOE/special effects

Checklist:
- [ ] Supports all weapon kinds from web
- [ ] Isolated from UI concerns

## `systems/UpgradeSystem.gd`

Responsibilities:
- Upgrade graph, prerequisites, purchase/refund, unlock effects

Checklist:
- [ ] Full `UPGRADES` parity model
- [ ] Hero vs normal research split

## `systems/EconomySystem.gd`

Responsibilities:
- Credits/supply/power tick loops, costs, payouts, drains

Checklist:
- [ ] Mirrors web resource equations
- [ ] Emits resource delta events

## `systems/CommanderSystem.gd`

Responsibilities:
- Commander-specific modifiers, units, and gating

Checklist:
- [ ] Complete commander feature coverage

## `systems/ScoreSystem.gd`

Responsibilities:
- Run score computation and persistence rules

Checklist:
- [ ] `computeRunScore` parity
- [ ] leaderboard ordering/top rules parity

## UI Controllers

`ui/MainMenuController.gd`, `ui/PauseController.gd`, `ui/GameOverController.gd`, `ui/HudController.gd`

Responsibilities:
- View rendering + user interactions only
- Subscribe to `GameState` signals

Checklist:
- [ ] No simulation logic embedded
- [ ] Full overlay behavior parity (including virtual cursor hit targets)

## Data Assets

`data/` with Resources or JSON:
- buildings
- upgrades
- commander configs
- difficulty/wave configs

Checklist:
- [ ] IDs and critical fields match web source
- [ ] Data load/validation step in startup
