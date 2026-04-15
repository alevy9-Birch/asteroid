# DECISIONS

## Audit Notes
- [AUDIT] Decision: Treat `docs/parity/PARITY_ATTACK_PLAN.md` as the checklist source for one-time audit seeding into root `ATTACK_PLAN.md`. | Why: root attack/decision files did not exist; parity plan already contains the active checklist and completion markers. | Alternative: create a brand-new checklist from scratch and ignore existing parity documentation.
- [AUDIT] Decision: Keep all currently `[x]` items as complete after static verification rather than downgrading any. | Why: each audited item has concrete implementation evidence in Godot code/files; no direct code contradiction found. | Alternative: conservatively downgrade items without runtime execution evidence.
- [VALIDATION] Decision: Log headless automation as blocked instead of claiming full parse validation. | Why: terminal context cannot run `godot` (`command not found`), so `--headless --check-only` cannot be executed here. | Alternative: mark validation complete based only on editor/manual assumptions.

## Session Decisions
- [BOOT/PARSE] Decision: Convert constructor-based constants in `main.gd` to runtime vars for compatibility (`PackedStringArray(...)`, `Color(...)`). | Why: current parser raised constant-expression errors. | Alternative: keep constants and require a different Godot parser/runtime behavior.
- [ASTEROIDS] Decision: Define `variant` in `AsteroidSystem.update_asteroids()` from asteroid payload before use. | Why: code referenced `variant` before declaration, causing parse/runtime failure. | Alternative: inline repeated dictionary lookups at each branch.

- [ATTACK_PLAN] Decision: Resolve duplicated root `ATTACK_PLAN.md` sections into a single canonical structure. | Why: file had contradictory duplicate blocks from prior sessions; a single source reduces ambiguity for queued runs. | Alternative: keep both blocks and infer latest state heuristically each session.
- [CAMERA D.5] Decision: Mirror web `updateCamera` movement constants in Godot (`speed=38`, y clamp `6..140`, x/z clamp `±170`). | Why: current Godot camera movement was slower and more constrained than web source-of-truth values. | Alternative: keep current Godot tuning and treat camera handling as an approved difference.
- [CAMERA D.5] Decision: Clamp per-frame mouse look deltas to `±220` before applying sensitivity. | Why: web clamps pointer deltas to avoid focus/pointer-lock jump spikes; Godot behavior should match for camera stability. | Alternative: leave unclamped and rely on platform input smoothness.
- [VALIDATION] Decision: Continue logging headless parse check as blocked in automation while still running available lint/static checks. | Why: `godot --headless --check-only` cannot execute in this terminal context. | Alternative: skip all validation steps until CLI path is fixed.
