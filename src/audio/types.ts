export type GameAudioEvent =
  | { type: 'wave_start' }
  | { type: 'wave_cleared' }
  | { type: 'asteroid_impact' }
  | { type: 'shield_hit' }
  | { type: 'asteroid_destroyed'; variant: string; reason: 'combat' | 'shield' }
  | { type: 'emp_pulse' }
  | { type: 'aoe_pop' }
  | { type: 'build_place' }
  | { type: 'build_sell' }
  | { type: 'upgrade_purchase' }
  | { type: 'upgrade_refund' }
  | { type: 'asteroid_discovery'; variant: string }
  | { type: 'game_over' }

export type MusicPhase = 'menu' | 'build' | 'combat' | 'gameover'
