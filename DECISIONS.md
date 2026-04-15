# DECISIONS

## Audit Notes
- [AUDIT] Decision: Treat `docs/parity/PARITY_ATTACK_PLAN.md` as the checklist source for one-time audit seeding into root `ATTACK_PLAN.md`. | Why: root attack/decision files did not exist; parity plan already contains the active checklist and completion markers. | Alternative: create a brand-new checklist from scratch and ignore existing parity documentation.
- [AUDIT] Decision: Keep all currently `[x]` items as complete after static verification rather than downgrading any. | Why: each audited item has concrete implementation evidence in Godot code/files; no direct code contradiction found. | Alternative: conservatively downgrade items without runtime execution evidence.
- [VALIDATION] Decision: Log headless automation as blocked instead of claiming full parse validation. | Why: terminal context cannot run `godot` (`command not found`), so `--headless --check-only` cannot be executed here. | Alternative: mark validation complete based only on editor/manual assumptions.

## Session Decisions
- [BOOT/PARSE] Decision: Convert constructor-based constants in `main.gd` to runtime vars for compatibility (`PackedStringArray(...)`, `Color(...)`). | Why: current parser raised constant-expression errors. | Alternative: keep constants and require a different Godot parser/runtime behavior.
- [ASTEROIDS] Decision: Define `variant` in `AsteroidSystem.update_asteroids()` from asteroid payload before use. | Why: code referenced `variant` before declaration, causing parse/runtime failure. | Alternative: inline repeated dictionary lookups at each branch.

# DECISIONS

[Startup Parse Baseline] Decision: Keep `MENU_DIFFICULTY_IDS` as a runtime variable in `godot/scripts/main.gd` instead of a typed constant expression. | Why: `PackedStringArray(...)` assignment triggered a Godot parser error for constant expressions in this environment. | Alternative: Keep it as `const` and require a stricter/newer parser behavior.

[Startup Parse Baseline] Decision: Declare `variant` explicitly in `godot/systems/AsteroidSystem.gd::update_asteroids` before use. | Why: Parser/runtime scope error occurred (`Identifier "variant" not declared`). | Alternative: Inline dictionary lookup everywhere instead of local variable extraction.

[Session Validation] Decision: Treat automated headless validation as blocked and require manual run feedback until Godot CLI path is configured. | Why: `godot` is unavailable on PATH and MCP project-info validation reports missing `C:\Program Files\Godot\Godot.exe`. | Alternative: Pause all parity implementation work until CLI tooling is fixed.
