extends RefCounted
class_name UpgradeSystem

## Maps prototype slot keys → real **`parity_web_defs.json`** `upgrades[].id` (labels/costs; **effects** still prototype).
const SLOT_UPGRADE_IDS := {
	"core": "turret_targeting",
	"factory": "unlock_factory",
	"logistics": "generator_efficiency",
	"nuclear": "unlock_nuclear_plant",
}

const FALLBACK_COSTS := {"core": 120, "factory": 140, "logistics": 160, "nuclear": 950}


func _upgrade_id(which: String) -> String:
	return String(SLOT_UPGRADE_IDS.get(which, ""))


func _purchase_cost(which: String) -> int:
	var uid := _upgrade_id(which)
	if uid.is_empty():
		return 99999
	if WebParityDefs.ok:
		return WebParityDefs.discounted_upgrade_credit_cost(uid, int(FALLBACK_COSTS.get(which, 999)))
	return int(FALLBACK_COSTS.get(which, 999))


func try_buy_upgrade(which: String, state: Dictionary) -> Dictionary:
	var out := state.duplicate(true)
	var uid := _upgrade_id(which)
	if uid.is_empty():
		out.ok = false
		return out
	if WebParityDefs.ok and not WebParityDefs.prototype_upgrade_prereqs_satisfied(uid, out):
		out.ok = false
		return out
	var cost := _purchase_cost(which)
	if which == "core":
		if out.upgrade_core or out.credits < cost:
			out.ok = false
			return out
		out.credits -= cost
		out.money_spent += cost
		out.upgrade_core = true
		out.turret_damage_mult = 1.2
	elif which == "factory":
		if out.upgrade_factory or out.credits < cost:
			out.ok = false
			return out
		out.credits -= cost
		out.money_spent += cost
		out.upgrade_factory = true
		out.kill_credit_bonus = 4
	elif which == "logistics":
		if out.upgrade_logistics or out.credits < cost:
			out.ok = false
			return out
		out.credits -= cost
		out.money_spent += cost
		out.upgrade_logistics = true
		out.turret_range_bonus = 3.5
		out.turret_cooldown_bonus = 0.06
	elif which == "nuclear":
		if out.upgrade_nuclear or out.credits < cost:
			out.ok = false
			return out
		out.credits -= cost
		out.money_spent += cost
		out.upgrade_nuclear = true
	else:
		out.ok = false
		return out
	out.ok = true
	return out


func label_core(owned: bool) -> String:
	return WebParityDefs.research_display_line(_upgrade_id("core"), "U", owned)


func label_factory(owned: bool) -> String:
	return WebParityDefs.research_display_line(_upgrade_id("factory"), "I", owned)


func label_logistics(owned: bool) -> String:
	return WebParityDefs.research_display_line(_upgrade_id("logistics"), "O", owned)


func label_nuclear(owned: bool) -> String:
	return WebParityDefs.research_display_line(_upgrade_id("nuclear"), "N", owned)
