extends RefCounted
class_name GameOverController

const CommanderSystemScript = preload("res://systems/CommanderSystem.gd")
var commander_system = CommanderSystemScript.new()

func set_visible(gameover_overlay: Control, visible: bool) -> void:
	gameover_overlay.visible = visible

func format_hint(wave: int, commander: String = "none") -> String:
	var cmd := ""
	if commander != "none" and not commander.is_empty():
		cmd = " | Commander: %s" % commander_system.display_name(commander)
	return "Waves survived: %d%s" % [wave, cmd]
