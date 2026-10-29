# Archived turn/lane engine tests

These 33 tests exercise `resolveRound` and the retired lane engine, not the authoritative `stepRealtime` server. They are retained unchanged apart from import paths, and remain runnable with `npm run test:legacy`. Latest run: 18 passed, 15 failed due to assumptions from earlier rules/configuration. They are not counted as passing current gameplay tests. Current real-time behavior, collision clearance, run-off, respawn, finish timing and steering are checked by `npm test`.
