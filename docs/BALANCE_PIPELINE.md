# Balance pipeline — organization plan (design-friendly, code-safe)

**Goal:** You iterate **numbers and names** in structured data; the game stays **buildable and playable** at every step. This doc is the **roadmap only** — nothing here is required to run the game until you opt in.

---

## Principles

1. **No big-bang migration** — introduce external data **one subsystem at a time** (e.g. `globals.json` first, then `buildings`, then `upgrades`).
2. **Validate before merge** — schema check (JSON Schema, Zod, or a small TypeScript validator) in `pnpm balance:validate` (to be added when ready).
3. **Single source of truth** — once a field moves to data, **remove** the duplicate literal from `BaseDefenseGame.ts` to avoid drift.
4. **Gameplay code stays in TS** — things like “Kingpin decoder stacking cap” remain **logic**; only **coefficients** (e.g. max stack `2.45`) become data when you choose.

---

## Proposed folder layout

```
space-ship/
  balance/
    README.md              # How to edit + export workflow
    schema/                # Optional JSON Schema files
    drafts/                # Optional: designer copies (gitignored if needed)
    globals.json           # VARS, POWER_DRAIN_GLOBAL_MUL, starting resources, upgrade vendor multiplier
    buildings.json         # One object per BuildingId (numeric stats)
    upgrades.json          # Upgrade defs: id, cost, prereqs, unlockBuildingIds, modifiers
    waves.json             # Later: spawn curves, inactive duration
    asteroids.json         # Later: variant weights, HP bands
```

**Runtime loading:** optional future step — either **import JSON as modules** (bundled) or fetch at startup. Start with **build-time import** so the game stays an offline bundle.

---

## Phased rollout (recommended)

| Phase | Scope | Risk |
|-------|--------|------|
| **0** | Document only (this file + `BALANCE_AND_EXCEL.md`) | None |
| **1** | `globals.json` + small loader; replace `VARS` / one global | Low |
| **2** | `buildings.json` + loader; `BUILDINGS` becomes generated or merged at build | Medium — needs tests |
| **3** | `upgrades.json` + modifiers matrix | Medium — large surface |
| **4** | Waves / asteroids | Medium — touches difficulty feel |

After each phase: **playtest**, **commit**, then continue.

---

## What you (design) can own in spreadsheets

- Export **CSV** from Excel/Sheets → convert to JSON (`pnpm balance:import` script — to be added).
- Keep **IDs** (`factory_megacomplex`, `hero_kingpin_core`) identical to `BuildingId` / `UpgradeId` in code until a rename pass is deliberate.

---

## Related docs

- `docs/BALANCE_AND_EXCEL.md` — philosophy, Excel pros/cons, variable inventory.
- `docs/GDD.md` — structure and upgrade ID lists (reference for IDs when authoring data).
