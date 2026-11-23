# Water and solar expansion

Player-requested Turbo systems, with explicit game balance:

| Facility | Footprint | Cost / annual upkeep | Function |
|---|---:|---:|---|
| Water pump | 2×2 | $500 / $100 | 5,000 water/month |
| Heavy water pump | 3×3 | $1,500 / $250 | 15,000 water/month |
| Water tower | 1×2 | $1,000 / $50 | Stores 20,000 water; charges/releases up to 5,000/month |
| Solar array | 2×2 | $5,000 / $100 | 1,000 power capacity |

Both pumps require electricity, connected pipes and water next to any edge. Towers need electricity and connected pipes, with no shoreline requirement. They start empty, fill only from surplus pumping, and release finite reserves during shortages. Inspection shows storage and previous monthly inflow/outflow. Preview/refresh never changes storage; save/reload retains it. Demolition/replacement discards the removed tank's reserve. Existing pump saves retain their 3×3 legacy footprint rather than deleting occupied cells.

Heavy pumps and solar arrays participate in regional water/power generation. Tower reserves are local, avoiding repeated remote exports from an unloaded city. Solar output is constant; day/night and clouds remain visual rather than changing generation.

Built-in ImageGen produced tower, heavy pump and solar masters; the standard pump uses the preserved earlier ImageGen master. Alpha PNG masters and SHA-256 receipts are in `assets/utility-expansion/manifest-v1.json`; runtime lossless WebP images are at most 252 pixels on the long edge. No full-resolution images are decoded during normal gameplay.

Verification: 385 Node checks, including every shoreline orientation, exact triple output, solar on/off and regional generation, finite tank charging/discharge, atomic replacement and legacy save layouts. Real browser checks exercise mouse placement, correct construction charges, underground connectors, storage meters, actual power/supply and session reload. Screenshots inspected; no page errors.

Pending user requests: municipal airport for light planes/private jets; international airport 24×18 with cargo/super-jumbo aircraft; military base/fighters/industrial benefit; multiple park/plaza footprints with land-value/happiness benefits. Earlier private health/security/art and full original-game fidelity work also remain incomplete.
