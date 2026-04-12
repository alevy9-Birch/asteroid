extends RefCounted
class_name CameraSystem

const LOOK_SENSITIVITY := 0.0022
const CAMERA_MOVE_SPEED := 26.0
const CAMERA_MIN_Y := 8.0
const CAMERA_MAX_Y := 90.0
const WORLD_BOUNDS := 100.0

var yaw := 0.0
var pitch := -0.82
var camera_pos := Vector3(0, 62, 72)

func reset(camera: Camera3D) -> void:
	yaw = 0.0
	pitch = -0.82
	camera_pos = Vector3(0, 62, 72)
	apply(camera)

func apply_mouse_look(relative: Vector2) -> void:
	yaw -= relative.x * LOOK_SENSITIVITY
	pitch = clampf(pitch - relative.y * LOOK_SENSITIVITY, -1.35, 1.35)

func update_movement(delta: float, camera: Camera3D) -> void:
	var forward := Vector3(sin(yaw), 0, cos(yaw)).normalized()
	var right := Vector3(forward.z, 0, -forward.x).normalized()
	var move := Vector3.ZERO
	if Input.is_action_pressed("move_forward"):
		move += forward
	if Input.is_action_pressed("move_back"):
		move -= forward
	if Input.is_action_pressed("move_right"):
		move += right
	if Input.is_action_pressed("move_left"):
		move -= right
	if Input.is_action_pressed("move_up"):
		move.y += 1.0
	if Input.is_action_pressed("move_down"):
		move.y -= 1.0
	if move.length_squared() > 0.001:
		camera_pos += move.normalized() * CAMERA_MOVE_SPEED * delta
	camera_pos.x = clampf(camera_pos.x, -WORLD_BOUNDS, WORLD_BOUNDS)
	camera_pos.z = clampf(camera_pos.z, -WORLD_BOUNDS, WORLD_BOUNDS)
	camera_pos.y = clampf(camera_pos.y, CAMERA_MIN_Y, CAMERA_MAX_Y)
	apply(camera)

func apply(camera: Camera3D) -> void:
	camera.position = camera_pos
	camera.rotation = Vector3(pitch, yaw, 0.0)

func screen_to_world_on_ground(camera: Camera3D, screen: Vector2, grid_size: float) -> Vector3:
	var origin := camera.project_ray_origin(screen)
	var dir := camera.project_ray_normal(screen)
	if absf(dir.y) < 0.0001:
		return Vector3.ZERO
	var t := -origin.y / dir.y
	var hit := origin + dir * t
	return Vector3(round(hit.x / grid_size) * grid_size, 0.8, round(hit.z / grid_size) * grid_size)
