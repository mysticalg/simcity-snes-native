# SimCity SNES native browser reconstruction

This project reverse engineers the USA release of SimCity for Super Nintendo and implements a native JavaScript city simulation. It does not run the original ROM in an emulator.

## Play

Open the [GitHub Pages version](https://mysticalg.github.io/simcity-snes-native/) after deployment, or serve this directory locally with `python -m http.server 5173` and open `http://localhost:5173`.

Latest Turbo update: **v0.2.30** replaces the14 remaining older civic plots with matching photoreal art, improves vehicles/landfills and avoids repeated night-light canvas allocation. [Evidence and limits](research/civic-art-v0.2.30.md).
