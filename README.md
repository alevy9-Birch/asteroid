# Asteroid Defense

This repository currently contains:

- The existing web game implementation (`src/`, React + TS + Vite)
- The Godot migration prototype (`godot/`)

## Migration Status

- Active migration branch: `migration/godot`
- Completed migration phases: 0 through 6 (prototype-level execution)
- Current state: playable Godot prototype with menu/pause/game-over virtual cursor flow, core wave/build loop, upgrades, and score persistence.

## Run the Web Version

```bash
npm install
npm run dev
```

## Run the Godot Migration Prototype

Open the Godot project located at:

- `godot/project.godot`

Or from command line (example):

```bash
Godot_v4.6.2-stable_win64.exe --path godot
```

## Migration Docs

- `MIGRATION.md`
- `docs/migration/PHASE_0_INVENTORY.md`
- `docs/migration/PHASE_0_PARITY_CHECKLIST.md`
- `docs/migration/PHASE_6_VALIDATION_REPORT.md`
- `docs/migration/KNOWN_DIFFERENCES.md`
- `docs/migration/CUTOVER_CHECKLIST.md`
