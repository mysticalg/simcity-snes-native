# Selected realistic art

Generated with the built-in `image_gen` tool on 2026-11-23. The player's final choice was **the first square-plot sheet**. The later diamond/isometric alternatives are not used.

- `atlas-day-v1.png`: the selected first sheet, 5 columns × 3 rows. Generation `exec-c550ad22-1a8d-4ca6-a98f-d92f111bbcd3`.
- `atlas-night-v1.png`: lighting-only counterpart of that selected sheet. Generation `exec-8d35514a-6e43-4740-a394-ecf90ca7a8d5`.
- `water-v1.png`: clean, deep, murky and scummy water, 2 × 2. Generation `exec-f3309abb-01ac-4061-8432-818835740eab`.
- `manifest.json`: source generation IDs, dimensions, subjects and SHA256 receipts.

The original generated files remain under the Codex generated-images folder. These project copies are used by the app. Original ROM-derived graphics remain available through the effects/art controls and in map overlays.

The fifteen building archetypes cover residential and commercial development, light/heavy industry, police, coal and nuclear plants. Intermediate stages map to these archetypes; this is a custom visual option rather than a one-for-one replacement for every original sprite. Logical construction footprints remain unchanged. Both atlases use fractional 5×3 source bounds to normalize their one-pixel canvas-width difference into the same game footprint. No diamond-base sheet is consumed.

Warm luminous pixels in the chosen night art form the bloom mask. Light therefore originates in the drawn windows and entrances, including police and skyscraper rows. Unpowered or disabled buildings receive no luminous night pass. Native/custom buildings not covered by the atlas use conservative sprite-window masks; police rows and the stepped tower have explicit masks. This is a presentation feature, not an original SNES lighting claim.

Water textures are clipped against original water/shore pixels. Brown/scum mixing reads actual sea contamination, with a soft visual boundary; it does not change sewage quantities or diffusion rules. Wind-driven drift integrates over visual time and freezes with pause. Smog reads the actual air-pollution field. Select **Weather / lighting → Realistic buildings and water** to switch this style on/off.

## Prompts

### Selected day sheet

Use case: style-transfer / game asset atlas. Re-render ONLY the FIRST THREE ROWS of the reference, the fifteen old SimCity building sprites labeled 99 b4 d8 fc 120 / 144 168 195 1d4 1ef / 201 21c 249 28c 27c. Ignore the lower custom civic rows completely. Deliver ONE production game sprite atlas: EXACTLY FIVE EQUAL COLUMNS BY THREE EQUAL ROWS, no labels, no gutters, transparent alpha background. Every cell is square and contains exactly one building/complex matching its reference silhouette, architecture, roof profile, overall footprint and front-facing orientation. Reference top row = five progressively larger residential complexes, middle row = five commercial offices/skyscrapers, bottom row = light industry, heavy industry, police department with recognizable PD roof lettering, coal power station, nuclear station. Make them much more PHOTOREALISTIC: architectural miniature/diorama render, real concrete/brick/metal, sharply defined individual glass windows and mullions, subtle grime and material texture, physically credible daylight and shadows. Fixed high oblique orthographic city-builder view, square ground footprint aligned horizontally/vertically like the reference, NOT diamond isometric and no perspective vanishing point. All fifteen share identical camera angle and light direction, fit fully inside their own equal cell, neutral midday light. No ground beyond each square footprint, no sky, no backdrop, no background checkerboard, no grid lines, no extra buildings outside the cells. Large crisp detailed sprites suitable to render at high zoom in the existing native JavaScript game. Preserve the fifteen subjects and order. Alpha around objects genuinely transparent.

Input: `output/window-gallery.png`, reproducible with `node tools/render-art-reference.mjs` while the local server is running on port5198.

### Selected night edit

Use case: lighting-weather edit. This FIRST photorealistic building atlas is the user's chosen final DAY artwork. Produce its exact aligned NIGHT counterpart for game crossfading. Preserve the original FIVE COLUMNS BY THREE ROWS, square plot bases aligned with the current grid, original camera angle, every silhouette, building size and cell placement. DO NOT rotate to diamond/isometric bases, DO NOT change the camera, architecture or layout. Change lighting only: cool moonlit roofs, building materials still visible, many individually separated warm amber/cream and some cool-white glowing windows with bright luminous centers and soft small bloom spilling onto the adjacent wall. Police station front AND right-side window rows fully represented; every visible floor/window row of the five skyscraper/office complexes represented, some windows unlit for realism. All residential/industrial windows also included. Glow comes from actual window openings, not large circles or stars on buildings. No floating lights, no opaque backdrop, no extra props, no signs/labels except existing PD roof lettering. Keep background genuinely transparent and clean, without stray colored/white speckles. Maintain precise day/night sprite alignment and the exact original aspect ratio.

Input: selected first day sheet above.

### Water atlas

Generate one production WATER TEXTURE ATLAS for a realistic top-down city-building game, EXACTLY TWO EQUAL COLUMNS by TWO EQUAL ROWS, all four cells seamless square textures with straight tile borders and NO gutters, NO labels. Camera straight down, orthographic. Top left: clean blue-teal lake/ocean water, natural fine wind ripples, subtle caustic variation and sun glints, no shore. Top right: deeper navy/teal water with long soft wind ripples, realistic low-contrast natural surface, no shore. Bottom left: visibly polluted murky brown water, suspended sediment and thin subtle oily surface film, still recognizably water with fine ripples. Bottom right: heavily polluted brown effluent with dispersed irregular pale scum and small dark particulate flecks moving in the water, realistic and subdued, no solid garbage objects. Natural photographic material detail, consistent physical scale and illumination across cells. NO horizon, coast, land, rocks, boats, buildings, text, checkerboard or perspective. Uniform overall exposure, edges of each cell should tile seamlessly with themselves. This atlas will animate under a masked game coastline, so use texture only, with no strong large repeated features. Crisp enough for close zoom, realistic rather than cartoon/pixel art.
