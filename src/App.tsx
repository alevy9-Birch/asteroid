import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useGameAudioController } from './audio/useGameAudio'
import {
  addScoreRecord,
  computeRunScore,
  type CommanderKey,
} from './highScores'
import { BaseDefenseGame, BUILDINGS, UPGRADES, type BuildingCategory, type BuildingId, type GameDifficulty, type HeroId, type UpgradeId } from './game/BaseDefenseGame'

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
  heroId: HeroId | null
  runStats: {
    moneyEarned: number
    moneySpent: number
    powerProduced: number
    asteroidsKilled: number
    mostCommonBuildingLabel: string
  }
  unlockedBuildingIds: BuildingId[]
  purchasedUpgradeIds: UpgradeId[]
  refundableUpgradeIds: UpgradeId[]
  selected: BuildingId
  gameOver: boolean
}

const INITIAL_STATE: State = {
  credits: 1550,
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
  heroId: null,
  runStats: {
    moneyEarned: 0,
    moneySpent: 0,
    powerProduced: 0,
    asteroidsKilled: 0,
    mostCommonBuildingLabel: '—',
  },
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

const VOLUME_STORAGE_KEY = 'meteor-base-defense-master-volume'
const MENU_CURSOR_MARGIN = 14

function pickMenuHitTarget(x: number, y: number): HTMLElement | null {
  for (const n of document.elementsFromPoint(x, y)) {
    if (!(n instanceof HTMLElement)) continue
    if (n.classList.contains('virtual-menu-cursor')) continue
    const el = n.closest('[data-menu-hit]')
    if (el instanceof HTMLButtonElement && !el.disabled) return el
  }
  return null
}

function readStoredMasterVolume(): number {
  try {
    const raw = localStorage.getItem(VOLUME_STORAGE_KEY)
    if (raw == null) return 0.85
    const v = parseFloat(raw)
    if (!Number.isFinite(v)) return 0.85
    return Math.min(1, Math.max(0, v))
  } catch {
    return 0.85
  }
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const gameRef = useRef<BaseDefenseGame | null>(null)
  const [state, setState] = useState<State>(INITIAL_STATE)
  const [wheelOpen, setWheelOpen] = useState(false)
  const wheelOpenRef = useRef(false)
  const wheelOpenStateRef = useRef(false)
  const [upgradeOpen, setUpgradeOpen] = useState(false)
  const upgradeOpenRef = useRef(false)
  const [researchOpen, setResearchOpen] = useState(false)
  const researchOpenRef = useRef(false)
  const [skillCam, setSkillCam] = useState({ x: 0, y: 0, zoom: 1 })
  const [viewport, setViewport] = useState({ w: window.innerWidth, h: window.innerHeight })
  const [menuScreenCursor, setMenuScreenCursor] = useState({ x: 0, y: 0 })
  const menuScreenCursorLiveRef = useRef(menuScreenCursor)
  const lastMenuClientRef = useRef<{ x: number; y: number } | null>(null)
  const [menuVirtualHover, setMenuVirtualHover] = useState<string | null>(null)
  const prevMenuPointerModeRef = useRef(false)
  const hoveredUpgradeRef = useRef<UpgradeId | undefined>(undefined)
  const hoveredUpgradeCanBuyRef = useRef(false)
  const [phase, setPhase] = useState<Phase>('menu')
  const [sessionId, setSessionId] = useState(0)
  const [virtualCursor, setVirtualCursor] = useState({ x: 0, y: -118 })
  const virtualCursorLiveRef = useRef(virtualCursor)
  const pendingLockedWheelSelectionRef = useRef<BuildingId | undefined>(undefined)
  const pendingUpgradeFocusRef = useRef<UpgradeId | undefined>(undefined)
  const categorySelectionRef = useRef<Partial<Record<BuildingCategory, BuildingId>>>({})
  const [selectedDifficulty, setSelectedDifficulty] = useState<GameDifficulty>('hard')
  /** `null` = None (neutral-only buildings). */
  const [selectedCommander, setSelectedCommander] = useState<HeroId | null>(null)
  const runConfigRef = useRef<{ mode?: 'normal' | 'sandbox'; difficulty?: GameDifficulty; heroId?: HeroId | null }>({
    mode: 'normal',
    difficulty: 'hard',
    heroId: null,
  })
  const gameOverHandledRef = useRef(false)
  const [gameOverSnapshot, setGameOverSnapshot] = useState<{
    wave: number
    difficulty: GameDifficulty
    sandbox: boolean
    commander: CommanderKey
    stats: State['runStats']
    score: number
    rankTotal: number | null
    rankCommander: number | null
    madeTotalTop: boolean
    madeCommanderTop: boolean
  } | null>(null)

  const [masterVolume, setMasterVolume] = useState(readStoredMasterVolume)
  const [pauseMenuOpen, setPauseMenuOpen] = useState(false)

  const menuPointerMode =
    phase === 'menu' || phase === 'gameover' || (phase === 'playing' && pauseMenuOpen)
  const menuPointerModeRef = useRef(menuPointerMode)
  useEffect(() => {
    menuPointerModeRef.current = menuPointerMode
  }, [menuPointerMode])

  const requestGamePointerLock = () => {
    const el = canvasRef.current
    if (!el || document.pointerLockElement === el) return
    void el.requestPointerLock()
  }

  /** Fullscreen + pointer lock on primary click; menu clicks use virtual cursor (handler runs before stopImmediatePropagation). */
  useEffect(() => {
    const tryPointerLockOnCanvas = () => {
      const el = canvasRef.current
      if (!el || document.pointerLockElement === el) return
      void el.requestPointerLock()
    }
    const tryFullscreenIfPossible = () => {
      if (document.fullscreenElement != null) return
      const root = document.documentElement as HTMLElement & { webkitRequestFullscreen?: () => void }
      const fs = root.requestFullscreen?.()
      if (fs != null && typeof (fs as Promise<void>).then === 'function') {
        void (fs as Promise<void>)
          .then(() => {
            tryPointerLockOnCanvas()
          })
          .catch(() => {})
        return
      }
      try {
        root.webkitRequestFullscreen?.()
      } catch {
        /* ignore */
      }
      tryPointerLockOnCanvas()
    }
    const scheduleRelock = () => {
      requestAnimationFrame(() => {
        tryPointerLockOnCanvas()
      })
    }
    const onPointerLockChange = () => {
      const el = canvasRef.current
      if (!el || document.pointerLockElement === el) return
      scheduleRelock()
    }
    const onPointerDownCapture = (e: PointerEvent) => {
      if (e.button !== 0) return
      tryFullscreenIfPossible()
      tryPointerLockOnCanvas()
      if (menuPointerModeRef.current) {
        e.preventDefault()
        e.stopImmediatePropagation()
        const t = pickMenuHitTarget(menuScreenCursorLiveRef.current.x, menuScreenCursorLiveRef.current.y)
        t?.click()
      }
    }
    window.addEventListener('pointerdown', onPointerDownCapture, { capture: true })
    document.addEventListener('pointerlockchange', onPointerLockChange)
    const onFocus = () => scheduleRelock()
    const onVisibility = () => {
      if (document.visibilityState === 'visible') scheduleRelock()
    }
    window.addEventListener('focus', onFocus)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pointerdown', onPointerDownCapture, { capture: true })
      document.removeEventListener('pointerlockchange', onPointerLockChange)
      window.removeEventListener('focus', onFocus)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [])

  useEffect(() => {
    const entered = menuPointerMode && !prevMenuPointerModeRef.current
    prevMenuPointerModeRef.current = menuPointerMode
    if (entered) {
      const cx = Math.max(MENU_CURSOR_MARGIN, viewport.w / 2)
      const cy = Math.max(MENU_CURSOR_MARGIN, viewport.h / 2)
      const p = { x: cx, y: cy }
      menuScreenCursorLiveRef.current = p
      setMenuScreenCursor(p)
      setMenuVirtualHover(null)
      lastMenuClientRef.current = null
    }
  }, [menuPointerMode, viewport.w, viewport.h])

  useEffect(() => {
    if (!menuPointerMode) return
    const onMove = (e: MouseEvent) => {
      let dx: number
      let dy: number
      const vw = window.innerWidth
      const vh = window.innerHeight
      const m = MENU_CURSOR_MARGIN
      if (lastMenuClientRef.current == null) {
        lastMenuClientRef.current = { x: e.clientX, y: e.clientY }
        dx = e.movementX ?? 0
        dy = e.movementY ?? 0
        if (dx === 0 && dy === 0) return
      } else {
        if (e.movementX !== 0 || e.movementY !== 0) {
          dx = e.movementX
          dy = e.movementY
        } else {
          dx = e.clientX - lastMenuClientRef.current.x
          dy = e.clientY - lastMenuClientRef.current.y
        }
        lastMenuClientRef.current = { x: e.clientX, y: e.clientY }
      }
      dx = Math.max(-220, Math.min(220, dx))
      dy = Math.max(-220, Math.min(220, dy))
      if (dx === 0 && dy === 0) return
      const prev = menuScreenCursorLiveRef.current
      const nx = Math.max(m, Math.min(vw - m, prev.x + dx))
      const ny = Math.max(m, Math.min(vh - m, prev.y + dy))
      menuScreenCursorLiveRef.current = { x: nx, y: ny }
      setMenuScreenCursor({ x: nx, y: ny })
      const hit = pickMenuHitTarget(nx, ny)?.getAttribute('data-menu-hit') ?? null
      setMenuVirtualHover(hit)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [menuPointerMode])

  const audioRef = useGameAudioController(phase, state.waveInProgress, state.gameOver)

  useEffect(() => {
    audioRef.current?.setMasterVolume(masterVolume)
  }, [masterVolume, audioRef])

  const commitMasterVolume = (v: number) => {
    const clamped = Math.min(1, Math.max(0, v))
    setMasterVolume(clamped)
    try {
      localStorage.setItem(VOLUME_STORAGE_KEY, String(clamped))
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    if (phase !== 'playing') setPauseMenuOpen(false)
  }, [phase])

  useEffect(() => {
    if (phase !== 'playing') return
    const canvas = canvasRef.current
    if (!canvas) return
    const game = new BaseDefenseGame(canvas, runConfigRef.current)
    const audio = audioRef.current!
    game.onAudio = (e) => audio.handleEvent(e)
    game.onStateChange = (s) => {
      setState(s)
      if (s.gameOver && !gameOverHandledRef.current) {
        gameOverHandledRef.current = true
        const cfg = runConfigRef.current
        const diff = cfg.difficulty ?? 'hard'
        const sandbox = cfg.mode === 'sandbox'
        const commander: CommanderKey = cfg.heroId ?? 'none'
        const score = sandbox
          ? 0
          : computeRunScore({
              wave: s.wave,
              asteroidsKilled: s.runStats.asteroidsKilled,
              moneyEarned: s.runStats.moneyEarned,
              moneySpent: s.runStats.moneySpent,
              powerProduced: s.runStats.powerProduced,
              difficulty: diff,
            })
        let rankTotal: number | null = null
        let rankCommander: number | null = null
        let madeTotalTop = false
        let madeCommanderTop = false
        if (!sandbox && score > 0) {
          const recAt = Date.now()
          const r = addScoreRecord({
            score,
            wave: s.wave,
            commander,
            difficulty: diff,
            moneyEarned: s.runStats.moneyEarned,
            moneySpent: s.runStats.moneySpent,
            powerProduced: s.runStats.powerProduced,
            asteroidsKilled: s.runStats.asteroidsKilled,
            mostCommonBuildingLabel: s.runStats.mostCommonBuildingLabel,
            at: recAt,
          })
          rankTotal = r.totalRank
          rankCommander = r.commanderRank
          madeTotalTop = r.madeTotalTop
          madeCommanderTop = r.madeCommanderTop
        }
        setGameOverSnapshot({
          wave: s.wave,
          difficulty: diff,
          sandbox,
          commander,
          stats: s.runStats,
          score,
          rankTotal,
          rankCommander,
          madeTotalTop,
          madeCommanderTop,
        })
        setPhase('gameover')
      }
    }
    game.start()
    gameRef.current = game
    return () => {
      game.onAudio = undefined
      game.stop()
      gameRef.current = null
    }
  }, [phase, sessionId])

  useEffect(() => {
    if (phase === 'playing') {
      gameOverHandledRef.current = false
      setGameOverSnapshot(null)
    }
  }, [phase, sessionId])

  const categoryOrder: BuildingCategory[] = useMemo(() => {
    const all: BuildingCategory[] = ['structural', 'economy', 'electrical', 'turrets', 'missile', 'energy', 'hero']
    if (state.heroId == null) return all.filter((c) => c !== 'hero')
    return all
  }, [state.heroId])
  const heroLabel: Record<HeroId, string> = {
    archangel: 'Archangel',
    dominion: 'Dominion',
    nova: 'Nova',
    citadel: 'Citadel',
    jupiter: 'Jupiter',
    kingpin: 'Kingpin',
  }
  const categoryLabel: Record<BuildingCategory, string> = {
    structural: 'Structural',
    economy: 'Economy',
    electrical: 'Electrical',
    turrets: 'Turrets',
    missile: 'Missile',
    energy: 'Energy',
    hero: state.heroId ? heroLabel[state.heroId] : 'No commander',
  }
  const categoryColor: Record<BuildingCategory, string> = {
    structural: '#60a5fa',
    economy: '#22c55e',
    electrical: '#eab308',
    turrets: '#f97316',
    missile: '#ef4444',
    energy: '#22d3ee',
    hero: '#a855f7',
  }

  const buildingDefs = useMemo(() => {
    const order = new Map(categoryOrder.map((c, i) => [c, i]))
    return [...BUILDINGS]
      // Commander-specific buildings may live in economy/turrets/etc.; hide them unless `heroId` matches.
      .filter((b) => b.heroId == null || (state.heroId != null && b.heroId === state.heroId))
      .sort((a, b) => {
      const ca = order.get(a.category) ?? 0
      const cb = order.get(b.category) ?? 0
      return ca - cb
    })
  }, [state.heroId])
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
  const normalUpgradeDefs = useMemo(() => UPGRADES.filter((u) => !u.heroId), [])
  const heroResearchDefs = useMemo(
    () => (state.heroId == null ? [] : UPGRADES.filter((u) => u.heroId === state.heroId)),
    [state.heroId],
  )
  const activeTreeDefs = researchOpen ? heroResearchDefs : normalUpgradeDefs
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
    const roots = activeTreeDefs.filter((u) => !u.prereqIds || u.prereqIds.length === 0)
    const rootUpgradeId: UpgradeId = researchOpen ? roots[0]?.id ?? 'core_protocol' : 'core_protocol'
    const byId = new Map(activeTreeDefs.map((u) => [u.id, u]))
    const catOrder = new Map(categoryOrder.map((c, i) => [c, i]))
    const memo = new Map<UpgradeId, number>()
    const depthOf = (id: UpgradeId): number => {
      if (id === rootUpgradeId) return 0
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
    const upgrades = activeTreeDefs
      .filter((u) => u.id !== rootUpgradeId)
      .sort((a, b) => {
      const da = depthOf(a.id)
      const db = depthOf(b.id)
      if (da !== db) return da - db
      const ca = catOrder.get(a.category) ?? 0
      const cb = catOrder.get(b.category) ?? 0
      if (ca !== cb) return ca - cb
      return a.label.localeCompare(b.label)
    })

    const coordById = new Map<UpgradeId, Hex>()
    coordById.set(rootUpgradeId, { q: 0, r: 0 })
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
      hero: Math.PI / 2,
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
    for (const up of activeTreeDefs) {
      const c = coordById.get(up.id) ?? { q: 0, r: 0 }
      const x = cellSize * Math.sqrt(3) * (c.q + c.r / 2)
      const y = cellSize * 1.5 * c.r
      nodes.push({ id: up.id, x, y })
    }

    const idByCoord = new Map<string, UpgradeId>()
    for (const [id, c] of coordById) idByCoord.set(`${c.q},${c.r}`, id)
    const adj = {} as Record<UpgradeId, UpgradeId[]>
    for (const u of activeTreeDefs) {
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
  }, [categoryOrder, activeTreeDefs, researchOpen])

  useEffect(() => {
    const pid = pendingUpgradeFocusRef.current
    if (!pid) return
    const node = skillHexLayout.nodes.find((n) => n.id === pid)
    if (node) {
      setSkillCam((prev) => ({ ...prev, x: node.x, y: node.y }))
      pendingUpgradeFocusRef.current = undefined
    }
  }, [skillHexLayout.nodes, upgradeOpen, researchOpen])
  const skillNodes = skillHexLayout.nodes
  const skillAdj = skillHexLayout.adj
  const skillEdges = skillHexLayout.edges
  const unlockedUpgradeSet = useMemo(() => {
    const roots = activeTreeDefs.filter((u) => !u.prereqIds || u.prereqIds.length === 0).map((u) => u.id)
    const s = new Set<UpgradeId>(roots)
    for (const p of purchasedUpgrades) {
      s.add(p)
      for (const n of skillAdj[p] ?? []) s.add(n)
    }
    return s
  }, [purchasedUpgrades, skillAdj, activeTreeDefs])
  const canBuyUpgrade = (id: UpgradeId, cost: number) =>
    unlockedUpgradeSet.has(id) && !purchasedUpgrades.has(id) && state.credits >= cost

  const findUnlockUpgradeForBuilding = (id: BuildingId): UpgradeId | undefined => {
    const bdef = BUILDINGS.find((b) => b.id === id)
    const pool = bdef?.heroId ? heroResearchDefs : normalUpgradeDefs
    const candidates = pool.filter((u) => (u.unlockBuildingIds ?? []).includes(id) && !purchasedUpgrades.has(u.id))
    if (candidates.length === 0) return undefined
    const byId = new Map(pool.map((u) => [u.id, u]))
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
    const upMeta = UPGRADES.find((u) => u.id === target)
    const isHeroResearch = Boolean(upMeta?.heroId)
    requestGamePointerLock()
    gameRef.current?.setWheelOpen(true)
    wheelOpenRef.current = false
    setWheelOpen(false)
    if (isHeroResearch) {
      upgradeOpenRef.current = false
      setUpgradeOpen(false)
      researchOpenRef.current = true
      setResearchOpen(true)
    } else {
      researchOpenRef.current = false
      setResearchOpen(false)
      upgradeOpenRef.current = true
      setUpgradeOpen(true)
    }
    pendingUpgradeFocusRef.current = target
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
    if (id === 'archangel_airfield') return 'Deploys one fast gunship: long-range bullet stream; needs fuel and bullets.'
    if (id === 'archangel_starport') return 'Deploys one bomber craft: slow heavy missiles with huge blast radius; needs fuel and missiles.'
    if (id === 'archangel_fueling_station')
      return 'During an active wave, while a plane is on its pad, each station adds fuel transfer; needs power. More stations = faster.'
    if (id === 'archangel_bulk_fueling_station')
      return 'Heavy pad fueling during waves when planes are landed; high power. Unlocked via Archangel research, not the starter core.'
    if (id === 'archangel_munitions_plant')
      return 'During waves, on the airfield pad only: spends credits to load gunship magazines. More plants = faster.'
    if (id === 'archangel_missile_factory')
      return 'During waves, on the starport pad: loads bomber missiles a bit faster than munitions load gunships. More factories = faster.'
    if (id === 'dominion_orbital_cannon')
      return '5x5 spherical battery: one devastating blast every ~5s for heavy power cost; unlimited range on the nearest rock, huge AoE plus shrapnel (more with Lead Rounds).'
    if (id === 'dominion_flak_gun')
      return 'Cheap long-range flak: very high damage, fast fire. Wide sky cone above the gun; cannot fire within 15 tiles ground range. Spawns shrapnel on hit.'
    if (id === 'dominion_seeker_drone_spawner')
      return 'Every 4s launches a drone to the nearest asteroid; slows and pushes it based on size, with light damage-over-time. Drone dies with the rock.'
    if (id === 'dominion_defensive_bunker')
      return 'Extremely tough turret with solid but not exceptional DPS.'
    if (id === 'dominion_laser_drill')
      return 'Powered mining laser: earns credits while damaging rocks; waits 1s after losing a target before locking a new one.'
    if (id === 'dominion_support_bay')
      return 'Launches one dropship at a time (two with Extended Support). Large healing aura, faster throughput than repair drones.'
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
        if (upgradeOpenRef.current || researchOpenRef.current) {
          upgradeOpenRef.current = false
          researchOpenRef.current = false
          setUpgradeOpen(false)
          setResearchOpen(false)
          if (!wheelOpenRef.current) {
            requestGamePointerLock()
            gameRef.current?.setWheelOpen(true)
            pendingLockedWheelSelectionRef.current = undefined
            wheelOpenRef.current = true
            setWheelOpen(true)
          }
          return
        }
        if (!wheelOpenRef.current) {
          requestGamePointerLock()
          gameRef.current?.setWheelOpen(true)
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
        if (researchOpenRef.current) {
          researchOpenRef.current = false
          setResearchOpen(false)
        }
        const next = !upgradeOpenRef.current
        if (next) {
          requestGamePointerLock()
          gameRef.current?.setWheelOpen(true)
        }
        upgradeOpenRef.current = next
        setUpgradeOpen(next)
      }
      if (e.key === 'r' || e.key === 'R') {
        if (e.repeat) return
        if (state.heroId == null) return
        if (wheelOpenRef.current) {
          wheelOpenRef.current = false
          setWheelOpen(false)
        }
        if (upgradeOpenRef.current) {
          upgradeOpenRef.current = false
          setUpgradeOpen(false)
        }
        const next = !researchOpenRef.current
        if (next) {
          requestGamePointerLock()
          gameRef.current?.setWheelOpen(true)
        }
        researchOpenRef.current = next
        setResearchOpen(next)
      }
      if (e.key === 'p' || e.key === 'P') {
        if (e.repeat) return
        e.preventDefault()
        setPauseMenuOpen((prev) => {
          const next = !prev
          gameRef.current?.setPaused(next)
          return next
        })
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
  }, [phase, unlockedSet, skillNodes, purchasedUpgrades, state.heroId])

  useEffect(() => {
    if (phase !== 'playing') return
    const onWheel = (e: WheelEvent) => {
      if (upgradeOpenRef.current || researchOpenRef.current) {
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
    researchOpenRef.current = researchOpen
  }, [researchOpen])

  useEffect(() => {
    if (phase !== 'playing') return
    const onMouseMove = (e: MouseEvent) => {
      const rawDx = e.movementX ?? 0
      const rawDy = e.movementY ?? 0
      const dx = Math.max(-220, Math.min(220, rawDx))
      const dy = Math.max(-220, Math.min(220, rawDy))
      if (dx === 0 && dy === 0) return
      if (upgradeOpenRef.current || researchOpenRef.current) {
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
    const targetDef = activeTreeDefs.find((u) => u.id === targetId)
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
      const def = activeTreeDefs.find((u) => u.id === id)
      if (!def) return
      if (creditsLeft < def.creditCost) return
      creditsLeft -= def.creditCost
      purchasedLocal.add(id)
      gameRef.current?.purchaseUpgrade(id)
    }
  }

  useEffect(() => {
    if (phase !== 'playing' || (!upgradeOpen && !researchOpen)) return
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
  }, [phase, upgradeOpen, researchOpen, refundableUpgrades, purchasedUpgrades, skillAdj, state.credits, activeTreeDefs])

  useLayoutEffect(() => {
    if (phase !== 'playing') return
    gameRef.current?.setWheelOpen(wheelOpen || upgradeOpen || researchOpen)
  }, [wheelOpen, upgradeOpen, researchOpen, phase])

  const startNewRun = () => {
    setPauseMenuOpen(false)
    runConfigRef.current = { mode: 'normal', difficulty: selectedDifficulty, heroId: selectedCommander }
    wheelOpenRef.current = false
    upgradeOpenRef.current = false
    researchOpenRef.current = false
    setWheelOpen(false)
    setUpgradeOpen(false)
    setResearchOpen(false)
    setState(INITIAL_STATE)
    categorySelectionRef.current = {}
    setSessionId((v) => v + 1)
    setPhase('playing')
  }

  const startSandbox = () => {
    setPauseMenuOpen(false)
    runConfigRef.current = { mode: 'sandbox', difficulty: selectedDifficulty, heroId: selectedCommander }
    wheelOpenRef.current = false
    upgradeOpenRef.current = false
    researchOpenRef.current = false
    setWheelOpen(false)
    setUpgradeOpen(false)
    setResearchOpen(false)
    setState(INITIAL_STATE)
    categorySelectionRef.current = {}
    setSessionId((v) => v + 1)
    setPhase('playing')
  }

  const goToMenu = () => {
    gameOverHandledRef.current = false
    setGameOverSnapshot(null)
    setPauseMenuOpen(false)
    wheelOpenRef.current = false
    upgradeOpenRef.current = false
    researchOpenRef.current = false
    setWheelOpen(false)
    setUpgradeOpen(false)
    setResearchOpen(false)
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
  const hoveredUpgradeDef = activeTreeDefs.find((u) => u.id === hoveredUpgradeId)
  const hoveredNodeCanBuy = hoveredUpgradeDef ? canBuyUpgrade(hoveredUpgradeDef.id, hoveredUpgradeDef.creditCost) : false

  useEffect(() => {
    hoveredUpgradeRef.current = hoveredUpgradeId
    hoveredUpgradeCanBuyRef.current = hoveredNodeCanBuy
  }, [hoveredUpgradeId, hoveredNodeCanBuy])

  const virtualMenuVolume = (prefix: string) => (
    <div className="menu-volume-virtual">
      <button
        type="button"
        className={`menu-vol-step ${menuVirtualHover === `${prefix}-vol-minus` ? 'menu-virtual-highlight' : ''}`}
        data-menu-hit={`${prefix}-vol-minus`}
        aria-label="Volume down"
        onClick={() => commitMasterVolume(Math.max(0, masterVolume - 0.05))}
      >
        −
      </button>
      <span className="menu-vol-pct">{Math.round(masterVolume * 100)}%</span>
      <button
        type="button"
        className={`menu-vol-step ${menuVirtualHover === `${prefix}-vol-plus` ? 'menu-virtual-highlight' : ''}`}
        data-menu-hit={`${prefix}-vol-plus`}
        aria-label="Volume up"
        onClick={() => commitMasterVolume(Math.min(1, masterVolume + 0.05))}
      >
        +
      </button>
    </div>
  )

  const resumeGame = () => {
    setPauseMenuOpen(false)
    gameRef.current?.setPaused(false)
    requestGamePointerLock()
  }

  return (
    <div className="app-root" style={{ ['--accent-color' as string]: categoryColor[selectedCategory] }}>
      <canvas ref={canvasRef} className="game-canvas" />

      {/* Crosshair (target is screen center while mouse-look is active) */}
      {phase === 'playing' && <div className="crosshair" />}

      {phase === 'playing' && pauseMenuOpen && (
        <div className="pause-overlay">
          <div className="screen-card pause-card">
            <h2>Paused</h2>
            <p className="small">Press P to resume. Move the mouse to steer the virtual cursor; primary click activates the target under it.</p>
            <div className="pause-volume-block">
              <span className="pause-volume-label">Master volume</span>
              {virtualMenuVolume('pause')}
            </div>
            <div className="screen-actions pause-actions">
              <button
                type="button"
                className={`primary-btn ${menuVirtualHover === 'pause-resume' ? 'menu-virtual-highlight' : ''}`}
                data-menu-hit="pause-resume"
                onClick={resumeGame}
              >
                Resume (P)
              </button>
              <button
                type="button"
                className={`secondary-btn ${menuVirtualHover === 'pause-menu' ? 'menu-virtual-highlight' : ''}`}
                data-menu-hit="pause-menu"
                onClick={goToMenu}
              >
                Main Menu
              </button>
            </div>
          </div>
        </div>
      )}

      {phase === 'playing' && state.wave === 0 && !state.waveInProgress && (
        <div className="hud top-left">
          <h1>Asteroid Defense</h1>
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

      {phase === 'playing' && (upgradeOpen || researchOpen) && (
        <div
          className="upgrade-overlay"
          aria-hidden="true"
          onMouseDown={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
        >
          <div className="upgrade-panel">
            <div className="upgrade-title">{researchOpen ? 'Hero Research' : 'Skill Tree'}</div>
            <div className="upgrade-subtitle">
              Press <b>{researchOpen ? 'R' : 'U'}</b> to toggle. Move mouse to pan, scroll to zoom, center reticle hovers.
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
                const up = activeTreeDefs.find((u) => u.id === n.id)!
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
                      ['--node-color' as string]: up.heroId ? categoryColor.hero : categoryColor[up.category],
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
                          : 'Locked: purchase adjacent research first'}
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
        <div className="main-menu-overlay">
          <h1 className="main-menu-title">Asteroid Defense</h1>
          <div className="main-menu-volume" title="Master volume">
            <span className="main-menu-volume-label">Vol</span>
            {virtualMenuVolume('menu')}
          </div>

          <div className="main-menu-difficulty-block">
            <div className="main-menu-section-label">Difficulty</div>
            <div className="main-menu-difficulty-btns">
              {(
                [
                  ['easy', 'Easy'],
                  ['medium', 'Medium'],
                  ['hard', 'Hard'],
                  ['brutal', 'Brutal'],
                  ['deadly', 'Deadly'],
                ] as Array<[GameDifficulty, string]>
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={
                    (selectedDifficulty === id ? 'menu-chip active' : 'menu-chip') +
                    (menuVirtualHover === `diff-${id}` ? ' menu-virtual-highlight' : '')
                  }
                  data-menu-hit={`diff-${id}`}
                  onClick={() => setSelectedDifficulty(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div className="main-menu-actions">
            <button
              type="button"
              className={`primary-btn main-menu-start${menuVirtualHover === 'start-run' ? ' menu-virtual-highlight' : ''}`}
              data-menu-hit="start-run"
              onClick={startNewRun}
            >
              Start Game
            </button>
            <button
              type="button"
              className={`secondary-btn main-menu-sandbox${menuVirtualHover === 'start-sandbox' ? ' menu-virtual-highlight' : ''}`}
              data-menu-hit="start-sandbox"
              onClick={startSandbox}
            >
              Sandbox
            </button>
          </div>

          <div className="main-menu-commander-block">
            <div className="main-menu-section-label">Commander</div>
            <button
              type="button"
              className={
                (selectedCommander === null ? 'commander-none-btn active' : 'commander-none-btn') +
                (menuVirtualHover === 'cmd-none' ? ' menu-virtual-highlight' : '')
              }
              data-menu-hit="cmd-none"
              onClick={() => setSelectedCommander(null)}
            >
              None
            </button>
            <p className="commander-none-hint">Neutral tech only — no hero buildings or hero research.</p>
            <div className="commander-grid-2x3">
              {(
                [
                  ['archangel', 'Archangel'],
                  ['dominion', 'Dominion'],
                  ['nova', 'Nova'],
                  ['citadel', 'Citadel'],
                  ['jupiter', 'Jupiter'],
                  ['kingpin', 'Kingpin'],
                ] as Array<[HeroId, string]>
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  className={
                    (selectedCommander === id ? 'commander-cell active' : 'commander-cell') +
                    (menuVirtualHover === `cmd-${id}` ? ' menu-virtual-highlight' : '')
                  }
                  data-menu-hit={`cmd-${id}`}
                  onClick={() => setSelectedCommander(id)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <p className="main-menu-hint small">
            Move the mouse to steer the virtual cursor; click selects. WASD move · Q/E height · mouse look · C build wheel · U
            skills · R hero research (with commander) · RMB sell · Space wave · P pause
          </p>
        </div>
      )}

      {phase === 'gameover' && (
        <div className="screen-overlay gameover-overlay">
          {gameOverSnapshot ? (
            <div className="screen-card danger gameover-card-wide">
              <h2>Base Destroyed</h2>
              <p className="gameover-wave-line">
                Waves survived: <b>{gameOverSnapshot.wave}</b>
                {gameOverSnapshot.sandbox && <span className="sandbox-tag"> Sandbox — score not saved</span>}
              </p>

              <div className="gameover-score-big">Score: {gameOverSnapshot.score.toLocaleString()}</div>

              <div className="gameover-stats-grid">
                <div>
                  <span className="stat-k">Money earned</span>
                  <span className="stat-v">{gameOverSnapshot.stats.moneyEarned.toLocaleString()} c</span>
                </div>
                <div>
                  <span className="stat-k">Money spent</span>
                  <span className="stat-v">{gameOverSnapshot.stats.moneySpent.toLocaleString()} c</span>
                </div>
                <div>
                  <span className="stat-k">Power produced</span>
                  <span className="stat-v">{gameOverSnapshot.stats.powerProduced.toLocaleString()} P·s</span>
                </div>
                <div>
                  <span className="stat-k">Asteroids killed</span>
                  <span className="stat-v">{gameOverSnapshot.stats.asteroidsKilled.toLocaleString()}</span>
                </div>
                <div className="gameover-stat-wide">
                  <span className="stat-k">Most common building</span>
                  <span className="stat-v">{gameOverSnapshot.stats.mostCommonBuildingLabel}</span>
                </div>
              </div>

              {!gameOverSnapshot.sandbox && gameOverSnapshot.score > 0 && (
                <div className="gameover-ranks">
                  <div>
                    Global top 5:{' '}
                    {gameOverSnapshot.madeTotalTop ? (
                      <b>#{gameOverSnapshot.rankTotal}</b>
                    ) : (
                      <span className="muted">not in top 5</span>
                    )}
                  </div>
                  <div>
                    {gameOverSnapshot.commander === 'none' ? 'None' : heroLabel[gameOverSnapshot.commander]} board:{' '}
                    {gameOverSnapshot.madeCommanderTop ? (
                      <b>#{gameOverSnapshot.rankCommander}</b>
                    ) : (
                      <span className="muted">not in top 5</span>
                    )}
                  </div>
                </div>
              )}

              <div className="screen-actions gameover-actions">
                <button
                  type="button"
                  className={`primary-btn${menuVirtualHover === 'go-play-again' ? ' menu-virtual-highlight' : ''}`}
                  data-menu-hit="go-play-again"
                  onClick={startNewRun}
                >
                  Play Again
                </button>
                <button
                  type="button"
                  className={`secondary-btn${menuVirtualHover === 'go-main-menu' ? ' menu-virtual-highlight' : ''}`}
                  data-menu-hit="go-main-menu"
                  onClick={goToMenu}
                >
                  Main Menu
                </button>
              </div>
            </div>
          ) : (
            <div className="screen-card danger">
              <h2>Base Destroyed</h2>
              <div className="screen-actions">
                <button
                  type="button"
                  className={`primary-btn${menuVirtualHover === 'go-play-again' ? ' menu-virtual-highlight' : ''}`}
                  data-menu-hit="go-play-again"
                  onClick={startNewRun}
                >
                  Play Again
                </button>
                <button
                  type="button"
                  className={`secondary-btn${menuVirtualHover === 'go-main-menu' ? ' menu-virtual-highlight' : ''}`}
                  data-menu-hit="go-main-menu"
                  onClick={goToMenu}
                >
                  Main Menu
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {menuPointerMode && (
        <div
          className="virtual-menu-cursor"
          style={{ left: menuScreenCursor.x, top: menuScreenCursor.y }}
          aria-hidden
        />
      )}
    </div>
  )
}

export default App
