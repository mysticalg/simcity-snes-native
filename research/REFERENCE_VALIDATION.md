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
