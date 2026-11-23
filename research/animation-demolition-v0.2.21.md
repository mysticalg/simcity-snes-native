# Animation speed and bulk demolition

World animation frames now scale with the selected simulation speed. This is a requested Turbo extension, not original SNES timing. Native actors and the shared civic clock (cars, buses, utility flows, smoke/weather) receive the scaled budget. UI input, zoom easing and placement feedback keep wall time. Paused cars and civic clock remain stationary.

`tools/check-animation-demolition.mjs` exercises the actual app module and car renderer: over one second, car travel is 11.708333, 23.416667, 46.833333, 93.666667 and 187.333333 atlas pixels at 1/2/4/8/16 speed. The fixed light-traffic fixture disables city simulation to isolate animation travel. Pause produces zero travel and zero clock frames.

Bulk bulldozing skips empty/already-cleared cells instead of invalidating the entire blueprint. Multi-cell strokes clear surface construction, stops and pipes at selected coordinates. Standalone stop removal still preserves its underlying road. Whole buildings touched by demolition retain their existing whole-building removal behavior. An all-empty stroke succeeds without cost or another advisor warning.

Verified: 379 Node checks; real mouse held blueprint makes no mutation, release clears all selected layers, outside construction survives, and repeating the empty rectangle remains valid. Browser reports no JavaScript errors. Full original game fidelity, other gift conditions and the private civic expansion remain unfinished.
