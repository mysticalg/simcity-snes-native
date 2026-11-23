# Gift building maintenance and Mayor upgrades

`CODE_03C0FA` increments the16-bit promotion flag at `$0CC9`. This is retained in `giftMilestones.mayorUpgradePending`, using the existing save/session schema. Overflow from65535 to0 is intentional.

The flagged gift worker `CODE_03AE25` first calls `CODE_03AEA1` with side3. On base steps divisible by8 it replaces only zero low10-bit tile IDs in the footprint, deriving each complete word from the center word and source offset. Occupied cells, fire, rubble and radiation survive this repair. `rom-maintenance.js` also expresses the source's4x4 and6x6 tables; this release wires the helper to gift and existing hospital/school maintenance only. It does not claim that all utility workers have been ported.

If the promotion flag is nonzero and the center is `$02BF`, `$02C8` or `$02D1`, `CODE_03AE47` passes center+5 to the existing `CODE_039940` footprint writer. This advances to `$02C8`, `$02D1` or `$02DA`. It then clears the complete flag word, even when redraw rejects an obstructed footprint. A flag of4 performs one upgrade, not four; the first eligible house in scan order consumes it. The final `$02DA` house and other gifts leave the flag intact. Headquarters use the separate station workers.

The normal tile scanner now calls this worker at the original gift-center visit, after its census visit and before proceeding to later cells. No monthly full-map postprocessing pass is added. The native gift art and inline gift inventory remain in use. Custom civic IDs do not enter this original gift path.

## Evidence

- `reference-gifts.json`:192 original-ROM dispatch calls, message ID and21 progress fields, including the pending promotion word and wraparound.
- `reference-gift-workers.json`:1440 original `CODE_03AE25` calls covering15 center IDs, four center flag combinations, pending words0/1/4/65535, two maintenance phases and intact/blank/fire-damaged footprints. Every one of the nine map words, remaining flag, native income and bank count matches. ROM and Mesen executable hashes are pinned in the report.
- `reference-scan-census.json`:84 full original120x100 scans, including four new gift layouts with three RNG seeds and both demand extremes. Pre-worker RCI census, counts, population, RNG state, all12000 final map words, empty-land/park/developed/bank counters and pending promotion flag match. This checks the effects of repairs on later visits in the same scan.
- Node checks replay captures and exercise actual city promotion/scan/save/reload, blocked redraw consumption, marker preservation and one-shot processing. Browser checks load a city through the real file UI, upgrade and repair while paused, then verify persisted map and flag after page refresh; console/network errors are checked and screenshots inspected.

These are controlled source/runtime comparisons. They do not establish complete natural calendar/actor/UI parity, full SPC/DSP equivalence or the unpublished health/security/economy extensions. The source nuclear worker's bounded RNG call for maxima above32766 remains a separate investigation; this release does not substitute a guessed nuclear probability.
