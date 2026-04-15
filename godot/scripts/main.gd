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
var MENU_HIGHLIGHT_COLOR := Color(0.20, 0.45, 0.85, 1.0)
var MENU_DEFAULT_COLOR := Color(1, 1, 1, 1)
const GRID_SIZE := 2.0
const ASTEROID_TARGET_HALF := 40.0
const ASTEROID_SPAWN_RADIUS_MIN := 160.0
const ASTEROID_SPAWN_RADIUS_MAX := 220.0
const ASTEROID_SPAWN_HEIGHT_MIN := 90.0
const ASTEROID_SPAWN_HEIGHT_MAX := 120.0
## Web `inactiveDurationSec`.
const INACTIVE_DURATION_SEC := 60.0
## Fallbacks if `WebParityDefs` fails; normally overridden from **`auto_turret`** / **`command_center`**.
var turret_cost: int = 100
var turret_range: float = 16.0
var turret_damage: float = 28.0
var turret_cooldown: float = 0.42
var turret_footprint_w: int = 1
var turret_footprint_h: int = 1
## Web **`auto_turret.supplyCost`** — blocks build when `supply_used + this > supply_cap`.
var turret_supply_cost: int = 2
## Web **`command_center.supplyCapAdd`** at run start; depots add more via **`_recompute_supply_cap()`**.
var _run_supply_cap_start: int = 20
## Web **`command_center.powerGenPerSec`**; turret draw is per-shot (`tryConsumeShotPower` analog).
var command_center_power_gen_per_sec: float = 1.6
var turret_power_drain_per_sec: float = 1.6
## Web **`command_center.creditPayout` / `creditIntervalSec`** during **`waveInProgress`** only.
var command_center_credit_payout: int = 18
var command_center_credit_interval_sec: float = 1.0
var command_center_econ_timer: float = 0.0
var center_max_hp: float = 1000.0
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
@onready var research_nuclear_label: Label = $GameplayLayer/ResearchPanel/ResearchVBox/ResearchNuclear
@onready var menu_overlay: PanelContainer = $MenuOverlay
@onready var pause_overlay: PanelContainer = $PauseOverlay
@onready var gameover_overlay: PanelContainer = $GameOverOverlay
@onready var virtual_cursor: ColorRect = $VirtualCursor
@onready var menu_difficulty_option: OptionButton = $MenuOverlay/MenuVBox/MenuDifficultyRow/MenuDifficultyOption
@onready var menu_volume_value: Label = $MenuOverlay/MenuVBox/MenuVolumeRow/MenuVolumeValue
@onready var pause_volume_value: Label = $PauseOverlay/PauseVBox/PauseVolumeRow/PauseVolumeValue
@onready var gameover_hint: Label = $GameOverOverlay/GameOverVBox/GameOverHint
@onready var gameover_score: Label = $GameOverOverlay/GameOverVBox/GameOverScore
@onready var gameover_best: Label = $GameOverOverlay/GameOverVBox/GameOverBest
@onready var wave_timer_hud: PanelContainer = $GameplayLayer/WaveTimerHud
@onready var wave_timer_ring: WaveTimerRing = $GameplayLayer/WaveTimerHud/WaveTimerMargin/WaveTimerRow/WaveTimerRing
@onready var wave_timer_caption: Label = $GameplayLayer/WaveTimerHud/WaveTimerMargin/WaveTimerRow/WaveTimerCaption

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
## Web sandbox-style run: **no** high-score write on game over; **Play Again** keeps the same mode.
var sandbox_run := false
var master_volume := 0.85
var menu_cursor := Vector2.ZERO
var highlighted_button: Button
var all_menu_buttons: Array[Button] = []
## Web pointer-lock parity: after focus/pointer-lock loss, first click re-captures only.
var capture_recover_pending := false
var turrets: Array = []
## Web **`factory_business`**: economy **`creditPayout` / `creditIntervalSec`**, passive **`powerDrainPerSec`×`POWER_DRAIN_GLOBAL_MUL`**, starvation when **`power_stored`≤0**.
var economy_buildings: Array = []
## **`turret`** | **`factory`** (I) | **`depot_s`** / **`depot_l`** (O) | **`nuclear`** (N research). **B** cycles unlocked modes.
var build_mode := "turret"
var factory_cost: int = 160
var factory_supply_cost: int = 4
var factory_credit_payout: int = 8
var factory_credit_interval_sec: float = 1.0
var factory_passive_power_drain: float = 0.6
var factory_footprint_w: int = 2
var factory_footprint_h: int = 2
## Web **`supply_depot_s`** / **`supply_depot_l`**: each adds its **`supplyCapAdd`** to run cap.
var supply_depots: Array = []
var depot_cost: int = 200
var depot_supply_cap_add: int = 18
var depot_supply_cost: int = 0
var depot_footprint_w: int = 2
var depot_footprint_h: int = 2
var depot_l_cost: int = 300
var depot_l_supply_cap_add: int = 30
var depot_l_supply_cost: int = 0
var depot_l_footprint_w: int = 3
var depot_l_footprint_h: int = 3
## Web **`nuclear_plant`**: **`powerGenPerSec`** during wave iff **`credits > 0`** (web: no gen when broke).
var nuclear_plants: Array = []
var nuclear_cost: int = 1200
var nuclear_power_gen_per_sec: float = 34.0
var nuclear_supply_cost: int = 0
var nuclear_footprint_w: int = 4
var nuclear_footprint_h: int = 4
var asteroids: Array = []
var projectiles: Array = []
var wave := 0
var credits := WebParityDefs.RESET_RUN_CREDITS
var command_center_hp := 1000.0
## Web `waveInProgress` — true for spawn window + cleanup until asteroids clear.
var wave_combat_active := false
var to_spawn := 0
var spawn_window_elapsed_sec := 0.0
var spawn_window_duration_sec := 0.0
var spawn_window_ended := false
var spawn_timer := 0.0
var intermission_timer := 0.0
## Web **`GameDifficulty`** — menu **`MenuDifficultyOption`**; drives **`WaveScaling`** + **`computeRunScore`** mul.
var game_difficulty := "hard"
var MENU_DIFFICULTY_IDS: PackedStringArray = PackedStringArray(["easy", "medium", "hard", "brutal", "deadly"])
## Web `inactiveTimeLeftSec` / `currentInactivePhase` (sell refund + upgrade phase).
var inactive_time_left_sec := 0.0
var current_inactive_phase := 0
var rand := RandomNumberGenerator.new()
var command_center_node: MeshInstance3D
var command_center_pos := Vector3.ZERO
var money_earned := 0
var money_spent := 0
var asteroids_killed := 0
var discovered_asteroid_variants: Dictionary = {}
var active_asteroid_discovery := ""
var active_asteroid_discovery_desc := ""
var asteroid_discovery_timer_sec := 0.0
var wave_variant_pool: Array[String] = ["normal"]
## Web `statsPowerProduced`: gross gen **`gen * dt`** during **`waveInProgress`** (CC + nuclears when **`credits > 0`**).
var power_produced := 0.0
var run_score := 0
var best_score := 0
var upgrade_core := false
var upgrade_factory := false
var upgrade_logistics := false
var upgrade_nuclear := false
var turret_damage_mult := 1.0
var kill_credit_bonus := 0
var turret_range_bonus := 0.0
var turret_cooldown_bonus := 0.0
var diagnostics_visible := false
var asteroid_pool: Array[MeshInstance3D] = []
## Web parity (`BaseDefenseGame.ts`): first wave starts only on player action; later waves use intermission auto-start.
var first_wave_started := false
## Web `resetRun()` power/supply; **`power_stored`**: gen/drain only while **`wave_combat_active`**, else `min(stored, cap)`.
var power_cap := WebParityDefs.RESET_RUN_POWER_CAP
var power_stored := WebParityDefs.RESET_RUN_POWER_STORED
var supply_cap := WebParityDefs.RESET_RUN_SUPPLY_CAP
var supply_used := WebParityDefs.RESET_RUN_SUPPLY_USED

