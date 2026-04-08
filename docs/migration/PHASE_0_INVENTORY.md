# Phase 0 Inventory (TypeScript -> Godot)

This inventory captures what currently exists in the TS project and how it maps into the Godot migration target.

## Runtime and Architecture

- **Current**
  - React app shell in `src/App.tsx`
  - Core gameplay simulation in `src/game/BaseDefenseGame.ts`
  - Audio abstraction in `src/audio/*`
  - Score/high score logic in `src/highScores.ts`
- **Godot Target**
  - `autoloads/GameState.gd`
  - `autoloads/RunConfig.gd`
  - `autoloads/AudioBusController.gd`
  - `autoloads/ScoreService.gd`
  - `scenes/Main.tscn` and gameplay sub-scenes

## Gameplay Systems

- **Wave / asteroid loop**
  - Spawn sequencing
  - Wave readiness/in-progress state
  - Remaining asteroid tracking
- **Building systems**
  - Build wheel selection
  - Placement validation on grid
  - Sell/refund interactions
  - Supply and power constraints
- **Combat systems**
  - Turret behavior
  - Projectile updates and cleanup
  - AOE/special effect damage flows
- **Commander systems**
  - Hero-specific buildings and gating
  - Hero-specific research trees

## UI/UX Systems

- Main menu, pause menu, and game-over overlays
- Build wheel + virtual cursor
- Research/upgrade overlay and center-reticle behavior
- HUD/state panels and timers
- Cursor behavior (hidden OS cursor + pointer lock/fullscreen)

## Data Surfaces to Port

- Building definitions (`BUILDINGS` in TS)
- Upgrade definitions (`UPGRADES` in TS)
- Difficulty settings and run configuration
- Runtime state snapshot model (`State` in `App.tsx`)
- Balance CSV assets in `balance/`

## Audio Surfaces to Port

- Event-driven gameplay SFX dispatch
- Master volume behavior and persistence
- Pooling/voice constraints and warnings

## Meta Systems

- Run score computation
- Leaderboard/top score persistence
- Commander-specific board views

## Source-of-Truth Candidates

- **Behavior source**: `src/game/BaseDefenseGame.ts`
- **UI flow source**: `src/App.tsx`
- **Balance source**: `balance/*.csv` + static constants in TS
- **Audio source**: `src/audio/gameAudioEngine.ts`

## Migration Notes

- Keep the TS branch as behavior reference while porting.
- For parity checks, treat current TS behavior as canonical unless intentionally changed and documented.
