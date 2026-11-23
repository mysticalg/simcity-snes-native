# Emergency-service footprints, v0.2.17

Player-requested Turbo extension: newly constructed police and fire stations
occupy 2x2 tiles. Police and fire headquarters retain their original 3x3 gift
footprints. Existing/scenario stations remain 3x3 when loaded; no city-map
migration deletes an old station's surrounding cells.

Compact station centers use unused custom IDs 977/978, aliasing the service
roles of original centers $0249/$0252. Original HQ IDs $0307/$0310 are retained.
Original 3x3 station tile compositions are cached and scaled into 16x16 pixels.
The existing optional realistic police art also uses the new footprint. No
replacement artwork is generated in this update.

Service seeding still uses CODE_03AAEB/03AB44 strength, funding and power
penalties, with double strength for headquarters. Compact stations check the
perimeter of their actual footprint for road/rail access; the original
CODE_03B26B search remains unchanged for native 3x3 stations. Stations still
cost $500 and receive the existing police/fire annual service funding rather
than a second custom-building upkeep charge. Inspection, on/off controls,
demolition, growth-transition rendering, underground rendering and collision
damage recognize the compact footprint.

Verification: 358 Node tests pass, including five new focused tests covering
construction/price/adjacency, all four road-access sides, service penalties and
funding, HQ gift gating/double strength, legacy save compatibility, demolition,
pipe preservation and bounded collision damage. Chromium's real mouse path
checks release-to-place blueprints, new station placement, noncenter inspection
of compact/legacy/HQ buildings, $100 upkeep, session reload, night/realistic
rendering and underground mode without page errors. Gameplay and blueprint
screenshots were inspected. Browser command:

```
node tools/check-emergency-footprints.mjs
```

This is a custom footprint change, not a claim of original-ROM parity. Full
port gaps remain documented in the main research/progress files, including
source scan census timing, original interface/global actor timing and mixed
SPC/DSP playback.