func _ready() -> void:
	add_child(audio_service)
	audio_service.name = "AudioService"
	_parity_apply_building_baseline()
	_setup_world_visuals()
	_setup_inputs()
	_collect_buttons()
	_setup_menu_difficulty_option()
	_connect_button_handlers()
	rand.randomize()
	_reset_camera()
	_create_gameplay_entities()
	best_score = score_system.load_best_score()
	_update_research_labels()
	go_to_menu()
	_set_master_volume(master_volume)
	if not WebParityDefs.ok:
		push_warning("WebParityDefs: load failed or empty — run: node scripts/parity/extract_web_defs.mjs")
	print("Godot migration Phase 5 prototype loaded.")


func _parity_apply_building_baseline() -> void:
	if not WebParityDefs.ok:
		command_center_hp = center_max_hp
		_run_supply_cap_start = 20
		turret_supply_cost = 2
		command_center_power_gen_per_sec = 1.6
		turret_power_drain_per_sec = 1.6
		command_center_credit_payout = 18
		command_center_credit_interval_sec = 1.0
		factory_cost = 160
		factory_supply_cost = 4
		factory_credit_payout = 8
		factory_credit_interval_sec = 1.0
		factory_passive_power_drain = 0.6
		factory_footprint_w = 2
		factory_footprint_h = 2
		depot_cost = 200
		depot_supply_cap_add = 18
		depot_supply_cost = 0
		depot_footprint_w = 2
		depot_footprint_h = 2
		depot_l_cost = 300
		depot_l_supply_cap_add = 30
		depot_l_supply_cost = 0
		depot_l_footprint_w = 3
		depot_l_footprint_h = 3
		nuclear_cost = 1200
		nuclear_power_gen_per_sec = 34.0
		nuclear_supply_cost = 0
		nuclear_footprint_w = 4
		nuclear_footprint_h = 4
		_recompute_power_cap()
		_recompute_supply_cap()
		return
	center_max_hp = WebParityDefs.prototype_command_center_max_hp(center_max_hp)
	command_center_hp = center_max_hp
	turret_cost = WebParityDefs.prototype_auto_turret_credit_cost(turret_cost)
	turret_range = WebParityDefs.prototype_auto_turret_range(turret_range)
	turret_damage = WebParityDefs.prototype_auto_turret_damage(turret_damage)
	turret_cooldown = WebParityDefs.prototype_auto_turret_cooldown_sec(turret_cooldown)
	var fp := WebParityDefs.prototype_auto_turret_footprint()
	turret_footprint_w = fp.x
	turret_footprint_h = fp.y
	turret_supply_cost = WebParityDefs.prototype_auto_turret_supply_cost(turret_supply_cost)
	_run_supply_cap_start = WebParityDefs.prototype_command_center_supply_cap_add(_run_supply_cap_start)
	command_center_power_gen_per_sec = WebParityDefs.prototype_command_center_power_gen_per_sec(
		command_center_power_gen_per_sec
	)
	turret_power_drain_per_sec = WebParityDefs.prototype_auto_turret_power_drain_per_sec(
		turret_power_drain_per_sec
	)
	command_center_credit_payout = WebParityDefs.prototype_command_center_credit_payout(
		command_center_credit_payout
	)
	command_center_credit_interval_sec = WebParityDefs.prototype_command_center_credit_interval_sec(
		command_center_credit_interval_sec
	)
	factory_cost = WebParityDefs.prototype_factory_business_credit_cost(factory_cost)
	factory_supply_cost = WebParityDefs.prototype_factory_business_supply_cost(factory_supply_cost)
	factory_credit_payout = WebParityDefs.prototype_factory_business_credit_payout(factory_credit_payout)
	factory_credit_interval_sec = WebParityDefs.prototype_factory_business_credit_interval_sec(
		factory_credit_interval_sec
	)
	factory_passive_power_drain = WebParityDefs.prototype_factory_business_power_drain_per_sec(
		factory_passive_power_drain
	)
	var ffp := WebParityDefs.prototype_factory_business_footprint()
	factory_footprint_w = ffp.x
	factory_footprint_h = ffp.y
	depot_cost = WebParityDefs.prototype_supply_depot_s_credit_cost(depot_cost)
	depot_supply_cap_add = WebParityDefs.prototype_supply_depot_s_supply_cap_add(depot_supply_cap_add)
	depot_supply_cost = WebParityDefs.prototype_supply_depot_s_supply_cost(depot_supply_cost)
	var dfp := WebParityDefs.prototype_supply_depot_s_footprint()
	depot_footprint_w = dfp.x
	depot_footprint_h = dfp.y
	depot_l_cost = WebParityDefs.prototype_supply_depot_l_credit_cost(depot_l_cost)
	depot_l_supply_cap_add = WebParityDefs.prototype_supply_depot_l_supply_cap_add(depot_l_supply_cap_add)
	depot_l_supply_cost = WebParityDefs.prototype_supply_depot_l_supply_cost(depot_l_supply_cost)
	var dlfp := WebParityDefs.prototype_supply_depot_l_footprint()
	depot_l_footprint_w = dlfp.x
	depot_l_footprint_h = dlfp.y
	nuclear_cost = WebParityDefs.prototype_nuclear_plant_credit_cost(nuclear_cost)
	nuclear_power_gen_per_sec = WebParityDefs.prototype_nuclear_plant_power_gen_per_sec(nuclear_power_gen_per_sec)
	nuclear_supply_cost = WebParityDefs.prototype_nuclear_plant_supply_cost(nuclear_supply_cost)
	var nfp := WebParityDefs.prototype_nuclear_plant_footprint()
	nuclear_footprint_w = nfp.x
	nuclear_footprint_h = nfp.y
	_recompute_power_cap()
	_recompute_supply_cap()


func _recompute_supply_cap() -> void:
	var cap := _run_supply_cap_start
	for d in supply_depots:
		cap += int(d.get("supply_cap_add", 0))
	supply_cap = maxi(0, cap)
	supply_used = mini(supply_used, supply_cap)


func _recompute_power_cap() -> void:
	var new_cap := WebParityDefs.prototype_run_power_cap(
		turrets.size(),
		economy_buildings.size(),
		nuclear_plants.size(),
	)
	power_cap = new_cap
	power_stored = mini(power_stored, power_cap)


func _placed_for_build() -> Array:
	var out: Array = []
	for t in turrets:
		out.append(t)
	for e in economy_buildings:
		out.append(e)
	for d in supply_depots:
		out.append(d)
	for n in nuclear_plants:
		out.append(n)
	return out


