# SimCity SNES native browser reconstruction

This project reverse engineers the USA release of SimCity for Super Nintendo and implements a native JavaScript city simulation. It does not run the original ROM in an emulator.

## Play

Open the [GitHub Pages version](https://mysticalg.github.io/simcity-snes-native/) after deployment, or serve this directory locally with `python -m http.server 5173` and open `http://localhost:5173`.

Latest Turbo update: **v0.2.26** fixes realistic buildings and water disappearing when weather effects are switched off. The two options now work independently. [Verification notes](research/independent-art-v0.2.26.md).

## Current coverage

- Verified input ROM: USA v1.0, 512 KiB, MD5 `23715fc7ef700b3999384d5be20f4db5`.
- Extracted and decoded all 35 graphics blocks, 50 tilemap blocks, palette tables, nine maps, all 25 BRR sound samples, music streams, and the SPC700 audio engine.
- Implemented original map decompression, the SNES 4bpp city atlas, ROM tile lookup tables, the 120×100 map canvas, scenario selection, construction, road connections, power propagation, city reports, budget controls, saving/loading, and disaster interactions.
- Source assembly and asset maps are retained under `research/disassembly/` and extraction/decoding scripts under `tools/`.

## Known gaps

This is a playable reverse-engineering milestone, **not a complete or faithful port yet**. City RCI calculations, zone evolution, service coverage, annual finance, special buildings, gifts, disasters, and all timed scenario objectives remain partly approximated. Menu and UI artwork is extracted but not yet drawn as the original composited SNES screens. Character messages, controller behavior, sound playback and event timing still need implementation. See `research/STATUS.md` and `progress.md` for the current audit.

The original ROM remains in the user's Downloads folder. The project stores decoded assets and a local backup under `work/original/`; it does not publish the ROM.

## Run the tools

Python 3 and Pillow are used for ROM research and graphics previews. `python tools/extract.py` reads the preserved local ROM backup at the workspace-relative path noted in that script. `python tools/decode_graphics.py` rebuilds the PNG atlases. The browser app has no runtime dependencies.

## Reference

Asset boundaries and assembly analysis use Yoshifanatic1's [SimCity SNES Disassembly](https://github.com/Yoshifanatic1/SimCity-SNES-Disassembly), commit `a6cc787f80c7d05719b3ab175be8159a5e606731`, licensed GPL-3.0. See `research/disassembly/LICENSE`.
