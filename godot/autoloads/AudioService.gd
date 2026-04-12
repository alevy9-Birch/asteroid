extends Node
class_name AudioService

# Phase parity skeleton: this defines event names and central handling point.
# Real audio routing/asset parity will be filled as we port web audio behavior.
func emit_event(event_name: String, payload: Dictionary = {}) -> void:
	# Intentionally lightweight for now; this preserves a stable API for systems.
	# Debug prints can be toggled on if needed during parity verification.
	if payload.is_empty():
		pass
	if event_name == "":
		return
