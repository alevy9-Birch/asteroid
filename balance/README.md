# Balance data (future)

This folder is reserved for **exported balance JSON** and optional schemas once the pipeline in `docs/BALANCE_PIPELINE.md` is implemented.

**Today:** Game balance still lives in `src/game/BaseDefenseGame.ts`. Editing files here has **no effect** until loaders are wired up.

When the pipeline starts, typical contents will be:

- `globals.json` — `VARS`, global multipliers, starting resources  
- `buildings.json` — per-structure stats  
- `upgrades.json` — costs, prerequisites, `unlockBuildingIds`, numeric modifiers  

See `docs/BALANCE_PIPELINE.md` for the full plan.
