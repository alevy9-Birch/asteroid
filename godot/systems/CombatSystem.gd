extends RefCounted
class_name CombatSystem

func select_target_index(tpos: Vector3, asteroids: Array, live_range: float) -> int:
	var best := -1
	var best_dist := INF
	for i in range(asteroids.size()):
		var apos: Vector3 = asteroids[i]["pos"]
		var d := tpos.distance_to(apos)
		if d < live_range and d < best_dist:
			best_dist = d
			best = i
	return best

func apply_projectile_hit(
	pos: Vector3,
	damage: float,
	asteroids: Array,
	kill_credit_bonus: int,
) -> Dictionary:
	var out := {
		"hit": false,
		"asteroids": asteroids,
		"killed_index": -1,
		"payout": 0,
	}
	var best := -1
	var best_d := 1.25
	for i in range(asteroids.size()):
		var ap: Vector3 = asteroids[i]["pos"]
		var d := ap.distance_to(pos)
		if d < best_d:
			best_d = d
			best = i
	if best < 0:
		return out
	var next_asteroids = asteroids.duplicate(true)
	var a = next_asteroids[best]
	a["hp"] = float(a["hp"]) - damage
	next_asteroids[best] = a
	out.hit = true
	out.asteroids = next_asteroids
	if float(a["hp"]) <= 0.0:
		out.killed_index = best
		out.payout = 12 + kill_credit_bonus
	return out

func step_projectiles(
	delta: float,
	projectiles: Array,
	asteroids: Array,
	kill_credit_bonus: int,
) -> Dictionary:
	var next_projectiles := projectiles.duplicate(true)
	var next_asteroids := asteroids.duplicate(true)
	var removed_projectile_indices := PackedInt32Array()
	var killed_asteroid_indices := PackedInt32Array()
	var payout_total := 0

	for i in range(next_projectiles.size() - 1, -1, -1):
		var p = next_projectiles[i]
		var pos: Vector3 = p["pos"]
		var vel: Vector3 = p["vel"]
		var ttl: float = p["ttl"] - delta
		pos += vel * delta
		p["pos"] = pos
		p["ttl"] = ttl
		next_projectiles[i] = p

		var hit = apply_projectile_hit(pos, float(p["damage"]), next_asteroids, kill_credit_bonus)
		if bool(hit.hit):
			next_asteroids = hit.asteroids
			var killed_index := int(hit.killed_index)
			if killed_index >= 0:
				killed_asteroid_indices.append(killed_index)
				payout_total += int(hit.payout)
			removed_projectile_indices.append(i)
			continue
		if ttl <= 0.0:
			removed_projectile_indices.append(i)

	return {
		"projectiles": next_projectiles,
		"asteroids": next_asteroids,
		"remove_projectiles": removed_projectile_indices,
		"killed_asteroids": killed_asteroid_indices,
		"payout_total": payout_total,
	}
