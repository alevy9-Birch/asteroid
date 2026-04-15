extends RefCounted
class_name CommanderSystem

const HEROES := ["archangel", "dominion", "nova", "citadel", "jupiter", "kingpin"]
const HERO_LABELS := {
	"none": "None",
	"archangel": "Archangel",
	"dominion": "Dominion",
	"nova": "Nova",
	"citadel": "Citadel",
	"jupiter": "Jupiter",
	"kingpin": "Kingpin",
}

func is_valid_commander(hero_id: String) -> bool:
	return HEROES.has(hero_id)

func normalize_commander(hero_id: String) -> String:
	if is_valid_commander(hero_id):
		return hero_id
	return "none"

func display_name(hero_id: String) -> String:
	var normalized := normalize_commander(hero_id)
	return String(HERO_LABELS.get(normalized, "None"))

func apply_commander_defaults(hero_id: String, state: Dictionary) -> Dictionary:
	var out := state.duplicate(true)
	out.commander = normalize_commander(hero_id)
	return out
