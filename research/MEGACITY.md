# Free Megacity — v0.2.12

Free Megacity is selectable from New City. It contains 240×200 logical cells (48,000), four times the original Free City's area. Terrain expands the original free-play layout in both axes and retiles water/forest boundaries. Each construction cell retains the same eight-pixel art scale; this is a larger editable map, not a stretched canvas.

City dimensions now own surface, utilities, pollution, service, employment, transport and coarse fields. Camera, blueprints, inspector, save/load, automatic session restore and regional edge guides use those dimensions. Megacity zooms out to 0.5×; switching to a normal map restores its 1× minimum. All nine original maps retain their original 120×100 dimensions. Original worker helpers retain default geometry for ROM fixture comparisons and accept explicit geometry from the city.

Region snapshots preserve dimensions. Neighbor connections match overlapping edge coordinates up to the smaller edge length; unequal cities are not silently cropped into 120×100 saves. This does not rescale one neighbor's edge to another's.

Verified: Node checks cover all quadrants, far-corner utilities/commutes, all 48,000 scanned cells, 750 coarse cells, water/sewage routes, regional wires/pipes past y=100, actor bounds and serialization. Chromium uses the actual menu, pans, places a park with the mouse at (230,190), refreshes with restored camera/city, reaches 0.5× zoom, and returns to ordinary Free City. Existing original routine fixtures pass with unchanged default dimensions. No fresh original CPU trace was recorded for this custom map size.

Limits: dense 48,000-cell city performance has not been benchmarked; current checks use sparse controlled fixtures. This extension retains the original simulation's census/economy caps and much of its arithmetic. It does not establish unlimited population, full original runtime parity, or SimCity 4's region simulation.
