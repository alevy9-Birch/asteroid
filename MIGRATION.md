# Godot Migration Plan (Multi-Phase)

This proposes a staged migration from the current web/TS build to a Godot-based game while preserving gameplay behavior and reducing risk.

## Goals

- Preserve core gameplay loop, progression, and balance.
- Maintain existing feature set (menus, wave logic, buildings, upgrades, commanders, score flow).
- Migrate in safe checkpoints with playable milestones.
- Use automation where possible (MCP + scripts) for repeatable conversion steps.

## Non-Goals (Initial Migration)

- Major rebalance or redesign.
- Full visual style overhaul before parity.
- Platform expansion beyond current target until parity is stable.

---

## Phase 0 - Migration Readiness (1-3 days)

**Outcomes**
- Godot project scaffolded and runnable.
- Migration inventory and acceptance criteria defined.

**Tasks**
- Create baseline Godot project structure:
  - `project.godot`
  - `scenes/`
  - `scripts/`
  - `assets/`
  - `data/`
- Define canonical game data schema in Godot-friendly format (`.tres`, `.res`, or JSON).
- Inventory current systems from TS code:
  - Game state model
  - Wave/asteroid system
  - Building placement + sell
  - Upgrades/research
  - Hero/commander systems
  - UI/menu flows
  - Audio/events
  - Save/high score logic
- Write acceptance checklist for feature parity.

**Exit Criteria**
- Godot app launches and loads a placeholder main scene.
- Feature inventory and parity checklist committed.

---

## Phase 1 - Core Architecture Port (3-7 days)

**Outcomes**
- Foundational runtime architecture in Godot mirrors TS behavior.

**Tasks**
- Implement global managers/autoloads:
  - `GameState`
  - `RunConfig`
  - `AudioBusController`
  - `ScoreService`
- Port deterministic update loop concepts:
  - Tick/update cadence
  - State emission cadence
  - Pause/resume semantics
- Define typed data resources for:
  - Buildings
  - Upgrades
  - Asteroid variants
  - Difficulty configs
- Build lightweight debug HUD for state verification.

**Exit Criteria**
- Main gameplay scene starts/stops cleanly.
- Base state transitions (`menu -> playing -> gameover`) work in Godot.

---

## Phase 2 - Input, Camera, and Menu UX Parity (2-5 days)

**Outcomes**
- FPS-like input, pointer capture, fullscreen behavior, and virtual cursor model are reproduced.

**Tasks**
- Implement input map and handlers:
  - Movement/look keys
  - Build/research shortcuts
  - Pause flow
  - LMB/RMB action semantics
- Recreate cursor policy:
  - Hidden OS cursor in all in-game/menu contexts
  - Relative mouse look in gameplay
  - Virtual cursor for menu overlays
- Recreate fullscreen capture behavior:
  - Primary-click fullscreen request
  - Pointer capture lock flow
  - Focus/visibility recovery logic
- Rebuild main menu, pause, and game-over overlays using Godot UI (`Control` tree).

**Exit Criteria**
- Input/camera/menu behavior matches current expected feel.
- No cursor visibility regressions across transitions.

---

## Phase 3 - Gameplay Systems Port (5-12 days)

**Outcomes**
- Core game loop is playable at feature parity.

**Tasks**
- Port world simulation:
  - Wave spawning
  - Asteroid movement/targeting/impact
  - Damage/health/death flows
- Port building systems:
  - Placement validation on grid
  - Cost/supply/power checks
  - Selling/refund behavior
  - Build wheel selection semantics
- Port combat systems:
  - Turret targeting/firing
  - Projectile behaviors
  - Area damage and special cases
- Port commander-specific mechanics and unlock gating.

**Exit Criteria**
- Full round is playable from wave start to defeat.
- Progression and failure conditions match expected behavior.

---

## Phase 4 - Research, Economy, and Meta Systems (3-7 days)

**Outcomes**
- Upgrade trees, economy curves, and score tracking function in Godot.

**Tasks**
- Rebuild skill/research UIs and camera panning/zoom behavior.
- Port unlock graph logic, purchase/refund rules, and gated building unlocks.
- Port economy loops:
  - Credit generation/spend
  - Power production/storage
  - Supply usage/cap changes
- Implement high-score records and commander-specific ranking views.

**Exit Criteria**
- Upgrade + economy progression completes without logic gaps.
- End-of-run scoring and leaderboard writes are stable.

---

## Phase 5 - Assets, Audio, and Performance Pass (3-8 days)

**Outcomes**
- Visual/audio parity and stable runtime performance.

**Tasks**
- Import and rewire sprites/meshes/materials/audio assets.
- Map event-driven audio triggers to Godot audio buses/players.
- Optimize:
  - Projectile pooling
  - Effect lifetimes
  - UI redraw hotspots
  - Physics/query hotspots
- Add diagnostics toggles (FPS, entity counts, wave stats).

**Exit Criteria**
- Performance is acceptable for target hardware.
- Audio/visual feedback is consistent with existing game behavior.

---

## Phase 6 - Validation, Cutover, and Cleanup (2-5 days)

**Outcomes**
- Migration is production-ready with rollback confidence.

**Tasks**
- Execute parity test checklist and regression test matrix.
- Create known-differences document (intentional changes only).
- Freeze legacy TS branch for reference.
- Update readme/build/run docs to Godot-first workflow.
- Tag migration milestone and handoff notes.

**Exit Criteria**
- Go/no-go checklist passes.
- Team agrees on Godot as primary codebase.

---

## Risk Register (Top Items)

- **Behavior drift** in wave/combat balance during port.
  - Mitigation: parity tests and snapshot comparisons per phase.
- **Input/cursor regressions** across overlays and focus changes.
  - Mitigation: dedicated input QA checklist + automated scene test harness.
- **Data translation errors** for buildings/upgrades.
  - Mitigation: schema validation and migration scripts.
- **Performance regressions** from naive node spawning.
  - Mitigation: pooling and profiling early in Phase 3/5.

## Suggested Branching Strategy

- `migration/godot` (integration branch)
- `migration/godot-phase-<n>` short-lived feature branches
- Merge only when each phase exit criteria are met.

## MCP-Assisted Workflow (How we should use it)

- Use Godot MCP to:
  - create/load/save scenes
  - launch editor and run project
  - retrieve debug output for rapid iteration
- Keep migration steps scriptable and replayable; avoid one-off editor-only actions when possible.

## Proposed Immediate Next Steps

1. Confirm this phase plan and scope boundaries.
2. Initialize Godot project skeleton in this branch.
3. Implement Phase 0 inventory + parity checklist.
4. Start Phase 1 autoload architecture with minimal playable scene.
