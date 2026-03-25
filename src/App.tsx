import { useEffect, useMemo, useRef, useState } from 'react'
import { BaseDefenseGame, BUILDINGS, type BuildingCategory, type BuildingId } from './game/BaseDefenseGame'

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
  const jumpCategory = (dir: 1 | -1) => {
    const curIdx = categoryOrder.indexOf(selectedCategory)
    const nextIdx = (curIdx + dir + categoryOrder.length) % categoryOrder.length
    const nextCat = categoryOrder[nextIdx]
    const remembered = categorySelectionRef.current[nextCat]
    const rememberedValid = remembered && buildingDefs.some((b) => b.id === remembered && b.category === nextCat)
    const fallback = buildingDefs.find((b) => b.category === nextCat)
    const next = rememberedValid ? remembered : fallback?.id
    if (next) gameRef.current?.setSelected(next)
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

  useEffect(() => {
    if (phase !== 'playing') return
    categorySelectionRef.current[selectedCategory] = state.selected
  }, [phase, selectedCategory, state.selected])

  useEffect(() => {
    if (phase !== 'playing') return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        if (!wheelOpenRef.current) {
          wheelOpenRef.current = true
          setWheelOpen(true)
        }
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        wheelOpenRef.current = false
        setWheelOpen(false)
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
      if (!wheelOpenRef.current) return
      e.preventDefault()
      const dir = Math.sign(e.deltaY)
      if (dir === 0) return
      jumpCategory(dir > 0 ? 1 : -1)
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
    if (hoveredItem.id !== state.selected) gameRef.current?.setSelected(hoveredItem.id)
  }, [wheelOpen, hoveredItem, state.selected])

  useEffect(() => {
    wheelOpenStateRef.current = wheelOpen
  }, [wheelOpen])

  useEffect(() => {
    if (phase !== 'playing') return
    const onMouseMove = (e: MouseEvent) => {
      if (!wheelOpenStateRef.current) return
      const dx = e.movementX ?? 0
      const dy = e.movementY ?? 0
      if (dx === 0 && dy === 0) return
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
    if (phase !== 'playing') return
    gameRef.current?.setWheelOpen(wheelOpen)
  }, [wheelOpen, phase])

  const startNewRun = () => {
    wheelOpenRef.current = false
    setWheelOpen(false)
    setState(INITIAL_STATE)
    setLastWave(0)
    categorySelectionRef.current = {}
    setSessionId((v) => v + 1)
    setPhase('playing')
  }

  const goToMenu = () => {
    wheelOpenRef.current = false
    setWheelOpen(false)
    setPhase('menu')
  }

  const waveCircleRadius = 22
  const waveCircleStroke = 4
  const waveCircleCirc = 2 * Math.PI * waveCircleRadius
  const waveProgress = state.waveInProgress
    ? Math.max(0, Math.min(1, state.waveSpawnProgress))
    : Math.max(0, Math.min(1, state.inactiveTimeLeftSec / 60))
  const waveDashOffset = waveCircleCirc * (1 - waveProgress)

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
                  const affordable = state.credits >= b.creditCost && state.supplyUsed + b.supplyCost <= state.supplyCap
                  return (
                    <div
                      key={b.id}
                      className={
                        isSelected
                          ? affordable
                            ? 'wheel-item selected'
                            : 'wheel-item selected unaffordable'
                          : isHovered
                            ? affordable
                              ? 'wheel-item hovered'
                              : 'wheel-item hovered unaffordable'
                          : affordable
                            ? 'wheel-item'
                            : 'wheel-item unaffordable'
                      }
                      style={{
                        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                      }}
                    >
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
              Controls: WASD move, Q/E vertical, mouse-look, hold C + scroll to choose tower, RMB sell, Space starts the next wave.
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
