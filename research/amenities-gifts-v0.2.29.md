# v0.2.29: stronger amenities and restored cartridge gifts

## Player-requested Turbo amenities

The four existing amenities double their radius from6/10/16/12 to12/20/32/24 tiles (garden/neighbourhood/city park/plaza). Their peak land-value bonuses rise to14/24/42/34; happiness to10/16/28/20. Benefits taper from the actual plot edge. Parks need road access, and can be switched off; electricity/water are not required. Land-value accumulation is bounded at85 and happiness at50 points, and does not compound on refresh/save.

Twelve NEW variants add four parks, four gardens and four plazas. Footprints run from1x1 to6x6, radii from16 to48 tiles. Exact costs, upkeep, strengths and sprites are in src/amenities.js and assets/amenities/designs-v1.json. Existing parks remain available. Plazas also add commercial appeal (18..48 points; existing plaza30), weighted by nearby commercial zones and tapered distance. The city's commercial demand receives four times its weighted appeal, capped with the normal1500 demand limit. This is an explicit Turbo balance rule, not a cartridge formula. Inspector meters show appeal and actual city demand bonus.

Unchanged park layouts reuse their cached service fields through unrelated zone growth. Road changes and facility enable/disable still invalidate the fields.

## Original gift dispatch

Translated CODE_03C0AD..03C424, including:
- Promotion and high population messages before inventory capacity, then scenario-mode return and capital model notice.
- Mayor's house; bank below2000 funds at City rank and its branch-open followup.
- Amusement/casino reward at road counts300/400/500 or native hospital+school6/10.
- Zoo at stadium counts1/3, with24 visits of its handler before reward. Earlier events/full inventory freeze the countdown.
- Reclamation when nonzero empty land falls strictly below150/100/50/30; independently at population200k/250k/300k/400k/450k.
- Police/fire HQ at6/12/18 stations; library at3/6/9 native schools; city park at300/600/900 native park tiles; station at500/2000 rail tiles.
- Windmill at150/500 developed R+C+I zones (not industrial zones alone).
- Mario at Megalopolis; exposition at City rank with an airport and seaport; fountain in1950 or later.

DATA_01BF8F/CODE_01BFC3 map message IDs to all15 gift tools. The user's requested inline Gifts area replaces the modal chooser. Amusement and casino share a single reward; selecting either never creates an extra inventory slot. All gifts now have names/icons; land reclamation uses the cartridge's3x3 zero-tile template over water, costs100 and requires some water with no buildings in the footprint (CODE_01B96A/01BA80/01BAEC/01BB78). The capital model is a real whole-city miniature in Information.

The existing Turbo convention of free placement for the other gifts is retained; the ROM normally charges100 plus preparation. Native school/hospital and park milestone counters retain their cartridge meaning, so custom educational/park facilities do not silently substitute for those counts. Custom facility integration can be expanded as an explicit Turbo rule later.

Gift counters are accumulated during the native tile visit, including developed-zone counts before growth, then saved with the scan census. Reward progress and zoo countdown persist in giftMilestones. The original four-slot queue (three in a Village) and one event per invocation are preserved.

## Evidence and limits

- tools/reference-gifts.mjs executes the original ROM in Mesen's isolated test runner.186 controlled calls compare message ID and all20 progress fields, covering threshold edges, priority, capacity, scenarios, packed-byte stages, zoo delay and promotion. Exit0; ROM/emulator SHA256 in research/reference-gifts.json.
- Tests replay those186 captured results plus real city aggregation, all gift placements, choice conservation, twelve amenity footprints/costs/upkeep/ranges, distance-weighted commercial demand, closed facilities, unchanged-layout caching and save/reload.
- Original full scan reference tests still compare60 complete ROM scans, map words, census and RNG.
- This does not establish full natural gameplay parity. Wright dialogue visuals/voice, Mayor-house evolution, original full menu behavior and remaining original audio/simulation comparisons still need work. The wider Turbo services are intentionally different from cartridge balance. Regional commodity economy modules remain unwired and unpublished.

12 original ImageGen PNG masters plus max252px lossless WebP are packaged with hashes/provenance in assets/amenities/manifest-v1.json. Café v1/v2 are both preserved;v2 selected. New assets, placement, meters, shared gift choice, reclamation, capital model and session passed browser checks with no page/HTTP errors. Dense-city FX measurements and limits are in render-performance-v0.2.29.md.
