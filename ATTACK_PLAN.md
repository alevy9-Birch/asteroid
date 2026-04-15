# ATTACK_PLAN

## Current Focus
Spawner meteor child parity (`F.6`/`F.7`): align spawned meteor offset and derived stats (`speed/hp/impact`) with web `spawnMeteorFromSpawner`.

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
- Asteroid movement slice completed this session:
  - `godot/systems/AsteroidSystem.gd`: seeker asteroids now retarget closest live structure each update.
  - `godot/scripts/main.gd`: provides live structure target list (`CC`, turrets, economy, depots, nuclear) for seeker steering.
  - `godot/systems/AsteroidSystem.gd`: spawner cooldown now follows web-style dynamic interval (`max(2.2, 5.2 - adj*0.12)`).
  - `godot/scripts/main.gd`: removed fixed `6.0` cooldown reset after spawner meteor launch.
  - `godot/systems/AsteroidSystem.gd`: impact trigger now uses web-style near-target distance (`2.2`) / low-altitude check, with impact radius reserved for damage AOE.
  - `godot/systems/AsteroidSystem.gd`: variant picking now uses web-style wave-ramped weights plus capped active type pool (`2 + floor(wave/3)`).
  - `godot/systems/AsteroidSystem.gd`: `colossus` size multiplier aligned to web (`10.0`).
  - `godot/scripts/main.gd`: seeker asteroids now get closest-structure target at spawn time (not delayed until first update tick).
  - `godot/scripts/main.gd`: run-scoped asteroid discovery state added (`discovered`, active discovery, 5s timer), with HUD “New: <variant>” notice.
  - `godot/autoloads/AudioService.gd`: added optional `asteroid_discovery` SFX event hook.
  - `godot/systems/AsteroidSystem.gd`: added discovery-aware wave pool assembly matching web `configureWaveVariantPool` behavior.
  - `godot/scripts/main.gd`: spawn path now uses discovery-aware variant picking (`pick_variant_with_discovery`).
  - `godot/scripts/main.gd`: wave variant pool is now rebuilt on wave changes and reused for all spawns in that wave.
  - `godot/systems/AsteroidSystem.gd`: added pool-based variant picker and public pool builder for wave-level orchestration.
  - `godot/systems/AsteroidSystem.gd`: added `variant_display_name` mapping for discovery UI text.
  - `godot/scripts/main.gd`: discovery HUD now shows display names (e.g., `Seeker`) instead of raw ids.
  - `godot/systems/AsteroidSystem.gd`: discovery notices now include variant descriptions in HUD text.
  - `godot/systems/AsteroidSystem.gd`: movement now honors `stasisTimer` freeze and `pulsarSlowTimer` slow (`0.52`) like web.
  - `godot/systems/AsteroidSystem.gd`: `radarMarkTimer` now decays each update for parity with web asteroid timer updates.
  - `godot/systems/AsteroidSystem.gd`: seeker closest-target and impact-trigger checks now use web-style planar XZ distance instead of full 3D distance.
  - `godot/scripts/main.gd`: seeker spawn target and asteroid death AOE/EMP range checks now use planar XZ distance to match web `Math.hypot` behavior.
  - `godot/systems/AsteroidSystem.gd`: non-seeker asteroids now steer toward and impact against their own `target` point (fallback to CC), matching web target-point lifecycle.
  - `godot/scripts/main.gd`: impact-triggered AOE/EMP effects now resolve around the asteroid target point for impact deaths.
  - `godot/scripts/main.gd`: non-seeker spawn targets now use randomized web-style grid points (`[-40, 40]` on X/Z) instead of fixed command-center target.
  - `godot/scripts/main.gd`: spawned meteors/splitter children now inherit parent target so split/spawn trajectories remain consistent with parent impact lane.
  - `godot/scripts/main.gd`: base asteroid entry now matches web radial/high-altitude spawn geometry (`r=160..220`, `y=90..120`) instead of low side-edge spawn.
  - `godot/scripts/main.gd`: spawner-created meteors now use web-like parent-derived stats and close local spawn offset (`speed/hp/impact` parity).

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
