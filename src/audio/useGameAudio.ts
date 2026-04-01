import { useEffect, useRef } from 'react'
import { createGameAudioEngine } from './gameAudioEngine'
import type { MusicPhase } from './types'

type Phase = 'menu' | 'playing' | 'gameover'

type AudioEngine = ReturnType<typeof createGameAudioEngine>

/** Stable Howler-backed engine + first-gesture unlock + music tied to game phase. */
export function useGameAudioController(phase: Phase, waveInProgress: boolean, gameOver: boolean) {
  const engineRef = useRef<AudioEngine | null>(null)
  if (!engineRef.current) engineRef.current = createGameAudioEngine()

  useEffect(() => {
    const e = engineRef.current!
    const unlock = () => e.unlock()
    window.addEventListener('pointerdown', unlock, { once: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  useEffect(() => {
    const e = engineRef.current!
    let music: MusicPhase
    if (phase === 'menu') music = 'menu'
    else if (phase === 'gameover' || gameOver) music = 'gameover'
    else if (waveInProgress) music = 'combat'
    else music = 'build'
    e.setMusicPhase(music)
  }, [phase, waveInProgress, gameOver])

  return engineRef
}
