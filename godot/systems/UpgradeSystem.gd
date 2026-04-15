extends RefCounted
class_name UpgradeSystem

## Maps prototype slot keys → real **`parity_web_defs.json`** `upgrades[].id` (labels/costs; **effects** still prototype).
const SLOT_UPGRADE_IDS := {
	"core": "turret_targeting",
	"factory": "unlock_factory",
	"logistics": "generator_efficiency",
	"nuclear": "unlock_nuclear_plant",
}
const SLOT_KEYS := ["core", "factory", "logistics", "nuclear"]

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
		out.upgrade_core_phase = int(out.get("current_inactive_phase", -1))
		out.turret_damage_mult = 1.2
	elif which == "factory":
		if out.upgrade_factory or out.credits < cost:
			out.ok = false
			return out
		out.credits -= cost
		out.money_spent += cost
		out.upgrade_factory = true
		out.upgrade_factory_phase = int(out.get("current_inactive_phase", -1))
		out.kill_credit_bonus = 4
	elif which == "logistics":
		if out.upgrade_logistics or out.credits < cost:
			out.ok = false
			return out
		out.credits -= cost
		out.money_spent += cost
		out.upgrade_logistics = true
		out.upgrade_logistics_phase = int(out.get("current_inactive_phase", -1))
		out.turret_range_bonus = 3.5
		out.turret_cooldown_bonus = 0.06
	elif which == "nuclear":
		if out.upgrade_nuclear or out.credits < cost:
			out.ok = false
			return out
		out.credits -= cost
		out.money_spent += cost
		out.upgrade_nuclear = true
		out.upgrade_nuclear_phase = int(out.get("current_inactive_phase", -1))
	else:
		out.ok = false
		return out
	out.ok = true
	return out


func try_refund_upgrade(which: String, state: Dictionary) -> Dictionary:
	var out := state.duplicate(true)
	if not _slot_owned(out, which):
		out.ok = false
		return out
	if int(out.get(_slot_phase_key(which), -999)) != int(out.get("current_inactive_phase", -1)):
		out.ok = false
		return out
	_refund_slot(out, which)
	_refund_invalid_current_phase_upgrades(out)
	out.ok = true
	return out


func _refund_invalid_current_phase_upgrades(state: Dictionary) -> void:
	var changed := true
	while changed:
		changed = false
		for which in SLOT_KEYS:
			if not _slot_owned(state, which):
				continue
			var phase_key := _slot_phase_key(which)
			if int(state.get(phase_key, -999)) != int(state.get("current_inactive_phase", -1)):
				continue
			var uid := _upgrade_id(which)
			if uid.is_empty():
				continue
			if WebParityDefs.ok and not WebParityDefs.prototype_upgrade_prereqs_satisfied(uid, state):
				_refund_slot(state, which)
				changed = true


func _refund_slot(state: Dictionary, which: String) -> void:
	var cost := _purchase_cost(which)
	state.credits = int(state.get("credits", 0)) + cost
	state.money_spent = maxi(0, int(state.get("money_spent", 0)) - cost)
	state[_slot_owned_key(which)] = false
	state[_slot_phase_key(which)] = -1
	match which:
		"core":
			state.turret_damage_mult = 1.0
		"factory":
			state.kill_credit_bonus = 0
		"logistics":
			state.turret_range_bonus = 0.0
			state.turret_cooldown_bonus = 0.0
		"nuclear":
			pass


func _slot_owned(state: Dictionary, which: String) -> bool:
	return bool(state.get(_slot_owned_key(which), false))


func _slot_owned_key(which: String) -> String:
	return "upgrade_%s" % which


func _slot_phase_key(which: String) -> String:
	return "upgrade_%s_phase" % which


func label_core(owned: bool) -> String:
	return WebParityDefs.research_display_line(_upgrade_id("core"), "U", owned)


func label_factory(owned: bool) -> String:
	return WebParityDefs.research_display_line(_upgrade_id("factory"), "I", owned)


func label_logistics(owned: bool) -> String:
	return WebParityDefs.research_display_line(_upgrade_id("logistics"), "O", owned)


func label_nuclear(owned: bool) -> String:
	return WebParityDefs.research_display_line(_upgrade_id("nuclear"), "N", owned)


func research_label_with_prereq_hint(which: String, owned: bool, state: Dictionary) -> String:
	var line := ""
	match which:
		"core":
			line = label_core(owned)
		"factory":
			line = label_factory(owned)
		"logistics":
			line = label_logistics(owned)
		"nuclear":
			line = label_nuclear(owned)
		_:
			return ""
	if owned:
		return line
	var uid := _upgrade_id(which)
	if WebParityDefs.ok:
		var pre := WebParityDefs.prototype_research_prereq_hint(uid, state)
		if not pre.is_empty():
			return "%s  %s" % [line, pre]
	var cost := _purchase_cost(which)
	var creds := int(state.get("credits", 0))
	if creds < cost:
		return "%s  [+%dc]" % [line, cost - creds]
	return line