func _toggle_build_mode() -> void:
	var modes: PackedStringArray = PackedStringArray()
	modes.append("turret")
	if upgrade_factory:
		modes.append("factory")
	if upgrade_logistics:
		modes.append("depot_s")
		modes.append("depot_l")
	if upgrade_nuclear:
		modes.append("nuclear")
	if modes.size() <= 1:
		build_mode = "turret"
		return
	var idx := modes.find(build_mode)
	if idx < 0:
		idx = 0
	build_mode = modes[(idx + 1) % modes.size()]


func _check_command_center_defeat() -> void:
	if phase != AppPhase.PLAYING:
		return
	if command_center_hp > 0.0:
		return
	command_center_hp = 0.0
	end_run()


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
				if capture_recover_pending or not _is_capture_active():
					capture_recover_pending = false
					return
				_handle_play_left_click()
			else:
				_activate_menu_target()
		elif mb.button_index == MOUSE_BUTTON_RIGHT and mb.pressed and phase == AppPhase.PLAYING:
			if capture_recover_pending or not _is_capture_active():
				capture_recover_pending = false
				return
			_handle_play_right_click()
	if event.is_action_pressed("ui_pause"):
		var next = pause_controller.handle_toggle(int(phase), int(AppPhase.PLAYING), int(AppPhase.PAUSED))
		if next != int(phase):
			apply_phase(AppPhase.values()[next])
	if event.is_action_pressed("simulate_gameover"):
		end_run()
	if event.is_action_pressed("start_wave") and phase == AppPhase.PLAYING:
		# Web `startNextWave(true)` only when `waveReady` (manual early-start uses inactive timer > 0 after wave 1+).
		if _compute_wave_ready():
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
	if event.is_action_pressed("buy_upgrade_nuclear") and phase == AppPhase.PLAYING and not _is_wave_combat_active():
		_try_buy_upgrade("nuclear")
	if event.is_action_pressed("toggle_build_mode") and phase == AppPhase.PLAYING:
		_toggle_build_mode()
	if event.is_action_pressed("toggle_diagnostics"):
		diagnostics_visible = not diagnostics_visible
		diagnostics_label.visible = diagnostics_visible


func _notification(what: int) -> void:
	if what == NOTIFICATION_APPLICATION_FOCUS_IN:
		_ensure_capture_mode()
		capture_recover_pending = false
	elif what == NOTIFICATION_APPLICATION_FOCUS_OUT:
		capture_recover_pending = true


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
	all_menu_buttons.append(menu_difficulty_option as Button)


func _setup_menu_difficulty_option() -> void:
	menu_difficulty_option.clear()
	for diff_id in MENU_DIFFICULTY_IDS:
		menu_difficulty_option.add_item(diff_id.capitalize())
	var sel := MENU_DIFFICULTY_IDS.find(game_difficulty)
	if sel < 0:
		sel = 2
	menu_difficulty_option.select(sel)
	game_difficulty = MENU_DIFFICULTY_IDS[sel]
	game_state.game_difficulty = game_difficulty
	var diff_cb := Callable(self, "_on_menu_difficulty_selected")
	if not menu_difficulty_option.item_selected.is_connected(diff_cb):
		menu_difficulty_option.item_selected.connect(diff_cb)


func _on_menu_difficulty_selected(index: int) -> void:
	if index < 0 or index >= MENU_DIFFICULTY_IDS.size():
		return
	game_difficulty = MENU_DIFFICULTY_IDS[index]
	game_state.game_difficulty = game_difficulty
	_sync_game_state_runtime()


func _connect_button_handlers() -> void:
	($MenuOverlay/MenuVBox/StartButton as Button).pressed.connect(func() -> void: start_run(false))
	($MenuOverlay/MenuVBox/SandboxButton as Button).pressed.connect(func() -> void: start_run(true))
	($MenuOverlay/MenuVBox/MenuVolumeRow/MenuVolMinus as Button).pressed.connect(func() -> void: _adjust_volume(-0.05))
	($MenuOverlay/MenuVBox/MenuVolumeRow/MenuVolPlus as Button).pressed.connect(func() -> void: _adjust_volume(0.05))
	($PauseOverlay/PauseVBox/PauseVolumeRow/PauseVolMinus as Button).pressed.connect(func() -> void: _adjust_volume(-0.05))
	($PauseOverlay/PauseVBox/PauseVolumeRow/PauseVolPlus as Button).pressed.connect(func() -> void: _adjust_volume(0.05))
	($PauseOverlay/PauseVBox/ResumeButton as Button).pressed.connect(func() -> void: apply_phase(AppPhase.PLAYING))
	($PauseOverlay/PauseVBox/PauseMenuButton as Button).pressed.connect(func() -> void: go_to_menu())
	($GameOverOverlay/GameOverVBox/PlayAgainButton as Button).pressed.connect(
		func() -> void: start_run(sandbox_run)
	)
	($GameOverOverlay/GameOverVBox/GameOverMenuButton as Button).pressed.connect(func() -> void: go_to_menu())


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


## Web-style run lifecycle (menu / gameover entry points). Pause still uses **`apply_phase`** (PLAYING ↔ PAUSED).
func start_run(is_sandbox: bool = false) -> void:
	_start_new_run(is_sandbox)


## Finalize score, sync **`GameState`**, SFX, then **GAMEOVER** (CC defeat, dev shortcut, etc.).
func end_run() -> void:
	_finalize_run_score()
	_sync_game_state_runtime()
	audio_service.emit_event("game_over", {})
	apply_phase(AppPhase.GAMEOVER)


func go_to_menu() -> void:
	apply_phase(AppPhase.MENU)


func _start_new_run(is_sandbox: bool = false) -> void:
	sandbox_run = is_sandbox
	build_mode = "turret"
	# Web `resetRun`–style teardown: all per-run entity arrays + CC node (C.1.2).
	_clear_entities()
	# Refresh JSON-derived baselines each run (parity extract can change without editor restart).
	_parity_apply_building_baseline()
	wave = 0
	credits = WebParityDefs.RESET_RUN_CREDITS
	power_stored = WebParityDefs.RESET_RUN_POWER_STORED
	supply_used = WebParityDefs.RESET_RUN_SUPPLY_USED
	command_center_hp = center_max_hp
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
	discovered_asteroid_variants.clear()
	active_asteroid_discovery = ""
	active_asteroid_discovery_desc = ""
	asteroid_discovery_timer_sec = 0.0
	wave_variant_pool = ["normal"]
	power_produced = 0.0
	run_score = 0
	upgrade_core = false
	upgrade_factory = false
	upgrade_logistics = false
	upgrade_nuclear = false
	turret_damage_mult = 1.0
	kill_credit_bonus = 0
	turret_range_bonus = 0.0
	turret_cooldown_bonus = 0.0
	command_center_econ_timer = 0.0
	first_wave_started = false
	var s = commander_system.apply_commander_defaults(selected_commander, {"commander": "none"})
	selected_commander = String(s.commander)
	_reset_camera()
	_create_gameplay_entities()
	_update_research_labels()
	_recompute_power_cap()
	_sync_game_state_runtime()
	apply_phase(AppPhase.PLAYING)


func _reset_camera() -> void:
	camera_system.reset(camera_3d)


