extends Node

## Runtime mirror of `godot/data/parity_web_defs.json` (from `scripts/parity/extract_web_defs.mjs`).
## Full building/upgrade dictionaries are preserved for forward-compatible fields.

const DEFS_PATH := "res://data/parity_web_defs.json"

## Web `BaseDefenseGame.resetRun()` resource baselines. **Supply** gated on build; **power** tick = CC gen + **non-turret** passive drains (turrets bill **`tryConsumeShotPower`** only).
const RESET_RUN_CREDITS := 1550
const RESET_RUN_POWER_CAP := 45
const RESET_RUN_POWER_STORED := 45
const RESET_RUN_SUPPLY_CAP := 0
const RESET_RUN_SUPPLY_USED := 0

## Web `BaseDefenseGame.ts` `POWER_DRAIN_GLOBAL_MUL` — scales passive drain and **`tryConsumeShotPower`** costs.
const POWER_DRAIN_GLOBAL_MUL := 1.5

var ok: bool = false
var balance_vars: Dictionary = {}
var buildings_by_id: Dictionary = {}
var upgrades_by_id: Dictionary = {}
var _raw_buildings: Array = []
var _raw_upgrades: Array = []


func _ready() -> void:
	_load_defs()


func _load_defs() -> void:
	if not FileAccess.file_exists(DEFS_PATH):
		push_warning("WebParityDefs: missing %s (run: node scripts/parity/extract_web_defs.mjs)" % DEFS_PATH)
		return
	var f := FileAccess.open(DEFS_PATH, FileAccess.READ)
	if f == null:
		push_warning("WebParityDefs: could not read %s" % DEFS_PATH)
		return
	var data = JSON.parse_string(f.get_as_text())
	if data == null or typeof(data) != TYPE_DICTIONARY:
		push_warning("WebParityDefs: invalid JSON in %s" % DEFS_PATH)
		return
	var d: Dictionary = data
	balance_vars = d.get("balanceVars", {})
	if typeof(balance_vars) != TYPE_DICTIONARY:
		balance_vars = {}
	_raw_buildings = d.get("buildings", [])
	_raw_upgrades = d.get("upgrades", [])
	if typeof(_raw_buildings) != TYPE_ARRAY:
		_raw_buildings = []
	if typeof(_raw_upgrades) != TYPE_ARRAY:
		_raw_upgrades = []
	buildings_by_id.clear()
	upgrades_by_id.clear()
	for item in _raw_buildings:
		if typeof(item) != TYPE_DICTIONARY:
			continue
		var b: Dictionary = item
		var bid := String(b.get("id", ""))
		if bid.is_empty():
			continue
		buildings_by_id[bid] = b
	for item in _raw_upgrades:
		if typeof(item) != TYPE_DICTIONARY:
			continue
		var u: Dictionary = item
		var uid := String(u.get("id", ""))
		if uid.is_empty():
			continue
		upgrades_by_id[uid] = u
	ok = buildings_by_id.size() > 0


func get_building(id: String) -> Dictionary:
	if not buildings_by_id.has(id):
		return {}
	var v = buildings_by_id[id]
	if typeof(v) != TYPE_DICTIONARY:
		return {}
	return v


func get_upgrade(id: String) -> Dictionary:
	if not upgrades_by_id.has(id):
		return {}
	var v = upgrades_by_id[id]
	if typeof(v) != TYPE_DICTIONARY:
		return {}
	return v


func has_building(id: String) -> bool:
	return buildings_by_id.has(id)


func has_upgrade(id: String) -> bool:
	return upgrades_by_id.has(id)


## Web `applyUpgradeCostAdjust`: global ×0.93 on upgrade `creditCost`.
const UPGRADE_CREDIT_COST_MUL := 0.93


func discounted_upgrade_credit_cost(upgrade_id: String, fallback: int) -> int:
	var u := get_upgrade(upgrade_id)
	if u.is_empty():
		return maxi(1, fallback)
	var v = u.get("creditCost", fallback)
	if typeof(v) != TYPE_INT and typeof(v) != TYPE_FLOAT:
		return maxi(1, fallback)
	return maxi(1, int(round(float(v) * UPGRADE_CREDIT_COST_MUL)))


## HUD line for prototype research slots (hotkey + label + discounted cost + description).
func research_display_line(upgrade_id: String, hotkey: String, owned: bool) -> String:
	if not ok:
		return "%s — (parity defs missing)" % hotkey
	var u := get_upgrade(upgrade_id)
	if u.is_empty():
		return "%s — (no upgrade \"%s\")" % [hotkey, upgrade_id]
	var label := String(u.get("label", upgrade_id))
	var cost := discounted_upgrade_credit_cost(upgrade_id, 0)
	var desc := String(u.get("description", ""))
	if desc.length() > 64:
		desc = desc.substr(0, 61) + "…"
	if owned:
		return "%s - %s (%dc) [OWNED]" % [hotkey, label, cost]
	return "%s - %s (%dc) — %s" % [hotkey, label, cost, desc]


