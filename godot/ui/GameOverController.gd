extends RefCounted
class_name GameOverController

func set_visible(gameover_overlay: Control, visible: bool) -> void:
	gameover_overlay.visible = visible

func format_hint(wave: int, kills: int, earned: int, spent: int, commander: String = "none") -> String:
	var cmd := ""
	if commander != "none" and not commander.is_empty():
		cmd = " | Commander: %s" % commander
	return "Wave %d | Kills %d | Earned %d | Spent %d%s" % [wave, kills, earned, spent, cmd]
