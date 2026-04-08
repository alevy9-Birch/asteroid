extends Control

enum AppPhase { MENU, PLAYING, PAUSED, GAMEOVER }

const MENU_HIGHLIGHT_COLOR := Color(0.20, 0.45, 0.85, 1.0)
const MENU_DEFAULT_COLOR := Color(1, 1, 1, 1)
const LOOK_SENSITIVITY := 0.0022
const GRID_SIZE := 32.0
const TURRET_COST := 100
const SELL_REFUND := 50
const TURRET_RANGE := 160.0
const TURRET_DAMAGE := 28.0
const TURRET_COOLDOWN := 0.42
const ASTEROID_SPEED := 52.0
const ASTEROID_BASE_HP := 60.0
const CENTER_MAX_HP := 1000.0

@onready var gameplay_layer: ColorRect = $GameplayLayer
@onready var look_readout: Label = $GameplayLayer/LookReadout
@onready var gameplay_info: Label = $GameplayLayer/GameplayInfo
@onready var menu_overlay: PanelContainer = $MenuOverlay
@onready var pause_overlay: PanelContainer = $PauseOverlay
@onready var gameover_overlay: PanelContainer = $GameOverOverlay
@onready var virtual_cursor: ColorRect = $VirtualCursor
@onready var menu_volume_value: Label = $MenuOverlay/MenuVBox/MenuVolumeRow/MenuVolumeValue
@onready var pause_volume_value: Label = $PauseOverlay/PauseVBox/PauseVolumeRow/PauseVolumeValue

var phase: AppPhase = AppPhase.MENU
var yaw := 0.0
var pitch := 0.0
var master_volume := 0.85
var menu_cursor := Vector2.ZERO
var highlighted_button: Button
var all_menu_buttons: Array[Button] = []
var turrets: Array = []
var asteroids: Array = []
var wave := 0
var credits := 350
var command_center_hp := CENTER_MAX_HP
var wave_spawning := false
var spawn_remaining := 0
var spawn_timer := 0.0
var intermission_timer := 0.0
var rand := RandomNumberGenerator.new()
var command_center_node: ColorRect
var command_center_pos := Vector2.ZERO

func _ready() -> void:
	_setup_inputs()
	_collect_buttons()
	_connect_button_handlers()
	rand.randomize()
	_create_gameplay_entities()
	apply_phase(AppPhase.MENU)
	_set_master_volume(master_volume)
	print("Godot migration Phase 3 prototype loaded.")


func _input(event: InputEvent) -> void:
	if event is InputEventMouseMotion:
		_handle_mouse_motion(event as InputEventMouseMotion)
		return
	if event is InputEventMouseButton:
		var mb := event as InputEventMouseButton
		if mb.button_index == MOUSE_BUTTON_LEFT and mb.pressed:
			_ensure_fullscreen_and_capture()
			if phase == AppPhase.PLAYING:
				_handle_play_left_click()
			else:
				_activate_menu_target()
		elif mb.button_index == MOUSE_BUTTON_RIGHT and mb.pressed and phase == AppPhase.PLAYING:
			_handle_play_right_click()
	if event.is_action_pressed("ui_pause"):
		if phase == AppPhase.PLAYING:
			apply_phase(AppPhase.PAUSED)
		elif phase == AppPhase.PAUSED:
			apply_phase(AppPhase.PLAYING)
	if event.is_action_pressed("simulate_gameover"):
		apply_phase(AppPhase.GAMEOVER)
	if event.is_action_pressed("start_wave") and phase == AppPhase.PLAYING:
		_start_next_wave()


func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_IN:
		_ensure_capture_mode()


func _setup_inputs() -> void:
	_add_action_if_missing("ui_pause", KEY_P)
	_add_action_if_missing("simulate_gameover", KEY_G)
	_add_action_if_missing("start_wave", KEY_SPACE)


func _add_action_if_missing(action_name: StringName, keycode: Key) -> void:
	if InputMap.has_action(action_name):
		return
	InputMap.add_action(action_name)
	var ev := InputEventKey.new()
	ev.keycode = keycode
	InputMap.action_add_event(action_name, ev)


