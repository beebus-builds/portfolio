# Asset credits

The 3D scene uses real-world imagery. This file records where each file came
from and under what licence, and must stay in the repo for as long as the
assets do.

## Planetary and sky textures — `public/textures/real/`

Downloaded from **Solar System Scope** — https://www.solarsystemscope.com/textures/

| File | Used for |
|---|---|
| `2k_neptune.jpg` | Verdania (About world) surface |
| `2k_earth_nightmap.jpg` | Halcyon (Contact world) surface — city-light "signal relay" |
| `2k_earth_clouds.jpg` | Verdania cloud shell |
| `2k_jupiter.jpg` | Ferrovia (Skills world) surface |
| `2k_mars.jpg` | Oberon (Projects world) surface |
| `2k_mercury.jpg` | Cartograph (Resume world) surface |
| `2k_moon.jpg` | Moon surfaces across the system |
| `2k_sun.jpg` | The system primary |
| `2k_stars_milky_way.jpg` | Star sky and image-based lighting environment |
| `2k_saturn_ring_alpha.png` | Planetary ring opacity |

**Licence:** Creative Commons Attribution 4.0 International (CC BY 4.0).
https://creativecommons.org/licenses/by/4.0/

Per Solar System Scope's own notes, the maps are derived from NASA elevation
and imagery data, colour-tuned against true-colour photographs from MESSENGER,
Viking, Cassini and the Hubble Space Telescope. NASA's own imagery is generally
in the public domain; the composite maps here are the CC BY 4.0 work above.

**Required attribution** (shown in the flight UI credits panel):

> Planet and sky textures by Solar System Scope (solarsystemscope.com/textures),
> CC BY 4.0, based on NASA imagery.

## Procedurally generated assets

Everything else in the scene is generated at runtime from code — no third-party
assets:

- `src/components/space/textures.ts` — hull, nozzle, radiator, hazard, glow and
  ring textures, plus the per-planet fallback surface maps.
- `src/components/space/shipGeometry.ts` — the interceptor airframe.
- `src/app/api/cover/[slug]/route.ts` and `src/lib/coverArt.ts` — blog cover art.

If any file under `public/textures/real/` is missing or fails to load, the
scene falls back to the procedural textures, so the site never shows a hole.
