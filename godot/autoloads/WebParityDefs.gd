extends Node

## Runtime mirror of `godot/data/parity_web_defs.json` (from `scripts/parity/extract_web_defs.mjs`).
## Full building/upgrade dictionaries are preserved for forward-compatible fields.

const DEFS_PATH := "res://data/parity_web_defs.json"

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


func balance_var_f(key: String, default := 1.0) -> float:
	var v = balance_vars.get(key, default)
	if typeof(v) == TYPE_INT or typeof(v) == TYPE_FLOAT:
		return float(v)
	return default
