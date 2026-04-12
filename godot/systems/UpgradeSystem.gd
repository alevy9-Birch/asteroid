extends RefCounted
class_name UpgradeSystem

func try_buy_upgrade(which: String, state: Dictionary) -> Dictionary:
	var out := state.duplicate(true)
	if which == "core":
		if out.upgrade_core or out.credits < 120:
			out.ok = false
			return out
		out.credits -= 120
		out.money_spent += 120
		out.upgrade_core = true
		out.turret_damage_mult = 1.2
	elif which == "factory":
		if out.upgrade_factory or out.credits < 140:
			out.ok = false
			return out
		out.credits -= 140
		out.money_spent += 140
		out.upgrade_factory = true
		out.kill_credit_bonus = 4
	elif which == "logistics":
		if out.upgrade_logistics or out.credits < 160:
			out.ok = false
			return out
		out.credits -= 160
		out.money_spent += 160
		out.upgrade_logistics = true
		out.turret_range_bonus = 3.5
		out.turret_cooldown_bonus = 0.06
	else:
		out.ok = false
		return out
	out.ok = true
	return out

func label_core(owned: bool) -> String:
	return "U - Core Protocol (120c): +20%% turret dmg %s" % ("[OWNED]" if owned else "")

func label_factory(owned: bool) -> String:
	return "I - Factory Expansion (140c): +4 credits/kill %s" % ("[OWNED]" if owned else "")

func label_logistics(owned: bool) -> String:
	return "O - Logistics (160c): +3.5 range, -0.06s cooldown %s" % ("[OWNED]" if owned else "")
