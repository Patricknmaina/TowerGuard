## TowerGuard Map-First Architecture Sketch

### Goals
- Make the Leaflet map (polygons + markers) the hero view.
- Surface tower details in an overlaid drawer/flyout that adapts to viewport.
- Draw data from the same Mongo-powered APIs already wired into the project.
- Keep styling consistent with the Tailwind theme (rounded cards, gradients, frosted glass).

### Component hierarchy

```
pages/
  DashboardPage.tsx
    ├── map/
    │     └── WaterTowersMap.tsx          # GeoJSON polygons, Turf centroids, click handlers
    ├── drawer/
    │     ├── TowerDrawer.tsx             # Layout, visibility, background UV overlay
    │     ├── TowerTabs.tsx               # Tab bar for Overview/Sites/Hydrology/Biodiversity
    │     ├── TowerOverviewTab.tsx        # Stat cards (area, elevation, counties)
    │     ├── TowerHydrologyTab.tsx       # Rainfall/NDVI stats
    │     └── TowerBiodiversityTab.tsx    # Species count + list
    └── cards/
          └── StatCard.tsx               # Reusable Tailwind card for numbers + label
```

### Data flow
1. `DashboardPage` fetches `water-towers` and `nurseries`.
2. `WaterTowersMap` renders polygons and centroids; clicking a feature sets `selectedTower`.
3. Drawer hooks (`useBiodiversityByTower`, `useSiteFeatures`, etc.) re-run when `selectedTower` updates.
4. Drawer tabs display cards populated directly from backend responses (no placeholder JSON).

### Visual system
- Map occupies full viewport; drawer overlaps on the right (desktop) or bottom (mobile).
- Drawer uses gradients (`from-emerald-900 to-slate-900`), frosted glass background, and rounded cards.
- Tabs call small `StatCard` components that share `p-4`, `shadow-sm`, and responsive grids.

### Next steps
1. Move the Turf-powered `WaterTowersMap` into `components/map/`.
2. Implement drawer components under `components/drawer/`.
3. Introduce `StatCard` under `components/cards/`.
4. Rewire `DashboardPage` to layer the map + drawer interaction.
