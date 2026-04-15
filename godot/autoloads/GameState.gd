extends Node
class_name GameState

enum AppPhase { MENU, PLAYING, PAUSED, GAMEOVER }

signal phase_changed(next_phase: int)
signal resources_changed(credits: int, center_hp: float)
signal wave_changed(wave: int, wave_combat_active: bool, to_spawn: int, wave_ready: bool)

var phase: AppPhase = AppPhase.MENU
var wave := 0
var credits := WebParityDefs.RESET_RUN_CREDITS
## Max command center HP (mirrors web `command_center.maxHp` when synced from `WebParityDefs`).
var command_center_max_hp := 1000.0
var command_center_hp := 1000.0
## Web `resetRun()` power/supply; **`power_stored`** follows `updateResources` (gen/drain only during wave combat).
var power_cap := WebParityDefs.RESET_RUN_POWER_CAP
var power_stored := WebParityDefs.RESET_RUN_POWER_STORED
var supply_cap := WebParityDefs.RESET_RUN_SUPPLY_CAP
var supply_used := WebParityDefs.RESET_RUN_SUPPLY_USED
var wave_combat_active := false
var to_spawn := 0
var spawn_window_elapsed_sec := 0.0
var spawn_window_duration_sec := 0.0
var spawn_window_ended := false
var spawn_timer := 0.0
var intermission_timer := 0.0
var inactive_time_left_sec := 0.0
var current_inactive_phase := 0
var game_difficulty := "hard"
var selected_commander := "none"
## Web `waveReady`: manual next wave allowed (Space) — false during `waveInProgress`; when inactive, true iff `inactiveTimeLeftSec > 0`.
var wave_ready := true

var money_earned := 0
var money_spent := 0
var asteroids_killed := 0
## Web `runStats.powerProduced` (gross gen during active waves).
var power_produced := 0.0
var run_score := 0
var best_score := 0

var upgrade_core := false
var upgrade_factory := false
var upgrade_logistics := false
var upgrade_nuclear := false
var upgrade_core_phase := -1
var upgrade_factory_phase := -1
var upgrade_logistics_phase := -1
var upgrade_nuclear_phase := -1

var turret_damage_mult := 1.0
var kill_credit_bonus := 0
var turret_range_bonus := 0.0
var turret_cooldown_bonus := 0.0

func reset_run() -> void:
	## Mirrors web `resetRun` scalars; **`main.gd` `start_run` → `_start_new_run`** is authoritative (calls `_sync_game_state_runtime`).
	wave = 0
	credits = WebParityDefs.RESET_RUN_CREDITS
	power_cap = WebParityDefs.RESET_RUN_POWER_CAP
	power_stored = WebParityDefs.RESET_RUN_POWER_STORED
	supply_cap = WebParityDefs.prototype_command_center_supply_cap_add(20) if WebParityDefs.ok else 20
	supply_used = WebParityDefs.RESET_RUN_SUPPLY_USED
	command_center_max_hp = WebParityDefs.prototype_command_center_max_hp(command_center_max_hp)
	command_center_hp = command_center_max_hp
	wave_combat_active = false
	to_spawn = 0
	spawn_window_elapsed_sec = 0.0
	spawn_window_duration_sec = 0.0
	spawn_window_ended = false
	spawn_timer = 0.0
	intermission_timer = 0.0
	inactive_time_left_sec = 0.0
	current_inactive_phase = 0
	game_difficulty = "hard"
	selected_commander = "none"
	wave_ready = true
	money_earned = 0
	money_spent = 0
	asteroids_killed = 0
	power_produced = 0.0
	run_score = 0
	upgrade_core = false
	upgrade_factory = false
	upgrade_logistics = false
	upgrade_nuclear = false
	upgrade_core_phase = -1
	upgrade_factory_phase = -1
	upgrade_logistics_phase = -1
	upgrade_nuclear_phase = -1
	turret_damage_mult = 1.0
	kill_credit_bonus = 0
	turret_range_bonus = 0.0
	turret_cooldown_bonus = 0.0
	emit_state()

func set_phase(next_phase: AppPhase) -> void:
	if phase == next_phase:
		return
	phase = next_phase
	phase_changed.emit(phase)

func emit_state() -> void:
	resources_changed.emit(credits, command_center_hp)
	wave_changed.emit(wave, wave_combat_active, to_spawn, wave_ready)
