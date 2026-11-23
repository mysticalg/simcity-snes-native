# Free Megacity requirement and dimension audit

Player requested a new free-play map with four times Free City's area. Working interpretation:240×200 tiles (48000 cells), retaining original tile size and normal120×100 scenarios. This is not implemented or selectable yet.

Authoritative next work: make city dimensions instance-owned; retain default120×100 ROM comparisons; size map, power, crime, land-value, density, service, transport, pipe, sewage, pollution, employment and region state from dimensions. Camera, panning, blueprint validation, inspector, saves and automatic session restore must use the same dimensions. Megacity must allow building and simulation throughout all four quadrants, without a cosmetic upscale or invisible boundary at x120/y100. Generate/expand genuine free-play terrain and verify far-corner placement, connected utilities/commutes, save/reload and browser performance before publishing.

Initial audit found16 source files containing explicit12000-cell or120-stride expressions, plus exported W/H consumers and original worker defaults. Preserve original ROM worker defaults and source-reference tests when introducing dimension arguments. Existing region cells remain original-sized unless deliberately extended; a megacity cannot silently masquerade as a normal region slot.
