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
const SAVE_PATH := "user://migration_score.save"
const PASSIVE_CREDITS_PER_SEC := 5.0

@onready var gameplay_layer: ColorRect = $GameplayLayer
@onready var look_readout: Label = $GameplayLayer/LookReadout
@onready var gameplay_info: Label = $GameplayLayer/GameplayInfo
@onready var diagnostics_label: Label = $GameplayLayer/Diagnostics
@onready var research_core_label: Label = $GameplayLayer/ResearchPanel/ResearchVBox/ResearchCore
@onready var research_factory_label: Label = $GameplayLayer/ResearchPanel/ResearchVBox/ResearchFactory
@onready var research_logistics_label: Label = $GameplayLayer/ResearchPanel/ResearchVBox/ResearchLogistics
@onready var menu_overlay: PanelContainer = $MenuOverlay
@onready var pause_overlay: PanelContainer = $PauseOverlay
@onready var gameover_overlay: PanelContainer = $GameOverOverlay
@onready var virtual_cursor: ColorRect = $VirtualCursor
@onready var menu_volume_value: Label = $MenuOverlay/MenuVBox/MenuVolumeRow/MenuVolumeValue
@onready var pause_volume_value: Label = $PauseOverlay/PauseVBox/PauseVolumeRow/PauseVolumeValue
@onready var gameover_hint: Label = $GameOverOverlay/GameOverVBox/GameOverHint
@onready var gameover_score: Label = $GameOverOverlay/GameOverVBox/GameOverScore
@onready var gameover_best: Label = $GameOverOverlay/GameOverVBox/GameOverBest

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
var money_earned := 0
var money_spent := 0
var asteroids_killed := 0
var run_score := 0
var best_score := 0
var upgrade_core := false
var upgrade_factory := false
var upgrade_logistics := false
var turret_damage_mult := 1.0
var kill_credit_bonus := 0
var turret_range_bonus := 0.0
var turret_cooldown_bonus := 0.0
var diagnostics_visible := false
var passive_credit_accum := 0.0
var asteroid_pool: Array[ColorRect] = []

func _ready() -> void:
	_setup_inputs()
	_collect_buttons()
	_connect_button_handlers()
	rand.randomize()
	_create_gameplay_entities()
	_load_best_score()
	_update_research_labels()
	apply_phase(AppPhase.MENU)
	_set_master_volume(master_volume)
	print("Godot migration Phase 5 prototype loaded.")


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
		_finalize_run_score()
		apply_phase(AppPhase.GAMEOVER)
	if event.is_action_pressed("start_wave") and phase == AppPhase.PLAYING:
		_start_next_wave()
	if event.is_action_pressed("buy_upgrade_core") and phase == AppPhase.PLAYING:
		_try_buy_upgrade("core")
	if event.is_action_pressed("buy_upgrade_factory") and phase == AppPhase.PLAYING:
		_try_buy_upgrade("factory")
	if event.is_action_pressed("buy_upgrade_logistics") and phase == AppPhase.PLAYING:
		_try_buy_upgrade("logistics")
	if event.is_action_pressed("toggle_diagnostics"):
		diagnostics_visible = not diagnostics_visible
		diagnostics_label.visible = diagnostics_visible


func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_IN:
		_ensure_capture_mode()


func _setup_inputs() -> void:
	_add_action_if_missing("ui_pause", KEY_P)
	_add_action_if_missing("simulate_gameover", KEY_G)
	_add_action_if_missing("start_wave", KEY_SPACE)
	_add_action_if_missing("buy_upgrade_core", KEY_U)
	_add_action_if_missing("buy_upgrade_factory", KEY_I)
	_add_action_if_missing("buy_upgrade_logistics", KEY_O)
	_add_action_if_missing("toggle_diagnostics", KEY_F3)


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
	money_earned = 0
	money_spent = 0
	asteroids_killed = 0
	run_score = 0
	upgrade_core = false
	upgrade_factory = false
	upgrade_logistics = false
	turret_damage_mult = 1.0
	kill_credit_bonus = 0
	turret_range_bonus = 0.0
	turret_cooldown_bonus = 0.0
	passive_credit_accum = 0.0
	_create_gameplay_entities()
	_update_research_labels()
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
	_update_passive_income(delta)
	_update_wave(delta)
	_update_asteroids(delta)
	_update_turrets(delta)
	_update_hud()
	_update_diagnostics()


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
	asteroid_pool.clear()
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
	var node: ColorRect
	if asteroid_pool.is_empty():
		node = ColorRect.new()
		node.color = Color(0.95, 0.55, 0.45, 0.95)
		node.size = Vector2(14, 14)
	else:
		node = asteroid_pool.pop_back()
		node.visible = true
	if node.get_parent() == null:
		gameplay_layer.add_child(node)
	node.position = p - node.size * 0.5
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
				_finalize_run_score()
				apply_phase(AppPhase.GAMEOVER)
				return
		else:
			asteroids[i] = a


