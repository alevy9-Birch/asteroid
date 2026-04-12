extends RefCounted
class_name EconomySystem

func tick_passive_income(delta: float, accum: float, per_sec: float) -> Dictionary:
	var next_accum = accum + per_sec * delta
	if next_accum < 1.0:
		return { "earned": 0, "accum": next_accum }
	var earned := int(next_accum)
	next_accum -= earned
	return { "earned": earned, "accum": next_accum }

func spend(credits: int, amount: int) -> Dictionary:
	if credits < amount:
		return { "ok": false, "credits": credits }
	return { "ok": true, "credits": credits - amount }

func add_income(credits: int, amount: int) -> int:
	return credits + amount
