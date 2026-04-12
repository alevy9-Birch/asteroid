extends Control
class_name WaveTimerRing

## Web `App.tsx` wave timer SVG: radius 22, stroke 4, viewBox ~60×60.

const RADIUS := 22.0
const STROKE := 4.0

var _progress: float = 0.0


func set_progress(p: float) -> void:
	var np := clampf(p, 0.0, 1.0)
	if is_equal_approx(np, _progress):
		return
	_progress = np
	queue_redraw()


func _draw() -> void:
	var c := size * 0.5
	var track := Color(0.58, 0.65, 0.71, 0.22)
	var accent := Color(0.13, 0.83, 0.93, 0.95)
	draw_arc(c, RADIUS, 0.0, TAU, 72, track, STROKE, true)
	if _progress <= 0.0001:
		return
	var start := -PI * 0.5
	var end := start + _progress * TAU
	var pts := clampi(8 + int(_progress * 64), 8, 72)
	draw_arc(c, RADIUS, start, end, pts, accent, STROKE, true)


func _get_minimum_size() -> Vector2:
	var d := RADIUS * 2.0 + 16.0
	return Vector2(d, d)