func _collect_buttons() -> void:
	all_menu_buttons.clear()
	var nodes := [
		$MenuOverlay/MenuVBox/MenuVolumeRow/MenuVolMinus,
		$MenuOverlay/MenuVBox/MenuVolumeRow/MenuVolPlus,
		$MenuOverlay/MenuVBox/StartButton,
		$MenuOverlay/MenuVBox/SandboxButton,
		$PauseOverlay/PauseVBox/PauseVolumeRow/PauseVolMinus,
		$PauseOverlay/PauseVBox/PauseVolumeRow/PauseVolPlus,
		$PauseOverlay/PauseVBox/ResumeButton,
		$PauseOverlay/PauseVBox/PauseMenuButton,
		$GameOverOverlay/GameOverVBox/PlayAgainButton,
		$GameOverOverlay/GameOverVBox/GameOverMenuButton,
	]
	for n in nodes:
		all_menu_buttons.append(n as Button)


func _connect_button_handlers() -> void:
	($MenuOverlay/MenuVBox/StartButton as Button).pressed.connect(func() -> void: _start_new_run())
	($MenuOverlay/MenuVBox/SandboxButton as Button).pressed.connect(func() -> void: _start_new_run())
	($MenuOverlay/MenuVBox/MenuVolumeRow/MenuVolMinus as Button).pressed.connect(func() -> void: _adjust_volume(-0.05))
	($MenuOverlay/MenuVBox/MenuVolumeRow/MenuVolPlus as Button).pressed.connect(func() -> void: _adjust_volume(0.05))
	($PauseOverlay/PauseVBox/PauseVolumeRow/PauseVolMinus as Button).pressed.connect(func() -> void: _adjust_volume(-0.05))
	($PauseOverlay/PauseVBox/PauseVolumeRow/PauseVolPlus as Button).pressed.connect(func() -> void: _adjust_volume(0.05))
	($PauseOverlay/PauseVBox/ResumeButton as Button).pressed.connect(func() -> void: apply_phase(AppPhase.PLAYING))
	($PauseOverlay/PauseVBox/PauseMenuButton as Button).pressed.connect(func() -> void: apply_phase(AppPhase.MENU))
	($GameOverOverlay/GameOverVBox/PlayAgainButton as Button).pressed.connect(func() -> void: _start_new_run())
	($GameOverOverlay/GameOverVBox/GameOverMenuButton as Button).pressed.connect(func() -> void: apply_phase(AppPhase.MENU))


func _adjust_volume(delta: float) -> void:
	_set_master_volume(clampf(master_volume + delta, 0.0, 1.0))


func _set_master_volume(v: float) -> void:
	master_volume = v
	var txt := "Volume: %d%%" % int(round(master_volume * 100.0))
	menu_volume_value.text = txt
	pause_volume_value.text = txt


func apply_phase(next_phase: AppPhase) -> void:
	phase = next_phase
	menu_overlay.visible = phase == AppPhase.MENU
	pause_overlay.visible = phase == AppPhase.PAUSED
	gameover_overlay.visible = phase == AppPhase.GAMEOVER
	gameplay_layer.visible = true
	highlighted_button = null
	_clear_button_highlights()
	_center_virtual_cursor()
	_ensure_fullscreen_and_capture()
	_update_hud()


func _start_new_run() -> void:
	_clear_entities()
	wave = 0
	credits = 350
	command_center_hp = CENTER_MAX_HP
	wave_spawning = false
	spawn_remaining = 0
	spawn_timer = 0.0
	intermission_timer = 0.0
	_create_gameplay_entities()
	apply_phase(AppPhase.PLAYING)


func _handle_mouse_motion(event: InputEventMouseMotion) -> void:
	if phase == AppPhase.PLAYING:
		menu_cursor += event.relative
		var psz := get_viewport_rect().size
		menu_cursor.x = clampf(menu_cursor.x, 8.0, psz.x - 8.0)
		menu_cursor.y = clampf(menu_cursor.y, 8.0, psz.y - 8.0)
		yaw -= event.relative.x * LOOK_SENSITIVITY
		pitch = clampf(pitch - event.relative.y * LOOK_SENSITIVITY, -1.35, 1.35)
		look_readout.text = "Yaw: %.2f | Pitch: %.2f" % [yaw, pitch]
		return
	menu_cursor += event.relative
	var sz := get_viewport_rect().size
	menu_cursor.x = clampf(menu_cursor.x, 8.0, sz.x - 8.0)
	menu_cursor.y = clampf(menu_cursor.y, 8.0, sz.y - 8.0)
	_move_virtual_cursor(menu_cursor)
	_update_menu_highlight()