func _handle_mouse_motion(event: InputEventMouseMotion) -> void:
	var viewport_size := get_viewport_rect().size
	if phase == AppPhase.PLAYING:
		menu_cursor = main_menu_controller.update_cursor(menu_cursor, event.relative, viewport_size)
		if not _is_capture_active():
			return
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
	if asteroid_discovery_timer_sec > 0.0:
		asteroid_discovery_timer_sec = maxf(0.0, asteroid_discovery_timer_sec - delta)
		if asteroid_discovery_timer_sec <= 0.0:
			active_asteroid_discovery = ""
			active_asteroid_discovery_desc = ""
	_update_camera_motion(delta)
	_update_passive_income(delta)
	_update_power_economy(delta)
	_update_economy_buildings(delta)
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
	## Prototype run arrays (web: buildings, missiles, projectiles, …).
	for t in turrets:
		var n: Node = t["node"]
		n.queue_free()
	for e in economy_buildings:
		var en: Node = e["node"]
		en.queue_free()
	for d in supply_depots:
		var dn: Node = d["node"]
		dn.queue_free()
	for np in nuclear_plants:
		var nn: Node = np["node"]
		nn.queue_free()
	for a in asteroids:
		var an: Node = a["node"]
		an.queue_free()
	for p in projectiles:
		var pn: Node = p["node"]
		pn.queue_free()
	turrets.clear()
	economy_buildings.clear()
	supply_depots.clear()
	nuclear_plants.clear()
	asteroids.clear()
	projectiles.clear()
	asteroid_pool.clear()
	if command_center_node != null:
		command_center_node.queue_free()
		command_center_node = null


func _spawn_asteroid() -> void:
	var spawn_angle := rand.randf_range(0.0, TAU)
	var spawn_r := rand.randf_range(ASTEROID_SPAWN_RADIUS_MIN, ASTEROID_SPAWN_RADIUS_MAX)
	var p := Vector3(
		cos(spawn_angle) * spawn_r,
		rand.randf_range(ASTEROID_SPAWN_HEIGHT_MIN, ASTEROID_SPAWN_HEIGHT_MAX),
		sin(spawn_angle) * spawn_r
	)
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
	if wave_variant_pool.is_empty():
		_rebuild_wave_variant_pool()
	var variant := asteroid_system.pick_variant_from_pool(rand, wave, wave_variant_pool)
	_register_asteroid_discovery(variant)
	var ab := WaveScaling.asteroid_base_stats(wave, game_difficulty)
	var kin := asteroid_system.compute_spawn_kinematics(
		variant,
		float(ab.get("base_hp", 100.0)),
		float(ab.get("base_damage", 360.0)),
		float(ab.get("base_speed", 15.0)),
	)
	var hp := float(kin.get("max_hp", 40.0))
	var target := _asteroid_target_for_variant(variant, p)
	var base_scale := asteroid_system.variant_size_mul(variant)
	node.scale = Vector3(base_scale, base_scale, base_scale)
	var mat_node := node.material_override as StandardMaterial3D
	if mat_node != null:
		mat_node.albedo_color = asteroid_system.variant_color(variant)
	asteroids.append({
		"node": node,
		"pos": p,
		"hp": hp,
		"max_hp": hp,
		"variant": variant,
		"target": target,
		"splitLevel": 0,
		"spawnCooldown": (6.0 if variant == "spawner" else 999.0),
		"spawnReady": false,
		"move_speed": float(kin.get("move_speed", 5.2)),
		"impact_damage": float(kin.get("impact_damage", 70.0)),
		"impact_radius": float(kin.get("impact_radius", 2.6)),
	})


func _spawn_asteroid_at(pos: Vector3, variant: String, split_level: int = 0, target_override: Variant = null) -> void:
	_register_asteroid_discovery(variant)
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
	var ab2 := WaveScaling.asteroid_base_stats(wave, game_difficulty)
	var kin2 := asteroid_system.compute_spawn_kinematics(
		variant,
		float(ab2.get("base_hp", 100.0)),
		float(ab2.get("base_damage", 360.0)),
		float(ab2.get("base_speed", 15.0)),
	)
	var hp2 := float(kin2.get("max_hp", 40.0))
	var ms2 := float(kin2.get("move_speed", 5.2))
	var idmg := float(kin2.get("impact_damage", 70.0))
	var irad := float(kin2.get("impact_radius", 2.6))
	var target2 := (
		Vector3(target_override)
		if typeof(target_override) == TYPE_VECTOR3
		else _asteroid_target_for_variant(variant, pos)
	)
	if split_level > 0:
		var hmul := 0.32
		var smul := 1.12
		if split_level == 1:
			hmul = 0.55
			smul = 1.05
		hp2 = maxf(30.0, hp2 * hmul)
		ms2 = maxf(8.0, ms2 * smul)
	var base_scale := asteroid_system.variant_size_mul(variant)
	if split_level > 0:
		node.scale = Vector3(base_scale * 0.72, base_scale * 0.72, base_scale * 0.72)
	else:
		node.scale = Vector3(base_scale, base_scale, base_scale)
	var mat_node := node.material_override as StandardMaterial3D
	if mat_node != null:
		mat_node.albedo_color = asteroid_system.variant_color(variant)
	asteroids.append({
		"node": node,
		"pos": pos,
		"hp": hp2,
		"max_hp": hp2,
		"variant": variant,
		"target": target2,
		"splitLevel": split_level,
		"spawnCooldown": (6.0 if variant == "spawner" else 999.0),
		"spawnReady": false,
		"move_speed": ms2,
		"impact_damage": idmg,
		"impact_radius": irad,
	})


func _update_asteroids(delta: float) -> void:
	asteroids = asteroid_system.update_asteroids(delta, asteroids, command_center_pos, _seeker_target_points(), wave, game_difficulty)
	for i in range(asteroids.size() - 1, -1, -1):
		var a = asteroids[i]
		if bool(a.get("spawnReady", false)):
			a["spawnReady"] = false
			asteroids[i] = a
			_spawn_spawner_meteor(a)
	var impacts = asteroid_system.find_impacts(asteroids, command_center_pos)
	for k in range(impacts.size() - 1, -1, -1):
		var hit = impacts[k]
		var i := int(hit["index"])
		command_center_hp -= float(hit["damage"])
		audio_service.emit_event("asteroid_impact", {})
		_remove_asteroid(i, "impact")
		if phase != AppPhase.PLAYING:
			return


func _seeker_target_points() -> Array:
	var points: Array = [command_center_pos]
	for t in turrets:
		if not t.has("pos"):
			continue
		points.append(Vector3(t["pos"]))
	for e in economy_buildings:
		if not e.has("pos"):
			continue
		points.append(Vector3(e["pos"]))
	for d in supply_depots:
		if not d.has("pos"):
			continue
		points.append(Vector3(d["pos"]))
	for n in nuclear_plants:
		if not n.has("pos"):
			continue
		points.append(Vector3(n["pos"]))
	return points


