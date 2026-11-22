# Original-ROM execution checks

The native game remains JavaScript. Mesen is used only as a local reference test runner, not shipped or embedded in the playable game.

On 22 November 2026, four controlled fixtures executed the supplied USA ROM in Mesen2 2.1.1:

| ROM routine | Calls | State words compared | Returned values compared | Result |
| --- | ---: | ---: | ---: | --- |
| CODE_03907E raw generator | 256 | 1792 | 0 | Match |
| CODE_039035 maximum119 | 256 | 1792 | 256 | Match |
| CODE_039035 maximum350 | 256 | 1792 | 256 | Match |
| CODE_039035 maximum4000 | 256 | 1792 | 256 | Match |

Each call checks all seven words at WRAM $0CCF..$0CDB against the native generator. Bounded fixtures also compare CPU A with the JavaScript quotient-scaling result. Assertions happen after the original subroutine returns. An assertion failure, wrong call count, timeout or runner error fails the test. The original ROM file is hash-checked and unchanged. A small call loop is injected into emulated WRAM; the routines themselves execute their original ROM bytes.

Fixture CPU state: native mode, direct page $1800, data/program bank3, stack $1EFF, status4, interrupts disabled. The seed comes from DATA_0390B7. CPU changes must be made from an instruction callback, not a frame callback during an in-flight CPU instruction. The helper routines need data bank3 to read their inline argument descriptors.

These checks establish the generator and bounded arithmetic for this fixture. They do **not** establish natural city startup state, full-game RNG call ordering, synchronized city ticks, original map/graphics/audio output or whole-game fidelity. Those remain open comparisons.

## Reproduce locally

Use a preconfigured Mesen2 installation and your own matching ROM. First-run configuration must be completed before headless testing. This project does not include the emulator executable or ROM.

```powershell
$env:MESEN_EXE='C:/path/to/Mesen.exe'
$env:SIMCITY_ROM='C:/path/to/SimCity (USA).sfc'
$env:REFERENCE_WORK='C:/path/to/local-reference-scratch'
node tools/reference-rng.mjs 256
node tools/reference-rng.mjs 256 119
node tools/reference-rng.mjs 256 350
node tools/reference-rng.mjs 256 4000
```

