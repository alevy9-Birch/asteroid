extends RefCounted
class_name BuildSystem

## Snap world XZ to grid (cell-center coordinates, same as placement math in `can_place_turret`).
func snap_placement(pos: Vector3, grid_size: float) -> Vector3:
	return _snap_to_grid(pos, grid_size)


## Cell centers for a w×h footprint centered on the snapped grid point (web-style cell alignment).
func footprint_cell_centers(center_world: Vector3, grid_size: float, footprint_w: int, footprint_h: int) -> Array[Vector3]:
	var cx := round(center_world.x / grid_size) * grid_size
	var cz := round(center_world.z / grid_size) * grid_size
	var out: Array[Vector3] = []
	for iz in range(footprint_h):
		for ix in range(footprint_w):
			var x := cx + (ix - (footprint_w - 1) * 0.5) * grid_size
			var z := cz + (iz - (footprint_h - 1) * 0.5) * grid_size
			out.append(Vector3(x, 0.0, z))
	return out


func _footprint_keys(center_world: Vector3, grid_size: float, footprint_w: int, footprint_h: int) -> Dictionary:
	var keys := {}
	for cell in footprint_cell_centers(center_world, grid_size, footprint_w, footprint_h):
		keys[_cell_key(cell, grid_size)] = true
	return keys


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
	footprint_w: int = 1,
	footprint_h: int = 1,
) -> bool:
	var fw := maxi(1, footprint_w)
	var fh := maxi(1, footprint_h)
	var p := _snap_to_grid(pos, grid_size)
	var c := _snap_to_grid(command_center_pos, grid_size)
	var new_keys := _footprint_keys(p, grid_size, fw, fh)
	for k in new_keys.keys():
		var cell_world := _key_to_world(k, grid_size)
		if abs(cell_world.x) > world_half_extent or abs(cell_world.z) > world_half_extent:
			return false
		if Vector3(cell_world.x, 0.0, cell_world.z).distance_to(Vector3(c.x, 0.0, c.z)) < center_clear_radius:
			return false
	var occupied := {}
	for t in turrets:
		var tw := maxi(1, int(t.get("footprint_w", 1)))
		var th := maxi(1, int(t.get("footprint_h", 1)))
		var tp: Vector3 = t["pos"]
		var tk := _footprint_keys(tp, grid_size, tw, th)
		for key in tk.keys():
			occupied[key] = true
	for k in new_keys.keys():
		if bool(occupied.get(k, false)):
			return false
	for t in turrets:
		var tp: Vector3 = t["pos"]
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


func _key_to_world(key: String, grid_size: float) -> Vector3:
	var parts := key.split(":")
	if parts.size() != 2:
		return Vector3.ZERO
	return Vector3(int(parts[0]) * grid_size, 0.0, int(parts[1]) * grid_size)
