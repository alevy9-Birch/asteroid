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

func update_asteroids(delta: float, asteroids: Array, command_center_pos: Vector3, speed: float, wave: int) -> Array:
	var out := asteroids.duplicate(true)
	for i in range(out.size() - 1, -1, -1):
		var a = out[i]
		var pos: Vector3 = a["pos"]
		var dir := (command_center_pos - pos).normalized()
		var variant := String(a.get("variant", "normal"))
		pos += dir * speed * variant_speed_mul(variant) * (1.0 + wave * 0.06) * delta
		a["pos"] = pos
		var node: MeshInstance3D = a["node"]
		node.position = pos
		if variant == "spawner":
			var cd := float(a.get("spawnCooldown", 0.0)) - delta
			a["spawnCooldown"] = cd
			a["spawnReady"] = cd <= 0.0
		out[i] = a
	return out

func find_impacts(asteroids: Array, command_center_pos: Vector3, impact_distance: float) -> Array:
	var hits: Array = []
	for i in range(asteroids.size()):
		var pos: Vector3 = asteroids[i]["pos"]
		if pos.distance_to(command_center_pos) < impact_distance:
			var variant := String(asteroids[i].get("variant", "normal"))
			hits.append({
				"index": i,
				"damage": variant_impact_damage(variant),
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

func variant_impact_damage(variant: String) -> float:
	match variant:
		"splitter":
			return 49.0
		"explosive":
			return 48.0
		"meteor":
			return 102.0
		"seeker":
			return 71.0
		"planet":
			return 78.0
		"gold":
			return 67.0
		"spawner":
			return 57.0
		"emp":
			return 39.0
		"colossus":
			return 84.0
		_:
			return 70.0

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
