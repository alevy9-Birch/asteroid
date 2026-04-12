extends Control

enum AppPhase { MENU, PLAYING, PAUSED, GAMEOVER }

const InputSystemScript = preload("res://systems/InputSystem.gd")
const CameraSystemScript = preload("res://systems/CameraSystem.gd")
const WaveSystemScript = preload("res://systems/WaveSystem.gd")
const AsteroidSystemScript = preload("res://systems/AsteroidSystem.gd")
const BuildSystemScript = preload("res://systems/BuildSystem.gd")
const CombatSystemScript = preload("res://systems/CombatSystem.gd")
const EconomySystemScript = preload("res://systems/EconomySystem.gd")
const UpgradeSystemScript = preload("res://systems/UpgradeSystem.gd")
const ScoreSystemScript = preload("res://systems/ScoreSystem.gd")
const AudioServiceScript = preload("res://autoloads/AudioService.gd")
const CommanderSystemScript = preload("res://systems/CommanderSystem.gd")
const MainMenuControllerScript = preload("res://ui/MainMenuController.gd")
const PauseControllerScript = preload("res://ui/PauseController.gd")
const GameOverControllerScript = preload("res://ui/GameOverController.gd")
const HudControllerScript = preload("res://ui/HudController.gd")
const MENU_HIGHLIGHT_COLOR := Color(0.20, 0.45, 0.85, 1.0)
const MENU_DEFAULT_COLOR := Color(1, 1, 1, 1)
const GRID_SIZE := 2.0
const TURRET_COST := 100
## Web `resetRun()` starting credits.
const STARTING_CREDITS := 1550
## Web `inactiveDurationSec`.
const INACTIVE_DURATION_SEC := 60.0
const TURRET_RANGE := 16.0
const TURRET_DAMAGE := 28.0
const TURRET_COOLDOWN := 0.42
const ASTEROID_SPEED := 5.2
const ASTEROID_BASE_HP := 60.0
const CENTER_MAX_HP := 1000.0
const PASSIVE_CREDITS_PER_SEC := 5.0
const PROJECTILE_SPEED := 42.0
const PROJECTILE_LIFETIME := 1.3

@onready var gameplay_layer: ColorRect = $GameplayLayer
@onready var world_3d: Node3D = $World3D
@onready var camera_3d: Camera3D = $World3D/Camera3D
@onready var ground: MeshInstance3D = $World3D/Ground
@onready var look_readout: Label = $GameplayLayer/LookReadout
@onready var gameplay_info: Label = $GameplayLayer/GameplayInfo
@onready var center_hp_bar: ProgressBar = $GameplayLayer/CenterHpBar
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
var game_state = GameState.new()
var input_system = InputSystemScript.new()
var camera_system = CameraSystemScript.new()
var wave_system = WaveSystemScript.new()
var asteroid_system = AsteroidSystemScript.new()
var build_system = BuildSystemScript.new()
var combat_system = CombatSystemScript.new()
var economy_system = EconomySystemScript.new()
var upgrade_system = UpgradeSystemScript.new()
var score_system = ScoreSystemScript.new()
var audio_service = AudioServiceScript.new()
var commander_system = CommanderSystemScript.new()
var main_menu_controller = MainMenuControllerScript.new()
var pause_controller = PauseControllerScript.new()
var gameover_controller = GameOverControllerScript.new()
var hud_controller = HudControllerScript.new()
var selected_commander := "none"
var master_volume := 0.85
var menu_cursor := Vector2.ZERO
var highlighted_button: Button
var all_menu_buttons: Array[Button] = []
var turrets: Array = []
var asteroids: Array = []
var projectiles: Array = []
var wave := 0
var credits := STARTING_CREDITS
var command_center_hp := CENTER_MAX_HP
## Web `waveInProgress` — true for spawn window + cleanup until asteroids clear.
var wave_combat_active := false
var to_spawn := 0
var spawn_window_elapsed_sec := 0.0
var spawn_window_duration_sec := 0.0
var spawn_window_ended := false
var spawn_timer := 0.0
var intermission_timer := 0.0
## Web default difficulty in `BaseDefenseGame` constructor.
var game_difficulty := "hard"
## Web `inactiveTimeLeftSec` / `currentInactivePhase` (sell refund + upgrade phase).
var inactive_time_left_sec := 0.0
var current_inactive_phase := 0
var rand := RandomNumberGenerator.new()
var command_center_node: MeshInstance3D
var command_center_pos := Vector3.ZERO
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
var asteroid_pool: Array[MeshInstance3D] = []
## Web parity (`BaseDefenseGame.ts`): first wave starts only on player action; later waves use intermission auto-start.
var first_wave_started := false