func _center_virtual_cursor() -> void:
	menu_cursor = get_viewport_rect().size * 0.5
	_move_virtual_cursor(menu_cursor)
	_update_menu_highlight()


func _move_virtual_cursor(pos: Vector2) -> void:
	var half := virtual_cursor.size * 0.5
	virtual_cursor.position = pos - half
	virtual_cursor.visible = phase != AppPhase.PLAYING


func _update_menu_highlight() -> void:
	if phase == AppPhase.PLAYING:
		return
	highlighted_button = null
	for b in all_menu_buttons:
		if not b.visible:
			continue
		if b.get_global_rect().has_point(menu_cursor):
			highlighted_button = b
			break
	_clear_button_highlights()
	if highlighted_button != null:
		highlighted_button.modulate = MENU_HIGHLIGHT_COLOR


func _clear_button_highlights() -> void:
	for b in all_menu_buttons:
		b.modulate = MENU_DEFAULT_COLOR


func _activate_menu_target() -> void:
	if highlighted_button == null:
		return
	highlighted_button.emit_signal("pressed")


func _process(delta: float) -> void:
	if phase != AppPhase.PLAYING:
		return
	_update_wave(delta)
	_update_asteroids(delta)
	_update_turrets(delta)
	_update_hud()


func _create_gameplay_entities() -> void:
	command_center_node = ColorRect.new()
	command_center_node.color = Color(0.45, 0.75, 0.95, 0.95)
	command_center_node.size = Vector2(28, 28)
	command_center_pos = get_viewport_rect().size * 0.5
	command_center_node.position = command_center_pos - command_center_node.size * 0.5
	gameplay_layer.add_child(command_center_node)


func _clear_entities() -> void:
	for t in turrets:
		var n: Node = t["node"]
		n.queue_free()
	for a in asteroids:
		var an: Node = a["node"]
		an.queue_free()
	turrets.clear()
	asteroids.clear()
	if command_center_node != null:
		command_center_node.queue_free()


func _start_next_wave() -> void:
	if wave_spawning or spawn_remaining > 0 or asteroids.size() > 0:
		return
	wave += 1
	wave_spawning = true
	spawn_remaining = 5 + wave * 2
	spawn_timer = 0.2


func _update_wave(delta: float) -> void:
	if not wave_spawning and spawn_remaining <= 0 and asteroids.is_empty():
		intermission_timer += delta
		if intermission_timer > 3.0:
			intermission_timer = 0.0
			_start_next_wave()
	if not wave_spawning:
		return
	spawn_timer -= delta
	if spawn_timer > 0.0:
		return
	_spawn_asteroid()
	spawn_remaining -= 1
	spawn_timer = max(0.12, 0.55 - wave * 0.02)
	if spawn_remaining <= 0:
		wave_spawning = false


func _spawn_asteroid() -> void:
	var size := get_viewport_rect().size
	var side := rand.randi_range(0, 3)
	var p := Vector2.ZERO
	match side:
		0:
			p = Vector2(rand.randf_range(0.0, size.x), -20.0)
		1:
			p = Vector2(size.x + 20.0, rand.randf_range(0.0, size.y))
		2:
			p = Vector2(rand.randf_range(0.0, size.x), size.y + 20.0)
		_:
			p = Vector2(-20.0, rand.randf_range(0.0, size.y))
	var node := ColorRect.new()
	node.color = Color(0.95, 0.55, 0.45, 0.95)
	node.size = Vector2(14, 14)
	node.position = p - node.size * 0.5
	gameplay_layer.add_child(node)
	var hp := ASTEROID_BASE_HP + wave * 7.0 + rand.randf_range(-10.0, 10.0)
	asteroids.append({
		"node": node,
		"pos": p,
		"hp": hp
	})


