# SimCity SNES native browser reconstruction

This project reverse engineers the USA release of SimCity for Super Nintendo and implements a native JavaScript city simulation. It does not run the original ROM in an emulator.

## Play

Open the [GitHub Pages version](https://mysticalg.github.io/simcity-snes-native/), or serve this directory locally with `python scripts/serve.py --port 5173` and open `http://localhost:5173`. The bundled server supplies the correct JavaScript MIME type on Windows.

Latest Turbo update: **v0.2.48** adds saved scenario completion records, the original first-six bonus award, correct city-selection badges and the original success/failure/bonus message text. Records travel with downloaded city saves. [Original-worker comparisons and remaining presentation limits](research/scenario-endings-v0.2.48.md).

v0.2.47 batches independent photoreal window glows while preserving exact tested pixels and overlap order. The controlled heavy-city comparison shows a modest CPU improvement; larger real-time frame spikes remain. [Rendering evidence and limits](research/photo-glow-batches-v0.2.47.md).

v0.2.46 adds the original Practice lessons and 30,000-resident review, with compact advisor notices, retained lesson text in Information, and saved progress. [Original-worker comparisons and limits](research/practice-v0.2.46.md).

v0.2.45 reconstructs staged scenario reminders and final review, fixes January/budget ordering, and records each decision once. City Information and completion dialogs now show all seven scenarios' deadlines and requirements, preserving the values used at the final review. [Original-worker comparisons and limits](research/scenario-lifecycle-v0.2.45.md).

v0.2.44 added City Graphs: original monthly/January records for RCI occupancy, crime, pollution and finances, with 10-year/120-year views, touch/keyboard readouts and saved history. The newest monthly records also feed zone demand. [Original-worker comparisons and limits](research/city-graphs-v0.2.44.md).

v0.2.43 shared civic window-glow pages, retaining individual windows and their fade while reducing separate bloom canvases and blur operations. [Pixel checks and rendering measurements](research/shared-window-glows-v0.2.43.md).

v0.2.42 added the original Capital, Metropolis and Megalopolis music, with shared tempo/volume fades and complete order cycles. All six city themes now follow promotion stage. [Source evidence, playback checks and limits](research/later-city-music-v0.2.42.md).

v0.2.41 batched terrain drawing and reused native atlas pixels, reducing heavy-city long-frame CPU cost while retaining exact tested pixels. [Rendering measurements](research/render-batching-v0.2.41.md).

v0.2.40 fixed large-city/regional demand, facility quota rollover and megacity evaluation sampling. [Demand evidence](research/megacity-demand-v0.2.40.md).

v0.2.39 fixed dense megacity population and repaired old wrapped census saves. [Population evidence](research/megacity-census-v0.2.39.md).

v0.2.38 fixed dense grids losing power despite ample generation. [Power evidence](research/power-work-stack-v0.2.38.md).

v0.2.37 cached shared photoreal building layers while preserving exact pixel output. [Rendering measurements](research/photo-cache-v0.2.37.md).

v0.2.36 added original Town and City music and corrected articulation, fades and note releases against the executed SPC driver. [Audio evidence](research/city-music-v0.2.36.md).

Recent releases also added four variants each of parks, gardens and plazas with different footprints and coverage; refreshed custom civic art; health facilities and road-bound ambulances; original numbered maps 000–999; and cached pollution/lighting rendering for heavier cities. Full original-game parity, menu/event music and full DSP audio remain in progress.
