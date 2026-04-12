extends RefCounted
class_name HudController

func format_gameplay_info(
	wave: int,
	credits: int,
	center_hp: int,
	center_max_hp: int,
	turret_count: int,
	asteroid_count: int,
	wave_ready: bool,
	spawn_status: String,
) -> String:
	var wr := "wait"
	if wave_ready:
		wr = "ready"
	return "Wave %d | Credits %d | Center HP %d/%d | Turrets %d | Asteroids %d | Space:%s | %s | LMB build / RMB sell / P pause" % [
		wave, credits, center_hp, center_max_hp, turret_count, asteroid_count, wr, spawn_status
	]

func format_look_info(yaw: float, pitch: float) -> String:
	return "Yaw %.2f | Pitch %.2f | WASD move | Q/E up-down | center reticle build/sell" % [yaw, pitch]

func apply_center_hp(center_hp_bar: ProgressBar, center_hp: float, center_max_hp: float) -> void:
	center_hp_bar.max_value = center_max_hp
	center_hp_bar.value = center_hp
