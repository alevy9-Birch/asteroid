import { Howl, Howler } from 'howler'
import type { GameAudioEvent, MusicPhase } from './types'

const audioUrl = (path: string) => {
  const base = import.meta.env.BASE_URL.replace(/\/$/, '')
  const rel = path.replace(/^\//, '')
  return `${base}/${rel}`
}

function sfx(src: string, volume = 0.85): Howl {
  return new Howl({ src: [audioUrl(src)], volume, preload: true, html5: false })
}

function musicTrack(src: string, volume: number): Howl {
  return new Howl({ src: [audioUrl(src)], volume, loop: true, preload: true, html5: true })
}

export class GameAudioEngine {
  private readonly sfx = {
    explosionCrunch: sfx('/audio/sfx/explosion_crunch.ogg', 0.72),
    explosionLow: sfx('/audio/sfx/explosion_low.ogg', 0.8),
    forceField: sfx('/audio/sfx/force_field.ogg', 0.42),
    laserSmall: sfx('/audio/sfx/laser_small.ogg', 0.38),
    laserLarge: sfx('/audio/sfx/laser_large.ogg', 0.48),
    doorOpen: sfx('/audio/sfx/door_open.ogg', 0.55),
    doorClose: sfx('/audio/sfx/door_close.ogg', 0.55),
    computer: sfx('/audio/sfx/computer.ogg', 0.5),
    thrWhoosh: sfx('/audio/sfx/thr_whoosh.ogg', 0.45),
    metalImpact: sfx('/audio/sfx/metal_impact.ogg', 0.7),
    empBurst: sfx('/audio/sfx/emp_burst.ogg', 0.75),
  }

  /** Dark sci-fi ambience / loops (OGG + MP3); see `public/audio/ATTRIBUTION.md`. */
  private readonly musicMenu = musicTrack('/audio/music/music_menu.ogg', 0.22)
  private readonly musicBuild = musicTrack('/audio/music/music_build.ogg', 0.2)
  private readonly musicCombat = musicTrack('/audio/music/music_combat.mp3', 0.22)

  /** `null` until first `setMusicPhase` so the initial menu pass always applies. */
  private musicPhase: MusicPhase | null = null
  private lastShieldHitMs = 0
  private unlocked = false

  unlock() {
    if (this.unlocked) return
    this.unlocked = true
    const ctx = Howler.ctx
    if (ctx?.state === 'suspended') void ctx.resume()
    if (!this.musicMenu.playing() && !this.musicBuild.playing() && !this.musicCombat.playing()) {
      this.applyMusicPhase(this.musicPhase ?? 'menu')
    }
  }

  setMusicPhase(phase: MusicPhase) {
    if (phase === this.musicPhase) return
    this.musicPhase = phase
    this.musicMenu.stop()
    this.musicBuild.stop()
    this.musicCombat.stop()
    if (!this.unlocked) return
    this.applyMusicPhase(phase)
  }

  private applyMusicPhase(phase: MusicPhase) {
    switch (phase) {
      case 'menu':
        this.musicMenu.play()
        break
      case 'build':
        this.musicBuild.play()
        break
      case 'combat':
        this.musicCombat.play()
        break
      case 'gameover':
        break
    }
  }

  handleEvent(e: GameAudioEvent) {
    if (!this.unlocked) return
    switch (e.type) {
      case 'wave_start':
        this.sfx.thrWhoosh.play()
        break
      case 'wave_cleared':
        this.sfx.computer.play()
        break
      case 'asteroid_impact':
        this.sfx.explosionLow.play()
        break
      case 'shield_hit': {
        const now = performance.now()
        if (now - this.lastShieldHitMs < 72) return
        this.lastShieldHitMs = now
        this.sfx.forceField.play()
        break
      }
      case 'asteroid_destroyed':
        if (e.reason === 'combat') {
          if (e.variant === 'colossus' || e.variant === 'planet') this.sfx.laserLarge.play()
          else this.sfx.laserSmall.play()
        } else {
          this.sfx.laserSmall.play()
        }
        break
      case 'emp_pulse':
        this.sfx.empBurst.play()
        break
      case 'aoe_pop':
        this.sfx.explosionCrunch.play()
        break
      case 'build_place':
        this.sfx.doorOpen.play()
        break
      case 'build_sell':
        this.sfx.doorClose.play()
        break
      case 'upgrade_purchase':
        this.sfx.computer.play()
        break
      case 'upgrade_refund':
        this.sfx.doorClose.play()
        break
      case 'asteroid_discovery':
        this.sfx.computer.play()
        break
      case 'game_over':
        this.musicMenu.stop()
        this.musicBuild.stop()
        this.musicCombat.stop()
        this.sfx.metalImpact.play()
        break
      default:
        break
    }
  }
}

export function createGameAudioEngine() {
  return new GameAudioEngine()
}
