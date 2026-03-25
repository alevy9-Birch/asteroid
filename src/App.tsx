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
  const [phase, setPhase] = useState<Phase>('menu')
  const [sessionId, setSessionId] = useState(0)
  const [lastWave, setLastWave] = useState(0)
  const [wheelRotation, setWheelRotation] = useState(0)
  const wheelRotationRef = useRef(0)
  const prevSelectedIndexRef = useRef(0)
  const prevCategoryRef = useRef<BuildingCategory | null>(null)
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
  const selectedIndex = Math.max(0, categoryItems.findIndex((b) => b.id === state.selected))
  const stepDeg = categoryItems.length > 0 ? 360 / categoryItems.length : 360
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
    // Prevent category switches from doing long spin animations.
    if (prevCategoryRef.current !== selectedCategory) {
      prevCategoryRef.current = selectedCategory
      prevSelectedIndexRef.current = selectedIndex
      wheelRotationRef.current = -selectedIndex * stepDeg
      setWheelRotation(wheelRotationRef.current)
      return
    }
    const n = Math.max(1, categoryItems.length)
    let delta = selectedIndex - prevSelectedIndexRef.current
    if (delta > n / 2) delta -= n
    if (delta < -n / 2) delta += n
    wheelRotationRef.current += -delta * stepDeg
    prevSelectedIndexRef.current = selectedIndex
    setWheelRotation(wheelRotationRef.current)
  }, [selectedIndex, stepDeg, categoryItems.length, phase, selectedCategory])

  useEffect(() => {
    if (phase !== 'playing') return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        if (!wheelOpenRef.current) {
          wheelOpenRef.current = true
          setWheelOpen(true)
          // Allow cursor interaction with wheel items.
          if (document.pointerLockElement) document.exitPointerLock()
        }
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'c' || e.key === 'C') {
        wheelOpenRef.current = false
        setWheelOpen(false)
        // Re-enter pointer lock for gameplay look control.
        const canvas = canvasRef.current
        if (canvas && phase === 'playing') canvas.requestPointerLock()
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
    const canvas = canvasRef.current
    if (!canvas) return
    const onWheel = (e: WheelEvent) => {
      if (!wheelOpenRef.current) return
      e.preventDefault()
      const dir = Math.sign(e.deltaY)
      if (dir === 0) return
      jumpCategory(dir > 0 ? 1 : -1)
    }
    canvas.addEventListener('wheel', onWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', onWheel as any)
  }, [phase, selectedCategory, buildingDefs])

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
    wheelRotationRef.current = 0
    prevSelectedIndexRef.current = 0
    categorySelectionRef.current = {}
    setWheelRotation(0)
    setSessionId((v) => v + 1)
    setPhase('playing')
  }

  const goToMenu = () => {
    wheelOpenRef.current = false
    setWheelOpen(false)
    setPhase('menu')
  }

  return (
    <div className="app-root" style={{ ['--accent-color' as string]: categoryColor[selectedCategory] }}>
      <canvas ref={canvasRef} className="game-canvas" />

      {/* Crosshair (target is screen center while mouse-look is active) */}
      {phase === 'playing' && <div className="crosshair" />}

      {phase === 'playing' && state.wave === 0 && !state.waveInProgress && (
        <div className="hud top-left">
          <h1>Meteor Base Defense</h1>
          <p>Press <b>Space</b> to start waves.</p>
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
                {categoryItems.map((b, i) => {
                  const angleDeg = i * (360 / Math.max(1, categoryItems.length)) + wheelRotation
                  const angle = (angleDeg * Math.PI) / 180
                  const r = 118
                  const x = Math.sin(angle) * r
                  const y = -Math.cos(angle) * r
                  const isSelected = b.id === state.selected
                  const affordable = state.credits >= b.creditCost && state.supplyUsed + b.supplyCost <= state.supplyCap
                  return (
                    <div
                      key={b.id}
                      className={
                        isSelected
                          ? affordable
                            ? 'wheel-item selected'
                            : 'wheel-item selected unaffordable'
                          : affordable
                            ? 'wheel-item'
                            : 'wheel-item unaffordable'
                      }
                      style={{
                        transform: `translate(-50%, -50%) translate(${x}px, ${y}px)`,
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (e.button === 0) gameRef.current?.setSelected(b.id)
                      }}
                    >
                      <div className="wheel-item-title">{b.label}</div>
                    </div>
                  )
                })}
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