func _spawn_spawner_meteor(parent: Dictionary) -> void:
	var parent_pos := Vector3(parent.get("pos", Vector3.ZERO))
	var parent_target := Vector3(parent.get("target", command_center_pos))
	var spawn_pos := parent_pos + Vector3(rand.randf_range(-0.6, 0.6), 0.4, rand.randf_range(-0.6, 0.6))
	_spawn_asteroid_at(spawn_pos, "meteor", 0, parent_target)
	if asteroids.is_empty():
		return
	var child_i := asteroids.size() - 1
	var child = asteroids[child_i]
	var parent_speed := float(parent.get("move_speed", 5.2))
	var parent_max_hp := float(parent.get("max_hp", parent.get("hp", 40.0)))
	var parent_impact_damage := float(parent.get("impact_damage", 70.0))
	child["move_speed"] = maxf(26.0, parent_speed * 1.45)
	child["max_hp"] = maxf(45.0, round(parent_max_hp * 0.42))
	child["hp"] = float(child["max_hp"])
	child["impact_radius"] = 0.95
	child["impact_damage"] = round(parent_impact_damage * 0.8)
	asteroids[child_i] = child


func _asteroid_target_for_variant(variant: String, from_pos: Vector3) -> Vector3:
	if variant != "seeker":
		return _random_asteroid_target()
	var points := _seeker_target_points()
	var best := command_center_pos
	var best_d := INF
	for p in points:
		if typeof(p) != TYPE_VECTOR3:
			continue
		var tp: Vector3 = p
		var d := _dist2_xz(from_pos, tp)
		if d < best_d:
			best_d = d
			best = tp
	return best


func _random_asteroid_target() -> Vector3:
	return Vector3(
		float(rand.randi_range(-int(ASTEROID_TARGET_HALF), int(ASTEROID_TARGET_HALF))),
		0.0,
		float(rand.randi_range(-int(ASTEROID_TARGET_HALF), int(ASTEROID_TARGET_HALF)))
	)


func _dist_xz(a: Vector3, b: Vector3) -> float:
	var dx := a.x - b.x
	var dz := a.z - b.z
	return sqrt(dx * dx + dz * dz)


func _dist2_xz(a: Vector3, b: Vector3) -> float:
	var dx := a.x - b.x
	var dz := a.z - b.z
	return dx * dx + dz * dz


func _register_asteroid_discovery(variant: String) -> void:
	if variant.is_empty():
		return
	if discovered_asteroid_variants.has(variant):
		return
	discovered_asteroid_variants[variant] = true
	active_asteroid_discovery = asteroid_system.variant_display_name(variant)
	active_asteroid_discovery_desc = asteroid_system.variant_discovery_description(variant)
	asteroid_discovery_timer_sec = 5.0
	audio_service.emit_event("asteroid_discovery", {"variant": variant})


func _discovered_variant_list() -> Array[String]:
	var out: Array[String] = []
	for k in discovered_asteroid_variants.keys():
		out.append(String(k))
	return out


func _rebuild_wave_variant_pool() -> void:
	wave_variant_pool = asteroid_system.build_wave_variant_pool_with_discovery(wave, _discovered_variant_list())


func _remove_asteroid(index: int, reason: String = "combat") -> void:
	var a = asteroids[index]
	var eff = asteroid_system.on_asteroid_destroyed(a, reason)
	var apos: Vector3 = a["pos"]
	var impact_origin := apos
	if reason == "impact" and a.has("target") and typeof(a["target"]) == TYPE_VECTOR3:
		impact_origin = Vector3(a["target"])
	var node: MeshInstance3D = a["node"]
	if node.get_parent() != null:
		node.get_parent().remove_child(node)
	node.visible = false
	asteroid_pool.append(node)
	asteroids.remove_at(index)
	if float(eff.get("aoe_radius", 0.0)) > 0.0:
		audio_service.emit_event("aoe_pop")
		if _dist_xz(impact_origin, command_center_pos) <= float(eff["aoe_radius"]):
			command_center_hp = max(0.0, command_center_hp - float(eff["aoe_damage"]))
	if float(eff.get("emp_radius", 0.0)) > 0.0:
		audio_service.emit_event("emp_pulse")
		for ti in range(turrets.size()):
			var t = turrets[ti]
			var tp: Vector3 = t["pos"]
			if _dist_xz(tp, impact_origin) <= float(eff["emp_radius"]):
				t["empDisable"] = max(float(t.get("empDisable", 0.0)), float(eff["emp_disable_sec"]))
				turrets[ti] = t
	if int(eff.get("spawn_children", 0)) > 0:
		var child_variant := String(eff.get("spawn_variant", "splitter"))
		var child_level := int(a.get("splitLevel", 0)) + 1
		for n in range(int(eff["spawn_children"])):
			var off = Vector3(rand.randf_range(-2.0, 2.0), 0, rand.randf_range(-2.0, 2.0))
			_spawn_asteroid_at(apos + off, child_variant, child_level, a.get("target", impact_origin))
	if int(eff.get("spawn_meteors", 0)) > 0:
		for _n in range(int(eff["spawn_meteors"])):
			var moff = Vector3(rand.randf_range(-2.5, 2.5), 0, rand.randf_range(-2.5, 2.5))
			_spawn_asteroid_at(apos + moff, "meteor", 0, a.get("target", impact_origin))
	_check_command_center_defeat()


func _update_turrets(delta: float) -> void:
	if asteroids.is_empty():
		return
	var live_range := turret_range + turret_range_bonus
	for i in range(turrets.size()):
		var t = turrets[i]
		var cooldown: float = t["cooldown"]
		var emp_disable: float = max(0.0, float(t.get("empDisable", 0.0)) - delta)
		t["empDisable"] = emp_disable
		if emp_disable > 0.0:
			cooldown -= delta
			t["cooldown"] = cooldown
			turrets[i] = t
			continue
		var shot_drain := maxf(0.0, float(t.get("build_power_drain_per_sec", 0.0)))
		# Web `updateDefenses`: draining turrets **pause** cooldown tick while `powerStored <= 0`.
		if shot_drain > 0.0 and float(power_stored) <= 0.001:
			t["cooldown"] = cooldown
			turrets[i] = t
			continue
		cooldown -= delta
		if cooldown > 0.0:
			t["cooldown"] = cooldown
			turrets[i] = t
			continue
		var tpos: Vector3 = t["pos"]
		var best := combat_system.select_target_index(tpos, asteroids, live_range)
		if best < 0:
			t["cooldown"] = cooldown
			turrets[i] = t
			continue
		# Web: set `cooldown` before `tryConsumeShotPower`; failed pay still burns the interval.
		t["cooldown"] = max(0.12, turret_cooldown - turret_cooldown_bonus)
		if not _try_consume_shot_power(shot_drain, 1.0):
			turrets[i] = t
			continue
		var apos: Vector3 = asteroids[best]["pos"]
		_spawn_projectile(tpos + Vector3(0, 0.9, 0), apos, turret_damage * turret_damage_mult)
		_flash_turret(t["node"])
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


func _compute_wave_ready() -> bool:
	# Web `BaseDefenseGame.updateWave` + `startNextWave`: false while `waveInProgress`; true before `firstWaveStarted`; else `inactiveTimeLeftSec > 0` (inactive branch, asteroids cleared).
	if wave_combat_active:
		return false
	if not first_wave_started:
		return true
	return inactive_time_left_sec > 0.0


