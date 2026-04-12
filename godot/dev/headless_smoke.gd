extends Node

## Minimal CI/smoke: autoloads load first, then assert parity JSON is present and exit.


func _ready() -> void:
	if not WebParityDefs.ok:
		push_error("HeadlessSmoke: WebParityDefs.ok is false (missing or empty parity_web_defs.json?)")
		get_tree().quit(1)
		return
	get_tree().quit(0)
