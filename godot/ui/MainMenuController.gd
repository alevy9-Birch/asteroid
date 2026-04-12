extends RefCounted
class_name MainMenuController

func set_visible(menu_overlay: Control, visible: bool) -> void:
	menu_overlay.visible = visible

func clear_button_highlights(buttons: Array[Button], default_color: Color) -> void:
	for b in buttons:
		b.modulate = default_color

func update_menu_highlight(
	phase_playing: bool,
	buttons: Array[Button],
	menu_cursor: Vector2,
	highlight_color: Color,
	default_color: Color,
) -> Button:
	if phase_playing:
		return null
	var highlighted: Button = null
	for b in buttons:
		if not b.visible:
			continue
		if b.get_global_rect().has_point(menu_cursor):
			highlighted = b
			break
	clear_button_highlights(buttons, default_color)
	if highlighted != null:
		highlighted.modulate = highlight_color
	return highlighted

func activate_menu_target(highlighted_button: Button) -> void:
	if highlighted_button == null:
		return
	highlighted_button.emit_signal("pressed")

func update_cursor(menu_cursor: Vector2, delta: Vector2, viewport_size: Vector2) -> Vector2:
	var next := menu_cursor + delta
	next.x = clampf(next.x, 8.0, viewport_size.x - 8.0)
	next.y = clampf(next.y, 8.0, viewport_size.y - 8.0)
	return next

func move_virtual_cursor(cursor_node: Control, pos: Vector2, phase_playing: bool) -> void:
	var half := cursor_node.size * 0.5
	cursor_node.position = pos - half
	cursor_node.visible = not phase_playing
