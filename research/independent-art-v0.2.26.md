# Realistic art without weather effects

The weather renderer's early disabled return suppressed the independently selected realistic buildings/water setting. It now has a fast artwork-only path: realistic building and water renderers run when selected, while clouds, rain, smoke particles, cars and day/night lighting remain disabled by the weather/lighting switch. Day artwork is used with lighting disabled. Turning both settings off retains original graphics.

The sea-pollution fallback no longer treats disabled weather as unavailable realistic water. Artwork animation repaint scheduling also follows the artwork option independently. This retains the cached/viewport-limited water surface and building renderers and skips atmospheric work in the artwork-only path.

Verified: **409 Node checks**. The real browser exercises all four checkbox combinations, confirms three R/C/I realistic replacements and realistic water with weather disabled, checks zero weather particles, compares actual building pixels against original graphics, reenables artwork, and reloads the session with weather off/artwork on. The same paused building pixels return exactly after reenabling/reload. Screenshots, including a powered close view, inspected; no page errors.

The regional economy, private civic expansion and remaining original-game fidelity work are still unfinished.
