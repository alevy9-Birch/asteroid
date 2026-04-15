extends RefCounted
class_name HudController

func format_gameplay_info(
	wave: int,
	credits: int,
	center_hp: int,
	center_max_hp: int,
	turret_count: int,
	asteroid_count: int,
	power_stored: int,
	power_cap: int,
	supply_used: int,
	supply_cap: int,
	wave_ready: bool,
	spawn_status: String,
	refund_hint: String = "",
) -> String:
	var wr := "wait"
	if wave_ready:
		wr = "ready"
	var tail := " | LMB/RMB | C build | U skills | R research | P pause"
	if not refund_hint.is_empty():
		tail = " | %s%s" % [refund_hint, tail]
	return "Wave %d | %dc | HP %d/%d | P %d/%d | S %d/%d | Tur %d | Ast %d | Space:%s | %s%s" % [
		wave,
		credits,
		center_hp,
		center_max_hp,
		power_stored,
		power_cap,
		supply_used,
		supply_cap,
		turret_count,
		asteroid_count,
		wr,
		spawn_status,
		tail,
	]

func format_look_info(yaw: float, pitch: float) -> String:
	return "Yaw %.2f | Pitch %.2f | WASD move | Q/E height | center reticle build/sell" % [yaw, pitch]

func apply_center_hp(center_hp_bar: ProgressBar, center_hp: float, center_max_hp: float) -> void:
	center_hp_bar.max_value = center_max_hp
	center_hp_bar.value = center_hp


## Web `App.tsx`: ring uses `waveSpawnProgress` while `waveInProgress`, else `inactiveTimeLeftSec / 60`.
func wave_timer_progress(
	wave_combat_active: bool,
	spawn_window_duration_sec: float,
	spawn_window_elapsed_sec: float,
	inactive_time_left_sec: float,
	inactive_duration_sec: float,
) -> float:
	if wave_combat_active:
		if spawn_window_duration_sec > 0.0:
			return clampf(spawn_window_elapsed_sec / spawn_window_duration_sec, 0.0, 1.0)
		return 0.0
	return clampf(inactive_time_left_sec / inactive_duration_sec, 0.0, 1.0)


## Web `App.tsx` `wave-timer-text` branches.
func format_wave_timer_caption(
	wave: int,
	wave_combat_active: bool,
	spawn_window_ended: bool,
	asteroid_count: int,
	inactive_time_left_sec: float,
) -> String:
	if wave == 0 and not wave_combat_active:
		return "Press Space to start"
	if wave_combat_active:
		if spawn_window_ended:
			return "Asteroids remaining: %d" % asteroid_count
		return "Spawning asteroids…"
	return "Next wave in %ds (Space)" % int(ceil(inactive_time_left_sec))

