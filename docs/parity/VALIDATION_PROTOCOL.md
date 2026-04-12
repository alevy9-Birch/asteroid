# Parity Validation Protocol

This is the required validation process for each parity item.

## Evidence Types

- **Automated check**: deterministic script/test output
- **Scenario replay**: repeatable runtime scenario with expected outcomes
- **Manual checklist**: explicit pass/fail user-visible behavior checks

At least one evidence type is required per parity item before it can be marked `[x]`.

## Validation Gates

## Gate 1 - Module Completion

- [ ] Module compiles and loads cleanly
- [ ] No linter/runtime errors in affected files
- [ ] Public API documented in module header

## Gate 2 - Behavior Match

- [ ] Item mapped to source reference in `PARITY_TRACKER.md`
- [ ] Expected behavior explicitly written
- [ ] Test/checklist result attached
- [ ] Status updated (`[ ]` -> `[-]` or `[x]`)

## Gate 3 - Regression Safety

- [ ] Existing green parity items still pass quick regression sweep
- [ ] No unrelated gameplay regression introduced

## Gate 4 - Commit Discipline

- [ ] Commit scope limited to one subsystem or bounded slice
- [ ] Commit message includes parity intent
- [ ] Push completed

## Test Scenario Templates

## Input/Cursor Template

- [ ] Open menu, pause, game-over overlays
- [ ] Verify hidden OS cursor
- [ ] Verify virtual cursor hit targets
- [ ] Verify fullscreen/pointer lock recovery cases

## Gameplay Loop Template

- [ ] Start run
- [ ] Start wave
- [ ] Place/sell buildings under expected rules
- [ ] Observe combat and asteroid impacts
- [ ] Trigger defeat and game-over path

## Upgrade/Economy Template

- [ ] Buy/refund upgrades
- [ ] Verify unlock dependencies
- [ ] Verify resource deltas and caps
- [ ] Verify score and persistence behavior

## Status Rules

- `[ ] Missing`: no parity implementation yet
- `[-] Partial`: implementation exists, but differs in behavior/data/UX
- `[x] Match`: validated equivalent behavior to web source

## Stop-Ship Criteria

Do not declare parity success if any are true:
- [ ] Any critical-path item remains `[ ]` or `[-]`
- [ ] No evidence attached for newly marked `[x]`
- [ ] Core loop regressions are unresolved
