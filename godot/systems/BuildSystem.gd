extends RefCounted
class_name BuildSystem

func can_place_turret(
	pos: Vector3,
	command_center_pos: Vector3,
	turrets: Array,
	credits: int,
	turret_cost: int,
	center_clear_radius: float,
	turret_clear_radius: float,
	grid_size: float = 2.0,
	world_half_extent: float = 100.0,
	footprint_cells: int = 1,
) -> bool:
	var p := _snap_to_grid(pos, grid_size)
	var c := _snap_to_grid(command_center_pos, grid_size)
	if abs(p.x) > world_half_extent or abs(p.z) > world_half_extent:
		return false
	if p.distance_to(c) < center_clear_radius:
		return false
	var occupied := {}
	for t in turrets:
		var tp: Vector3 = _snap_to_grid(t["pos"], grid_size)
		for ox in range(-footprint_cells, footprint_cells + 1):
			for oz in range(-footprint_cells, footprint_cells + 1):
				var key := _cell_key(tp + Vector3(ox * grid_size, 0, oz * grid_size), grid_size)
				occupied[key] = true
	for ox in range(-footprint_cells, footprint_cells + 1):
		for oz in range(-footprint_cells, footprint_cells + 1):
			var cell := p + Vector3(ox * grid_size, 0, oz * grid_size)
			if bool(occupied.get(_cell_key(cell, grid_size), false)):
				return false
	for t in turrets:
		var tp: Vector3 = _snap_to_grid(t["pos"], grid_size)
		if tp.distance_to(p) < turret_clear_radius:
			return false
	if credits < turret_cost:
		return false
	return true

func pick_sell_target(turrets: Array, target: Vector3, max_dist: float) -> int:
	var best := -1
	var best_dist := max_dist
	for i in range(turrets.size()):
		var p: Vector3 = turrets[i]["pos"]
		var d := p.distance_to(target)
		if d < best_dist:
			best_dist = d
			best = i
	return best

func _snap_to_grid(pos: Vector3, grid_size: float) -> Vector3:
	return Vector3(round(pos.x / grid_size) * grid_size, 0.0, round(pos.z / grid_size) * grid_size)

func _cell_key(pos: Vector3, grid_size: float) -> String:
	var gx := int(round(pos.x / grid_size))
	var gz := int(round(pos.z / grid_size))
	return "%d:%d" % [gx, gz]
