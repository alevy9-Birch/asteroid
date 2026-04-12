extends RefCounted
class_name WaveScaling

## Mirrors `BaseDefenseGame.ts` difficulty + enemy scaling helpers (hard default).

static func difficulty_scale(diff: String) -> Dictionary:
	## Web `getDifficultyScale()` — includes asteroid `hpMul` / `damageMul` / `speedMul`.
	match diff:
		"easy":
			return {"count_mul": 0.72, "spawn_interval_mul": 1.22, "hp_mul": 0.72, "damage_mul": 0.75, "speed_mul": 0.82}
		"medium":
			return {"count_mul": 0.86, "spawn_interval_mul": 1.1, "hp_mul": 0.86, "damage_mul": 0.9, "speed_mul": 0.92}
		"brutal":
			return {"count_mul": 1.22, "spawn_interval_mul": 0.9, "hp_mul": 1.2, "damage_mul": 1.2, "speed_mul": 1.12}
		"deadly":
			return {"count_mul": 1.48, "spawn_interval_mul": 0.8, "hp_mul": 1.45, "damage_mul": 1.45, "speed_mul": 1.24}
		_:
			return {"count_mul": 1.0, "spawn_interval_mul": 1.0, "hp_mul": 1.0, "damage_mul": 1.0, "speed_mul": 1.0}


static func enemy_wave_progress_k(diff: String) -> float:
	match diff:
		"easy":
			return 0.5
		"medium":
			return 0.64
		"brutal":
			return 0.94
		"deadly":
			return 1.0
		_:
			return 0.82


static func enemy_scaling_wave(wave: int, diff: String) -> Dictionary:
	var k := enemy_wave_progress_k(diff)
	var pow_t := maxf(0.0, float(wave - 1)) * k
	var adj := 1.0 + pow_t
	return {"adj": adj, "pow_t": pow_t}


static func enemy_spawn_burst_exponent(diff: String) -> float:
	match diff:
		"easy":
			return 1.1
		"medium":
			return 1.135
		"brutal":
			return 1.172
		"deadly":
			return 1.18
		_:
			return 1.16


static func compute_to_spawn(wave: int, diff: String) -> int:
	var d := difficulty_scale(diff)
	var sc := enemy_scaling_wave(wave, diff)
	var adj: float = float(sc.get("adj", 1.0))
	var burst := enemy_spawn_burst_exponent(diff)
	var base_count := 10.0 + adj * 3.5
	var extra := 0.0
	if adj > 5.0:
		extra = 6.0 * pow(burst, adj - 5.0)
	var cm := float(d.get("count_mul", 1.0))
	var n := int(round((base_count + extra) * cm))
	return maxi(1, n)


static func spawn_interval_for_wave(wave: int, diff: String) -> float:
	var d := difficulty_scale(diff)
	var sc := enemy_scaling_wave(wave, diff)
	var adj: float = float(sc.get("adj", 1.0))
	var spawn_interval_base := maxf(0.06, 0.34 - adj * 0.015)
	var late_mult := 1.0
	if adj > 5.0:
		late_mult = pow(0.93, adj - 5.0)
	var sim := float(d.get("spawn_interval_mul", 1.0))
	return maxf(0.035, spawn_interval_base * late_mult * sim)


static func compute_spawn_window_duration_sec(to_spawn: int, wave: int, diff: String) -> float:
	if to_spawn <= 0:
		return 6.0
	var interval := spawn_interval_for_wave(wave, diff)
	return maxf(6.0, float(to_spawn) * interval)


## Web `spawnAsteroid()` base stats (`ASTEROID_HP_GLOBAL_MUL`, `getEnemyScalingWave`, `getDifficultyScale`).
const ASTEROID_HP_GLOBAL_MUL := 0.78

static func asteroid_base_stats(wave: int, diff: String) -> Dictionary:
	var sc := enemy_scaling_wave(wave, diff)
	var adj := float(sc.get("adj", 1.0))
	var pow_t := float(sc.get("pow_t", 0.0))
	var d := difficulty_scale(diff)
	var hp_m := float(d.get("hp_mul", 1.0))
	var dmg_m := float(d.get("damage_mul", 1.0))
	var spd_m := float(d.get("speed_mul", 1.0))
	var base_hp := int(round((100.0 + adj * 26.0 + pow(pow_t, 1.3) * 14.0) * hp_m * ASTEROID_HP_GLOBAL_MUL))
	var base_damage := int(round((360.0 + adj * 42.0 + pow(pow_t, 1.22) * 16.0) * dmg_m))
	var base_speed := (15.0 + adj * 0.9 + pow(pow_t, 1.08) * 0.18) * spd_m
	return {"base_hp": float(base_hp), "base_damage": float(base_damage), "base_speed": base_speed}
