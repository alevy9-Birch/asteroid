import { useEffect, useMemo, useRef, useState } from 'react'
import { BaseDefenseGame, BUILDINGS } from './game/BaseDefenseGame'

type State = {
  baseHealth: number
  credits: number
  wave: number
  selected: 'wall' | 'turret' | 'laser' | 'missile' | 'shield'
  incoming: number
  gameOver: boolean
}

const INITIAL_STATE: State = {
  baseHealth: 1000,
  credits: 300,
  wave: 0,
  selected: 'turret',
  incoming: 0,
  gameOver: false,
}

function App() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const gameRef = useRef<BaseDefenseGame | null>(null)
  const [state, setState] = useState<State>(INITIAL_STATE)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const game = new BaseDefenseGame(canvas)
    game.onStateChange = (s) => setState(s)
    game.start()
    gameRef.current = game
    return () => game.stop()
  }, [])

  const buildingDefs = useMemo(() => BUILDINGS, [])

  return (
    <div className="app-root">
      <canvas ref={canvasRef} className="game-canvas" />

      <div className="hud top-left">
        <h1>Meteor Base Defense</h1>
        <p>Build your fortress before the next meteor wave lands.</p>
      </div>

      <div className="hud top-right stats">
        <div>Wave: {state.wave}</div>
        <div>Base HP: {state.baseHealth}</div>
        <div>Credits: {state.credits}</div>
        <div>Incoming: {state.incoming}</div>
      </div>

      <div className="hud bottom-left">
        <div className="hint">Controls: Left click to build, Keys 1-5 to swap buildings.</div>
        <div className="building-grid">
          {buildingDefs.map((b, idx) => {
            const selected = state.selected === b.id
            return (
              <button
                key={b.id}
                type="button"
                className={selected ? 'building-btn selected' : 'building-btn'}
                onClick={() => gameRef.current?.setSelected(b.id)}
              >
                <span>
                  {idx + 1}. {b.label}
                </span>
                <span>{b.cost}c</span>
              </button>
            )
          })}
        </div>
      </div>

      {state.gameOver && (
        <div className="game-over">
          <div className="game-over-card">
            <h2>Base Destroyed</h2>
            <p>You survived {state.wave} wave(s).</p>
            <p>Reload to start a fresh defense.</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default App