func balance_var_f(key: String, default := 1.0) -> float:
	var v = balance_vars.get(key, default)
	if typeof(v) == TYPE_INT or typeof(v) == TYPE_FLOAT:
		return float(v)
	return default


func read_building_float(building_id: String, key: String, fallback: float) -> float:
	var b := get_building(building_id)
	if b.is_empty():
		return fallback
	var v = b.get(key, fallback)
	if typeof(v) == TYPE_INT or typeof(v) == TYPE_FLOAT:
		return float(v)
	return fallback


func read_building_int(building_id: String, key: String, fallback: int) -> int:
	return int(round(read_building_float(building_id, key, float(fallback))))


## Web `BuildingDef.size` { w, h } in grid cells (min 1×1). Use for any **`buildings_by_id`** entry.
func read_building_footprint(building_id: String, default_w: int = 1, default_h: int = 1) -> Vector2i:
	var dw := maxi(1, default_w)
	var dh := maxi(1, default_h)
	var b := get_building(building_id)
	if b.is_empty():
		return Vector2i(dw, dh)
	var sz = b.get("size", {})
	if typeof(sz) != TYPE_DICTIONARY:
		return Vector2i(dw, dh)
	var ww := int(sz.get("w", default_w))
	var hh := int(sz.get("h", default_h))
	return Vector2i(maxi(1, ww), maxi(1, hh))


## Prototype research slots: web **`upgrades[].id`** → **`main.gd`** / state dict keys (`try_buy_upgrade` payload).
const PROTOTYPE_UPGRADE_STATE_KEYS := {
	"turret_targeting": "upgrade_core",
	"unlock_factory": "upgrade_factory",
	"generator_efficiency": "upgrade_logistics",
	"unlock_nuclear_plant": "upgrade_nuclear",
}


## True iff every **`prereqIds`** entry on **`upgrade_web_id`** is satisfied. Mapped ids use run state; unmapped ids (e.g. **`unlock_grid_expansion`**) are satisfied when their JSON **`prereqIds`** chain is satisfied (prototype does not sell every web node).
func prototype_upgrade_prereqs_satisfied(upgrade_web_id: String, state: Dictionary) -> bool:
	if not ok:
		return true
	var u := get_upgrade(upgrade_web_id)
	if u.is_empty():
		return true
	var pr = u.get("prereqIds", [])
	if typeof(pr) != TYPE_ARRAY or pr.is_empty():
		return true
	var memo := {}
	for pid in pr:
		if typeof(pid) != TYPE_STRING:
			continue
		if not _prototype_research_effective(String(pid), state, {}, memo):
			return false
	return true


func _prototype_research_effective(upgrade_id: String, state: Dictionary, stack: Dictionary, memo: Dictionary) -> bool:
	if memo.has(upgrade_id):
		return bool(memo[upgrade_id])
	if stack.get(upgrade_id, false):
		memo[upgrade_id] = false
		return false
	stack[upgrade_id] = true
	var result: bool
	if PROTOTYPE_UPGRADE_STATE_KEYS.has(upgrade_id):
		var k := String(PROTOTYPE_UPGRADE_STATE_KEYS[upgrade_id])
		result = bool(state.get(k, false))
	else:
		var u := get_upgrade(upgrade_id)
		if u.is_empty():
			result = true
		else:
			var pr = u.get("prereqIds", [])
			if typeof(pr) != TYPE_ARRAY or pr.is_empty():
				result = true
			else:
				result = true
				for pid in pr:
					if typeof(pid) != TYPE_STRING:
						continue
					if not _prototype_research_effective(String(pid), state, stack, memo):
						result = false
						break
	stack.erase(upgrade_id)
	memo[upgrade_id] = result
	return result


## Godot prototype maps to web **`command_center`**.
func prototype_command_center_max_hp(fallback := 1000.0) -> float:
	return read_building_float("command_center", "maxHp", fallback)


## Web: command center adds **`supplyCapAdd`** to the run supply **base**; depots add more in **`main._recompute_supply_cap()`**.
func prototype_command_center_supply_cap_add(fallback := 20) -> int:
	return maxi(0, read_building_int("command_center", "supplyCapAdd", fallback))


func prototype_command_center_power_gen_per_sec(fallback := 1.6) -> float:
	return maxf(0.0, read_building_float("command_center", "powerGenPerSec", fallback))


func prototype_command_center_credit_payout(fallback := 18) -> int:
	return maxi(0, read_building_int("command_center", "creditPayout", fallback))


## Web `updateResources` economy loop uses `creditIntervalSec` (min positive step).
func prototype_command_center_credit_interval_sec(fallback := 1.0) -> float:
	return maxf(0.05, read_building_float("command_center", "creditIntervalSec", fallback))


## Godot prototype “turret” maps to web **`auto_turret`** (`BuildingDef`).
func prototype_auto_turret_credit_cost(fallback := 100) -> int:
	return int(round(read_building_float("auto_turret", "creditCost", float(fallback))))


func prototype_auto_turret_supply_cost(fallback := 2) -> int:
	return maxi(0, read_building_int("auto_turret", "supplyCost", fallback))


