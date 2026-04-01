# Balance, Data Ownership, and a Theoretical “Master Balance” Spreadsheet

This document discusses **where numbers should live**, whether **Excel** (or Sheets) is a good master for balance, and a **non-exhaustive catalog** of tunable variables that exist today in the codebase — primarily `src/game/BaseDefenseGame.ts`.

---

## 1. “Mega-Complex” naming (balance / UX)

The MK2 upgrade **`factory_megacomplex_mk2`** buffs **`factory_megacomplex`**, which players see as **“Mega Factory”**. Aligning names across **unlock**, **wheel**, and **MK2** reduces confusion and support questions. This is a **copy/ID consistency** issue, not a formula issue.

---

## 2. Current balance architecture (as implemented)

| Layer | What it does |
|--------|----------------|
| **`VARS`** | `C`, `P`, `S`, `E` — global scalars for costs, power, supply, economy outputs. |
| **`POWER_DRAIN_GLOBAL_MUL`** | Extra global multiplier on passive power drain. |
| **`BOARD_SIZE` / `HALF`** | Playfield extent (derived from a formula). |
| **`BUILDINGS[]`** | Per-structure base stats (`creditCost`, `maxHp`, combat stats, economy intervals, etc.). |
| **`UPGRADES_RAW` → `UPGRADES`** | Upgrades get **~7% credit cost reduction** via `Math.round(u.creditCost * 0.93)` — a second global layer. |
| **`BuildingModifier`** | Per-upgrade overrides: `rangeAdd`, `damageAdd`, `fireRateMul`, `creditPayoutMul`, `powerGenMul`, `powerDrainMul`, `maxHpMul`, shield muls, `creditIntervalSecMul`, `shotCreditCostMul`, etc. |
| **Inline literals** | Many systems use magic numbers (wave spawn, asteroid HP, Kingpin multipliers, Citadel conduit strengths, etc.). |

**Implication:** Balance is **distributed**. A single spreadsheet does not drive the game today; TypeScript does.

---

## 3. Should all balancing variables move to Excel?

### 3.1 What Excel (or Google Sheets) is good at

- **Non-programmers** editing numbers with compare/history (esp. Sheets + version history).
- **Bulk edits** and **What-if** columns (e.g., DPS per credit formulas).
- **Single visible table** for designers for “all turret damage at a glance.”

### 3.2 What Excel is weak at

- **No type safety** — typos in IDs break imports unless validated.
- **Pipeline** — you need **export** (CSV/JSON) + **build step** or runtime load + **schema validation**.
- **Logic** — branching hero rules, aura stacking caps, and special cases often read clearer in **code** or a **DSL** than in sheet formulas.
- **Merge friction** — binary `.xlsx` in git is painful; **CSV** or **Google Sheets export** is easier for teams.

### 3.3 Recommendation

- **Do not** move *everything* to Excel blindly.
- **Do** use a **structured data file** (JSON/YAML/TS generated from CSV) as the **single source of truth** for **tabular** data: building base stats, upgrade costs, modifier tables, global scalars.
- **Excel/Sheets** can be the **authoring UI** if designers prefer it, with a small script: `pnpm balance:export` → writes `balance/*.json` that the game imports.
- Keep **true one-off logic** (e.g., “Kingpin mineral processor payout formula”) in code, but **parameterize** the constants (base payout, wave scaling) in data.

This gives **80% of designer control** without fighting TypeScript for every number.

---

## 4. Theoretical “master balance” workbook — sheet ideas

| Sheet name | Purpose |
|------------|---------|
| **Globals** | `VARS.C/P/S/E`, `POWER_DRAIN_GLOBAL_MUL`, upgrade vendor discount, `BOARD_SIZE` multiplier, starting credits/power/supply. |
| **Difficulty** | Per-difficulty multipliers: spawn count, HP, damage, speed, spawn interval. |
| **Buildings** | One row per `BuildingId`: cost, HP, size, supply, power gen/drain, combat stats, economy payout/interval, shield tuning, `shotCreditCost`, citadel conduit template fields. |
| **Upgrades_Global** | Upgrade id, label, cost, prereqs, `unlockBuildingIds`, category (for UI tree). |
| **Upgrades_Modifiers** | Long table: `upgradeId`, `buildingId`, then modifier columns (`rangeAdd`, `damageAdd`, …). |
| **Upgrades_Hero*** | Same as above but filtered per hero, or one sheet with `heroId` column. |
| **Waves** | Base spawn count curve, spawn interval curve, inactive duration, scaling exponents. |
| **Asteroids** | Per-variant: weights, HP bands, speed, impact damage/radius, kill credit contributions. |
| **Audio** | Music/SFX base volumes (if moved from `gameAudioEngine.ts`). |

Columns should use **`snake_case` IDs** matching `BuildingId` / `UpgradeId` to avoid mapping tables.

---

## 5. Variables you could expose in a master doc (by system)

Below lists **categories** of tunables. Many already exist on **`BuildingDef`** or **`BuildingModifier`**; others are **literals** in methods.

### 5.1 Global scalars

