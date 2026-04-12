extends Node
class_name AudioService

## Optional defeat clip (works if present).
const GAME_OVER_STREAM_PATH := "res://audio/game_over.wav"

## Same **filenames** as web `public/audio/sfx/` — copy that folder to **`godot/audio/sfx/`** import in Godot.
const SFX_DIR := "res://audio/sfx/"
## Web **`wave_start` / `wave_cleared`** types are silent in TS; we map optional **`thr_whoosh`** / **`door_close`** if present in **`SFX_DIR`**.
const OPTIONAL_SFX := {
	"wave_start": "thr_whoosh.ogg",
	"wave_cleared": "door_close.ogg",
	"build_place": "door_open.ogg",
	"build_sell": "door_close.ogg",
	"emp_pulse": "emp_burst.ogg",
	"aoe_pop": "explosion_crunch.ogg",
	"upgrade_purchase": "computer.ogg",
	"asteroid_impact": "explosion_low.ogg",
	"asteroid_destroyed_small": "laser_small.ogg",
	"asteroid_destroyed_large": "laser_large.ogg",
}

var _sfx: AudioStreamPlayer


func _ready() -> void:
	_sfx = AudioStreamPlayer.new()
	_sfx.name = "SfxPlayer"
	add_child(_sfx)


func emit_event(event_name: String, payload: Dictionary = {}) -> void:
	if event_name == "":
		return
	if event_name == "game_over":
		_play_game_over_if_available()
		return
	if event_name == "asteroid_destroyed":
		_play_asteroid_destroyed(payload)
		return
	var fname: String = OPTIONAL_SFX.get(event_name, "")
	if fname.is_empty():
		return
	_play_stream_if_exists(SFX_DIR + fname)


func _play_asteroid_destroyed(payload: Dictionary) -> void:
	var reason := String(payload.get("reason", "combat"))
	var v := String(payload.get("variant", ""))
	if reason != "combat":
		_play_stream_if_exists(SFX_DIR + OPTIONAL_SFX["asteroid_destroyed_small"])
		return
	var large := v == "colossus" or v == "planet"
	var key := "asteroid_destroyed_large" if large else "asteroid_destroyed_small"
	_play_stream_if_exists(SFX_DIR + OPTIONAL_SFX[key])


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
