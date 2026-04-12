extends Node
class_name AudioService

# Phase parity skeleton: this defines event names and central handling point.
# Known events (extend as needed): build_place, build_sell, upgrade_purchase, aoe_pop, emp_pulse, game_over, …
func emit_event(event_name: String, payload: Dictionary = {}) -> void:
	# Intentionally lightweight for now; this preserves a stable API for systems.
	# Debug prints can be toggled on if needed during parity verification.
	if payload.is_empty():
		pass
	if event_name == "":
		return