- `VARS.C`, `VARS.P`, `VARS.S`, `VARS.E`
- `POWER_DRAIN_GLOBAL_MUL`
- Upgrade list global **credit multiplier** (currently `0.93` on `UPGRADES`)
- Starting run resources: initial `credits`, `powerCap`, `powerStored`, command center baseline
- Sandbox overrides
- Grid: `BOARD_SIZE` formula / `HALF` (or raw size)

### 5.2 Per-building (`BUILDINGS`)

For each `BuildingId`:

- **Economic:** `creditCost`, `supplyCost`, `supplyCapAdd`, `creditPayout`, `creditIntervalSec`
- **Power:** `powerCapAdd`, `powerGenPerSec`, `powerDrainPerSec`
- **Defensive:** `maxHp`, `kind`, `range`, `fireRate`, `damage`, `aoeRadius`, `burst`, `projectileSpeed`, `shotCreditCost`
- **Shield:** `shieldCapacityMul`, `shieldRechargeMul`, `shieldUpkeepPowerPerSec`, `shieldRegenPowerPerSec`, `shieldBarWidth`
- **Footprint:** `size.w`, `size.h`
- **Citadel:** `citadelConduit.kind`, `radius`, `strength` (where applicable)

### 5.3 Per-upgrade (`UPGRADES_RAW`)

- `creditCost`, `label`, `description` (localization later)
- `prereqIds` (graph edges), `unlockBuildingIds`
- **`modifiers` matrix:** for each affected `BuildingId`:
  - `rangeAdd`, `damageAdd`, `fireRateMul`, `creditPayoutMul`, `powerGenMul`, `powerDrainMul`, `aoeRadiusMul`, `maxHpMul`
  - `shieldCapacityMul`, `shieldRechargeMul`, `supplyCapAddMul`, `powerCapAddMul`
  - `creditIntervalSecMul`, `shotCreditCostMul`, `projectileSpeedMul`

### 5.4 Wave / spawn (`startNextWave`, `updateWave`, `spawnAsteroid` ecosystem)

- Spawn count: base `10 + adj * 3.5`, late extra term, `getEnemySpawnBurstExponent()` per difficulty
- Spawn interval: `spawnIntervalBase`, `lateMult`, difficulty `spawnIntervalMul`
- `inactiveDurationSec` (default 60)
- Auto-start vs manual rules
- Wave clear audio/economy hooks (Hazard Pay coefficients if hero)

### 5.5 Asteroids

- Variant **weights** / unlock pools
- Per-variant: HP, speed, impact radius/damage, split behavior, EMP drain per building, kill credit formula (`getAsteroidKillReward`, wave scaling)
- Spawner child meteor stats

### 5.6 Combat / targeting

- Railgun: charge cap, draw per second, damage
- Plasma / Tesla duty cycles and power factors
- Missile `ttl`, speeds, Hydra burst timing
- Ballistic durations
- Citadel / Nova / Jupiter **aura radii and strength** (many embedded in code paths, not only `BuildingDef`)

### 5.7 Hero-specific logic (candidates to parameterize)

Examples (non-exhaustive):

- **Kingpin:** Decoder stack factor cap, investment wealth curve, mineral processor payout base, scavenging refund %, insider discount %, hazard pay base/wave coeff, Slag shot cost
- **Citadel:** Conduit MK2 bonuses, `aggregateCitadelStrength` caps, placement discount from construction conduit
- **Jupiter:** Relay pool rules, arc tier costs/damage/chains, radar mark counts/duration, battery emergency surge
- **Archangel:** plane fuel, ammo, bomber volley cadence, pad transfer rates
- **Dominion:** orbital cooldown, flak constraints, shrapnel damage/ttl
- **Nova:** photon orb stats, pulsar slow/stasis timers, gravity well tuning

### 5.8 UI / meta

- Initial `INITIAL_STATE` in `App.tsx` (placeholder; real values from game `emitState`)
- Wheel geometry (`itemRadius`, category order)
- Skill tree cell size, zoom limits

### 5.9 Audio (`gameAudioEngine.ts`)

- Master volumes per Howl, music track gains, per-event SFX routing

---

## 6. Practical next step (if you adopt external balance data)

1. Define **JSON Schema** (or Zod) for `buildings.json`, `upgrades.json`, `globals.json`.
2. Add **`pnpm balance:validate`** in CI.
3. Start by **exporting one subsystem** (e.g., all `BUILDINGS` numeric fields) — proves the pipeline before migrating hero logic constants.

---

## 7. Summary

- **Excel as the literal runtime source:** usually **no** — use **typed JSON/YAML** loaded or imported at build time.
- **Excel as a designer-friendly editor exporting that data:** often **yes** for large teams.
- The game already centralizes some globals (`VARS`) but **most balance** sits in **large TS tables + scattered literals**; documenting those (as in this file and **`GDD.md`**) is the first step before any export pipeline.

---

## Related docs

- `docs/GDD.md` — structure and upgrade ID lists (reference for IDs when authoring data).
- `docs/BALANCE_PIPELINE.md` — phased plan to introduce `balance/*.json` without breaking the game.
