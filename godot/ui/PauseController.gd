extends RefCounted
class_name PauseController

func set_visible(pause_overlay: Control, visible: bool) -> void:
	pause_overlay.visible = visible

func handle_toggle(current_phase: int, phase_playing: int, phase_paused: int) -> int:
	if current_phase == phase_playing:
		return phase_paused
	if current_phase == phase_paused:
		return phase_playing
	return current_phase