The runner generates Lua in the scratch folder. It uses no Lua filesystem/network permissions and exits with `emu.stop(code)`, as defined in [Mesen's Lua API](https://github.com/SourMesen/Mesen2/blob/master/UI/Debugger/Documentation/LuaDocumentation.json). Successful reports record ROM/emulator hashes, fixture state and comparison counts in the adjacent `reference-*.json` files. A failed run does not overwrite successful evidence. Ordinary Node tests also check the native generator against the successful256-call reference result.
`tools/reference-demand.mjs` now executes CODE_03894C against79 controlled fixtures in one reference process. It compares three Q8 ratios, three final demand words, total census units and prior-total copy (632 word comparisons). Cases cover empty/balanced cities, all difficulties, tax limits, negative/positive prior demand, suppression flags, forced maxima,64 deterministic mixed cases and two16-bit overflow cases. All matched. Inputs are injected into WRAM and routine entry is invoked from a RAM stub with the same CPU fixture described above; this does not validate natural city census/history initialization or scheduling. Reproduce with `node tools/reference-demand.mjs`; successful evidence is `reference-demand.json`.
`tools/reference-power.mjs` now invokes CODE_03AFB0 and CODE_03B152 for nine controlled120x100 maps. All13,500 bitmap bytes,108,000 map words,36 capacity/usage words and nine overload flags matched. Fixtures cover no plants, isolated coal, branching junctions, disconnected and connected mixed plants, coal/nuclear overload, marker preservation, nonconductive roads and the final scan-register plant case. The fixture injects the plant counts and row-major seed stack normally produced by the tile scan. It does not validate natural seed collection/timing or concurrent map edits. Reproduce with `node tools/reference-power.mjs`; evidence is `reference-power.json`.
`tools/reference-train.mjs` invokes CODE_00B260 for608 direction decisions (19 tile IDs, four incoming directions and eight menu-RNG seeds). Eight train-state words and two menu-RNG words per case match (6080 word comparisons). This comparison exposed and corrected the native menu RNG returning its first updated word instead of the second; CODE_00824F returns the latter. The fixture supplies tile-center positions and compares routing, not full frame scheduling/OAM composition. Reproduce with `node tools/reference-train.mjs`; evidence is `reference-train.json`.
`nShip navigation: node tools/reference-ship.mjs executes CODE_00B86D in the unmodified USA ROM, with 768 controlled direction/map/RNG fixtures. All 4608 compared state values (active flag, target direction, turn increment, turn phase, two RNG words) match src/rom-ship.js. Includes all eight headings, water, open drawbridges, straight road/rail crossings, conditional bridge lookahead, reverse and initialization failure. Fixture report: reference-ship.json. This does not verify normal frame scheduling, sprite placement, collision damage or full-game startup.
`nShip movement: node tools/reference-ship-motion.mjs executes CODE_00B759 for 64 fixtures spanning eight headings and initialization, aligned/unaligned motion, two turn phases, pause, modal block and edge exit. All 13 entity fields and two RNG words match per case (960 values). Report reference-ship-motion.json. Horn countdown/reload has native unit checks; actual horn sound and collision damage are not validated by these all-water reference fixtures.
`nCollision tile damage: node tools/reference-collision.mjs calls CODE_03A9C6 in the original ROM for 72 tile/seed cases. Compares 169 map words and two menu RNG words per case (12312 values), all match. Includes zone centers and airport burn pattern; report reference-collision.json. The five-point ship call order is source-derived and unit-tested; original audiovisual effect/Wright UI not validated.
`nCommercial/industrial local scores: node tools/reference-commercial.mjs runs original CODE_03A24B,039A0E,039A31 for70 center/coordinate/transport cases. All195 field words and two return values per case match (13790 values), including byte-wrap centers and the disabled-commercial A=0 branch. Field generation uses prior center as ordered by density CODE_039B83. Report reference-commercial.json. Native city-scan test demonstrates same injected random word grows a central commercial zone and rejects a distant one; no whole-city original-runtime growth comparison is claimed.
`nCity score: node tools/reference-evaluation.mjs executes CODE_03B708 for84 problem/funding/cap/demand/previous-score cases. All168 score/delta words match, including unsigned underflow and fire-service threshold4096 vs police1000. Report reference-evaluation.json. Problem-rating producers are source-derived with focused tests, not yet original-runtime whole-evaluation fixtures; approval/worst-problem vote RNG and assessed value remain unported.
`nAnnual polls: node tools/reference-polls.mjs executes03B627 vote sampling,03B5C8 ranking and03B824 approval in the original ROM.32 fixtures compare8 vote words,4 concern IDs,4 concern counts,2 approval words and7 final RNG words (800 values). All match. Covers zero/500/714/1000 score, no concerns, single concern, multiple/high concerns and two RNG seeds; report reference-polls.json.
`nSpecial facilities: reference-facilities.mjs runs039449 creation and0391DF/039207 repair/retirement across80 fixtures;1440 map/quota/RNG values match, including negative creation flags, blocked stamps, repair gates and retirement draws. Assessed value: reference-valuation.mjs runs03B4AA for44 counter sets, including group16bit wrap;88 result words match. Reports reference-facilities.json/reference-valuation.json. Natural facility repair-phase RAM0B9B and full live-scan/census ordering remain unverified.
`nPopulation/migration: reference-population.mjs executes038196 and annual03B562 for60 RCI/baseline cases.420 population/migration/category/baseline words match, including final-ASL carry into residential ADC,16-bit unit wrap, signed32-bit migration and annual baseline copy. Report reference-population.json. Native January integration captures prior displayed population before fresh map census; original natural whole-city display/census timing remains unverified.

Fire initiation reference: tools/reference-fire-start.mjs executes CODE_03BBB9/03BB6A and their actual CODE_03BC9F/039035 random-coordinate path against the supplied hash-verified ROM. 28 fixtures compare every map word, seven RNG words and fire counter, recorded in reference-fire-start.json. Both eligible and rejected tile classes, marker bits and two RNG seeds are covered. This validates controlled routine executions, not natural full-city event scheduling.
