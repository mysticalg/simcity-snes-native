# Civic graphics and lighting, v0.2.30

## Artwork

The remaining14 first-generation custom civic plots now resolve to selected photoreal assets: hospital, landfill, incinerator, fusion, school, college, university, bus stop, bus station, wind turbine, sewage pump, sewage treatment, recycling centre and refuse depot. Seven completed ImageGen masters from the private civic-art work are reused;12 new images supply the missing buildings, turbine base/rotor, landfill soil/waste and moving bus/refuse-truck graphics. The compact fire station also receives matching art. The hospital remains the existing released hospital; unreleased health/security definitions on feature/civic-expansion are preserved separately.

All masters remain in assets/realistic-civic with hashes and generation identifiers in manifest-v1.json. Runtime lossless WebP dimensions are at most252px. Original first-generation files remain preserved. Square plots retain square bases; college is2x1; the turbine retains a2x1 ground footprint with an intentional northward mast/rotor overhang. Costs, capacity, footprints and saved construction remain unchanged. Core R/C/I and original police still use the previously chosen original/realistic art paths.

Bus-stop rendering overlays only its shelter/curb strip, rotating for a vertical road, so it preserves visible road junctions and the actual underlying road word. Moving buses/refuse trucks use overhead vehicle art and keep their existing routes/accounting. The turbine has a separate rotor with a measured hub anchor; switching off stops rotation. Generic square highlights over arbitrary roof pixels are removed. Existing window-derived night lighting and selected soft machinery activity remain.

Landfill changes from bare prepared soil to rubbish in12 fill buckets, retaining shared-site boundaries. Adjacent cells have no internal fence. Ordinary views retain the existing whole-map cell cache. At zoom>1, only the visible rectangle receives a high-resolution cache; a4x bitmap for the whole megacity is never allocated. Fill changes and removed cells update cached cells. Graphics never change stored garbage or collection accounting.

## Lighting performance

WindowLights previously discarded all building entries whenever city.revision changed, rebuilding two canvases per building even when its mask, position and lighting phase were unchanged. It now revalidates entries by building identity, mask and footprint, preserving valid glows. Demolition, replacement, changed legacy footprints and removed powered buildings still invalidate correctly. The same canvas pair is also cleared and reused when the45-second lighting cycle changes. Civic metadata uses an indexed lookup instead of repeated array searches.

In the controlled180-civic local Chromium fixture,30 unchanged refreshes created10800 temporary canvases before and0 after. Median isolated draw time was20.4ms before and0.3ms after. Thirty changing lighting phases also created10800 before and0 after; median was35.3ms before and5.3ms after. Unchanged refresh, initial rendering, power filtering/restoration, legacy footprint changes and three lighting cycles compare pixel-for-pixel with the prior renderer. Raw measurements: window-cache-v0.2.30.json. These are local renderer/CPU measurements, not user-device display FPS; other simulation/FX bottlenecks remain possible.

## Verification

Node checks cover all active custom sprite paths,19 pinned asset masters/runtime files, footprint aspect ratios and metadata identity, alongside the existing simulation suite. Browser checks exercise the released city scene, actual shelter placement on a vertical road without changing the road word, photoreal moving refuse trucks, active bus routes, turbine animation/off state, landfill fill differences, a bounded close-up cache, night settings and session reload. Asset gallery and actual game screenshots are inspected privately in output/. Original ROM logic, full menu/audio parity, unreleased gameplay extensions and remaining native reference comparisons are not declared complete by this graphics release.
