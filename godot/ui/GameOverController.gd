extends RefCounted
class_name GameOverController

func set_visible(gameover_overlay: Control, visible: bool) -> void:
	gameover_overlay.visible = visible

func format_hint(wave: int, kills: int, earned: int, spent: int) -> String:
	return "Wave %d | Kills %d | Earned %d | Spent %d" % [wave, kills, earned, spent]
