# ATTACK_PLAN

## Current Focus
Virtual cursor margin parity (`D.3`): use web-equivalent edge margin for menu cursor clamping.

## Complete
- Session bootstrap files are established (`ATTACK_PLAN.md`, `DECISIONS.md`).
- Startup parse blockers fixed:
  - `godot/scripts/main.gd`: constructor-based const-expression parser issues avoided with runtime vars.
  - `godot/systems/AsteroidSystem.gd`: missing `variant` local fixed.
- Camera parity slice completed this session:
  - `godot/systems/CameraSystem.gd`: speed and bounds now match web `updateCamera`.
  - `godot/systems/CameraSystem.gd`: look delta clamp added (`±220`) before sensitivity apply.
  - `godot/systems/CameraSystem.gd`: default and reset pose aligned to web (`camPos`, `yaw`, `pitch`).
- Pointer-lock recovery slice completed this session:
  - `godot/scripts/main.gd`: gameplay look/click now requires active mouse capture.
  - `godot/scripts/main.gd`: first click after focus loss recaptures only (no build/sell action on that click).
- Virtual cursor slice completed this session:
  - `godot/ui/MainMenuController.gd`: menu hit testing now scans top-most first and ignores disabled/hidden controls.
  - `godot/ui/MainMenuController.gd`: activation path guards against disabled/hidden targets.
  - `godot/ui/MainMenuController.gd`: cursor clamp margin aligned to web value (`14`).

## In Progress
- Runtime parse validation remains pending from automation context (`godot --headless --check-only` unavailable here).

## Remaining
- Continue parity slices from `docs/parity/PARITY_ATTACK_PLAN.md` unresolved items:
  - D.4 build wheel and research overlay parity.
  - F.6/F.7 asteroid behavior tuning and movement parity.
  - G.3-G.7 weapon family parity (hitscan/missiles/ballistic/railgun/shields).
  - I.2 full upgrade graph and modifier semantics.
  - J.2/J.3 richer HUD/research/discovery UI parity.
  - K.2 audio event/bus parity.

## Blocked
- Automated headless parse validation is blocked in this terminal environment because `godot` is not on PATH and MCP expects `C:\Program Files\Godot\Godot.exe`.