func _ready() -> void:
	_setup_world_visuals()
	_setup_inputs()
	_collect_buttons()
	_connect_button_handlers()
	rand.randomize()
	_reset_camera()
	_create_gameplay_entities()
	best_score = score_system.load_best_score()
	_update_research_labels()
	apply_phase(AppPhase.MENU)
	_set_master_volume(master_volume)
	print("Godot migration Phase 5 prototype loaded.")


func _setup_world_visuals() -> void:
	var plane := PlaneMesh.new()
	plane.size = Vector2(220, 220)
	ground.mesh = plane
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.12, 0.15, 0.19, 1)
	mat.roughness = 1.0
	ground.material_override = mat
	_create_world_border()


func _create_world_border() -> void:
	var wall_mat := StandardMaterial3D.new()
	wall_mat.albedo_color = Color(0.09, 0.1, 0.12, 1)
	for i in range(4):
		var wall := MeshInstance3D.new()
		var box := BoxMesh.new()
		if i % 2 == 0:
			box.size = Vector3(210, 10, 6)
		else:
			box.size = Vector3(6, 10, 210)
		wall.mesh = box
		wall.material_override = wall_mat
		match i:
			0:
				wall.position = Vector3(0, 5, -104)
			1:
				wall.position = Vector3(104, 5, 0)
			2:
				wall.position = Vector3(0, 5, 104)
			_:
				wall.position = Vector3(-104, 5, 0)
		world_3d.add_child(wall)


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
		var next = pause_controller.handle_toggle(int(phase), int(AppPhase.PLAYING), int(AppPhase.PAUSED))
		if next != int(phase):
			apply_phase(AppPhase.values()[next])
	if event.is_action_pressed("simulate_gameover"):
		_finalize_run_score()
		apply_phase(AppPhase.GAMEOVER)
	if event.is_action_pressed("start_wave") and phase == AppPhase.PLAYING:
		# Web `startNextWave(true)`: manual early-start only while inactive timer > 0 (after wave 1+).
		var block_manual := first_wave_started and wave > 0 and inactive_time_left_sec <= 0.0
		if not block_manual:
			var st = wave_system.start_next_wave(_wave_state_dict(), asteroids.size())
			_apply_wave_state(st)
			if wave > 0 or wave_combat_active:
				first_wave_started = true
	if event.is_action_pressed("buy_upgrade_core") and phase == AppPhase.PLAYING and not _is_wave_combat_active():
		_try_buy_upgrade("core")
	if event.is_action_pressed("buy_upgrade_factory") and phase == AppPhase.PLAYING and not _is_wave_combat_active():
		_try_buy_upgrade("factory")
	if event.is_action_pressed("buy_upgrade_logistics") and phase == AppPhase.PLAYING and not _is_wave_combat_active():
		_try_buy_upgrade("logistics")
	if event.is_action_pressed("toggle_diagnostics"):
		diagnostics_visible = not diagnostics_visible
		diagnostics_label.visible = diagnostics_visible


func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_IN:
		_ensure_capture_mode()


func _setup_inputs() -> void:
	input_system.ensure_default_actions()


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
	game_state.set_phase(GameState.AppPhase.values()[int(phase)])
	main_menu_controller.set_visible(menu_overlay, phase == AppPhase.MENU)
	pause_controller.set_visible(pause_overlay, phase == AppPhase.PAUSED)
	gameover_controller.set_visible(gameover_overlay, phase == AppPhase.GAMEOVER)
	gameplay_layer.visible = true
	highlighted_button = null
	main_menu_controller.clear_button_highlights(all_menu_buttons, MENU_DEFAULT_COLOR)
	_center_virtual_cursor()
	_ensure_fullscreen_and_capture()
	_update_hud()


func _start_new_run() -> void:
	_clear_entities()
	wave = 0
	credits = STARTING_CREDITS
	command_center_hp = CENTER_MAX_HP
	wave_combat_active = false
	to_spawn = 0
	spawn_window_elapsed_sec = 0.0
	spawn_window_duration_sec = 0.0
	spawn_window_ended = false
	spawn_timer = 0.0
	intermission_timer = 0.0
	inactive_time_left_sec = 0.0
	current_inactive_phase = 0
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
	first_wave_started = false
	var s = commander_system.apply_commander_defaults(selected_commander, {"commander": "none"})
	selected_commander = String(s.commander)
	_reset_camera()
	_create_gameplay_entities()
	_update_research_labels()
	apply_phase(AppPhase.PLAYING)


