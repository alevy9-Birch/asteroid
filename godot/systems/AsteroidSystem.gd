extends RefCounted
class_name AsteroidSystem

const VARIANTS := ["normal", "splitter", "explosive", "meteor", "seeker", "planet", "gold", "spawner", "emp", "colossus"]
const IMPACT_TRIGGER_DISTANCE := 2.2
const IMPACT_TRIGGER_MIN_Y := 0.6

func pick_variant(rand: RandomNumberGenerator, wave: int) -> String:
	var w := _variant_weights_for_wave(wave)
	var allowed := _allowed_variant_pool_for_wave(w, wave)
	return _pick_weighted(rand, w, allowed)


func pick_variant_with_discovery(rand: RandomNumberGenerator, wave: int, discovered: Array[String]) -> String:
	var w := _variant_weights_for_wave(wave)
	var allowed := _allowed_variant_pool_with_discovery(w, wave, discovered)
	return _pick_weighted(rand, w, allowed)


func pick_variant_from_pool(rand: RandomNumberGenerator, wave: int, pool: Array[String]) -> String:
	var w := _variant_weights_for_wave(wave)
	if pool.is_empty():
		return _pick_weighted(rand, w, _allowed_variant_pool_for_wave(w, wave))
	return _pick_weighted(rand, w, pool)


func build_wave_variant_pool_with_discovery(wave: int, discovered: Array[String]) -> Array[String]:
	var w := _variant_weights_for_wave(wave)
	return _allowed_variant_pool_with_discovery(w, wave, discovered)


func _pick_weighted(rand: RandomNumberGenerator, weights: Dictionary, allowed: Array[String]) -> String:
	var total := 0.0
	for v in allowed:
		total += maxf(0.0001, float(weights.get(v, 0.01)))
	var r := rand.randf() * total
	for v in allowed:
		r -= maxf(0.0001, float(weights.get(v, 0.01)))
		if r <= 0.0:
			return v
	return "normal"


func _variant_weights_for_wave(wave: int) -> Dictionary:
	# Web parity (`getAsteroidVariantWeights`): linear ramp by `waveT = clamp(wave / 18, 0, 1)`.
	var wave_t := clampf(float(wave) / 18.0, 0.0, 1.0)
	return {
		"normal": 1.0,
		"splitter": 0.035 + 0.11 * wave_t,
		"explosive": 0.02 + 0.085 * wave_t,
		"meteor": 0.015 + 0.07 * wave_t,
		"seeker": 0.02 + 0.06 * wave_t,
		"planet": 0.008 + 0.03 * wave_t,
		"gold": 0.015 + 0.06 * wave_t,
		"spawner": 0.006 + 0.03 * wave_t,
		"emp": 0.01 + 0.045 * wave_t,
		"colossus": 0.002 + 0.012 * wave_t,
	}


func _allowed_variant_pool_for_wave(weights: Dictionary, wave: int) -> Array[String]:
	var max_types := mini(VARIANTS.size(), 2 + int(floor(float(wave) / 3.0)))
	var scored: Array = []
	for v in VARIANTS:
		scored.append({"id": v, "w": float(weights.get(v, 0.01))})
	scored.sort_custom(func(a, b): return float(a["w"]) > float(b["w"]))
	var pool: Array[String] = []
	for e in scored:
		if pool.size() >= max_types:
			break
		pool.append(String(e["id"]))
	if not pool.has("normal"):
		if pool.is_empty():
			pool.append("normal")
		else:
			pool[pool.size() - 1] = "normal"
	return pool


func _allowed_variant_pool_with_discovery(weights: Dictionary, wave: int, discovered: Array[String]) -> Array[String]:
	# Web parity (`configureWaveVariantPool`): build pool from known set, keep normal, then inject one unknown variant.
	var max_types := mini(VARIANTS.size(), 2 + int(floor(float(wave) / 3.0)))
	var known: Array[String] = []
	for v in discovered:
		if not VARIANTS.has(v):
			continue
		if known.has(v):
			continue
		known.append(v)
	if not known.has("normal"):
		known.push_front("normal")
	if known.is_empty():
		known.append("normal")
	known.sort_custom(func(a, b): return float(weights.get(a, 0.01)) > float(weights.get(b, 0.01)))
	var pool: Array[String] = known.slice(0, max_types)
	if not pool.has("normal"):
		if pool.size() >= max_types and pool.size() > 0:
			pool[pool.size() - 1] = "normal"
		else:
			pool.append("normal")

	var unknown: Array[String] = []
	for v in VARIANTS:
		if not known.has(v):
			unknown.append(v)
	if unknown.size() > 0 and wave >= 2:
		unknown.sort_custom(func(a, b): return float(weights.get(a, 0.01)) > float(weights.get(b, 0.01)))
		var intro := unknown[0]
		if not pool.has(intro):
			if pool.size() >= max_types:
				var idx := -1
				for i in range(pool.size()):
					if pool[i] != "normal":
						idx = i
						break
				if idx >= 0:
					pool[idx] = intro
			else:
				pool.append(intro)
	return pool

