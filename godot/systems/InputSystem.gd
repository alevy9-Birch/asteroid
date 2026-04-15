extends RefCounted
class_name InputSystem

func ensure_default_actions() -> void:
	_remove_action_if_exists("toggle_build_mode")
	_add_action_if_missing("ui_pause", KEY_P)
	_add_action_if_missing("simulate_gameover", KEY_G)
	_add_action_if_missing("start_wave", KEY_SPACE)
	_add_action_if_missing("buy_upgrade_core", KEY_U)
	_add_action_if_missing("buy_upgrade_factory", KEY_I)
	_add_action_if_missing("buy_upgrade_logistics", KEY_O)
	_add_action_if_missing("buy_upgrade_nuclear", KEY_N)
	_add_action_if_missing("toggle_diagnostics", KEY_F3)
	_add_action_if_missing("toggle_build_mode_alt", KEY_C)
	_add_action_if_missing("toggle_research_panel", KEY_R)
	_add_action_if_missing("move_forward", KEY_W)
	_add_action_if_missing("move_left", KEY_A)
	_add_action_if_missing("move_back", KEY_S)
	_add_action_if_missing("move_right", KEY_D)
	_add_action_if_missing("move_down", KEY_Q)
	_add_action_if_missing("move_up", KEY_E)

func _add_action_if_missing(action_name: StringName, keycode: Key) -> void:
	if InputMap.has_action(action_name):
		return
	InputMap.add_action(action_name)
	var ev := InputEventKey.new()
	ev.keycode = keycode
	InputMap.action_add_event(action_name, ev)


func _remove_action_if_exists(action_name: StringName) -> void:
	if InputMap.has_action(action_name):
		InputMap.erase_action(action_name)