func _reset_camera() -> void:
	camera_system.reset(camera_3d)


func _handle_mouse_motion(event: InputEventMouseMotion) -> void:
	var viewport_size := get_viewport_rect().size
	if phase == AppPhase.PLAYING:
		menu_cursor = main_menu_controller.update_cursor(menu_cursor, event.relative, viewport_size)
		camera_system.apply_mouse_look(event.relative)
		look_readout.text = "Yaw: %.2f | Pitch: %.2f" % [camera_system.yaw, camera_system.pitch]
		return
	menu_cursor = main_menu_controller.update_cursor(menu_cursor, event.relative, viewport_size)
	_move_virtual_cursor(menu_cursor)
	_update_menu_highlight()


func _center_virtual_cursor() -> void:
	menu_cursor = get_viewport_rect().size * 0.5
	_move_virtual_cursor(menu_cursor)
	_update_menu_highlight()


func _move_virtual_cursor(pos: Vector2) -> void:
	main_menu_controller.move_virtual_cursor(virtual_cursor, pos, phase == AppPhase.PLAYING)


func _update_menu_highlight() -> void:
	highlighted_button = main_menu_controller.update_menu_highlight(
		phase == AppPhase.PLAYING,
		all_menu_buttons,
		menu_cursor,
		MENU_HIGHLIGHT_COLOR,
		MENU_DEFAULT_COLOR,
	)


func _activate_menu_target() -> void:
	main_menu_controller.activate_menu_target(highlighted_button)


func _process(delta: float) -> void:
	if phase != AppPhase.PLAYING:
		return
	_update_camera_motion(delta)
	_update_passive_income(delta)
	var combat_before := _is_wave_combat_active()
	_update_asteroids(delta)
	var st = wave_system.tick(delta, _wave_state_dict(), asteroids.size(), Callable(self, "_spawn_asteroid"))
	_apply_wave_state(st)
	_update_turrets(delta)
	_update_projectiles(delta)
	_update_hud()
	_update_diagnostics()
	_sync_game_state_runtime()


func _create_gameplay_entities() -> void:
	command_center_node = MeshInstance3D.new()
	var center_mesh := BoxMesh.new()
	center_mesh.size = Vector3(3.0, 3.0, 3.0)
	command_center_node.mesh = center_mesh
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.45, 0.75, 0.95, 1.0)
	command_center_node.material_override = mat
	command_center_pos = Vector3(0, 1.5, 0)
	command_center_node.position = command_center_pos
	world_3d.add_child(command_center_node)


func _clear_entities() -> void:
	for t in turrets:
		var n: Node = t["node"]
		n.queue_free()
	for a in asteroids:
		var an: Node = a["node"]
		an.queue_free()
	for p in projectiles:
		var pn: Node = p["node"]
		pn.queue_free()
	turrets.clear()
	asteroids.clear()
	projectiles.clear()
	asteroid_pool.clear()
	if command_center_node != null:
		command_center_node.queue_free()


func _spawn_asteroid() -> void:
	var arena := 95.0
	var side := rand.randi_range(0, 3)
	var p := Vector3.ZERO
	match side:
		0:
			p = Vector3(rand.randf_range(-arena, arena), 1.2, -arena)
		1:
			p = Vector3(arena, 1.2, rand.randf_range(-arena, arena))
		2:
			p = Vector3(rand.randf_range(-arena, arena), 1.2, arena)
		_:
			p = Vector3(-arena, 1.2, rand.randf_range(-arena, arena))
	var node: MeshInstance3D
	if asteroid_pool.is_empty():
		node = MeshInstance3D.new()
		var mesh := SphereMesh.new()
		mesh.radius = 0.9
		mesh.height = 1.8
		node.mesh = mesh
		var amat := StandardMaterial3D.new()
		amat.albedo_color = Color(0.95, 0.55, 0.45, 1)
		node.material_override = amat
	else:
		node = asteroid_pool.pop_back()
		node.visible = true
	if node.get_parent() == null:
		world_3d.add_child(node)
	node.position = p
	var variant := asteroid_system.pick_variant(rand, wave)
	var hp := (ASTEROID_BASE_HP + wave * 7.0 + rand.randf_range(-10.0, 10.0)) * asteroid_system.variant_hp_mul(variant)
	var base_scale := asteroid_system.variant_size_mul(variant)
	node.scale = Vector3(base_scale, base_scale, base_scale)
	var mat_node := node.material_override as StandardMaterial3D
	if mat_node != null:
		mat_node.albedo_color = asteroid_system.variant_color(variant)
	asteroids.append({
		"node": node,
		"pos": p,
		"hp": hp,
		"variant": variant,
		"splitLevel": 0,
		"spawnCooldown": (6.0 if variant == "spawner" else 999.0),
		"spawnReady": false,
	})