func prototype_auto_turret_power_drain_per_sec(fallback := 1.6) -> float:
	return maxf(0.0, read_building_float("auto_turret", "powerDrainPerSec", fallback))


func prototype_auto_turret_range(fallback := 16.0) -> float:
	return read_building_float("auto_turret", "range", fallback)


func prototype_auto_turret_damage(fallback := 28.0) -> float:
	return read_building_float("auto_turret", "damage", fallback)


## Web `BaseDefenseGame`: shot interval `1 / max(0.04, fireRate)` with `fireRate` as shots/sec.
func prototype_auto_turret_cooldown_sec(fallback := 0.42) -> float:
	var fr := read_building_float("auto_turret", "fireRate", 0.0)
	if fr <= 0.0:
		return fallback
	return 1.0 / maxf(0.04, fr)


func prototype_auto_turret_footprint() -> Vector2i:
	return read_building_footprint("auto_turret", 1, 1)


## Web `updateResources`: `powerCap` = base + Σ `powerCapAdd` on alive buildings. Prototype: **RESET_RUN_POWER_CAP** + CC + turret/factory + **`nuclear_plant`** counts (usually 0).
func prototype_run_power_cap(
	turret_count: int,
	factory_business_count: int = 0,
	nuclear_plant_count: int = 0,
) -> int:
	var cap := RESET_RUN_POWER_CAP
	if not ok:
		return maxi(1, cap)
	cap += read_building_int("command_center", "powerCapAdd", 0)
	cap += read_building_int("auto_turret", "powerCapAdd", 0) * maxi(0, turret_count)
	cap += read_building_int("factory_business", "powerCapAdd", 0) * maxi(0, factory_business_count)
	cap += read_building_int("nuclear_plant", "powerCapAdd", 0) * maxi(0, nuclear_plant_count)
	return maxi(1, cap)


## Web **`factory_business`** economy building.
func prototype_factory_business_credit_cost(fallback := 160) -> int:
	return int(round(read_building_float("factory_business", "creditCost", float(fallback))))


func prototype_factory_business_supply_cost(fallback := 4) -> int:
	return maxi(0, read_building_int("factory_business", "supplyCost", fallback))


func prototype_factory_business_credit_payout(fallback := 8) -> int:
	return maxi(0, read_building_int("factory_business", "creditPayout", fallback))


func prototype_factory_business_credit_interval_sec(fallback := 1.0) -> float:
	return maxf(0.05, read_building_float("factory_business", "creditIntervalSec", fallback))


func prototype_factory_business_power_drain_per_sec(fallback := 0.6) -> float:
	return maxf(0.0, read_building_float("factory_business", "powerDrainPerSec", fallback))


func prototype_factory_business_footprint() -> Vector2i:
	return read_building_footprint("factory_business", 2, 2)


## Web **`supply_depot_s`** — raises global supply cap (`supplyCapAdd`).
func prototype_supply_depot_s_credit_cost(fallback := 200) -> int:
	return int(round(read_building_float("supply_depot_s", "creditCost", float(fallback))))


func prototype_supply_depot_s_supply_cap_add(fallback := 18) -> int:
	return maxi(0, read_building_int("supply_depot_s", "supplyCapAdd", fallback))


func prototype_supply_depot_s_supply_cost(fallback := 0) -> int:
	return maxi(0, read_building_int("supply_depot_s", "supplyCost", fallback))


func prototype_supply_depot_s_footprint() -> Vector2i:
	return read_building_footprint("supply_depot_s", 2, 2)


## Web **`supply_depot_l`** — larger depot, higher **`supplyCapAdd`** / cost.
func prototype_supply_depot_l_credit_cost(fallback := 300) -> int:
	return int(round(read_building_float("supply_depot_l", "creditCost", float(fallback))))


func prototype_supply_depot_l_supply_cap_add(fallback := 30) -> int:
	return maxi(0, read_building_int("supply_depot_l", "supplyCapAdd", fallback))


func prototype_supply_depot_l_supply_cost(fallback := 0) -> int:
	return maxi(0, read_building_int("supply_depot_l", "supplyCost", fallback))


func prototype_supply_depot_l_footprint() -> Vector2i:
	return read_building_footprint("supply_depot_l", 3, 3)


## Web **`nuclear_plant`**: large power gen; **`credits <= 0`** → no gen (handled in **`main._update_power_economy`**).
func prototype_nuclear_plant_credit_cost(fallback := 1200) -> int:
	return int(round(read_building_float("nuclear_plant", "creditCost", float(fallback))))


func prototype_nuclear_plant_power_gen_per_sec(fallback := 34.0) -> float:
	return maxf(0.0, read_building_float("nuclear_plant", "powerGenPerSec", fallback))


func prototype_nuclear_plant_supply_cost(fallback := 0) -> int:
	return maxi(0, read_building_int("nuclear_plant", "supplyCost", fallback))


func prototype_nuclear_plant_footprint() -> Vector2i:
	return read_building_footprint("nuclear_plant", 4, 4)