func update_asteroids(
	delta: float,
	asteroids: Array,
	command_center_pos: Vector3,
	seeker_targets: Array = [],
	wave: int = 1,
	difficulty: String = "hard",
) -> Array:
	var out := asteroids.duplicate(true)
	for i in range(out.size() - 1, -1, -1):
		var a = out[i]
		var variant := String(a.get("variant", "normal"))
		var stasis_t := maxf(0.0, float(a.get("stasisTimer", 0.0)) - delta)
		var pulsar_t := maxf(0.0, float(a.get("pulsarSlowTimer", 0.0)) - delta)
		var radar_t := maxf(0.0, float(a.get("radarMarkTimer", 0.0)) - delta)
		a["stasisTimer"] = stasis_t
		a["pulsarSlowTimer"] = pulsar_t
		a["radarMarkTimer"] = radar_t
		var pos: Vector3 = a["pos"]
		var move_target := command_center_pos
		if a.has("target") and typeof(a["target"]) == TYPE_VECTOR3:
			move_target = Vector3(a["target"])
		# Web parity: seekers continuously retarget the closest live building while moving.
		if variant == "seeker":
			move_target = _closest_target_point(pos, seeker_targets, command_center_pos)
		var dir := (move_target - pos).normalized()
		## Web: per-asteroid `speed` after variant `speedMul`; set at spawn via `compute_spawn_kinematics`.
		var spd := float(a.get("move_speed", 5.2))
		var slow_mul := 0.52 if pulsar_t > 0.0 else 1.0
		if stasis_t <= 0.0:
			pos += dir * spd * slow_mul * delta
		a["pos"] = pos
		a["target"] = move_target
		var node: MeshInstance3D = a["node"]
		node.position = pos
		if variant == "spawner":
			var cd := float(a.get("spawnCooldown", 0.0)) - delta
			if cd <= 0.0:
				a["spawnReady"] = true
				cd += _next_spawner_cooldown_sec(wave, difficulty)
			else:
				a["spawnReady"] = false
			a["spawnCooldown"] = cd
		out[i] = a
	return out


func _closest_target_point(from_pos: Vector3, targets: Array, fallback: Vector3) -> Vector3:
	var best := fallback
	var best_d := INF
	for t in targets:
		if typeof(t) != TYPE_VECTOR3:
			continue
		var tp: Vector3 = t
		var d := _dist2_xz(from_pos, tp)
		if d < best_d:
			best_d = d
			best = tp
	return best


func _next_spawner_cooldown_sec(wave: int, difficulty: String) -> float:
	# Web parity (`BaseDefenseGame.updateAsteroids`): max(2.2, 5.2 - adj * 0.12)
	var sc := WaveScaling.enemy_scaling_wave(maxi(1, wave), difficulty)
	var adj := float(sc.get("adj", 1.0))
	return maxf(2.2, 5.2 - adj * 0.12)

func find_impacts(asteroids: Array, command_center_pos: Vector3) -> Array:
	var hits: Array = []
	for i in range(asteroids.size()):
		var pos: Vector3 = asteroids[i]["pos"]
		var target := command_center_pos
		if asteroids[i].has("target") and typeof(asteroids[i]["target"]) == TYPE_VECTOR3:
			target = Vector3(asteroids[i]["target"])
		# Web parity: impact trigger is near-target distance (2.2) or very low altitude, not AOE radius.
		if _dist_xz(pos, target) < IMPACT_TRIGGER_DISTANCE or pos.y <= IMPACT_TRIGGER_MIN_Y:
			var variant := String(asteroids[i].get("variant", "normal"))
			var dmg := float(asteroids[i].get("impact_damage", 70.0))
			hits.append({
				"index": i,
				"damage": dmg,
				"variant": variant,
			})
	return hits


func _dist_xz(a: Vector3, b: Vector3) -> float:
	var dx := a.x - b.x
	var dz := a.z - b.z
	return sqrt(dx * dx + dz * dz)


func _dist2_xz(a: Vector3, b: Vector3) -> float:
	var dx := a.x - b.x
	var dz := a.z - b.z
	return dx * dx + dz * dz

func variant_speed_mul(variant: String) -> float:
	match variant:
		"splitter":
			return 1.02
		"explosive":
			return 1.08
		"meteor":
			return 2.05
		"seeker":
			return 1.45
		"planet":
			return 0.62
		"spawner":
			return 0.55
		"emp":
			return 0.92
		"gold":
			return 0.96
		"colossus":
			return 0.5
		_:
			return 1.0

## Web `spawnAsteroid` switch: `impactDamage / baseDamage`.
func variant_impact_damage_mul(variant: String) -> float:
	match variant:
		"splitter":
			return 0.7
		"explosive":
			return 0.68
		"meteor":
			return 1.45
		"seeker":
			return 1.02
		"planet":
			return 1.12
		"gold":
			return 0.95
		"spawner":
			return 0.82
		"emp":
			return 0.55
		"colossus":
			return 1.2
		_:
			return 1.0


