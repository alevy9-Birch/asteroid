# ATTACK_PLAN

## Current Focus
Godot boot/parse stability and session-audit baseline.

## Audit Pass (one-time)
Reference checklist audited from `docs/parity/PARITY_ATTACK_PLAN.md` complete (`[x]`) items.

- **Verified in code:** A.1, A.3, A.4, A.5, B.1, B.5, B.6, B.7, D.1, D.6, E.1, E.2, E.3, F.1, F.2, F.3, F.5, G.1, G.2, H.1, H.6, I.1, I.3, L.1.
- **Audit outcome:** no `[x]` item was downgraded in this pass based on static code verification.
- **Runtime caveat:** local automation environment currently cannot execute `godot --headless --check-only` (Godot executable unavailable on PATH in this terminal context), so runtime validation remains manual in-editor for now.

## Complete
- Established root session files (`ATTACK_PLAN.md`, `DECISIONS.md`) for queued-run workflow.
- Fixed parser-level blockers already encountered during startup:
  - `main.gd`: constructor-based constants converted to runtime vars where required by parser compatibility.
  - `AsteroidSystem.gd`: missing `variant` local in `update_asteroids()` fixed.

## In Progress
- Validate clean Godot parse/headless check from automation context once executable path is available.

## Remaining (priority order)
1. Resolve automation pathing so `godot --headless --check-only` can run non-interactively each session.
2. Continue parity work from `docs/parity/PARITY_ATTACK_PLAN.md` unresolved items, one focus area per session.

## Blocked
- Automated headless parse validation is blocked by missing `godot` binary in this terminal environment.

# ATTACK_PLAN

Current Focus: Godot startup parse-clean baseline (scripts compile without parser errors)

## Complete

- Fixed `MENU_DIFFICULTY_IDS` constant-expression parse issue in `godot/scripts/main.gd` by using runtime storage.
- Fixed missing local identifier `variant` in `godot/systems/AsteroidSystem.gd::update_asteroids`.
- Added explicit parity snapshot section to `docs/parity/PARITY_ATTACK_PLAN.md` to clarify current Godot-vs-web functionality.

## In Progress

- Validate startup parse-clean state with headless check command (`godot --headless --check-only` equivalent session validation).
- Confirm no additional parse errors remain after recent fixes.

## Remains

- Continue parity implementation slices from `docs/parity/PARITY_ATTACK_PLAN.md`:
  - D.4 build wheel and research overlay parity.
  - F.6/F.7 asteroid behavior tuning and movement parity.
  - G.3-G.7 weapon family parity (hitscan/missiles/ballistic/railgun/shields).
  - I.2 full upgrade graph and modifier semantics.
  - J.2/J.3 richer HUD/research/discovery UI parity.
  - K.2 audio event/bus parity.

## Blocked

- Local automation environment cannot run direct Godot CLI checks because `godot` is not on PATH, and MCP tooling reports `C:\Program Files\Godot\Godot.exe` missing for project-info/validation flows.
- Until CLI path/tooling is resolved, parse validation depends on manual editor run feedback from the user.