func _spawn_asteroid_at(pos: Vector3, variant: String, split_level: int = 0) -> void:
	var node: MeshInstance3D
	if asteroid_pool.is_empty():
		node = MeshInstance3D.new()
		var mesh := SphereMesh.new()
		mesh.radius = 0.9
		mesh.height = 1.8
		node.mesh = mesh
		var amat := StandardMaterial3D.new()
		amat.albedo_color = Color(0.95, 0.55, 0.45, 1)
		node.material_override = amat
	else:
		node = asteroid_pool.pop_back()
		node.visible = true
	if node.get_parent() == null:
		world_3d.add_child(node)
	node.position = pos
	var hp := (ASTEROID_BASE_HP + wave * 7.0 + rand.randf_range(-6.0, 6.0)) * asteroid_system.variant_hp_mul(variant)
	var base_scale := asteroid_system.variant_size_mul(variant)
	if split_level > 0:
		hp *= 0.58
		node.scale = Vector3(base_scale * 0.72, base_scale * 0.72, base_scale * 0.72)
	else:
		node.scale = Vector3(base_scale, base_scale, base_scale)
	var mat_node := node.material_override as StandardMaterial3D
	if mat_node != null:
		mat_node.albedo_color = asteroid_system.variant_color(variant)
	asteroids.append({
		"node": node,
		"pos": pos,
		"hp": hp,
		"variant": variant,
		"splitLevel": split_level,
		"spawnCooldown": (6.0 if variant == "spawner" else 999.0),
		"spawnReady": false,
	})


func _update_asteroids(delta: float) -> void:
	asteroids = asteroid_system.update_asteroids(delta, asteroids, command_center_pos, ASTEROID_SPEED, wave)
	for i in range(asteroids.size() - 1, -1, -1):
		var a = asteroids[i]
		if bool(a.get("spawnReady", false)):
			a["spawnReady"] = false
			a["spawnCooldown"] = 6.0
			asteroids[i] = a
			_spawn_asteroid_at(Vector3(a["pos"]) + Vector3(rand.randf_range(-3.0, 3.0), 0, rand.randf_range(-3.0, 3.0)), "meteor")
	var impacts = asteroid_system.find_impacts(asteroids, command_center_pos, 2.6)
	for k in range(impacts.size() - 1, -1, -1):
		var hit = impacts[k]
		var i := int(hit["index"])
		command_center_hp -= float(hit["damage"])
		_remove_asteroid(i, "impact")
		if command_center_hp <= 0.0:
			command_center_hp = 0.0
			_finalize_run_score()
			apply_phase(AppPhase.GAMEOVER)
			return


func _remove_asteroid(index: int, reason: String = "combat") -> void:
	var a = asteroids[index]
	var eff = asteroid_system.on_asteroid_destroyed(a, reason)
	var apos: Vector3 = a["pos"]
	var node: MeshInstance3D = a["node"]
	if node.get_parent() != null:
		node.get_parent().remove_child(node)
	node.visible = false
	asteroid_pool.append(node)
	asteroids.remove_at(index)
	if float(eff.get("aoe_radius", 0.0)) > 0.0:
		audio_service.emit_event("aoe_pop")
		if apos.distance_to(command_center_pos) <= float(eff["aoe_radius"]):
			command_center_hp = max(0.0, command_center_hp - float(eff["aoe_damage"]))
	if float(eff.get("emp_radius", 0.0)) > 0.0:
		audio_service.emit_event("emp_pulse")
		for ti in range(turrets.size()):
			var t = turrets[ti]
			var tp: Vector3 = t["pos"]
			if tp.distance_to(apos) <= float(eff["emp_radius"]):
				t["empDisable"] = max(float(t.get("empDisable", 0.0)), float(eff["emp_disable_sec"]))
				turrets[ti] = t
	if int(eff.get("spawn_children", 0)) > 0:
		var child_variant := String(eff.get("spawn_variant", "splitter"))
		var child_level := int(a.get("splitLevel", 0)) + 1
		for n in range(int(eff["spawn_children"])):
			var off = Vector3(rand.randf_range(-2.0, 2.0), 0, rand.randf_range(-2.0, 2.0))
			_spawn_asteroid_at(apos + off, child_variant, child_level)
	if int(eff.get("spawn_meteors", 0)) > 0:
		for _n in range(int(eff["spawn_meteors"])):
			var moff = Vector3(rand.randf_range(-2.5, 2.5), 0, rand.randf_range(-2.5, 2.5))
			_spawn_asteroid_at(apos + moff, "meteor")


