# SimCity SNES native browser reconstruction

This project reverse engineers the USA release of SimCity for Super Nintendo and implements a native JavaScript city simulation. It does not run the original ROM in an emulator.

## Play

Open the [GitHub Pages version](https://mysticalg.github.io/simcity-snes-native/) after deployment, or serve this directory locally with `python -m http.server 5173` and open `http://localhost:5173`.

Latest Turbo update: **v0.2.37** reduces repeated photoreal building drawing in dense cities while preserving growth, lighting and pixel output. The developed-city test median frame CPU cost changed from 40.7 ms to 13.7 ms in the fully powered night/rain fixture. [Measurements and limits](research/photo-cache-v0.2.37.md).

v0.2.36 added original Town and City music and corrected articulation, fades and note releases against the executed SPC driver. [Audio evidence](research/city-music-v0.2.36.md).

Recent releases also added four variants each of parks, gardens and plazas with different footprints and coverage; refreshed custom civic art; health facilities and road-bound ambulances; original numbered maps 000–999; and cached pollution/lighting rendering for heavier cities. Full original-game parity and later music themes remain in progress.
