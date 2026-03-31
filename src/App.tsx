import { useEffect, useMemo, useRef, useState } from 'react'
import { BaseDefenseGame, BUILDINGS, UPGRADES, type BuildingCategory, type BuildingId, type GameDifficulty, type UpgradeId } from './game/BaseDefenseGame'

type State = {
  credits: number
  supplyUsed: number
  supplyCap: number
  powerStored: number
  powerCap: number
  wave: number
  waveReady: boolean
  waveInProgress: boolean
  waveSpawnProgress: number
  waveSpawnEnded: boolean
  inactiveTimeLeftSec: number
  asteroidsRemaining: number
  asteroidDiscovery: { variant: string; name: string; description: string; color: number } | null
  unlockedBuildingIds: BuildingId[]
  purchasedUpgradeIds: UpgradeId[]
  refundableUpgradeIds: UpgradeId[]
  selected: BuildingId
  gameOver: boolean
}

const INITIAL_STATE: State = {
  credits: 650,
  supplyUsed: 0,
  supplyCap: 0,
  powerStored: 20,
  powerCap: 20,
  wave: 0,
  waveReady: true,
  waveInProgress: false,
  waveSpawnProgress: 0,
  waveSpawnEnded: false,
  inactiveTimeLeftSec: 0,
  asteroidsRemaining: 0,
  asteroidDiscovery: null,
  unlockedBuildingIds: [
    'command_center',
    'supply_depot_s',
    'supply_depot_l',
    'support_node',
    'factory_business',
    'refinery',
    'mega_refinery',
    'generator_small',
    'battery_small',
    'auto_turret',
    'auto_turret_large',
    'siege_cannon',
    'heavy_siege_gun',
    'aa_gun',
    'railgun',
    'missile_launcher_s',
    // The real unlock state comes from the game instance; this is just a UI placeholder.
  ],
  purchasedUpgradeIds: ['core_protocol'],
  refundableUpgradeIds: [],
  selected: 'auto_turret',
  gameOver: false,
}