func _update_turrets(delta: float) -> void:
	if asteroids.is_empty():
		return
	var live_range := TURRET_RANGE + turret_range_bonus
	for i in range(turrets.size()):
		var t = turrets[i]
		var cooldown: float = t["cooldown"]
		cooldown -= delta
		var emp_disable: float = max(0.0, float(t.get("empDisable", 0.0)) - delta)
		t["empDisable"] = emp_disable
		if emp_disable > 0.0:
			t["cooldown"] = cooldown
			turrets[i] = t
			continue
		if cooldown > 0.0:
			t["cooldown"] = cooldown
			turrets[i] = t
			continue
		var tpos: Vector3 = t["pos"]
		var best := combat_system.select_target_index(tpos, asteroids, live_range)
		if best >= 0:
			var apos: Vector3 = asteroids[best]["pos"]
			_spawn_projectile(tpos + Vector3(0, 0.9, 0), apos, TURRET_DAMAGE * turret_damage_mult)
			_flash_turret(t["node"])
			t["cooldown"] = max(0.12, TURRET_COOLDOWN - turret_cooldown_bonus)
		turrets[i] = t


func _flash_turret(node: MeshInstance3D) -> void:
	var mat := node.material_override as StandardMaterial3D
	if mat == null:
		return
	mat.albedo_color = Color(0.65, 1.0, 0.75, 1.0)
	var tween := create_tween()
	tween.tween_property(mat, "albedo_color", Color(0.45, 0.95, 0.60, 0.95), 0.14)


func _screen_to_world_on_ground(screen: Vector2) -> Vector3:
	return camera_system.screen_to_world_on_ground(camera_3d, screen, GRID_SIZE)


func _crosshair_world_on_ground() -> Vector3:
	var center := get_viewport_rect().size * 0.5
	return _screen_to_world_on_ground(center)


func _is_wave_combat_active() -> bool:
	# Web: `waveInProgress` (spawn window + cleanup).
	if not first_wave_started:
		return false
	return wave_combat_active


func _handle_play_left_click() -> void:
	if _is_wave_combat_active():
		return
	var pos := _crosshair_world_on_ground()
	if not build_system.can_place_turret(pos, command_center_pos, turrets, credits, TURRET_COST, 4.8, 1.6, GRID_SIZE, 100.0, 1):
		return
	credits -= TURRET_COST
	money_spent += TURRET_COST
	audio_service.emit_event("build_place")
	var node := MeshInstance3D.new()
	var m := BoxMesh.new()
	m.size = Vector3(1.8, 1.8, 1.8)
	node.mesh = m
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.45, 0.95, 0.60, 0.95)
	node.material_override = mat
	node.position = pos
	world_3d.add_child(node)
	turrets.append({
		"node": node,
		"pos": pos,
		"cooldown": 0.1,
		"built_in_inactive_phase": current_inactive_phase,
	})


func _handle_play_right_click() -> void:
	if _is_wave_combat_active():
		return
	if turrets.is_empty():
		return
	var target := _crosshair_world_on_ground()
	var best := build_system.pick_sell_target(turrets, target, 3.4)
	if best < 0:
		return
	var t = turrets[best]
	var node: Node = t["node"]
	node.queue_free()
	turrets.remove_at(best)
	# Web `sellLookedAt`: 100% if same inactive phase and not in wave, else 50%.
	var built_phase := int(t.get("built_in_inactive_phase", -999))
	var full_refund := not _is_wave_combat_active() and built_phase == current_inactive_phase
	var refund := TURRET_COST if full_refund else int(floor(TURRET_COST * 0.5))
	credits += refund
	audio_service.emit_event("build_sell")


