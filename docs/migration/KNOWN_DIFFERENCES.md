# Known Differences (Godot Migration Prototype vs TS Game)

## Rendering / Presentation

- Godot migration prototype is currently **2D-oriented** UI/gameplay presentation.
- Existing TS game is **3D scene-driven** with richer visual effects and environmental art.

## Gameplay Content Coverage

- Prototype includes a reduced gameplay set:
  - One command center
  - One turret build type
  - Simplified asteroid model
  - Simplified upgrade set (3 upgrades)
- TS version has significantly broader building, commander, and upgrade coverage.

## Systems Depth

- Prototype economy and score formulas are simplified.
- TS version has richer balancing, commander-specific progression, and detailed combat variants.

## Audio

- Prototype focuses on migration mechanics and currently lacks full event/audio asset parity.
- TS version includes fuller audio event handling and content.

## Why This Is Acceptable Right Now

These differences are intentional for migration throughput: establish stable architecture + gameplay loop first, then expand toward full parity in follow-up iterations.