func _handle_play_left_click() -> void:
	if _is_wave_combat_active():
		return
	var pos := _crosshair_world_on_ground()
	var place_c := build_system.snap_placement(pos, GRID_SIZE)
	if build_mode == "factory":
		if not upgrade_factory:
			return
		if factory_supply_cost > 0 and supply_used + factory_supply_cost > supply_cap:
			return
		if not build_system.can_place_turret(
			place_c,
			command_center_pos,
			_placed_for_build(),
			credits,
			factory_cost,
			4.8,
			1.6,
			GRID_SIZE,
			100.0,
			factory_footprint_w,
			factory_footprint_h,
		):
			return
		credits -= factory_cost
		money_spent += factory_cost
		supply_used += factory_supply_cost
		audio_service.emit_event("build_place")
		var fnode := MeshInstance3D.new()
		var fm := BoxMesh.new()
		var fsx := 0.88 * GRID_SIZE * float(factory_footprint_w)
		var fsz := 0.88 * GRID_SIZE * float(factory_footprint_h)
		fm.size = Vector3(fsx, minf(2.4, 0.95 * GRID_SIZE * 1.2), fsz)
		fnode.mesh = fm
		var fmat := StandardMaterial3D.new()
		fmat.albedo_color = Color(0.35, 0.72, 0.42, 0.95)
		fnode.material_override = fmat
		fnode.position = Vector3(place_c.x, 0.9, place_c.z)
		world_3d.add_child(fnode)
		economy_buildings.append({
			"node": fnode,
			"pos": place_c,
			"footprint_w": factory_footprint_w,
			"footprint_h": factory_footprint_h,
			"build_credit_cost": factory_cost,
			"build_supply_cost": factory_supply_cost,
			"passive_power_drain_per_sec": factory_passive_power_drain,
			"credit_payout": factory_credit_payout,
			"credit_interval_sec": factory_credit_interval_sec,
			"econ_timer": 0.0,
			"built_in_inactive_phase": current_inactive_phase,
		})
		_recompute_power_cap()
		return
	if build_mode == "depot_s" or build_mode == "depot_l":
		if not upgrade_logistics:
			return
		var d_cred := depot_cost
		var d_sup_c := depot_supply_cost
		var d_cap_add := depot_supply_cap_add
		var dfw := depot_footprint_w
		var dfh := depot_footprint_h
		var dcol := Color(0.82, 0.62, 0.35, 0.95)
		if build_mode == "depot_l":
			d_cred = depot_l_cost
			d_sup_c = depot_l_supply_cost
			d_cap_add = depot_l_supply_cap_add
			dfw = depot_l_footprint_w
			dfh = depot_l_footprint_h
			dcol = Color(0.68, 0.48, 0.28, 0.95)
		if d_sup_c > 0 and supply_used + d_sup_c > supply_cap:
			return
		if not build_system.can_place_turret(
			place_c,
			command_center_pos,
			_placed_for_build(),
			credits,
			d_cred,
			4.8,
			1.6,
			GRID_SIZE,
			100.0,
			dfw,
			dfh,
		):
			return
		credits -= d_cred
		money_spent += d_cred
		supply_used += d_sup_c
		audio_service.emit_event("build_place")
		var dnode := MeshInstance3D.new()
		var dm := BoxMesh.new()
		var dsx := 0.88 * GRID_SIZE * float(dfw)
		var dsz := 0.88 * GRID_SIZE * float(dfh)
		dm.size = Vector3(dsx, minf(2.2, 0.92 * GRID_SIZE * 1.1), dsz)
		dnode.mesh = dm
		var dmat := StandardMaterial3D.new()
		dmat.albedo_color = dcol
		dnode.material_override = dmat
		dnode.position = Vector3(place_c.x, 0.85, place_c.z)
		world_3d.add_child(dnode)
		supply_depots.append({
			"node": dnode,
			"pos": place_c,
			"footprint_w": dfw,
			"footprint_h": dfh,
			"build_credit_cost": d_cred,
			"build_supply_cost": d_sup_c,
			"supply_cap_add": d_cap_add,
			"built_in_inactive_phase": current_inactive_phase,
		})
		_recompute_supply_cap()
		return
	if build_mode == "nuclear":
		if not upgrade_nuclear:
			return
		if nuclear_supply_cost > 0 and supply_used + nuclear_supply_cost > supply_cap:
			return
		if not build_system.can_place_turret(
			place_c,
			command_center_pos,
			_placed_for_build(),
			credits,
			nuclear_cost,
			4.8,
			1.6,
			GRID_SIZE,
			100.0,
			nuclear_footprint_w,
			nuclear_footprint_h,
		):
			return
		credits -= nuclear_cost
		money_spent += nuclear_cost
		supply_used += nuclear_supply_cost
		audio_service.emit_event("build_place")
		var nnode := MeshInstance3D.new()
		var nm := BoxMesh.new()
		var nsx := 0.88 * GRID_SIZE * float(nuclear_footprint_w)
		var nsz := 0.88 * GRID_SIZE * float(nuclear_footprint_h)
		nm.size = Vector3(nsx, minf(3.0, 1.0 * GRID_SIZE * 1.4), nsz)
		nnode.mesh = nm
		var nmat := StandardMaterial3D.new()
		nmat.albedo_color = Color(0.55, 0.95, 0.42, 0.96)
		nnode.material_override = nmat
		nnode.position = Vector3(place_c.x, 1.0, place_c.z)
		world_3d.add_child(nnode)
		nuclear_plants.append({
			"node": nnode,
			"pos": place_c,
			"footprint_w": nuclear_footprint_w,
			"footprint_h": nuclear_footprint_h,
			"build_credit_cost": nuclear_cost,
			"build_supply_cost": nuclear_supply_cost,
			"power_gen_per_sec": nuclear_power_gen_per_sec,
			"built_in_inactive_phase": current_inactive_phase,
		})
		_recompute_power_cap()
		return
	if turret_supply_cost > 0 and supply_used + turret_supply_cost > supply_cap:
		return
	if not build_system.can_place_turret(
		place_c,
		command_center_pos,
		_placed_for_build(),
		credits,
		turret_cost,
		4.8,
		1.6,
		GRID_SIZE,
		100.0,
		turret_footprint_w,
		turret_footprint_h,
	):
		return
	credits -= turret_cost
	money_spent += turret_cost
	supply_used += turret_supply_cost
	audio_service.emit_event("build_place")
	var node := MeshInstance3D.new()
	var m := BoxMesh.new()
	var sx := 0.88 * GRID_SIZE * float(turret_footprint_w)
	var sz := 0.88 * GRID_SIZE * float(turret_footprint_h)
	m.size = Vector3(sx, minf(2.4, 0.9 * GRID_SIZE * 1.2), sz)
	node.mesh = m
	var mat := StandardMaterial3D.new()
	mat.albedo_color = Color(0.45, 0.95, 0.60, 0.95)
	node.material_override = mat
	node.position = Vector3(place_c.x, 0.9, place_c.z)
	world_3d.add_child(node)
	turrets.append({
		"node": node,
		"pos": place_c,
		"footprint_w": turret_footprint_w,
		"footprint_h": turret_footprint_h,
		## Web per-building `creditCost` at placement (sell/refund uses this, not live `turret_cost`).
		"build_credit_cost": turret_cost,
		"build_supply_cost": turret_supply_cost,
		"build_power_drain_per_sec": turret_power_drain_per_sec,
		"cooldown": 0.1,
		"built_in_inactive_phase": current_inactive_phase,
	})
	_recompute_power_cap()