## Web impact radius in world units; scaled to Godot arena (legacy hit test used ~2.6 for normal).
const _WEB_REF_RADIUS := 4.6

func variant_impact_radius_web(variant: String) -> float:
	match variant:
		"splitter":
			return 4.2
		"explosive":
			return 6.6
		"meteor":
			return 0.95
		"seeker":
			return 4.9
		"planet":
			return 7.6
		"gold":
			return 4.9
		"spawner":
			return 4.4
		"emp":
			return 5.8
		"colossus":
			return 10.5
		_:
			return 4.6


func compute_spawn_kinematics(variant: String, base_hp: float, base_damage: float, base_speed: float) -> Dictionary:
	var hp_m := variant_hp_mul(variant)
	var sp_m := variant_speed_mul(variant)
	var max_hp := maxi(40, int(round(base_hp * hp_m)))
	var move_speed := base_speed * sp_m
	var dmg_mul := variant_impact_damage_mul(variant)
	var impact_damage := base_damage * dmg_mul
	var r_web := variant_impact_radius_web(variant)
	var impact_radius := r_web * (2.6 / _WEB_REF_RADIUS)
	return {
		"max_hp": float(max_hp),
		"move_speed": move_speed,
		"impact_damage": impact_damage,
		"impact_radius": impact_radius,
	}

func variant_hp_mul(variant: String) -> float:
	match variant:
		"splitter":
			return 0.92
		"explosive":
			return 0.9
		"meteor":
			return 0.8
		"seeker":
			return 0.88
		"colossus":
			return 20.0
		"planet":
			return 2.4
		"gold":
			return 1.12
		"spawner":
			return 1.6
		"emp":
			return 1.05
		_:
			return 1.0

func variant_size_mul(variant: String) -> float:
	match variant:
		"splitter":
			return 1.0
		"explosive":
			return 1.03
		"meteor":
			return 0.88
		"seeker":
			return 0.95
		"planet":
			return 2.25
		"gold":
			return 1.08
		"spawner":
			return 1.35
		"emp":
			return 1.12
		"colossus":
			return 10.0
		_:
			return 1.0

func variant_color(variant: String) -> Color:
	match variant:
		"splitter":
			return Color(0.64, 0.11, 0.69, 1.0)
		"explosive":
			return Color(1.0, 0.30, 0.43, 1.0)
		"meteor":
			return Color(0.22, 0.74, 0.97, 1.0)
		"seeker":
			return Color(0.13, 0.77, 0.37, 1.0)
		"planet":
			return Color(0.92, 0.70, 0.03, 1.0)
		"gold":
			return Color(0.98, 0.80, 0.08, 1.0)
		"spawner":
			return Color(0.05, 0.64, 0.91, 1.0)
		"emp":
			return Color(0.49, 0.83, 0.99, 1.0)
		"colossus":
			return Color(0.61, 0.64, 0.69, 1.0)
		_:
			return Color(0.95, 0.55, 0.45, 1.0)


func variant_display_name(variant: String) -> String:
	match variant:
		"splitter":
			return "Splitter"
		"explosive":
			return "Explosive"
		"meteor":
			return "Meteor"
		"seeker":
			return "Seeker"
		"planet":
			return "Planet"
		"gold":
			return "Gold"
		"spawner":
			return "Spawner"
		"emp":
			return "EMP"
		"colossus":
			return "Colossus"
		_:
			return "Normal"


func variant_discovery_description(variant: String) -> String:
	match variant:
		"splitter":
			return "Splits into smaller splitters on death."
		"explosive":
			return "Detonates on death, even mid-air."
		"meteor":
			return "Fast impactor with high single-hit damage."
		"seeker":
			return "Steers toward buildings during flight."
		"planet":
			return "Huge and durable, but moves slower."
		"gold":
			return "Drops bonus credits when destroyed."
		"spawner":
			return "Periodically launches fast meteors."
		"emp":
			return "Death blast disables nearby turrets."
		"colossus":
			return "Massive elite with extreme durability."
		_:
			return "Standard asteroid."

func on_asteroid_destroyed(asteroid: Dictionary, reason: String) -> Dictionary:
	var variant := String(asteroid.get("variant", "normal"))
	var split_level := int(asteroid.get("splitLevel", 0))
	var res := {
		"spawn_children": 0,
		"spawn_variant": "normal",
		"aoe_radius": 0.0,
		"aoe_damage": 0.0,
		"emp_radius": 0.0,
		"emp_power_drain_per_building": 0.0,
		"spawn_meteors": 0,
	}
	if variant == "splitter" and split_level < 2:
		res.spawn_children = 2
		res.spawn_variant = "splitter"
	elif variant == "explosive" and reason != "impact":
		res.aoe_radius = 10.0
		res.aoe_damage = 38.0
	elif variant == "emp":
		res.emp_radius = 18.0
		res.emp_power_drain_per_building = 22.0
	return res
