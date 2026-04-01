# Meteor Base Defense — Performance Optimization Plan

This document outlines a practical path to improve runtime performance without rewriting the game from scratch. Items are ordered roughly by **impact vs. effort**; adjust based on profiling.

---

## 1. Establish baselines and measure

1. **Browser profiling**
   - Chrome Performance panel: record 30–60s during a heavy wave + build phase.
   - Note: long tasks, `update*` frame time, scripting vs. rendering vs. GPU.
2. **Mark hot paths in code** (optional): wrap `update`, `updateDefenses`, `updateAsteroids`, `updateResources` with `performance.mark/measure` in dev builds.
3. **Target metrics** (example goals):
   - Steady **60 FPS** on a mid-range laptop at default quality during wave 10+.
   - No **>50ms** main-thread spikes from a single system.

---

## 2. Rendering (Three.js)

### 2.1 Reduce draw calls and mesh count

- **InstancedMesh** for repeated visuals: asteroids (same base geometry, per-instance matrix + color), shots/explosions if many particles, grid helpers.
- **Merge static geometry** where materials allow (e.g., ground tiles, distant decor) into fewer meshes.
- **LOD (level of detail)**: lower-poly asteroid/building meshes beyond a camera distance; swap or scale detail with distance.

### 2.2 Materials and lights

- Prefer **MeshStandardMaterial** tuning over excessive lights; use capped shadow map size and shadow casters only on key objects.
- **Frustum culling** is automatic; ensure very large invisible objects are not blocking culling incorrectly.

### 2.3 Per-frame work in the render loop

- The game calls `renderer.render` every frame even when paused (acceptable). Avoid allocating `new THREE.Vector3` / `new Color` in hot loops; reuse class-level temporaries (partially done already — extend pattern).

---

## 3. Game logic and algorithms

### 3.1 Targeting and spatial queries

- **Defense targeting** currently scans all asteroids for each weapon. With many turrets and rocks, this is **O(turrets × asteroids)**.
  - Introduce a **uniform grid** or **spatial hash** (cell size ~ max weapon range / 2) storing asteroid references by cell.
  - Each tick, clear/rebuild or incremental-update the grid from asteroid positions; weapons query only nearby cells.
- **AOE / conduit / aura** loops over all buildings: same structure can support “buildings in radius” queries.

### 3.2 Throttle UI state emission

- `emitState` runs from `update` every frame, which drives React state. Consider:
  - Emitting at **10–20 Hz** for non-critical fields, or
  - **Dirty flags** (credits/supply/power changed → emit full state; otherwise skip).
- Coalesce `setState` in React (e.g., requestAnimationFrame batching) if partial state updates are added later.

### 3.3 Wave and economy ticks

- Economy loop iterates all buildings each tick (unavoidable at current scale, but cheap). If counts grow, **partition buildings by type** (economy vs. defenses) to avoid branching on every entry.

### 3.4 Garbage collection

- Avoid **closures per frame** and short-lived arrays in `updateDefenses`, missiles, nova photons. Prefer pooled objects or pre-sized buffers where hotspots show allocations.

---

## 4. React UI

- **Memoize** heavy derived data in `App.tsx` (already partially done); avoid recreating large structures when `wheelOpen` toggles if inputs unchanged.
- **Virtualize** skill tree only if node count grows substantially; current hex layout may be fine.
- Defer non-urgent UI (e.g., discovery toast) with short timeouts if needed.

---

## 5. Assets and audio

- **Textures**: power-of-two sizes, compressed formats (Basis/KTX2) if you add many textures; current minimal aesthetic may not need this yet.
- **Audio**: Howler already streams some music; keep SFX decode cost low (OGG/WebM), avoid loading duplicate paths.

---

## 6. Build and delivery

- **Code splitting**: lazy-load `App` skill-tree panels or non-critical routes if the bundle grows.
- **Production build**: ensure minification and tree-shaking; audit accidental imports of dev-only tools.

---

## 7. Difficulty scaling audit

- Wave spawn formulas and asteroid counts scale with wave index and difficulty. If late-game bogs down, **cap simultaneous asteroids** or **stagger spawns** with the same DPS budget — a design lever that also helps performance.

---

## 8. Suggested phased roadmap

| Phase | Focus | Outcome |
|-------|--------|---------|
| A | Profiling + `emitState` throttling | Less React work, clearer hotspots |
| B | Spatial grid for weapons vs. asteroids | Major win when counts are high |
| C | Instancing for asteroids (and similar) | Fewer draw calls |
| D | LOD + shadow tuning | GPU headroom on low-end |

Re-profile after each phase so effort tracks real bottlenecks on your target hardware.
