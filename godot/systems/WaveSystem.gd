extends RefCounted
class_name WaveSystem

## Web `BaseDefenseGame.ts`: `inactiveDurationSec` (60) between waves; auto-start when timer hits 0;
## manual Space only while timer > 0 (early start).

func tick(delta: float, state: Dictionary, asteroid_count: int, spawn_asteroid: Callable) -> Dictionary:
	var out := state.duplicate(true)
	# Between waves: count down inactive timer, then auto-start (matches web `updateWave` auto path).
	if bool(out.get("first_wave_started", false)):
		var idle := not out.wave_spawning and int(out.get("spawn_remaining", 0)) <= 0 and asteroid_count == 0
		if idle and int(out.get("wave", 0)) > 0:
			var left := float(out.get("inactive_time_left_sec", 0.0))
			if left > 0.0:
				left = maxf(0.0, left - delta)
				out.inactive_time_left_sec = left
			if left <= 0.0:
				out = start_next_wave(out, asteroid_count)

	if not out.wave_spawning:
		return out

	out.spawn_timer -= delta
	if out.spawn_timer > 0.0:
		return out

	spawn_asteroid.call()
	out.spawn_remaining -= 1
	out.spawn_timer = max(0.12, 0.55 - out.wave * 0.02)
	if out.spawn_remaining <= 0:
		out.wave_spawning = false
	return out

func start_next_wave(state: Dictionary, asteroid_count: int) -> Dictionary:
	var out := state.duplicate(true)
	if out.wave_spawning or int(out.get("spawn_remaining", 0)) > 0 or asteroid_count > 0:
		return out
	# Web: `currentInactivePhase` increments at every successful wave start (with wave++).
	out.current_inactive_phase = int(out.get("current_inactive_phase", 0)) + 1
	out.wave = int(out.get("wave", 0)) + 1
	out.wave_spawning = true
	out.spawn_remaining = 5 + out.wave * 2
	out.spawn_timer = 0.2
	out.inactive_time_left_sec = 0.0
	return out
