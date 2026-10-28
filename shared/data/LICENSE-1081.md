# 1081 first 8 km route data

The derived route data in `1081-first8km.ts` and `public/tracks/1081-first8km.geojson` contains OpenStreetMap data, licensed under ODbL 1.0: https://www.openstreetmap.org/copyright and https://opendatacommons.org/licenses/odbl/1-0/ . Attribution: © OpenStreetMap contributors. These data files are supplied under ODbL; this notice does not relicense the game code.

Routing: FOSSGIS OSRM service, https://routing.openstreetmap.de/about.html . Route endpoints 18.9862566,100.9396322 and 19.0795457,101.1512379; full returned route approximately 39.8792 km, clipped at 8000 m of horizontal road distance. Retrieved 2026-10-28. The selected Google Maps link was used to identify endpoints; Google route geometry was not extracted.

Elevations: SRTM 90 m v3 through Open Topo Data, https://www.opentopodata.org/datasets/srtm/ . Sampled every 100 m along the route, linearly interpolated, relative base elevation 301 m. This is approximate terrain height and not a measurement of the road deck. World geometry is normalized to 8000 m of 3D centreline length, so horizontal distances may differ slightly from the original geodetic route. Width, grip, curve limits, vegetation and surrounding terrain are game approximations.


Full route extension: `1081-full.ts` and `public/tracks/1081-full.geojson` are supplied under the same ODbL terms. Full OSRM distance 39879.2 m, presented as 39900 game metres; 10/20/30 km modes are prefixes of the same route. DEM sampled every 100 game metres across the full route, interpolated at 20 m intervals. Full-route elevations retrieved 2026-10-28. Each course geometry is normalized to its specified game distance.
