extends RefCounted
class_name ScoreSystem

const SAVE_PATH := "user://migration_score.save"


## Web `highScores.ts` `computeRunScore` (difficulty multipliers + `powerProduced` term).
func difficulty_score_mul(difficulty: String) -> float:
	match difficulty:
		"easy":
			return 0.72
		"medium":
			return 0.86
		"hard":
			return 1.0
		"brutal":
			return 1.22
		"deadly":
			return 1.45
		_:
			return 1.0


func compute_run_score(
	wave: int,
	asteroids_killed: int,
	money_earned: int,
	money_spent: int,
	power_produced: float,
	difficulty: String,
) -> int:
	var diff_mul := difficulty_score_mul(difficulty)
	var raw := (
		float(wave) * 180.0
		+ float(asteroids_killed) * 12.0
		+ float(money_earned) * 0.04
		+ power_produced * 0.08
		- float(money_spent) * 0.02
	)
	return maxi(0, int(round(raw * diff_mul)))

func load_best_score() -> int:
	if not FileAccess.file_exists(SAVE_PATH):
		return 0
	var f := FileAccess.open(SAVE_PATH, FileAccess.READ)
	if f == null:
		return 0
	return int(f.get_32())

func save_best_score(best_score: int) -> void:
	var f := FileAccess.open(SAVE_PATH, FileAccess.WRITE)
	if f == null:
		return
	f.store_32(best_score)
