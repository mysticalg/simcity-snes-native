# Parks, happiness and the treasury cap

Four requested Turbo amenities are available under Parks / gifts:

| Amenity | Size | Build / yearly upkeep | Radius | Maximum local land-value / happiness benefit |
|---|---:|---:|---:|---:|
| Pocket garden | 1×1 | $25 / $5 | 6 | +8 / +6 |
| Neighbourhood park | 2×2 | $100 / $20 | 10 | +16 / +10 |
| City park | 4×4 | $750 / $80 | 16 | +28 / +18 |
| Civic plaza | 3×3 | $500 / $60 | 12 | +22 / +14 |

Road access is required; electricity/water are not. Benefits taper with distance from plot edges. Combined benefits cap at +60 land value and +30 happiness. Resident-weighted park happiness increases residential demand during actual city steps. City happiness combines these benefits with local crime/pollution penalties; it is a new metric, distinct from the original annual approval survey. Inspector bars show benefits, happiness, radius, operating status and costs; Civic Services reports city happiness. Generated art uses preserved alpha masters and small runtime textures.

The unboosted ROM land-value plane is preserved separately. Refreshes never accumulate the bonus, and save/reload applies it once. Switching off/removing a park removes its effects. Original cities without custom parks retain original land-value calculations.

The treasury now caps at **$1,000,000,000,000** through a central funds accessor. Income and restored balances clamp to the cap; loans that would cross it are refused. The previous annual $999,999 clamp is removed. Negative balances remain representable, and infinite-money spending stays separate. These are player-requested Turbo extensions, not ROM finance rules.

Verified: 394 Node checks; actual browser placement, costs, benefit bars, funds-to-budget click, above-cap save import, reload and 390-pixel mobile HUD fit. Outstanding airport/regional-economy scope and earlier fidelity work remain recorded in `expansion-backlog.md`.
