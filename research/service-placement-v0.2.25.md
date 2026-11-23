# Automatic service coverage while building

Selecting Police, Police HQ, Fire station, Fire HQ, a health/ambulance facility or an education facility automatically displays the matching existing coverage. Construction tools, drag blueprints and release-to-place stay active. Selecting an unrelated tool clears this temporary layer. Manual Map View retains its separate overlay controls.

Police/fire layers project the existing ROM-derived service-plane seeding and smoothing with current facility positions, allocated strength, police effectiveness, power/access penalties and disabled-building masks. This allows planning immediately while paused without changing the actual simulation planes or advancing city time. Green represents strong coverage, amber partial coverage and red no coverage. Emergency coverage is normalized at 255 field units, matching the crime/fire-protection field range rather than confusing the 1,000 funding-strength units with map influence.

Health/education layers show powered, road-connected existing facilities' Manhattan service ranges and capacity/load factors; they do not include a hypothetical hovered building. Health coverage describes the facility's local service influence, not an ambulance's full possible road travel distance. Future private healthcare types use their configured radius and capacity.

The overlay is cached as a low-resolution bitmap and drawn in one canvas pass. Current revision, power, funding, effectiveness and enabled states invalidate it. No simulation, financial or save data changes during display.

Verified: 407 Node checks, including paused projection, funding/disable changes and finite local capacity. Real browser checks select each service tool, keep construction controls visible, hold and release valid blueprints, confirm new facility counts, switch to roads to clear the layer, and enter manual Map View. Screenshots inspected; no page errors. Regional-economy development and original-game/private civic parity work remain unfinished.