func _update_asteroids(delta: float) -> void:
	for i in range(asteroids.size() - 1, -1, -1):
		var a = asteroids[i]
		var pos: Vector2 = a["pos"]
		var dir := (command_center_pos - pos).normalized()
		pos += dir * ASTEROID_SPEED * (1.0 + wave * 0.06) * delta
		a["pos"] = pos
		var node: ColorRect = a["node"]
		node.position = pos - node.size * 0.5
		if pos.distance_to(command_center_pos) < 18.0:
			command_center_hp -= 70.0
			_remove_asteroid(i)
			if command_center_hp <= 0.0:
				command_center_hp = 0.0
				apply_phase(AppPhase.GAMEOVER)
				return
		else:
			asteroids[i] = a


func _remove_asteroid(index: int) -> void:
	var a = asteroids[index]
	var node: Node = a["node"]
	node.queue_free()
	asteroids.remove_at(index)


func _update_turrets(delta: float) -> void:
	if asteroids.is_empty():
		return
	for i in range(turrets.size()):
		var t = turrets[i]
		var cooldown: float = t["cooldown"]
		cooldown -= delta
		if cooldown > 0.0:
			t["cooldown"] = cooldown
			turrets[i] = t
			continue
		var tpos: Vector2 = t["pos"]
		var best := -1
		var best_dist := INF
		for j in range(asteroids.size()):
			var apos: Vector2 = asteroids[j]["pos"]
			var d := tpos.distance_to(apos)
			if d < TURRET_RANGE and d < best_dist:
				best_dist = d
				best = j
		if best >= 0:
			var a = asteroids[best]
			a["hp"] = float(a["hp"]) - TURRET_DAMAGE
			asteroids[best] = a
			_flash_turret(t["node"])
			if float(a["hp"]) <= 0.0:
				credits += 12
				_remove_asteroid(best)
			t["cooldown"] = TURRET_COOLDOWN
		turrets[i] = t


func _flash_turret(node: ColorRect) -> void:
	node.color = Color(0.65, 1.0, 0.75, 1.0)
	var tween := create_tween()
	tween.tween_property(node, "color", Color(0.45, 0.95, 0.60, 0.95), 0.14)


func _snap_to_grid(pos: Vector2) -> Vector2:
	return Vector2(round(pos.x / GRID_SIZE) * GRID_SIZE, round(pos.y / GRID_SIZE) * GRID_SIZE)


func _handle_play_left_click() -> void:
	var pos := _snap_to_grid(menu_cursor)
	if pos.distance_to(command_center_pos) < 46.0:
		return
	for t in turrets:
		var p: Vector2 = t["pos"]
		if p.distance_to(pos) < 6.0:
			return
	if credits < TURRET_COST:
		return
	credits -= TURRET_COST
	var node := ColorRect.new()
	node.color = Color(0.45, 0.95, 0.60, 0.95)
	node.size = Vector2(16, 16)
	node.position = pos - node.size * 0.5
	gameplay_layer.add_child(node)
	turrets.append({
		"node": node,
		"pos": pos,
		"cooldown": 0.1
	})


func _handle_play_right_click() -> void:
	if turrets.is_empty():
		return
	var best := -1
	var best_dist := 22.0
	for i in range(turrets.size()):
		var p: Vector2 = turrets[i]["pos"]
		var d := p.distance_to(menu_cursor)
		if d < best_dist:
			best_dist = d
			best = i
	if best < 0:
		return
	var t = turrets[best]
	var node: Node = t["node"]
	node.queue_free()
	turrets.remove_at(best)
	credits += SELL_REFUND


func _update_hud() -> void:
	var spawn_status := "Ready"
	if wave_spawning:
		spawn_status = "Spawning (%d left)" % spawn_remaining
	elif not asteroids.is_empty():
		spawn_status = "Cleanup (%d asteroids)" % asteroids.size()
	gameplay_info.text = "Wave %d | Credits %d | Center HP %d | Turrets %d | %s | LMB build / RMB sell / Space wave / P pause" % [
		wave, credits, int(command_center_hp), turrets.size(), spawn_status
	]


func _ensure_fullscreen_and_capture() -> void:
	if DisplayServer.window_get_mode() != DisplayServer.WINDOW_MODE_FULLSCREEN:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
	_ensure_capture_mode()


func _ensure_capture_mode() -> void:
	# Keep OS cursor hidden; for menu overlays we still use relative motion to steer a virtual cursor.
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