func _update_hud() -> void:
	var spawn_status := "Ready"
	if wave_combat_active and not spawn_window_ended and to_spawn > 0:
		var win_pct := 0.0
		if spawn_window_duration_sec > 0.0:
			win_pct = clampf(100.0 * spawn_window_elapsed_sec / spawn_window_duration_sec, 0.0, 100.0)
		spawn_status = "Spawn %d left | window %.0f%%" % [to_spawn, win_pct]
	elif wave_combat_active:
		spawn_status = "Cleanup (%d asteroids)" % asteroids.size()
	elif first_wave_started and wave > 0 and inactive_time_left_sec > 0.0:
		spawn_status = "Inactive %.0fs (Space early / wait auto)" % inactive_time_left_sec
	gameplay_info.text = hud_controller.format_gameplay_info(
		wave, credits, int(command_center_hp), int(CENTER_MAX_HP), turrets.size(), asteroids.size(), spawn_status
	)
	hud_controller.apply_center_hp(center_hp_bar, command_center_hp, CENTER_MAX_HP)
	look_readout.text = hud_controller.format_look_info(camera_system.yaw, camera_system.pitch)


func _update_passive_income(delta: float) -> void:
	var r = economy_system.tick_passive_income(delta, passive_credit_accum, PASSIVE_CREDITS_PER_SEC)
	passive_credit_accum = float(r.accum)
	var earned := int(r.earned)
	if earned <= 0:
		return
	credits = economy_system.add_income(credits, earned)
	money_earned += earned


func _update_diagnostics() -> void:
	if not diagnostics_visible:
		return
	var fps := int(round(Engine.get_frames_per_second()))
	var mem_mb := Performance.get_monitor(Performance.MEMORY_STATIC) / (1024.0 * 1024.0)
	diagnostics_label.text = "FPS %d | Turrets %d | Asteroids %d | Pool %d | WaveCombat %s toSpawn %d | Mem %.1f MB" % [
		fps, turrets.size(), asteroids.size(), asteroid_pool.size(), str(wave_combat_active), to_spawn, mem_mb
	]


func _spawn_projectile(from_pos: Vector3, to_pos: Vector3, damage: float) -> void:
	var node := MeshInstance3D.new()
	var m := SphereMesh.new()
	m.radius = 0.22
	m.height = 0.44
	node.mesh = m
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.9, 0.95, 1.0, 1.0)
	mat.emission_enabled = true
	mat.emission = Color(0.5, 0.8, 1.0, 1.0)
	node.material_override = mat
	node.position = from_pos
	world_3d.add_child(node)
	var vel := (to_pos - from_pos).normalized() * PROJECTILE_SPEED
	projectiles.append({
		"node": node,
		"pos": from_pos,
		"vel": vel,
		"ttl": PROJECTILE_LIFETIME,
		"damage": damage
	})


func _update_projectiles(delta: float) -> void:
	var r = combat_system.step_projectiles(delta, projectiles, asteroids, kill_credit_bonus)
	projectiles = r.projectiles
	asteroids = r.asteroids
	var payout_total := int(r.payout_total)
	if payout_total > 0:
		credits += payout_total
		money_earned += payout_total
	var kills: PackedInt32Array = r.killed_asteroids
	for _k in kills:
		asteroids_killed += 1
	var remove_projectiles: PackedInt32Array = r.remove_projectiles
	for j in range(remove_projectiles.size()):
		var idx = int(remove_projectiles[j])
		if idx >= 0 and idx < projectiles.size():
			var n: MeshInstance3D = projectiles[idx]["node"]
			n.queue_free()
			projectiles.remove_at(idx)
	for j in range(kills.size() - 1, -1, -1):
		var ai = int(kills[j])
		if ai >= 0 and ai < asteroids.size():
			_remove_asteroid(ai, "combat")


func _update_camera_motion(delta: float) -> void:
	camera_system.update_movement(delta, camera_3d)


