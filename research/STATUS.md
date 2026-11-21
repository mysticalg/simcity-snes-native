# Reverse engineering status

ROM identity is verified against the USA hash in the reference disassembly. The LoROM header declares `SIMCITY`, North America, 512 KiB ROM, SRAM, and 1991 release. The archive copy was SHA-256 checked against `E:\Downloads\SimCity.zip` before extraction.

## Implemented from observed assembly/data

- LC_LZ5 decompressor translated from `CODE_0090DD..00926D`.
- Scenario map loading translated from `CODE_03D15F..03D254`: input map RLE, overlapping back-reference stream, then 3×3 expansion of negative marker words into multi-tile sprites.
- SNES 4bpp tile decoding and palette conversion; the city-screen table lookups in `CODE_01C7ED` and `CODE_01C7F6` are retained as ROM data.
- 120×100 map and adjacency/network structure match the RAM layout and `CODE_03D283` city scan. Connectivity bit masks are inspired by `DATA_018020` and its directional connection code.
- `CODE_00824F` additive RNG, the starting-year table, and `$64` annual station cost are translated from the USA source.
- BRR decoder uses the SNES sample filter equations; 25 extracted samples are retained as BRR and PCM WAV.

## Still to do

- Compare initial title/menu/map-select/simulation screens against actual ROM output. Recreate screen composition using the extracted layers, tilemaps, palettes, and sprite sheets.
- Port the actual original mapgen (`CODE_03D283` and related routines), player input/build state machine, special building placement rules, and tool-selection UI.
- Translate original monthly RCI/demand, zone valuation/growth, service radii and funding, population scoring, year budgets, bond/loan interest and payments, gifts, messages, stadium state, and save SRAM.
- Partial finance translation: the transport funding request uses the ROM's road/rail tile counts, difficulty Q8 factors, and $9,999 cap (`CODE_038E39`, `DATA_038FE8`). The yearly average tax rate now follows the 48-step accumulator (`CODE_038016`, divided by `$0030` in `CODE_038DF1`). The gross-revenue formula, exact land-value input, appropriations, and loan accounting remain provisional or untranslated.
- Residential branch slice: `src/rom-growth.js` implements `CODE_0399D2`'s byte-difference scale/cap (`×32`, cap 6000, then −3000) and `CODE_03937A`'s `$0B87` sign fallback, regular-tile one-in-eight gate, `$0084` bypass, signed comparisons at −350/+350, and 16-bit overflow/sign tests against `$670C` with injected random words. `City.updateResidentialTile` mutates the map only on a returned `grow` or `decline` action. Five deterministic checks cover gate pass/fail, score/fallback arithmetic, both threshold paths/boundaries, and conditional map mutation. This ports the branch mechanics only: the city currently supplies provisional land-value/demand fields, the pre-gate `$23` random population/relocation search is missing, `$0084` adjacent-home counts and actual growth/decay footprint routines remain approximate, and the `$0CCD..$0CDB` PRNG startup/sequence is unresolved. The exact browser random stream is not claimed equivalent.
- Demand accumulator slice: `src/rom-demand.js` ports the final `CODE_03894C` accumulation with every signed word in `DATA_038BA1`, the 0–20 effective-tax cap, subtraction of `$0258`, addition of the prior accumulator, and the residential ±$07D0 / commercial-industrial ±$05DC clamps. The special positive-suppression and force-maximum inputs are modeled and tested, but the city has not yet tied them to source `$0BB3/$0BB5/$0BB7`/`$0425` conditions. `City.tick` now applies this exact tail to the approximate generated demand. The upstream fixed-point ratio calculations and source planes still need porting, so the end-to-end RCI demand remains provisional.
- Port disaster generation, progression and scenario timers/conditions for all nine scenarios; verify against deterministic traces from the USA ROM.
- Decode and play original SPC music/SFX. SPC engine and stream data are extracted; full SPC700 emulation and DSP sequence playback have not been implemented.
- Correct the known visual mapping issue in the preliminary city atlas: tile palette selection and layering are partly approximated. Atlas is useful for identifying original art, but is not a verified frame match.
- Implement and verify all menus, dialogs, scale map, graphs, reports, loans, save slots, gifts, and game over transitions.
- Browser input, rendering, and full progression still require verification against screenshots/state from the supplied ROM.

## Fidelity accounting

`src/simulation.js` labels the model as provisional. Several visible features exist in the playable build, but are not asserted to be original-equivalent until traced and compared. A browser milestone or successful deployment does not constitute completion of the full port.

Follow-up: corrected residential population lookup from `CODE_03842F` and added 5 passing Node tests for map assets, population band thresholds, save/restore and RNG determinism, budget shape/tax range, and corrupt-save rejection. This does not verify total-city population or growth equivalence.

Population census is now source-derived: `CODE_038297` scan with `DATA_0384EB` bit-0 filtering accumulates per-tile residential/commercial/industrial counters; `CODE_038196` computes city population as `20 × (8 × (industrial + commercial) + residential)`. Scenario map census estimates are now 65,440–133,440 vs configured starts around 65k–152k. Seven focused Node checks pass. Values remain pending comparison against original runtime behavior.
