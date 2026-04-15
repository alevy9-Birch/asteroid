extends RefCounted
class_name AsteroidSystem

const VARIANTS := ["normal", "splitter", "explosive", "meteor", "seeker", "planet", "gold", "spawner", "emp", "colossus"]

func pick_variant(rand: RandomNumberGenerator, wave: int) -> String:
	# Placeholder weighted ramp. This is parity-scaffold only; real weights will be imported.
	if wave < 3:
		return "normal"
	if wave < 6:
		return ["normal", "splitter", "explosive"][rand.randi_range(0, 2)]
	return VARIANTS[rand.randi_range(0, VARIANTS.size() - 1)]

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
		var pos: Vector3 = a["pos"]
		var move_target := command_center_pos
		# Web parity: seekers continuously retarget the closest live building while moving.
		if variant == "seeker":
			move_target = _closest_target_point(pos, seeker_targets, command_center_pos)
		var dir := (move_target - pos).normalized()
		## Web: per-asteroid `speed` after variant `speedMul`; set at spawn via `compute_spawn_kinematics`.
		var spd := float(a.get("move_speed", 5.2))
		pos += dir * spd * delta
		a["pos"] = pos
		if variant == "seeker":
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
		var d := from_pos.distance_squared_to(tp)
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
		var rad := float(asteroids[i].get("impact_radius", 2.6))
		if pos.distance_to(command_center_pos) < rad:
			var variant := String(asteroids[i].get("variant", "normal"))
			var dmg := float(asteroids[i].get("impact_damage", 70.0))
			hits.append({
				"index": i,
				"damage": dmg,
				"variant": variant,
			})
	return hits

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
			return 3.8
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

func on_asteroid_destroyed(asteroid: Dictionary, reason: String) -> Dictionary:
	var variant := String(asteroid.get("variant", "normal"))
	var split_level := int(asteroid.get("splitLevel", 0))
	var res := {
		"spawn_children": 0,
		"spawn_variant": "normal",
		"aoe_radius": 0.0,
		"aoe_damage": 0.0,
		"emp_radius": 0.0,
		"emp_disable_sec": 0.0,
		"spawn_meteors": 0,
	}
	if variant == "splitter" and split_level < 2:
		res.spawn_children = 2
		res.spawn_variant = "splitter"
	elif variant == "explosive" and reason != "impact":
		res.aoe_radius = 10.0
		res.aoe_damage = 38.0
	elif variant == "emp":
		res.emp_radius = 14.0
		res.emp_disable_sec = 3.5
	elif variant == "spawner":
		res.spawn_meteors = 1
	elif variant == "colossus":
		res.aoe_radius = 14.0
		res.aoe_damage = 62.0
	return res
