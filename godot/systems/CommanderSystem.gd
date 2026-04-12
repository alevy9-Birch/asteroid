extends RefCounted
class_name CommanderSystem

const HEROES := ["archangel", "dominion", "nova", "citadel", "jupiter", "kingpin"]

func is_valid_commander(hero_id: String) -> bool:
	return HEROES.has(hero_id)

func normalize_commander(hero_id: String) -> String:
	if is_valid_commander(hero_id):
		return hero_id
	return "none"

func apply_commander_defaults(hero_id: String, state: Dictionary) -> Dictionary:
	var out := state.duplicate(true)
	out.commander = normalize_commander(hero_id)
	return out
