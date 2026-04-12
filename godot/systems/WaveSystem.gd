extends RefCounted
class_name WaveSystem

## Parity with `BaseDefenseGame.ts` `updateWave` + `startNextWave`:
## spawn window (`spawnWindowDurationSec` / `spawnWindowElapsedSec` / `spawnWindowEnded`),
## `toSpawn` count + spawn intervals, inactive timer between waves.

const INACTIVE_DURATION_SEC := 60.0

func tick(delta: float, state: Dictionary, asteroid_count: int, spawn_asteroid: Callable) -> Dictionary:
	var out := state.duplicate(true)
	var wcb := bool(out.get("wave_combat_active", false))

	if wcb:
		out = _tick_active_wave(delta, out, asteroid_count, spawn_asteroid)
		wcb = bool(out.get("wave_combat_active", false))

	# Between waves (web `updateWave` inactive branch + auto-start).
	if not wcb and bool(out.get("first_wave_started", false)):
		var idle := asteroid_count == 0 and int(out.get("wave", 0)) > 0
		if idle:
			var left := float(out.get("inactive_time_left_sec", 0.0))
			if left > 0.0:
				left = maxf(0.0, left - delta)
				out["inactive_time_left_sec"] = left
			if left <= 0.0:
				out = start_next_wave(out, asteroid_count)

	return out


func _tick_active_wave(delta: float, out: Dictionary, asteroid_count: int, spawn_asteroid: Callable) -> Dictionary:
	var elapsed := float(out.get("spawn_window_elapsed_sec", 0.0)) + delta
	out["spawn_window_elapsed_sec"] = elapsed

	if not bool(out.get("spawn_window_ended", false)):
		var dur := float(out.get("spawn_window_duration_sec", 0.0))
		if dur > 0.0 and elapsed >= dur:
			out["spawn_window_ended"] = true
			out["to_spawn"] = 0

	var to_spawn := int(out.get("to_spawn", 0))
	if not bool(out.get("spawn_window_ended", false)) and to_spawn > 0:
		var stimer := float(out.get("spawn_timer", 0.0)) - delta
		out["spawn_timer"] = stimer
		if stimer <= 0.0:
			spawn_asteroid.call()
			to_spawn -= 1
			out["to_spawn"] = to_spawn
			var w := int(out.get("wave", 1))
			var diff := str(out.get("difficulty", "hard"))
			out["spawn_timer"] = WaveScaling.spawn_interval_for_wave(w, diff)

	var asteroids_done := asteroid_count == 0
	var spawn_done := bool(out.get("spawn_window_ended", false)) or int(out.get("to_spawn", 0)) <= 0
	if asteroids_done and spawn_done:
		out["wave_combat_active"] = false
		out["spawn_window_elapsed_sec"] = 0.0
		out["spawn_window_duration_sec"] = 0.0
		out["spawn_window_ended"] = false
		out["to_spawn"] = 0
		out["spawn_timer"] = 0.0
		out["inactive_time_left_sec"] = INACTIVE_DURATION_SEC

	return out


func start_next_wave(state: Dictionary, asteroid_count: int) -> Dictionary:
	var out := state.duplicate(true)
	if bool(out.get("wave_combat_active", false)) or asteroid_count > 0:
		return out

	out["current_inactive_phase"] = int(out.get("current_inactive_phase", 0)) + 1
	out["wave"] = int(out.get("wave", 0)) + 1
	var w := int(out["wave"])
	var diff := str(out.get("difficulty", "hard"))

	var ts := WaveScaling.compute_to_spawn(w, diff)
	out["to_spawn"] = ts
	out["spawn_window_duration_sec"] = WaveScaling.compute_spawn_window_duration_sec(ts, w, diff)
	out["spawn_window_elapsed_sec"] = 0.0
	out["spawn_window_ended"] = false
	out["spawn_timer"] = 0.0
	out["wave_combat_active"] = true
	out["inactive_time_left_sec"] = 0.0

	return out