func _pick_sell_structure(target: Vector3, max_dist: float) -> Dictionary:
	var best_kind := "none"
	var best_idx := -1
	var best_d := max_dist
	var specs: Array = [
		{"kind": "turret", "arr": turrets},
		{"kind": "economy", "arr": economy_buildings},
		{"kind": "depot", "arr": supply_depots},
		{"kind": "nuclear", "arr": nuclear_plants},
	]
	for spec in specs:
		var arr: Array = spec["arr"]
		var kind: String = spec["kind"]
		var idx := build_system.pick_sell_target(arr, target, max_dist)
		if idx < 0:
			continue
		var d := (arr[idx]["pos"] as Vector3).distance_to(target)
		if d < best_d:
			best_d = d
			best_idx = idx
			best_kind = kind
	if best_idx < 0:
		return {"kind": "none", "index": -1}
	return {"kind": best_kind, "index": best_idx}


func _apply_sell_refund(t: Dictionary) -> void:
	var node: Node = t["node"]
	node.queue_free()
	var built_phase := int(t.get("built_in_inactive_phase", -999))
	var full_refund := not _is_wave_combat_active() and built_phase == current_inactive_phase
	var paid := int(t.get("build_credit_cost", 0))
	var refund := paid if full_refund else int(floor(paid * 0.5))
	credits += refund
	var sup_paid := int(t.get("build_supply_cost", 0))
	supply_used = maxi(0, supply_used - sup_paid)
	audio_service.emit_event("build_sell")


func _handle_play_right_click() -> void:
	if _is_wave_combat_active():
		return
	if (
		turrets.is_empty()
		and economy_buildings.is_empty()
		and supply_depots.is_empty()
		and nuclear_plants.is_empty()
	):
		return
	var target := _crosshair_world_on_ground()
	var sel := _pick_sell_structure(target, 3.4)
	var kind := String(sel.get("kind", "none"))
	if kind == "none":
		return
	if kind == "turret":
		var ti := int(sel.get("index", -1))
		if ti < 0 or ti >= turrets.size():
			return
		var t1 = turrets[ti]
		_apply_sell_refund(t1)
		turrets.remove_at(ti)
	elif kind == "economy":
		var ei := int(sel.get("index", -1))
		if ei < 0 or ei >= economy_buildings.size():
			return
		var e1 = economy_buildings[ei]
		_apply_sell_refund(e1)
		economy_buildings.remove_at(ei)
	elif kind == "depot":
		var di := int(sel.get("index", -1))
		if di < 0 or di >= supply_depots.size():
			return
		var d1 = supply_depots[di]
		_apply_sell_refund(d1)
		supply_depots.remove_at(di)
	else:
		var ni := int(sel.get("index", -1))
		if ni < 0 or ni >= nuclear_plants.size():
			return
		var n1 = nuclear_plants[ni]
		_apply_sell_refund(n1)
		nuclear_plants.remove_at(ni)
	_recompute_supply_cap()
	_recompute_power_cap()


func _update_hud() -> void:
	if phase == AppPhase.PLAYING:
		wave_timer_hud.visible = true
		wave_timer_ring.set_progress(
			hud_controller.wave_timer_progress(
				wave_combat_active,
				spawn_window_duration_sec,
				spawn_window_elapsed_sec,
				inactive_time_left_sec,
				INACTIVE_DURATION_SEC,
			)
		)
		wave_timer_caption.text = hud_controller.format_wave_timer_caption(
			wave,
			wave_combat_active,
			spawn_window_ended,
			asteroids.size(),
			inactive_time_left_sec,
		)
	else:
		wave_timer_hud.visible = false
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
	var refund_hint := ""
	if not _is_wave_combat_active() and first_wave_started and inactive_time_left_sec > 0.0:
		refund_hint = "Sell (RMB): 100% if built this break"
	var wave_ready := _compute_wave_ready()
	var gi := hud_controller.format_gameplay_info(
		wave,
		credits,
		int(command_center_hp),
		int(center_max_hp),
		turrets.size(),
		asteroids.size(),
		int(power_stored),
		int(power_cap),
		int(supply_used),
		int(supply_cap),
		wave_ready,
		spawn_status,
		refund_hint,
	)
	if sandbox_run:
		gi = "SANDBOX (no hiscore save) | " + gi
	if phase == AppPhase.PLAYING:
		gi += " | Diff: %s" % game_difficulty
		if not active_asteroid_discovery.is_empty():
			gi += " | New: %s — %s" % [active_asteroid_discovery, active_asteroid_discovery_desc]
	if economy_buildings.size() > 0:
		gi += " | Fac %d" % economy_buildings.size()
	if supply_depots.size() > 0:
		gi += " | Dep %d" % supply_depots.size()
	if nuclear_plants.size() > 0:
		gi += " | Nuc %d" % nuclear_plants.size()
	gameplay_info.text = gi
	hud_controller.apply_center_hp(center_hp_bar, command_center_hp, center_max_hp)
	if phase == AppPhase.PLAYING or phase == AppPhase.PAUSED:
		_update_research_labels()
	var bm := "turret"
	if upgrade_factory or upgrade_logistics or upgrade_nuclear:
		bm = build_mode
		if bm == "depot_s":
			bm = "depot S"
		elif bm == "depot_l":
			bm = "depot L"
		elif bm == "nuclear":
			bm = "nuclear plant"
	look_readout.text = "%s | Build: %s | B toggle" % [
		hud_controller.format_look_info(camera_system.yaw, camera_system.pitch),
		bm,
	]


func _update_power_economy(delta: float) -> void:
	# Web `updateResources`: while `!waveInProgress`, no gen/drain — only `min(powerStored, powerCap)`.
	# During wave: passive `gen - drain` where drain uses `getPassivePowerDrainPerSec` (turrets/missiles = **0**; power is per-shot `tryConsumeShotPower` in `updateDefenses`).
	if not _is_wave_combat_active():
		power_stored = mini(power_stored, power_cap)
		return
	# Economy buildings: web `getPassivePowerDrainPerSec` includes **`category === 'economy'`** (× `POWER_DRAIN_GLOBAL_MUL`).
	var econ_drain := 0.0
	for e in economy_buildings:
		econ_drain += maxf(0.0, float(e.get("passive_power_drain_per_sec", 0.0)))
	var gen := maxf(0.0, command_center_power_gen_per_sec)
	if credits > 0:
		for np in nuclear_plants:
			gen += maxf(0.0, float(np.get("power_gen_per_sec", 0.0)))
	power_produced += gen * delta
	var net := (gen - econ_drain * WebParityDefs.POWER_DRAIN_GLOBAL_MUL) * delta
	power_stored = int(round(clampf(float(power_stored) + net, 0.0, float(power_cap))))


## Web `tryConsumeShotPower(def, scale)` — `cost = max(0, powerDrainPerSec * POWER_DRAIN_GLOBAL_MUL * scale)`.
func _try_consume_shot_power(drain_per_sec: float, scale: float = 1.0) -> bool:
	var cost := maxf(0.0, drain_per_sec * WebParityDefs.POWER_DRAIN_GLOBAL_MUL * scale)
	if cost <= 0.0:
		return true
	if float(power_stored) + 1e-6 < cost:
		return false
	power_stored = int(round(clampf(float(power_stored) - cost, 0.0, float(power_cap))))
	return true