type Phase = 'menu' | 'playing' | 'gameover'

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const gameRef = useRef<BaseDefenseGame | null>(null)
  const [state, setState] = useState<State>(INITIAL_STATE)
  const [wheelOpen, setWheelOpen] = useState(false)
  const wheelOpenRef = useRef(false)
  const wheelOpenStateRef = useRef(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const upgradeOpenRef = useRef(false)
  const [skillCam, setSkillCam] = useState({ x: 0, y: 0, zoom: 1 })
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight })
  const hoveredUpgradeRef = useRef<UpgradeId | undefined>(undefined)
  const hoveredUpgradeCanBuyRef = useRef(false)
  const [phase, setPhase] = useState<Phase>('menu')
  const [sessionId, setSessionId] = useState(0)
  const [lastWave, setLastWave] = useState(0)
  const [virtualCursor, setVirtualCursor] = useState({ x: 0, y: -118 })
  const virtualCursorLiveRef = useRef(virtualCursor)
  const pendingLockedWheelSelectionRef = useRef<BuildingId | undefined>(undefined)
  const categorySelectionRef = useRef<Partial<Record<BuildingCategory, BuildingId>>>({})
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>('hard')
  const runConfigRef = useRef<{ mode?: 'normal' | 'sandbox'; difficulty?: GameDifficulty }>({
    mode: 'normal',
    difficulty: 'hard',
  })

  useEffect(() => {
    if (phase !== 'playing') return
    const canvas = canvasRef.current
    if (!canvas) return
    const game = new BaseDefenseGame(canvas, runConfigRef.current)
    game.onStateChange = (s) => {
      setState(s)
      if (s.gameOver) {
        setLastWave(s.wave)
        setPhase('gameover')
      }
    }
    game.start()
    gameRef.current = game
    return () => {
      game.stop()
      gameRef.current = null
    }
  }, [phase, sessionId])

  const categoryOrder: BuildingCategory[] = ['structural', 'economy', 'electrical', 'turrets', 'missile', 'energy']
  const categoryLabel: Record<BuildingCategory, string> = {
    structural: 'Structural',
    economy: 'Economy',
    electrical: 'Electrical',
    turrets: 'Turrets',
    missile: 'Missile',
    energy: 'Energy',
  }
  const categoryColor: Record<BuildingCategory, string> = {
    structural: '#60a5fa',
    economy: '#22c55e',
    electrical: '#eab308',
    turrets: '#f97316',
    missile: '#ef4444',
    energy: '#22d3ee',
  }

  const buildingDefs = useMemo(() => {
    const order = new Map(categoryOrder.map((c, i) => [c, i]))
    return [...BUILDINGS].sort((a, b) => {
      const ca = order.get(a.category) ?? 0
      const cb = order.get(b.category) ?? 0
      return ca - cb
    })
  }, [])
  const unlockedSet = useMemo(() => new Set(state.unlockedBuildingIds), [state.unlockedBuildingIds])
  const selectedDef = buildingDefs.find((b) => b.id === state.selected) ?? buildingDefs[0]
  const selectedCategory = selectedDef?.category ?? 'structural'
  const categoryItems = useMemo(
    () => buildingDefs.filter((b) => b.category === selectedCategory),
    [buildingDefs, selectedCategory],
  )
  const itemRadius = 118
  const itemLayout = useMemo(
    () =>
      categoryItems.map((b, i) => {
        // Icons in a category are permanently placed at fixed angles.
        const angle = (i * (360 / Math.max(1, categoryItems.length)) * Math.PI) / 180
        return { b, x: Math.sin(angle) * itemRadius, y: -Math.cos(angle) * itemRadius }
      }),
    [categoryItems],
  )
  const hoveredItem = useMemo(() => {
    if (itemLayout.length === 0) return undefined
    let best = itemLayout[0]
    let bestD = Infinity
    for (const entry of itemLayout) {
      const dx = entry.x - virtualCursor.x
      const dy = entry.y - virtualCursor.y
      const d = dx * dx + dy * dy
      if (d < bestD) {
        bestD = d
        best = entry
      }
    }
    return best.b
  }, [itemLayout, virtualCursor.x, virtualCursor.y])
  const virtualAngle = Math.atan2(virtualCursor.y, virtualCursor.x)
  const virtualLength = Math.hypot(virtualCursor.x, virtualCursor.y)
  const wheelSize = 320
  const wheelCenter = wheelSize / 2
  const powerTier = (v: number | undefined) => {
    const p = v ?? 0
    if (p < 0.5) return 'Low'
    if (p < 2.5) return 'Med'
    return 'High'
  }
  const buildDesc = (b: (typeof buildingDefs)[number]) => {
    const [u1, u2] = b.wheelDetails()
    return {
      cost: `Cost: ${b.creditCost}c`,
      supply: `Supply Usage: ${b.supplyCost}`,
      power: `Power Consumption: ${powerTier(b.powerDrainPerSec)}`,
      unique: `${u1} | ${u2}`,
    }
  }
  const selectedStat = buildDesc(selectedDef)
  const purchasedUpgrades = useMemo(() => new Set(state.purchasedUpgradeIds), [state.purchasedUpgradeIds])
  const refundableUpgrades = useMemo(() => new Set(state.refundableUpgradeIds), [state.refundableUpgradeIds])
  const skillHexLayout = useMemo(() => {
    type Hex = { q: number; r: number }
    const dirs: Hex[] = [
      { q: 1, r: 0 },
      { q: 1, r: -1 },
      { q: 0, r: -1 },
      { q: -1, r: 0 },
      { q: -1, r: 1 },
      { q: 0, r: 1 },
    ]
    const byId = new Map(UPGRADES.map((u) => [u.id, u]))
    const catOrder = new Map(categoryOrder.map((c, i) => [c, i]))
    const memo = new Map<UpgradeId, number>()
    const depthOf = (id: UpgradeId): number => {
      if (id === 'core_protocol') return 0
      const cached = memo.get(id)
      if (cached !== undefined) return cached
      const up = byId.get(id)
      if (!up || !up.prereqIds || up.prereqIds.length === 0) {
        memo.set(id, 1)
        return 1
      }
      const d = Math.max(...up.prereqIds.map((p) => depthOf(p) + 1))
      memo.set(id, d)
      return d
    }
    const upgrades = UPGRADES.filter((u) => u.id !== 'core_protocol').sort((a, b) => {
      const da = depthOf(a.id)
      const db = depthOf(b.id)
      if (da !== db) return da - db
      const ca = catOrder.get(a.category) ?? 0
      const cb = catOrder.get(b.category) ?? 0
      if (ca !== cb) return ca - cb
      return a.label.localeCompare(b.label)
    })

    const coordById = new Map<UpgradeId, Hex>()
    coordById.set('core_protocol', { q: 0, r: 0 })
    const occupied = new Set<string>(['0,0'])
    const hasOccupiedNeighbor = (h: Hex) =>
      dirs.some((d) => occupied.has(`${h.q + d.q},${h.r + d.r}`))

    // Build true concentric hex rings, but leave roughly 1/5 blank slots distributed.
    const chosenCells: Hex[] = []
    let ring = 1
    let ordinal = 0
    const blankEvery = 5 // 1/5 blank
    while (chosenCells.length < upgrades.length) {
      let cur: Hex = { q: -ring, r: ring }
      for (let side = 0; side < 6; side++) {
        for (let step = 0; step < ring; step++) {
          ordinal += 1
          const candidate = { q: cur.q, r: cur.r }
          const shouldBlank = ordinal % blankEvery === 0
          if (!shouldBlank || !hasOccupiedNeighbor(candidate)) {
            chosenCells.push(candidate)
            occupied.add(`${candidate.q},${candidate.r}`)
            if (chosenCells.length >= upgrades.length) break
          }
          cur = { q: cur.q + dirs[side].q, r: cur.r + dirs[side].r }
        }
        if (chosenCells.length >= upgrades.length) break
      }
      ring += 1
    }
    const ringOf = (h: Hex) => (Math.abs(h.q) + Math.abs(h.r) + Math.abs(h.q + h.r)) / 2
    const angleOf = (h: Hex) => Math.atan2(h.r * 1.5, (Math.sqrt(3) / 2) * (2 * h.q + h.r))
    const angleByCat: Record<BuildingCategory, number> = {
      structural: Math.PI,
      economy: (-2 * Math.PI) / 3,
      electrical: (2 * Math.PI) / 3,
      turrets: -Math.PI / 3,
      missile: 0,
      energy: Math.PI / 3,
    }
    const remainingCells = [...chosenCells]
    for (const up of upgrades) {
      const desiredRing = Math.max(1, depthOf(up.id))
      const targetAngle = angleByCat[up.category]
      let bestIdx = 0
      let bestScore = Infinity
      for (let i = 0; i < remainingCells.length; i++) {
        const c = remainingCells[i]
        const dr = Math.abs(ringOf(c) - desiredRing)
        let da = Math.abs(angleOf(c) - targetAngle)
        if (da > Math.PI) da = 2 * Math.PI - da
        const score = dr * 2.5 + da
        if (score < bestScore) {
          bestScore = score
          bestIdx = i
        }
      }
      const picked = remainingCells.splice(bestIdx, 1)[0]
      coordById.set(up.id, picked)
    }

    const cellSize = 150
    const nodes: Array<{ id: UpgradeId; x: number; y: number }> = []
    for (const up of UPGRADES) {
      const c = coordById.get(up.id) ?? { q: 0, r: 0 }
      const x = cellSize * Math.sqrt(3) * (c.q + c.r / 2)
      const y = cellSize * 1.5 * c.r
      nodes.push({ id: up.id, x, y })
    }

    const idByCoord = new Map<string, UpgradeId>()
    for (const [id, c] of coordById) idByCoord.set(`${c.q},${c.r}`, id)
    const adj = {} as Record<UpgradeId, UpgradeId[]>
    for (const u of UPGRADES) {
      const c = coordById.get(u.id) ?? { q: 0, r: 0 }
      const neighbors: UpgradeId[] = []
      for (const d of dirs) {
        const n = idByCoord.get(`${c.q + d.q},${c.r + d.r}`)
        if (n) neighbors.push(n)
      }
      adj[u.id] = neighbors
    }

    const edges = new Set<string>()
    for (const [id, list] of Object.entries(adj) as Array<[UpgradeId, UpgradeId[]]>) {
      for (const to of list) {
        const a = id < to ? id : to
        const b = id < to ? to : id
        edges.add(`${a}|${b}`)
      }
    }
    const edgeList = [...edges].map((k) => {
      const [from, to] = k.split('|') as [UpgradeId, UpgradeId]
      return { from, to }
    })

    return { nodes, adj, edges: edgeList }
  }, [categoryOrder])
  const skillNodes = skillHexLayout.nodes
  const skillAdj = skillHexLayout.adj
  const skillEdges = skillHexLayout.edges
  const unlockedUpgradeSet = useMemo(() => {
    const s = new Set<UpgradeId>(['core_protocol'])
    for (const p of purchasedUpgrades) {
      s.add(p)
      for (const n of skillAdj[p] ?? []) s.add(n)
    }
    return s
  }, [purchasedUpgrades, skillAdj])
  const canBuyUpgrade = (id: UpgradeId, cost: number) =>
    unlockedUpgradeSet.has(id) && !purchasedUpgrades.has(id) && state.credits >= cost

  const findUnlockUpgradeForBuilding = (id: BuildingId): UpgradeId | undefined => {
    const candidates = UPGRADES.filter((u) => (u.unlockBuildingIds ?? []).includes(id) && !purchasedUpgrades.has(u.id))
    if (candidates.length === 0) return undefined
    const byId = new Map(UPGRADES.map((u) => [u.id, u]))
    const memo = new Map<UpgradeId, number>()
    const depth = (uid: UpgradeId): number => {
      const cached = memo.get(uid)
      if (cached !== undefined) return cached
      const up = byId.get(uid)
      if (!up) return 0
      const d = 1 + Math.max(0, ...(up.prereqIds ?? []).map((p) => depth(p)))
      memo.set(uid, d)
      return d
    }
    candidates.sort((a, b) => depth(a.id) - depth(b.id))
    return candidates[0]?.id
  }

  const openUpgradeForBuilding = (buildingId: BuildingId) => {
    const target = findUnlockUpgradeForBuilding(buildingId)
    if (!target) return
    const node = skillNodes.find((n) => n.id === target)
    if (!node) return
    wheelOpenRef.current = false
    setWheelOpen(false)
    upgradeOpenRef.current = true
    setUpgradeOpen(true)
    // Center the target upgrade under the reticle.
    setSkillCam((prev) => ({ ...prev, x: node.x, y: node.y }))
  }

  const jumpCategory = (dir: 1 | -1) => {
    const curIdx = categoryOrder.indexOf(selectedCategory)
    for (let step = 1; step <= categoryOrder.length; step++) {
      const nextIdx = (curIdx + dir * step + categoryOrder.length) % categoryOrder.length
      const nextCat = categoryOrder[nextIdx]
      const remembered = categorySelectionRef.current[nextCat]
      const rememberedValid = remembered && buildingDefs.some((b) => b.id === remembered && b.category === nextCat)
      const fallback = buildingDefs.find((b) => b.category === nextCat)
      const next = rememberedValid ? remembered : fallback?.id
      if (next) {
        gameRef.current?.setSelected(next)
        return
      }
    }
  }
  const selectedDescription = useMemo(() => {
    const id = selectedDef?.id
    if (!id) return ''
    if (id === 'command_center') return 'Primary bunker. If all command centers are destroyed, the run ends.'
    if (id === 'supply_depot_s') return 'Compact supply depot that raises your max Supply.'
    if (id === 'supply_depot_l') return 'Larger supply depot with better Supply capacity.'
    if (id === 'repair_bay') return 'Launches two drones that heal damaged structures over time.'
    if (id === 'support_node') return 'Pulses periodic area healing to nearby structures.'
    if (id === 'reconstruction_yard') return 'Auto-rebuilds nearby destroyed buildings at 50% cost.'
    if (id === 'factory_business') return 'Small economy node: low credits, very frequent payouts.'
    if (id === 'factory_factory') return 'Larger factory with stronger output and low power demand.'
    if (id === 'factory_megacomplex') return 'Mega factory: expensive, large footprint, very high efficient output.'
    if (id === 'refinery') return 'Compact refinery: rapid cash pulses with high power cost.'
    if (id === 'mega_refinery') return 'Mega refinery: very rapid cash generation, very high power draw.'
    if (id === 'chemical_installation') return 'High-tech dome economy building that damages nearby structures.'
    if (id === 'generator_small') return 'Compact power source for early infrastructure.'
    if (id === 'generator_large') return 'Large-area generator with strong sustained power output.'
    if (id === 'battery_small') return 'Small battery bank that increases maximum power storage.'
    if (id === 'battery_large') return 'Large battery bank with major max-power capacity boost.'
    if (id === 'pylon') return 'Networked pylon: gains power from nearby pylons, chain-reacts on destruction.'
    if (id === 'nuclear_plant') return 'Massive power output but drains credits each tick; halts when broke.'
    if (id === 'auto_turret') return 'Cheap short-range machine-gun turret with high fire rate.'
    if (id === 'auto_turret_large') return '2x2 auto-turret with higher sustained damage and power draw.'
    if (id === 'siege_cannon') return 'Low-profile long-range artillery with slow heavy shots.'
    if (id === 'heavy_siege_gun') return 'Heavy siege cannon platform with stronger single-target hits.'
    if (id === 'aa_gun') return 'Low-profile 4-barrel gun with explosive shots and very long range.'
    if (id === 'railgun') return 'Charges from power, then fires high-damage piercing beam shots.'
    if (id === 'missile_launcher_s') return '2x2 launcher with lower power cost and reliable death-location missile blasts.'
    if (id === 'missile_launcher_m') return '3x3 launcher variant with stronger constant missile pressure and better AOE.'
    if (id === 'portable_silo') return '1x1 slow silo: retargeting missiles with bigger blasts and higher per-shot damage.'
    if (id === 'missile_silo') return '3x3 heavy silo with long reload, retargeting missiles, and large AOE strikes.'
    if (id === 'nuclear_silo') return '5x5 extreme silo with huge retargeting missile damage and massive splash radius.'
    if (id === 'hydra_launcher') return '12-round burst launcher (0.1s spacing), fastest missiles, no splash, stacking volley damage.'
    if (id === 'shield_generator_m') return '3x3 medium dome generator creating a 12-radius shield field.'
    if (id === 'shield_generator_l') return '5x5 large dome generator creating a 24-radius shield field.'
    if (id === 'tesla_tower') return '2x2 tower with top emitter that zaps all enemies in range with rapid lightning DoT.'
    if (id === 'plasma_laser_s') return 'Small long-range beam turret with high sustained power cost.'
    if (id === 'plasma_laser_m') return 'Medium long-range plasma beam with stronger sustained damage.'
    if (id === 'plasma_laser_l') return 'Large long-range plasma beam platform with highest energy-beam output.'
    return ''
  }, [selectedDef])
  const selectedCatIndex = categoryOrder.indexOf(selectedCategory)
  const prevCategory = categoryOrder[(selectedCatIndex - 1 + categoryOrder.length) % categoryOrder.length]
  const nextCategory = categoryOrder[(selectedCatIndex + 1) % categoryOrder.length]

  useEffect(() => {
    if (phase !== 'playing') return
    categorySelectionRef.current[selectedCategory] = state.selected
  }, [phase, selectedCategory, state.selected])

  useEffect(() => {
    if (phase !== 'playing') return
    if (buildingDefs.length === 0) return
    if (!buildingDefs.some((b) => b.id === state.selected)) {
      gameRef.current?.setSelected(buildingDefs[0].id)
    }
  }, [phase, buildingDefs, state.selected])

  useEffect(() => {
    if (phase !== 'playing') return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        if (upgradeOpenRef.current) {
          upgradeOpenRef.current = false
          setUpgradeOpen(false)
          if (!wheelOpenRef.current) {
            pendingLockedWheelSelectionRef.current = undefined
            wheelOpenRef.current = true
            setWheelOpen(true)
          }
          return
        }
        if (!wheelOpenRef.current) {
          pendingLockedWheelSelectionRef.current = undefined
          wheelOpenRef.current = true
          setWheelOpen(true)
        }
      }
      if (e.key === 'u' || e.key === 'U') {
        if (e.repeat) return
        if (wheelOpenRef.current) {
          wheelOpenRef.current = false
          setWheelOpen(false)
        }
        const next = !upgradeOpenRef.current
        upgradeOpenRef.current = next
        setUpgradeOpen(next)
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        wheelOpenRef.current = false
        setWheelOpen(false)
        const pending = pendingLockedWheelSelectionRef.current
        pendingLockedWheelSelectionRef.current = undefined
        if (pending && !unlockedSet.has(pending)) openUpgradeForBuilding(pending)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [phase, unlockedSet, skillNodes, purchasedUpgrades])

  useEffect(() => {
    if (phase !== 'playing') return
    const onWheel = (e: WheelEvent) => {
      if (upgradeOpenRef.current) {
        e.preventDefault()
        const dir = Math.sign(e.deltaY)
        if (dir === 0) return
        setSkillCam((prev) => ({ ...prev, zoom: Math.max(0.45, Math.min(2.2, prev.zoom - dir * 0.08)) }))
        return
      }
      if (wheelOpenRef.current) {
        e.preventDefault()
        const dir = Math.sign(e.deltaY)
        if (dir === 0) return
        jumpCategory(dir > 0 ? 1 : -1)
      }
    }
    window.addEventListener('wheel', onWheel, { passive: false })
    return () => window.removeEventListener('wheel', onWheel as any)
  }, [phase, selectedCategory, buildingDefs])

  useEffect(() => {
    // When the wheel opens, start the virtual cursor on the currently selected icon.
    if (!wheelOpen) return
    const selected = itemLayout.find((e) => e.b.id === state.selected)
    if (selected) setVirtualCursor({ x: selected.x, y: selected.y })
    if (selected) virtualCursorLiveRef.current = { x: selected.x, y: selected.y }
  }, [wheelOpen, itemLayout])

  useEffect(() => {
    const onResize = () => setViewport({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  useEffect(() => {
    wheelOpenStateRef.current = wheelOpen
  }, [wheelOpen])

  useEffect(() => {
    upgradeOpenRef.current = upgradeOpen
  }, [upgradeOpen])

  useEffect(() => {
    if (phase !== 'playing') return
    const onMouseMove = (e: MouseEvent) => {
      const dx = e.movementX ?? 0
      const dy = e.movementY ?? 0
      if (dx === 0 && dy === 0) return
      if (upgradeOpenRef.current) {
        // Pan direction should feel like "dragging the canvas".
        setSkillCam((prev) => ({ ...prev, x: prev.x + dx / prev.zoom, y: prev.y + dy / prev.zoom }))
        return
      }
      if (wheelOpenStateRef.current) {
        setVirtualCursor((prev) => {
          let x = prev.x + dx
          let y = prev.y + dy
          const len = Math.hypot(x, y)
          if (len > itemRadius && len > 0.0001) {
            const s = itemRadius / len
            x *= s
            y *= s
          }
          virtualCursorLiveRef.current = { x, y }
          if (itemLayout.length > 0) {
            let best = itemLayout[0]
            let bestD = Infinity
            for (const entry of itemLayout) {
              const ddx = entry.x - x
              const ddy = entry.y - y
              const d2 = ddx * ddx + ddy * ddy
              if (d2 < bestD) {
                bestD = d2
                best = entry
              }
            }
            if (best.b.id !== state.selected) {
              gameRef.current?.setSelected(best.b.id)
              pendingLockedWheelSelectionRef.current = unlockedSet.has(best.b.id) ? undefined : best.b.id
            }
          }
          return { x, y }
        })
      }
    }
    window.addEventListener('mousemove', onMouseMove)
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [phase, itemRadius, itemLayout, state.selected, unlockedSet, skillNodes, purchasedUpgrades])

  useEffect(() => {
    if (phase !== 'playing') return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        gameRef.current?.startNextWave()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [phase])

  const tryPurchasePathTo = (targetId: UpgradeId) => {
    const targetDef = UPGRADES.find((u) => u.id === targetId)
    if (!targetDef) return

    // BFS from "any purchased node" to the target over the adjacency graph.
    const starts = [...purchasedUpgrades]
    if (starts.length === 0) starts.push('core_protocol')
    const q: UpgradeId[] = []
    const prev = new Map<UpgradeId, UpgradeId | null>()
    for (const s of starts) {
      q.push(s)
      prev.set(s, null)
    }
    while (q.length) {
      const cur = q.shift()!
      if (cur === targetId) break
      for (const nxt of skillAdj[cur] ?? []) {
        if (prev.has(nxt)) continue
        prev.set(nxt, cur)
        q.push(nxt)
      }
    }
    if (!prev.has(targetId)) return

    const path: UpgradeId[] = []
    let cur: UpgradeId | null = targetId
    while (cur) {
      path.push(cur)
      cur = prev.get(cur) ?? null
    }
    path.reverse()

    // Try to purchase along the path in order, stopping if we can't afford the next node.
    let creditsLeft = state.credits
    const purchasedLocal = new Set(purchasedUpgrades)
    for (const id of path) {
      if (purchasedLocal.has(id)) continue
      const def = UPGRADES.find((u) => u.id === id)
      if (!def) return
      if (creditsLeft < def.creditCost) return
      creditsLeft -= def.creditCost
      purchasedLocal.add(id)
      gameRef.current?.purchaseUpgrade(id)
    }
  }

  useEffect(() => {
    if (phase !== 'playing' || !upgradeOpen) return
    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return
      const id = hoveredUpgradeRef.current
      if (!id) return
      e.preventDefault()
      if (refundableUpgrades.has(id)) {
        gameRef.current?.refundUpgrade(id)
        return
      }
      if (hoveredUpgradeCanBuyRef.current) {
        gameRef.current?.purchaseUpgrade(id)
        return
      }
      // If it's locked, attempt to buy a chain leading to it.
      if (!purchasedUpgrades.has(id)) tryPurchasePathTo(id)
    }
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [phase, upgradeOpen, refundableUpgrades, purchasedUpgrades, skillAdj, state.credits])

  useEffect(() => {
    if (phase !== 'playing') return
    gameRef.current?.setWheelOpen(wheelOpen || upgradeOpen)
  }, [wheelOpen, upgradeOpen, phase])

  const startNewRun = () => {
    runConfigRef.current = { mode: 'normal', difficulty: selectedDifficulty }
    wheelOpenRef.current = false
    upgradeOpenRef.current = false
    setWheelOpen(false)
    setUpgradeOpen(false)
    setState(INITIAL_STATE)
    setLastWave(0)
    categorySelectionRef.current = {}
    setSessionId((v) => v + 1)
    setPhase('playing')
  }

  const startSandbox = () => {
    runConfigRef.current = { mode: 'sandbox', difficulty: selectedDifficulty }
    wheelOpenRef.current = false
    upgradeOpenRef.current = false
    setWheelOpen(false)
    setUpgradeOpen(false)
    setState(INITIAL_STATE)
    setLastWave(0)
    categorySelectionRef.current = {}
    setSessionId((v) => v + 1)
    setPhase('playing')
  }

  const goToMenu = () => {
    wheelOpenRef.current = false
    upgradeOpenRef.current = false
    setWheelOpen(false)
    setUpgradeOpen(false)
    setPhase('menu')
  }

  const waveCircleRadius = 22
  const waveCircleStroke = 4
  const waveCircleCirc = 2 * Math.PI * waveCircleRadius
  const waveProgress = state.waveInProgress
    ? Math.max(0, Math.min(1, state.waveSpawnProgress))
    : Math.max(0, Math.min(1, state.inactiveTimeLeftSec / 60))
  const waveDashOffset = waveCircleCirc * (1 - waveProgress)
  const treeW = Math.max(820, viewport.w - 80)
  const treeH = Math.max(520, viewport.h - 210)
  const treeCx = treeW / 2
  const treeCy = treeH / 2
  const renderedSkillNodes = useMemo(
    () =>
      skillNodes.map((n) => ({
        ...n,
        sx: treeCx + (n.x - skillCam.x) * skillCam.zoom,
        sy: treeCy + (n.y - skillCam.y) * skillCam.zoom,
      })),
    [skillNodes, skillCam],
  )
  // Slightly smaller nodes (the new tree got busy).
  const nodeScale = Math.max(0.45, Math.min(1.0, skillCam.zoom * 0.9))
  const hoveredUpgradeId = useMemo(() => {
    let best: UpgradeId | undefined
    let bestDist = Infinity
    for (const n of renderedSkillNodes) {
      const d = Math.hypot(n.sx - treeCx, n.sy - treeCy)
      if (d < bestDist) {
        bestDist = d
        best = n.id
      }
    }
    return bestDist <= 30 * nodeScale ? best : undefined
  }, [renderedSkillNodes, treeCx, treeCy, nodeScale])
  const hoveredUpgradeDef = UPGRADES.find((u) => u.id === hoveredUpgradeId)
  const hoveredNodeCanBuy = hoveredUpgradeDef ? canBuyUpgrade(hoveredUpgradeDef.id, hoveredUpgradeDef.creditCost) : false

  useEffect(() => {
    hoveredUpgradeRef.current = hoveredUpgradeId
    hoveredUpgradeCanBuyRef.current = hoveredNodeCanBuy
  }, [hoveredUpgradeId, hoveredNodeCanBuy])

  return (
    <div className="app-root" style={{ ['--accent-color' as string]: categoryColor[selectedCategory] }}>
      <canvas ref={canvasRef} className="game-canvas" />

      {/* Crosshair (target is screen center while mouse-look is active) */}
      {phase === 'playing' && <div className="crosshair" />}

      {phase === 'playing' && state.wave === 0 && !state.waveInProgress && (
        <div className="hud top-left">
          <h1>Meteor Base Defense</h1>
          <p>Defend the base through waves.</p>
        </div>
      )}

      {phase === 'playing' && (
        <div className="hud wave-timer">
          <svg
            width={waveCircleRadius * 2 + 16}
            height={waveCircleRadius * 2 + 16}
            viewBox={`0 0 ${waveCircleRadius * 2 + 16} ${waveCircleRadius * 2 + 16}`}
            className="wave-timer-svg"
            aria-hidden="true"
          >
            <circle
              cx={waveCircleRadius + 8}
              cy={waveCircleRadius + 8}
              r={waveCircleRadius}
              fill="none"
              stroke="rgba(148, 163, 184, 0.22)"
              strokeWidth={waveCircleStroke}
            />
            <circle
              cx={waveCircleRadius + 8}
              cy={waveCircleRadius + 8}
              r={waveCircleRadius}
              fill="none"
              stroke="color-mix(in srgb, var(--accent-color, #22d3ee) 85%, white)"
              strokeWidth={waveCircleStroke}
              strokeLinecap="round"
              strokeDasharray={waveCircleCirc}
              strokeDashoffset={waveDashOffset}
              transform={`rotate(-90 ${waveCircleRadius + 8} ${waveCircleRadius + 8})`}
            />
          </svg>

          <div className="wave-timer-text">
            {state.wave === 0 && !state.waveInProgress ? (
              <>
                Press <b>Space</b> to start
              </>
            ) : state.waveInProgress ? (
              state.waveSpawnEnded ? (
                <>
                  Asteroids remaining: <b>{state.asteroidsRemaining}</b>
                </>
              ) : (
                <>Spawning asteroids…</>
              )
            ) : (
              <>
                Next wave in <b>{Math.ceil(state.inactiveTimeLeftSec)}s</b> (Space)
              </>
            )}
          </div>
        </div>
      )}

      {phase === 'playing' && (
        <div className="hud top-right stats">
          <div>Wave: {state.wave}</div>
          <div>Credits: {state.credits}</div>
          <div>
            Supply: {state.supplyUsed}/{state.supplyCap}
          </div>
          <div>
            Power: {state.powerStored}/{state.powerCap}
          </div>
        </div>
      )}
      {phase === 'playing' && state.asteroidDiscovery && (
        <div className="asteroid-discovery-toast">
          <div
            className="asteroid-discovery-icon"
            style={{
              ['--asteroid-color' as string]: `#${state.asteroidDiscovery.color.toString(16).padStart(6, '0')}`,
            }}
          />
          <div className="asteroid-discovery-text">
            <div className="asteroid-discovery-title">New Asteroid: {state.asteroidDiscovery.name}</div>
            <div className="asteroid-discovery-body">{state.asteroidDiscovery.description}</div>
          </div>
        </div>
      )}

      {phase === 'playing' && (
        <div className="hud bottom-info">
          <div className="selected-name">{selectedDef?.label}</div>
          <div className="selected-desc">{selectedDescription}</div>
          <div className="selected-meta">
            {selectedStat.cost} | {selectedStat.supply}
            <br />
            {selectedStat.power}
            <br />
            {selectedStat.unique}
          </div>
        </div>
      )}

      {phase === 'playing' && upgradeOpen && (
        <div
          className="upgrade-overlay"
          aria-hidden="true"
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <div className="upgrade-panel">
            <div className="upgrade-title">Skill Tree</div>
            <div className="upgrade-subtitle">
              Hold <b>U</b> to keep open. Move mouse to pan, scroll to zoom, center reticle hovers.
            </div>
            <div className="skilltree-canvas" style={{ width: treeW, height: treeH }}>
              <svg className="skilltree-lines" viewBox={`0 0 ${treeW} ${treeH}`} aria-hidden="true">
                {skillEdges.map(({ from, to }) => {
                  const a = renderedSkillNodes.find((k) => k.id === from)
                  const b = renderedSkillNodes.find((k) => k.id === to)
                  if (!a || !b) return null
                  return <line key={`${from}-${to}`} x1={a.sx} y1={a.sy} x2={b.sx} y2={b.sy} className="skilltree-line" />
                })}
              </svg>

              {renderedSkillNodes.map((n) => {
                const up = UPGRADES.find((u) => u.id === n.id)!
                const purchased = purchasedUpgrades.has(n.id)
                const refundable = refundableUpgrades.has(n.id)
                const unlocked = unlockedUpgradeSet.has(n.id)
                const isHovered = hoveredUpgradeId === n.id
                return (
                  <div
                    key={n.id}
                    className={[
                      'skill-node',
                      purchased ? 'purchased' : '',
                      unlocked ? 'unlocked' : 'locked',
                      isHovered ? 'hovered' : '',
                    ].join(' ')}
                    style={{
                      left: `${n.sx}px`,
                      top: `${n.sy}px`,
                      transform: `translate(-50%, -50%) scale(${nodeScale})`,
                      ['--node-color' as string]: categoryColor[up.category],
                    }}
                  >
                    {refundable && <div className="skill-node-refund">$</div>}
                    <div className="skill-node-cat-dot" aria-hidden="true" />
                    <div className="skill-node-label">{up.label}</div>
                    <div className="skill-node-cost">{purchased ? 'Owned' : `${up.creditCost}c`}</div>
                  </div>
                )
              })}
              <div className="skilltree-reticle" />
            </div>
            <div className="skilltree-info">
              {hoveredUpgradeDef ? (
                <>
                  <div className="skilltree-tooltip-title">{hoveredUpgradeDef.label}</div>
                  <div className="skilltree-tooltip-body">{hoveredUpgradeDef.description}</div>
                  <div className="skilltree-tooltip-meta">
                    {purchasedUpgrades.has(hoveredUpgradeDef.id)
                      ? refundableUpgrades.has(hoveredUpgradeDef.id)
                        ? 'Left click to refund this inactive phase'
                        : 'Purchased'
                      : hoveredNodeCanBuy
                        ? 'Left click to purchase'
                        : unlockedUpgradeSet.has(hoveredUpgradeDef.id)
                          ? 'Insufficient credits'
                          : 'Locked: purchase adjacent upgrade first'}
                  </div>
                </>
              ) : (
                <>
                  <div className="skilltree-tooltip-title">Upgrade Details</div>
                  <div className="skilltree-tooltip-body">Move the tree so an upgrade is under the center reticle.</div>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {phase === 'playing' && wheelOpen && (
        <div
          className="wheel-overlay"
          aria-hidden="true"
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
            if (e.button !== 0) return
            // Click selection should use the latest cursor position (not the previous React render).
            if (itemLayout.length === 0) return
            const cur = virtualCursorLiveRef.current
            let best = itemLayout[0]
            let bestD = Infinity
            for (const entry of itemLayout) {
              const dx = entry.x - cur.x
              const dy = entry.y - cur.y
              const d = dx * dx + dy * dy
              if (d < bestD) {
                bestD = d
                best = entry
              }
            }
            if (best?.b) {
              gameRef.current?.setSelected(best.b.id)
              pendingLockedWheelSelectionRef.current = unlockedSet.has(best.b.id) ? undefined : best.b.id
            }
          }}
          onContextMenu={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <div className="wheel-category-outside">{categoryLabel[selectedCategory]}</div>
          <div className="wheel-adjacent wheel-adjacent-left">
            <span className="wheel-adjacent-arrow">◀</span>
            <span
              className="wheel-adjacent-label"
              style={{ ['--adj-color' as string]: categoryColor[prevCategory] }}
            >
              {categoryLabel[prevCategory]}
            </span>
          </div>
          <div className="wheel-adjacent wheel-adjacent-right">
            <span
              className="wheel-adjacent-label"
              style={{ ['--adj-color' as string]: categoryColor[nextCategory] }}
            >
              {categoryLabel[nextCategory]}
            </span>
            <span className="wheel-adjacent-arrow">▶</span>
          </div>
          <div className="wheel">
            <div className="wheel-ring">
              <div className="wheel-ring-track">
                {itemLayout.map(({ b, x, y }) => {
                  const isSelected = b.id === state.selected
                  const isHovered = b.id === hoveredItem?.id
                  const hasUpgrade = unlockedSet.has(b.id)
                  const hasMoney = state.credits >= b.creditCost
                  const hasSupply = state.supplyUsed + b.supplyCost <= state.supplyCap
                  const buildable = hasUpgrade && hasMoney && hasSupply
                  return (
                    <div
                      key={b.id}
                      className={
                        isSelected
                          ? buildable
                            ? 'wheel-item selected'
                            : 'wheel-item selected unaffordable'
                          : isHovered
                            ? buildable
                              ? 'wheel-item hovered'
                              : 'wheel-item hovered unaffordable'
                          : buildable
                            ? 'wheel-item'
                            : 'wheel-item unaffordable'
                      }
                      style={{
                        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                      }}
                    >
                      {!hasUpgrade && <div className="wheel-lock-icon">W</div>}
                      {hasUpgrade && !hasMoney && <div className="wheel-lock-icon">$</div>}
                      <div className="wheel-item-title">{b.label}</div>
                    </div>
                  )
                })}
                <svg className="wheel-virtual-overlay" viewBox={`0 0 ${wheelSize} ${wheelSize}`} aria-hidden="true">
                  <line
                    className="wheel-virtual-line"
                    x1={wheelCenter}
                    y1={wheelCenter}
                    x2={wheelCenter + Math.cos(virtualAngle) * virtualLength}
                    y2={wheelCenter + Math.sin(virtualAngle) * virtualLength}
                  />
                  <circle
                    className="wheel-virtual-cursor"
                    cx={wheelCenter + virtualCursor.x}
                    cy={wheelCenter + virtualCursor.y}
                    r="7"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {phase === 'menu' && (
        <div className="screen-overlay">
          <div className="screen-card">
            <h2>Meteor Base Defense</h2>
            <p>Defend your command center(s) against massive meteor impacts.</p>
            <p className="small">
              Controls: WASD move, Q/E vertical, mouse-look, hold C for build wheel, press U for skill tree, RMB sell, Space starts next wave.
            </p>
            <div className="difficulty-picker">
              {([
                ['easy', 'Easy'],
                ['medium', 'Medium'],
                ['hard', 'Hard'],
                ['brutal', 'Brutal'],
                ['deadly', 'Deadly'],
              ] as Array<[GameDifficulty, string]>).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={selectedDifficulty === id ? 'secondary-btn active' : 'secondary-btn'}
                  onClick={() => setSelectedDifficulty(id)}
                >
                  {label}
                </button>
              ))}
            </div>
            <button type="button" className="primary-btn" onClick={startNewRun}>
              Start Game ({selectedDifficulty[0].toUpperCase() + selectedDifficulty.slice(1)})
            </button>
            <div className="screen-actions" style={{ marginTop: 10 }}>
              <button type="button" className="secondary-btn" onClick={startSandbox}>
                Sandbox (Debug)
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'gameover' && (
        <div className="screen-overlay">
          <div className="screen-card danger">
            <h2>Base Destroyed</h2>
            <p>You survived <b>{lastWave}</b> wave(s).</p>
            <div className="screen-actions">
              <button type="button" className="primary-btn" onClick={startNewRun}>
                Play Again
              </button>
              <button type="button" className="secondary-btn" onClick={goToMenu}>
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
