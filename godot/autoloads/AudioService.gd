extends Node
class_name AudioService

## Optional defeat clip (works if present).
const GAME_OVER_STREAM_PATH := "res://audio/game_over.wav"

## Same **filenames** as web `public/audio/sfx/` — copy that folder to **`godot/audio/sfx/`** import in Godot.
const SFX_DIR := "res://audio/sfx/"
const OPTIONAL_SFX := {
	"asteroid_discovery": "computer.ogg",
	"build_place": "door_open.ogg",
	"build_sell": "door_close.ogg",
	"emp_pulse": "emp_burst.ogg",
	"aoe_pop": "explosion_crunch.ogg",
	"upgrade_purchase": "computer.ogg",
	"upgrade_refund": "door_close.ogg",
	"shield_hit": "explosion_low.ogg",
	"asteroid_impact": "explosion_low.ogg",
	"asteroid_destroyed_small": "laser_small.ogg",
	"asteroid_destroyed_large": "laser_large.ogg",
}

var _sfx: AudioStreamPlayer
var _build_sell_sfx: AudioStreamPlayer
var _last_shield_hit_ms := 0
var _master_volume := 0.85
const SHIELD_HIT_MIN_INTERVAL_MS := 72
const BUILD_SELL_STOP_SEC := 0.072


func _ready() -> void:
	_sfx = AudioStreamPlayer.new()
	_sfx.name = "SfxPlayer"
	add_child(_sfx)
	_build_sell_sfx = AudioStreamPlayer.new()
	_build_sell_sfx.name = "BuildSellSfxPlayer"
	add_child(_build_sell_sfx)
	set_master_volume(_master_volume)


func set_master_volume(level: float) -> void:
	_master_volume = clampf(level, 0.0, 1.0)
	var db := linear_to_db(_master_volume) if _master_volume > 0.0001 else -80.0
	if _sfx != null:
		_sfx.volume_db = db
	if _build_sell_sfx != null:
		_build_sell_sfx.volume_db = db


func emit_event(event_name: String, payload: Dictionary = {}) -> void:
	if event_name == "":
		return
	if event_name == "game_over":
		_play_game_over_if_available()
		return
	if event_name == "asteroid_destroyed":
		_play_asteroid_destroyed(payload)
		return
	if event_name == "shield_hit":
		_play_shield_hit_throttled()
		return
	if event_name == "build_sell":
		_play_build_sell_short()
		return
	var fname: String = OPTIONAL_SFX.get(event_name, "")
	if fname.is_empty():
		return
	_play_stream_if_exists(SFX_DIR + fname)


func _play_asteroid_destroyed(payload: Dictionary) -> void:
	var reason := String(payload.get("reason", "combat"))
	var v := String(payload.get("variant", ""))
	var large := v == "colossus" or v == "planet"
	var key := "asteroid_destroyed_small"
	if reason == "combat" and large:
		key = "asteroid_destroyed_large"
	_play_stream_if_exists(SFX_DIR + OPTIONAL_SFX[key])


func _play_shield_hit_throttled() -> void:
	var now := Time.get_ticks_msec()
	if now - _last_shield_hit_ms < SHIELD_HIT_MIN_INTERVAL_MS:
		return
	_last_shield_hit_ms = now
	_play_stream_if_exists(SFX_DIR + OPTIONAL_SFX["shield_hit"])


func _play_build_sell_short() -> void:
	if _build_sell_sfx == null:
		return
	var path := SFX_DIR + String(OPTIONAL_SFX.get("build_sell", ""))
	if path.is_empty() or not ResourceLoader.exists(path):
		return
	var st = load(path)
	if not (st is AudioStream):
		return
	_build_sell_sfx.stream = st as AudioStream
	_build_sell_sfx.play()
	var timer := get_tree().create_timer(BUILD_SELL_STOP_SEC)
	timer.timeout.connect(func() -> void:
		if _build_sell_sfx != null and _build_sell_sfx.playing:
			_build_sell_sfx.stop()
	)


func _play_game_over_if_available() -> void:
	if _play_stream_if_exists(GAME_OVER_STREAM_PATH):
		return
	_play_stream_if_exists(SFX_DIR + "metal_impact.ogg")


func _play_stream_if_exists(path: String) -> bool:
	if _sfx == null or path.is_empty():
		return false
	if not ResourceLoader.exists(path):
		return false
	var st = load(path)
	if not (st is AudioStream):
		return false
	_sfx.stream = st as AudioStream
	_sfx.play()
	return true
