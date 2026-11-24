# Sim City Turbo v0.2.62

This release addresses the requested animation speed, independent traffic option, city sharing controls, missing import/export depots, compact tools and stronger health care. These are Turbo extensions and balance changes.

## Traffic and controls

World frames already scaled by 1/2/4/8/16. Cars previously clamped elapsed rendering time to one second and could lose movement when fast simulation outpaced drawing. Road cars now integrate fixed world frames, retaining the existing vehicle appearance, deterministic turns and congestion-dependent speed. Visual settings has independent weather/lighting, realistic road traffic, and realistic buildings/water switches. Traffic-only rendering skips weather entirely. Turning cars off restores original traffic marks. Session refresh saves all three switches. Paused actors remain frozen.

Desktop category padding drops to 4px/3px and tool padding to 3px/4px, with 34px default tool rows. Compact depot labels retain full accessible names. Mobile keeps readable labels and minimum 38/40px touch targets.

## City sharing

Each loaded city's Regions screen has saved switches for RCI/commuting, electricity, water, health/waste services and depot goods. Existing saves default to sharing enabled. Both participating cities must allow the exchange. Roads/rails connect at matching border positions; power and water use their physical networks. Demand uses saved neighbors' workers/jobs and vacancies. Neighbors do not run their simulation in the background. Settings, ordinary city saves, region backups and session refresh retain policy choices.

## Depots and trade

The missing published depot system is implemented under Trade: road 3x2 (600 units/month), rail 4x2 (1600), sea 4x3 (4000), air 3x3 (1200). Depots have build costs, upkeep, power/route requirements, enable controls, inspection and actual last-month throughput meters. Warehouse artwork currently reuses the collection-depot sprite with mode-specific cargo markings; it is not four new bespoke image assets.

Road/rail trading requires operating depots attached to the same joined transport component. Isolated depots cannot inflate a connected route's throughput. Sea depots require adjacent road and water; air depots require adjacent road and a genuinely operating powered/watered airport. Outside-market road/rail orders need an actual path to the map border. Regional goods shipments currently use road/rail; sea/air handle outside-market shipments.

Imports/exports provides eleven requested commodities, stock meters, per-resource Off/Import/Export controls, targets and monthly limits. Orders default Off, so existing cities do not spend automatically. Imports stop at target stock; exports retain target stock. All commodities share finite depot throughput. Regional counterparties with compatible orders take priority. Transfers conserve goods and debit/credit actual city funds, with affordability and treasury/storage caps. Outside markets provide the remaining configured orders with a five-percent buy/sell spread. Abstract prices respond to configured supply/demand. Regional snapshots update both inventories and cash atomically in one region record; a newer regional economic revision repairs a stale automatic-session economic snapshot. Neighbor calendars remain unchanged. A saved monthly guard prevents replay of the same month's shipments.

Mining, extraction, factory recipes and automatic consumption/production chains are not integrated in this release. Commodity inventory is usable for trading; it does not yet fuel plants or factories. Regional service estimates and commuting are existing aggregate systems, not a full SimCity 4/5 regional economy. Those remaining features are not represented as completed.

## Health

Existing hospitals automatically gain 20000 capacity (4x), a 72-tile radius (3x), and 4x coverage strength. The other medical facilities gain 4x capacity and preventive-care strength. Prices/footprints are retained. The placement overlay and actual local health share one capacity-aware field; power, road access, disabled facilities and overload still matter. Identical service layouts reuse the field across simulation refreshes. Existing buildings need no replacement.

## Verification

615 Node checks pass, including original ROM reference tests, finite cash/stock conservation, once-per-month/reload guards, isolated/mismatched depot rejection, affordability, outside-route checks, sea/air prerequisites, sharing opt-outs, native-plane speed and health overload. The actual browser app advances 6/24/48/96 world frames per 100ms at 1/4/8/16x, moving both aircraft systems and cars. Traffic renders with both weather and realistic art off, and its toggle survives refresh. Real sharing controls stop/re-enable demand and goods. A saved two-city browser fixture transfers 180 metals, preserves total stock at 400 (220+180), keeps the exporter's calendar paused and restores exact stocks after reload. Hospital placement is green at 1000/1000; local health is 100 in the supplied clean fixture. Desktop depot buttons measure 34px. Mobile has no horizontal overflow and keeps touch-sized controls. Browser errors: none. The earlier pause/drag camera regression probe still passes. Required game-client and feature screenshots were inspected.

Run the browser flow from the repository root with Playwright installed:
`CHROMIUM_EXECUTABLE=<installed Chromium path> node scripts/verify-regional-browser.mjs <local or published base URL>`
The harness uses a fresh isolated browser context and creates synthetic verification cities only. Local reports/screenshots go to the untracked output directory. Broader ROM reconstruction and fax/audio work remain paused.