func _update_passive_income(delta: float) -> void:
	# Web `updateResources`: building payouts (CC `creditPayout` / `creditIntervalSec`) only while `waveInProgress`.
	if not _is_wave_combat_active():
		return
	var payout := command_center_credit_payout
	if payout <= 0:
		return
	var interval := command_center_credit_interval_sec
	command_center_econ_timer += delta
	while command_center_econ_timer >= interval:
		command_center_econ_timer -= interval
		credits = economy_system.add_income(credits, payout)
		money_earned += payout


func _update_economy_buildings(delta: float) -> void:
	# Web `updateResources` economy loop: **`creditPayout` / `creditIntervalSec`** during wave; pause timer if draining and **no power**.
	if not _is_wave_combat_active():
		return
	for i in range(economy_buildings.size()):
		var e = economy_buildings[i]
		var drain := maxf(0.0, float(e.get("passive_power_drain_per_sec", 0.0)))
		if drain > 0.0 and float(power_stored) <= 0.001:
			continue
		var payout := int(e.get("credit_payout", 0))
		if payout <= 0:
			continue
		var interval := maxf(0.05, float(e.get("credit_interval_sec", 1.0)))
		var timer := float(e.get("econ_timer", 0.0)) + delta
		while timer >= interval:
			timer -= interval
			if drain > 0.0 and float(power_stored) <= 0.001:
				break
			credits = economy_system.add_income(credits, payout)
			money_earned += payout
		e["econ_timer"] = timer
		economy_buildings[i] = e


func _update_diagnostics() -> void:
	if not diagnostics_visible:
		return
	var fps := int(round(Engine.get_frames_per_second()))
	var mem_mb := Performance.get_monitor(Performance.MEMORY_STATIC) / (1024.0 * 1024.0)
	diagnostics_label.text = "FPS %d | Tur %d | Fac %d | Nuc %d | Ast %d | Pool %d | WaveCombat %s toSpawn %d | P %d/%d S %d/%d | PowProd %.0f | %s | Mem %.1f MB" % [
		fps,
		turrets.size(),
		economy_buildings.size(),
		nuclear_plants.size(),
		asteroids.size(),
		asteroid_pool.size(),
		str(wave_combat_active),
		to_spawn,
		int(power_stored),
		int(power_cap),
		int(supply_used),
		int(supply_cap),
		power_produced,
		game_difficulty,
		mem_mb,
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
	var kill_mul := WebParityDefs.balance_var_f("asteroidKillCreditMul", 1.45)
	var r = combat_system.step_projectiles(
		delta, projectiles, asteroids, wave, kill_credit_bonus, kill_mul
	)
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
			var kv := String(asteroids[ai].get("variant", "normal"))
			audio_service.emit_event("asteroid_destroyed", {"variant": kv, "reason": "combat"})
			_remove_asteroid(ai, "combat")
		if phase != AppPhase.PLAYING:
			break


func _update_camera_motion(delta: float) -> void:
	camera_system.update_movement(delta, camera_3d)


func _try_buy_upgrade(which: String) -> void:
	var s = {
		"credits": credits,
		"money_spent": money_spent,
		"upgrade_core": upgrade_core,
		"upgrade_factory": upgrade_factory,
		"upgrade_logistics": upgrade_logistics,
		"upgrade_nuclear": upgrade_nuclear,
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
	upgrade_nuclear = bool(out.upgrade_nuclear)
	turret_damage_mult = float(out.turret_damage_mult)
	kill_credit_bonus = int(out.kill_credit_bonus)
	turret_range_bonus = float(out.turret_range_bonus)
	turret_cooldown_bonus = float(out.turret_cooldown_bonus)
	audio_service.emit_event("upgrade_purchase", {"upgrade": which})
	_update_research_labels()


func _update_research_labels() -> void:
	var rs := {
		"credits": credits,
		"upgrade_core": upgrade_core,
		"upgrade_factory": upgrade_factory,
		"upgrade_logistics": upgrade_logistics,
		"upgrade_nuclear": upgrade_nuclear,
	}
	research_core_label.text = upgrade_system.research_label_with_prereq_hint("core", upgrade_core, rs)
	research_factory_label.text = upgrade_system.research_label_with_prereq_hint("factory", upgrade_factory, rs)
	research_logistics_label.text = upgrade_system.research_label_with_prereq_hint("logistics", upgrade_logistics, rs)
	research_nuclear_label.text = upgrade_system.research_label_with_prereq_hint("nuclear", upgrade_nuclear, rs)


func _finalize_run_score() -> void:
	if sandbox_run:
		run_score = 0
	else:
		run_score = score_system.compute_run_score(
			wave,
			asteroids_killed,
			money_earned,
			money_spent,
			power_produced,
			game_difficulty,
		)
	gameover_hint.text = gameover_controller.format_hint(
		wave, asteroids_killed, money_earned, money_spent, selected_commander
	)
	if sandbox_run:
		gameover_hint.text += " | Sandbox (score not saved)"
	gameover_score.text = "Score: %d" % run_score
	if sandbox_run:
		gameover_best.text = "Best: %d (sandbox run)" % best_score
	elif run_score > best_score:
		best_score = run_score
		score_system.save_best_score(best_score)
		gameover_best.text = "Best: %d" % best_score
	else:
		gameover_best.text = "Best: %d" % best_score


func _ensure_fullscreen_and_capture() -> void:
	if DisplayServer.window_get_mode() != DisplayServer.WINDOW_MODE_FULLSCREEN:
		DisplayServer.window_set_mode(DisplayServer.WINDOW_MODE_FULLSCREEN)
	_ensure_capture_mode()


func _ensure_capture_mode() -> void:
	# Keep OS cursor hidden; for menu overlays we still use relative motion to steer a virtual cursor.
	Input.mouse_mode = Input.MOUSE_MODE_CAPTURED


func _is_capture_active() -> bool:
	return Input.mouse_mode == Input.MOUSE_MODE_CAPTURED


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
	var prev_combat := wave_combat_active
	var prev_wave := wave
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
	if wave != prev_wave:
		_rebuild_wave_variant_pool()
	if wave_combat_active and not prev_combat:
		audio_service.emit_event("wave_start", {})
	if prev_combat and not wave_combat_active:
		audio_service.emit_event("wave_cleared", {})
	_sync_game_state_runtime()


func _sync_game_state_runtime() -> void:
	game_state.wave = wave
	game_state.credits = credits
	game_state.command_center_max_hp = center_max_hp
	game_state.command_center_hp = command_center_hp
	game_state.power_cap = power_cap
	game_state.power_stored = power_stored
	game_state.supply_cap = supply_cap
	game_state.supply_used = supply_used
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
	game_state.power_produced = power_produced
	game_state.run_score = run_score
	game_state.best_score = best_score
	game_state.wave_ready = _compute_wave_ready()
	game_state.upgrade_core = upgrade_core
	game_state.upgrade_factory = upgrade_factory
	game_state.upgrade_logistics = upgrade_logistics
	game_state.upgrade_nuclear = upgrade_nuclear
	game_state.turret_damage_mult = turret_damage_mult
	game_state.kill_credit_bonus = kill_credit_bonus
	game_state.turret_range_bonus = turret_range_bonus
	game_state.turret_cooldown_bonus = turret_cooldown_bonus
