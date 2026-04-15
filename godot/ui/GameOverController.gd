extends RefCounted
class_name GameOverController

func set_visible(gameover_overlay: Control, visible: bool) -> void:
	gameover_overlay.visible = visible

func format_hint(wave: int) -> String:
	return "Waves survived: %d" % wave
