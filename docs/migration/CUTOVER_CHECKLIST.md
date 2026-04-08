# Godot Cutover Checklist

Use this checklist before declaring Godot as primary runtime.

## Product Readiness

- [ ] All critical gameplay mechanics from TS are ported
- [ ] Commander-specific content parity complete
- [ ] Research tree parity complete
- [ ] Economy/balance values validated against design targets

## Technical Readiness

- [ ] 3D scene/camera parity implemented (if required by product direction)
- [ ] Runtime performance acceptable on target hardware
- [ ] Save/load and high-score persistence validated
- [ ] Input/cursor/fullscreen behavior validated across environments

## QA and Regression

- [ ] Feature parity checklist fully green
- [ ] Known-differences list reduced to intentionally accepted items
- [ ] Manual regression run documented
- [ ] Crash/critical bug sweep completed

## Release Operations

- [ ] Godot run/build docs updated
- [ ] Team sign-off on migration branch
- [ ] TS branch tagged as legacy reference
- [ ] Final go/no-go decision recorded
