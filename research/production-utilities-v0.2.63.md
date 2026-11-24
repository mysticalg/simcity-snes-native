# Sim City Turbo v0.2.63: production and stronger utilities

The requested mining/factory slice is integrated with the existing city inventory and regional depot trade. These are custom Turbo systems, not cartridge routines. Broader original-game reconstruction and fax/audio work remain paused.

## Industry

Industry tools now offer oil extraction (3x3, 240/month), metal mining (3x3, 300), gold (2x2, 40), diamonds (2x2, 20), uranium (3x3, 60), and a configurable manufacturing factory (4x4, 40 batches/month). Every facility has construction/upkeep costs, enable controls, output meters and connection explanations. Mines require an undepleted matching deposit beneath the plot, electricity and an adjacent road/rail path to an operating freight depot. Factories require the same infrastructure and 1000 water/month if the city's water system is enabled. Factory inputs and output stock are real inventory, with finite batch and storage limits. Sites use the existing industrial/warehouse art with mode labels and animated machinery; bespoke new building masters are not included.

The Resources overlay shows oil brown, metals grey, gold yellow, diamonds cyan and uranium green. Selecting an extraction tool also displays deposits while the construction tools stay available. This mode explicitly disables the plain-tile raster shortcut; previously that shortcut ignored overlay colours. A real canvas-pixel assertion verifies that the overlay changes rendered pixels.

Each city saves a stable geological seed. Newly settled region slots use the region identity and slot for distinct geology. Renaming, construction, save/reload and demolition cannot reroll deposits. Only land deposits are extractable; some cities lack particular precious resources. Mining decrements saved per-cell reserves exactly. Exhausted deposits remain exhausted even after city demolition/restart. Ordinary saves and region exports include seed and depletion.

Factories support the six existing abstract game recipes: plastics, pharmaceuticals, fertilizers, components, contraband and weapons. These are inventory recipes, not real manufacturing processes. A month runs extraction first, factories next (deterministic site order), and trade last. Mining output can feed a factory that month. Newly imported inputs become available to production next month. Missing inputs, disabled facilities, shortages, exhausted deposits and full output storage prevent or limit production without losing material. Successful production adds bounded local air pollution; no inputs are conjured from ambient industrial zones.

Inspect a factory to choose its product. Import / Export → Mining & Factories opens all facility meters. Configure export orders above the desired stock reserve, and matching import orders in the receiving city. Both cities must allow goods sharing and connect road/rail depots at the border. Existing depots continue to enforce stock, price, cash, route and throughput limits. Only the currently played city produces; neighboring cities trade their saved inventory without running their simulation. Monthly production and trade guards prevent same-month replay after reload. Inventories are pooled citywide; individual commodity delivery trucks, factory worker attendance and resource fuel consumption in power plants are not part of this slice.

## 4x utility capacity

Water pump: 5000 → 20000/month. Heavy water pump: 15000 → 60000. Sewage pump: 8000 → 32000. Sewage treatment: 20000 → 80000. Existing plots update automatically; footprints, costs and upkeep are retained. Towers retain their finite storage/release limits. Actual water allocation, regional generation, shortage advice, sewage collection/outfall/treatment and inspection meters use the upgraded capacities. Sewage no longer repeats hard-coded old limits independently of facility definitions.

## Verification

626 Node checks pass. Eleven new production checks cover every raw resource and recipe; exact input consumption; same-month guards; real monthly simulation calls; seed persistence and city restart; finite exhaustion; wrong-site rejection; storage headroom; depot/power/water requirements; upkeep; preview purity; and production → export → recipient manufacturing. Existing water/sewage tests now exercise genuinely overloaded upgraded networks rather than their old lower-capacity thresholds.

Actual Chromium mouse workflow: reject a metal mine on an oil-only deposit without spending; release a valid oil blueprint for $4000; produce 240 oil and 160 plastics; export 40 oil plus 160 plastics to a second city; change and reload a factory recipe; shut down and reload the mine; load the recipient and manufacture 40 pharmaceuticals using 40 oil and 20 plastics; save/reload stock; settle a third city with distinct geology. Browser errors: none. Actual utility inspections show 20000/60000/32000/80000 capacities; three sewage pumps and one treatment plant process 80000 from 120000 backlog, preserving 40000. Resource-overlay pixels change from [189,172,123] to [125,102,78] at the tested oil cell. Feature, mobile and required smoke-client screenshots were inspected. Prior regional/traffic/health and pause/drag-advisor regressions pass.

Reproduce with Playwright installed, from the repository root:

- `CHROMIUM_EXECUTABLE=<browser path> node scripts/verify-industry-browser.mjs <base URL>`
- `CHROMIUM_EXECUTABLE=<browser path> node scripts/verify-utility-capacity-browser.mjs <base URL>`

These probes create isolated synthetic browser cities. Private output remains under the untracked output directory.
