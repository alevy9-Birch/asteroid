extends RefCounted
class_name ScoreSystem

const SAVE_PATH := "user://migration_score.save"

func compute_run_score(wave: int, asteroids_killed: int, money_earned: int, money_spent: int) -> int:
	var score := int(wave * 100 + asteroids_killed * 18 + money_earned * 0.7 - money_spent * 0.25)
	return max(0, score)

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
