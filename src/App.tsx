import { useEffect, useMemo, useRef, useState } from 'react'
import { BaseDefenseGame, BUILDINGS, UPGRADES, type BuildingCategory, type BuildingId, type UpgradeId } from './game/BaseDefenseGame'

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
  unlockedBuildingIds: [
    'command_center',
    'supply_depot',
    'factory_business',
    'generator_small',
    'generator_large',
    'battery',
    'auto_turret',
    'siege_cannon',
    'missile_launcher',
    'silo',
    'shield_generator',
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
  const hoverStabilityRef = useRef<{ id?: BuildingId; ticks: number }>({ id: undefined, ticks: 0 })
  const hoveredUpgradeRef = useRef<UpgradeId | undefined>(undefined)
  const hoveredUpgradeCanBuyRef = useRef(false)
  const [phase, setPhase] = useState<Phase>('menu')
  const [sessionId, setSessionId] = useState(0)
  const [lastWave, setLastWave] = useState(0)
  const [virtualCursor, setVirtualCursor] = useState({ x: 0, y: -118 })
  const categorySelectionRef = useRef<Partial<Record<BuildingCategory, BuildingId>>>({})

  useEffect(() => {
    if (phase !== 'playing') return
    const canvas = canvasRef.current
    if (!canvas) return
    const game = new BaseDefenseGame(canvas)
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

  const categoryOrder: BuildingCategory[] = ['structural', 'economy', 'electrical', 'turrets', 'missile', 'utility']
  const categoryLabel: Record<BuildingCategory, string> = {
    structural: 'Structural',
    economy: 'Economy',
    electrical: 'Electrical',
    turrets: 'Turrets',
    missile: 'Missile',
    utility: 'Utility',
  }
  const categoryColor: Record<BuildingCategory, string> = {
    structural: '#60a5fa',
    economy: '#22c55e',
    electrical: '#eab308',
    turrets: '#f97316',
    missile: '#ef4444',
    utility: '#22d3ee',
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
  const skillNodes = useMemo(
    () =>
      [
        { id: 'core_protocol', x: 0, y: 0 },
        { id: 'unlock_factory', x: -180, y: -40 },
        { id: 'unlock_megacomplex', x: -300, y: -120 },
        { id: 'turret_targeting', x: 180, y: -40 },
        { id: 'generator_efficiency', x: 40, y: 170 },
      ] as Array<{ id: UpgradeId; x: number; y: number }>,
    [],
  )
  const skillAdj = useMemo(
    () =>
      ({
        core_protocol: ['unlock_factory', 'turret_targeting', 'generator_efficiency'],
        unlock_factory: ['core_protocol', 'unlock_megacomplex'],
        unlock_megacomplex: ['unlock_factory'],
        turret_targeting: ['core_protocol'],
        generator_efficiency: ['core_protocol'],
      }) as Record<UpgradeId, UpgradeId[]>,
    [],
  )
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
    if (id === 'supply_depot') return 'Expands max Supply so you can field more structures.'
    if (id === 'factory_business') return 'Small economy node: low credits, very frequent payouts.'
    if (id === 'factory_factory') return 'Balanced industry: medium periodic credit payouts.'
    if (id === 'factory_megacomplex') return 'Heavy economy core: huge payouts on long intervals.'
    if (id === 'generator_small') return 'Compact power source for early infrastructure.'
    if (id === 'generator_large') return 'High-output power plant for large defensive grids.'
    if (id === 'battery') return 'Increases max Power storage for sustained operations.'
    if (id === 'auto_turret') return 'Cheap short-range machine-gun turret with high fire rate.'
    if (id === 'siege_cannon') return 'Long-range artillery with high single-target damage.'
    if (id === 'missile_launcher') return 'Burst launcher firing tracking missiles with medium AOE.'
    if (id === 'silo') return 'Very slow ballistic launcher with massive AOE impact.'
    if (id === 'shield_generator') return 'Large forcefield that intercepts impacts while draining power.'
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
        if (upgradeOpenRef.current) return
        if (!wheelOpenRef.current) {
          wheelOpenRef.current = true
          setWheelOpen(true)
        }
      }
      if (e.key === 'u' || e.key === 'U') {
        if (wheelOpenRef.current) {
          wheelOpenRef.current = false
          setWheelOpen(false)
        }
        if (!upgradeOpenRef.current) {
          upgradeOpenRef.current = true
          setUpgradeOpen(true)
        }
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        wheelOpenRef.current = false
        setWheelOpen(false)
      }
      if (e.key === 'u' || e.key === 'U') {
        upgradeOpenRef.current = false
        setUpgradeOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [phase])

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
  }, [wheelOpen, itemLayout])

  useEffect(() => {
    if (!wheelOpen || !hoveredItem) return
    if (hoverStabilityRef.current.id === hoveredItem.id) {
      hoverStabilityRef.current.ticks += 1
    } else {
      hoverStabilityRef.current.id = hoveredItem.id
      hoverStabilityRef.current.ticks = 1
    }
    if (hoverStabilityRef.current.ticks >= 2 && hoveredItem.id !== state.selected) {
      gameRef.current?.setSelected(hoveredItem.id)
    }
  }, [wheelOpen, hoveredItem, state.selected])

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
        setSkillCam((prev) => ({ ...prev, x: prev.x - dx / prev.zoom, y: prev.y - dy / prev.zoom }))
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
          return { x, y }
        })
      }
    }
    window.addEventListener('mousemove', onMouseMove)
    return () => window.removeEventListener('mousemove', onMouseMove)
  }, [phase, itemRadius])

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
      if (hoveredUpgradeCanBuyRef.current) gameRef.current?.purchaseUpgrade(id)
    }
    window.addEventListener('mousedown', onMouseDown)
    return () => window.removeEventListener('mousedown', onMouseDown)
  }, [phase, upgradeOpen, refundableUpgrades])

  useEffect(() => {
    if (phase !== 'playing') return
    gameRef.current?.setWheelOpen(wheelOpen || upgradeOpen)
  }, [wheelOpen, upgradeOpen, phase])

  const startNewRun = () => {
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
    return bestDist <= 34 ? best : undefined
  }, [renderedSkillNodes, treeCx, treeCy])
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
                {renderedSkillNodes.flatMap((n) =>
                  (skillAdj[n.id] ?? [])
                    .filter((to) => n.id < to)
                    .map((to) => {
                      const t = renderedSkillNodes.find((k) => k.id === to)
                      if (!t) return null
                      return <line key={`${n.id}-${to}`} x1={n.sx} y1={n.sy} x2={t.sx} y2={t.sy} className="skilltree-line" />
                    }),
                )}
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
                      ['--node-color' as string]: categoryColor[up.category],
                    }}
                  >
                    {refundable && <div className="skill-node-refund">$</div>}
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
            if (e.button === 0 && hoveredItem) gameRef.current?.setSelected(hoveredItem.id)
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
            <div className="wheel-selected">{selectedDef?.label ?? state.selected}</div>
            <div className="wheel-sub">
              {selectedDef ? selectedDef.wheelDetails()[0] : ''}
              <br />
              {selectedDef ? selectedDef.wheelDetails()[1] : ''}
            </div>
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
              Controls: WASD move, Q/E vertical, mouse-look, hold C for build wheel, hold U for skill tree, RMB sell, Space starts next wave.
            </p>
            <button type="button" className="primary-btn" onClick={startNewRun}>
              Start Game
            </button>
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
