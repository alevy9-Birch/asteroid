extends Node
class_name AudioService

## Optional asset: drop a short clip here to hear defeat SFX (C.4); safe if missing.
const GAME_OVER_STREAM_PATH := "res://audio/game_over.wav"

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
	if not payload.is_empty():
		pass


func _play_game_over_if_available() -> void:
	if _sfx == null:
		return
	if not ResourceLoader.exists(GAME_OVER_STREAM_PATH):
		return
	var st := load(GAME_OVER_STREAM_PATH)
	if st is AudioStream:
		_sfx.stream = st
		_sfx.play()