func _remove_asteroid(index: int) -> void:
	var a = asteroids[index]
	var node: ColorRect = a["node"]
	if node.get_parent() != null:
		node.get_parent().remove_child(node)
	node.visible = false
	asteroid_pool.append(node)
	asteroids.remove_at(index)


func _update_turrets(delta: float) -> void:
	if asteroids.is_empty():
		return
	var live_range := TURRET_RANGE + turret_range_bonus
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
			if d < live_range and d < best_dist:
				best_dist = d
				best = j
		if best >= 0:
			var a = asteroids[best]
			a["hp"] = float(a["hp"]) - TURRET_DAMAGE * turret_damage_mult
			asteroids[best] = a
			_flash_turret(t["node"])
			if float(a["hp"]) <= 0.0:
				var payout := 12 + kill_credit_bonus
				credits += payout
				money_earned += payout
				asteroids_killed += 1
				_remove_asteroid(best)
			t["cooldown"] = max(0.12, TURRET_COOLDOWN - turret_cooldown_bonus)
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
	money_spent += TURRET_COST
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


func _update_passive_income(delta: float) -> void:
	passive_credit_accum += PASSIVE_CREDITS_PER_SEC * delta
	if passive_credit_accum < 1.0:
		return
	var earned := int(passive_credit_accum)
	passive_credit_accum -= earned
	credits += earned
	money_earned += earned


func _update_diagnostics() -> void:
	if not diagnostics_visible:
		return
	var fps := int(round(Engine.get_frames_per_second()))
	var mem_mb := Performance.get_monitor(Performance.MEMORY_STATIC) / (1024.0 * 1024.0)
	diagnostics_label.text = "FPS %d | Turrets %d | Asteroids %d | Pool %d | Spawning %s | Mem %.1f MB" % [
		fps, turrets.size(), asteroids.size(), asteroid_pool.size(), str(wave_spawning), mem_mb
	]


func _try_buy_upgrade(which: String) -> void:
	if which == "core":
		if upgrade_core or credits < 120:
			return
		credits -= 120
		money_spent += 120
		upgrade_core = true
		turret_damage_mult = 1.2
	elif which == "factory":
		if upgrade_factory or credits < 140:
			return
		credits -= 140
		money_spent += 140
		upgrade_factory = true
		kill_credit_bonus = 4
	elif which == "logistics":
		if upgrade_logistics or credits < 160:
			return
		credits -= 160
		money_spent += 160
		upgrade_logistics = true
		turret_range_bonus = 35.0
		turret_cooldown_bonus = 0.06
	_update_research_labels()


func _update_research_labels() -> void:
	research_core_label.text = "U - Core Protocol (120c): +20%% turret dmg %s" % ("[OWNED]" if upgrade_core else "")
	research_factory_label.text = "I - Factory Expansion (140c): +4 credits/kill %s" % ("[OWNED]" if upgrade_factory else "")
	research_logistics_label.text = "O - Logistics (160c): +35 range, -0.06s cooldown %s" % ("[OWNED]" if upgrade_logistics else "")


func _finalize_run_score() -> void:
	run_score = int(wave * 100 + asteroids_killed * 18 + money_earned * 0.7 - money_spent * 0.25)
	if run_score < 0:
		run_score = 0
	gameover_hint.text = "Wave %d | Kills %d | Earned %d | Spent %d" % [wave, asteroids_killed, money_earned, money_spent]
	gameover_score.text = "Score: %d" % run_score
	if run_score > best_score:
		best_score = run_score
		_save_best_score()
	gameover_best.text = "Best: %d" % best_score


func _save_best_score() -> void:
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f == null:
		return
	f.store_32(best_score)


func _load_best_score() -> void:
	if not FileAccess.file_exists(SAVE_PATH):
		best_score = 0
		return
	var f := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if f == null:
		best_score = 0
		return
	best_score = int(f.get_32())


func _ensure_fullscreen_and_capture() -> void:
	if DisplayServer.window_get_mode() != DisplayServer.WINDOW_MODE_FULLSCREEN:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
	_ensure_capture_mode()


func _ensure_capture_mode() -> void:
	# Keep OS cursor hidden; for menu overlays we still use relative motion to steer a virtual cursor.
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED
