# Phase 0 Parity Checklist (Baseline)

Use this checklist in later phases to validate parity against the TS implementation.

## A. Boot and Run Flow

- [ ] App starts to main menu.
- [ ] New run transitions to gameplay scene.
- [ ] Sandbox mode starts with expected configuration.
- [ ] Defeat condition transitions to game-over flow.
- [ ] Return to menu resets runtime session correctly.

## B. Input and Cursor Contract

- [ ] OS cursor remains hidden in gameplay and menu overlays.
- [ ] Gameplay mouse-look behaves with relative movement.
- [ ] Pointer lock/fullscreen flow behaves on primary click.
- [ ] Main menu supports virtual cursor click targeting.
- [ ] Pause menu supports virtual cursor click targeting.
- [ ] Game-over menu supports virtual cursor click targeting.

## C. Core Gameplay Loop

- [ ] Wave start/stop state is correct.
- [ ] Wave spawn progress is visible and accurate.
- [ ] Asteroid count tracking is accurate.
- [ ] Loss condition triggers when command centers are gone.

## D. Building and Economy

- [ ] Building selection and placement work on the grid.
- [ ] Placement validity checks match TS rules.
- [ ] Sell behavior works and returns expected value.
- [ ] Credits are earned/spent correctly.
- [ ] Supply and power constraints gate builds correctly.

## E. Combat and Projectiles

- [ ] Turrets acquire targets and fire correctly.
- [ ] Projectile movement and hit resolution match expected behavior.
- [ ] Area damage and special effects apply correctly.
- [ ] Cleanup/disposal does not leak entities.

## F. Upgrades and Research

- [ ] Skill/research trees open and navigate correctly.
- [ ] Unlock prerequisites are enforced.
- [ ] Purchase and refund rules are correct.
- [ ] Hero-research gating works by commander.

## G. Audio and Feedback

- [ ] Audio events fire at expected gameplay moments.
- [ ] Master volume control persists correctly.
- [ ] No severe audio pooling regressions.

## H. Meta and Scoring

- [ ] End-of-run score calculation matches intent.
- [ ] Score persistence works.
- [ ] Commander leaderboard split works.

## Phase 0 Completion Conditions

- [x] Godot scaffold exists under `godot/`.
- [x] Placeholder main scene is configured in `project.godot`.
- [x] Inventory document created.
- [x] Baseline parity checklist created.
- [x] Godot project launch verified on this machine (headless launch succeeded).
