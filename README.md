# SimCity SNES native browser reconstruction

This project reverse engineers the USA release of SimCity for Super Nintendo and implements a native JavaScript city simulation. It does not run the original ROM in an emulator.

## Play

Open the [GitHub Pages version](https://mysticalg.github.io/simcity-snes-native/) after deployment, or serve this directory locally with `python -m http.server 5173` and open `http://localhost:5173`.

Latest Turbo update: **v0.2.36** adds the original Town and City themes, corrects articulation, fade and note-release timing against the executed SPC driver, and verifies emitted stereo PCM and separate music/SFX controls. [Evidence and limits](research/city-music-v0.2.36.md).

Recent releases also added four variants each of parks, gardens and plazas with different footprints and coverage; refreshed custom civic art; health facilities and road-bound ambulances; original numbered maps 000–999; and cached pollution/lighting rendering for heavier cities. Full original-game parity and later music themes remain in progress.
