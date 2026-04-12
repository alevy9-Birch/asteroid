extends RefCounted
class_name WaveSystem

func tick(delta: float, state: Dictionary, asteroid_count: int, spawn_asteroid: Callable) -> Dictionary:
	var out := state.duplicate(true)
	# Web parity: first wave is manual (Space); do not auto-start via intermission until then.
	if bool(out.get("first_wave_started", false)):
		if not out.wave_spawning and out.spawn_remaining <= 0 and asteroid_count == 0:
			out.intermission_timer += delta
			if out.intermission_timer > 3.0:
				out.intermission_timer = 0.0
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
	if out.wave_spawning or out.spawn_remaining > 0 or asteroid_count > 0:
		return out
	out.wave += 1
	out.wave_spawning = true
	out.spawn_remaining = 5 + out.wave * 2
	out.spawn_timer = 0.2
	return out