func _try_buy_upgrade(which: String) -> void:
	var s = {
		"credits": credits,
		"money_spent": money_spent,
		"upgrade_core": upgrade_core,
		"upgrade_factory": upgrade_factory,
		"upgrade_logistics": upgrade_logistics,
		"turret_damage_mult": turret_damage_mult,
		"kill_credit_bonus": kill_credit_bonus,
		"turret_range_bonus": turret_range_bonus,
		"turret_cooldown_bonus": turret_cooldown_bonus,
	}
	var out = upgrade_system.try_buy_upgrade(which, s)
	if not bool(out.ok):
		return
	credits = int(out.credits)
	money_spent = int(out.money_spent)
	upgrade_core = bool(out.upgrade_core)
	upgrade_factory = bool(out.upgrade_factory)
	upgrade_logistics = bool(out.upgrade_logistics)
	turret_damage_mult = float(out.turret_damage_mult)
	kill_credit_bonus = int(out.kill_credit_bonus)
	turret_range_bonus = float(out.turret_range_bonus)
	turret_cooldown_bonus = float(out.turret_cooldown_bonus)
	audio_service.emit_event("upgrade_purchase", {"upgrade": which})
	_update_research_labels()


func _update_research_labels() -> void:
	research_core_label.text = upgrade_system.label_core(upgrade_core)
	research_factory_label.text = upgrade_system.label_factory(upgrade_factory)
	research_logistics_label.text = upgrade_system.label_logistics(upgrade_logistics)


func _finalize_run_score() -> void:
	run_score = score_system.compute_run_score(wave, asteroids_killed, money_earned, money_spent)
	gameover_hint.text = gameover_controller.format_hint(wave, asteroids_killed, money_earned, money_spent)
	gameover_score.text = "Score: %d" % run_score
	if run_score > best_score:
		best_score = run_score
		score_system.save_best_score(best_score)
	gameover_best.text = "Best: %d" % best_score


func _ensure_fullscreen_and_capture() -> void:
	if DisplayServer.window_get_mode() != DisplayServer.WINDOW_MODE_FULLSCREEN:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
	_ensure_capture_mode()


func _ensure_capture_mode() -> void:
	# Keep OS cursor hidden; for menu overlays we still use relative motion to steer a virtual cursor.
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func _wave_state_dict() -> Dictionary:
	return {
		"wave": wave,
		"wave_combat_active": wave_combat_active,
		"to_spawn": to_spawn,
		"spawn_window_elapsed_sec": spawn_window_elapsed_sec,
		"spawn_window_duration_sec": spawn_window_duration_sec,
		"spawn_window_ended": spawn_window_ended,
		"spawn_timer": spawn_timer,
		"intermission_timer": intermission_timer,
		"first_wave_started": first_wave_started,
		"inactive_time_left_sec": inactive_time_left_sec,
		"current_inactive_phase": current_inactive_phase,
		"difficulty": game_difficulty,
	}


func _apply_wave_state(st: Dictionary) -> void:
	wave = int(st.get("wave", wave))
	wave_combat_active = bool(st.get("wave_combat_active", wave_combat_active))
	to_spawn = int(st.get("to_spawn", to_spawn))
	spawn_window_elapsed_sec = float(st.get("spawn_window_elapsed_sec", spawn_window_elapsed_sec))
	spawn_window_duration_sec = float(st.get("spawn_window_duration_sec", spawn_window_duration_sec))
	spawn_window_ended = bool(st.get("spawn_window_ended", spawn_window_ended))
	spawn_timer = float(st.get("spawn_timer", spawn_timer))
	intermission_timer = float(st.get("intermission_timer", intermission_timer))
	inactive_time_left_sec = float(st.get("inactive_time_left_sec", inactive_time_left_sec))
	current_inactive_phase = int(st.get("current_inactive_phase", current_inactive_phase))
	game_difficulty = str(st.get("difficulty", game_difficulty))
	_sync_game_state_runtime()


func _sync_game_state_runtime() -> void:
	game_state.wave = wave
	game_state.credits = credits
	game_state.command_center_hp = command_center_hp
	game_state.wave_combat_active = wave_combat_active
	game_state.to_spawn = to_spawn
	game_state.spawn_window_elapsed_sec = spawn_window_elapsed_sec
	game_state.spawn_window_duration_sec = spawn_window_duration_sec
	game_state.spawn_window_ended = spawn_window_ended
	game_state.spawn_timer = spawn_timer
	game_state.intermission_timer = intermission_timer
	game_state.inactive_time_left_sec = inactive_time_left_sec
	game_state.current_inactive_phase = current_inactive_phase
	game_state.game_difficulty = game_difficulty
	game_state.money_earned = money_earned
	game_state.money_spent = money_spent
	game_state.asteroids_killed = asteroids_killed
	game_state.run_score = run_score
	game_state.best_score = best_score
