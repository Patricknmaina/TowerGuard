import { Circle, CircleMarker, MapContainer, Polygon, TileLayer, Tooltip, useMap, useMapEvents } from "react-leaflet";
import { useEffect, useState } from "react";
import type { TowerView } from "../../pages/DashboardPage";
import type { Nursery } from "../../api/types";

interface WaterTowersMapProps {
  towers: TowerView[];
  selectedTowerId: string | null;
  selectedSiteId?: string | null;
  onSelectTower: (id: string) => void;
  showBoundary?: boolean;
  showBubbles?: boolean;
  showSatellite?: boolean;
  showNdvi?: boolean;
  showRainfall?: boolean;
  nurseries?: Nursery[];
}

const KENYA_CENTER: [number, number] = [-0.0236, 37.9062];

// Fallback coordinates for known towers (approximate). Replace when backend supplies precise geometry.
const fallbackCoords: Record<string, [number, number]> = {
  aberdare: [-0.3, 36.7],
  "aberdare range": [-0.3, 36.7],
  cherangani: [1.3, 35.4],
  "cherangani hills": [1.3, 35.4],
  chyulu: [-2.4, 37.9],
  "chyulu hills": [-2.4, 37.9],
  huri: [3.9, 37.2],
  "huri hills": [3.9, 37.2],
  kirisia: [0.7, 36.9],
  "lerroghi kirisia hills": [0.7, 36.9],
  loita: [-1.5, 35.4],
  "loita hills": [-1.5, 35.4],
  marmanet: [0.2, 36.3],
  "marmanet forest": [0.2, 36.3],
  matthews: [1.3, 37.2],
  "matthews range": [1.3, 37.2],
  mau: [-0.5, 35.6],
  "mau forest complex": [-0.5, 35.6],
  mtelgon: [1.1, 34.6],
  "mount elgon water tower": [1.1, 34.6],
  mtkenya: [0.15, 37.3],
  "mount kenya water tower": [0.15, 37.3],
  mtkipipiri: [-0.4, 36.6],
  "mount kipipiri": [-0.4, 36.6],
  mtkulal: [2.6, 36.9],
  "mount kulal": [2.6, 36.9],
  mtmarsabit: [2.3, 37.97],
  "mount marsabit": [2.3, 37.97],
  mtnyiru: [2.2, 36.75],
  "mount nyiru": [2.2, 36.75],
  ndotos: [1.8, 37.2],
  "ndotos hills": [1.8, 37.2],
  nyambene: [0.5, 37.8],
  "nyambene hills": [0.5, 37.8],
  shimba: [-4.2, 39.4],
  "shimba hills": [-4.2, 39.4],
};

const getLatLng = (tower: TowerView): [number, number] => {
  if ((tower as any).latitude && (tower as any).longitude) {
    return [(tower as any).latitude, (tower as any).longitude];
  }
  const key = tower.name?.toLowerCase?.() ?? tower.id?.toLowerCase?.();
  const fromFallback = key ? fallbackCoords[key] : undefined;
  return fromFallback ?? KENYA_CENTER;
};

const polygonForTower = (tower: TowerView): [number, number][][] => {
  const [lat, lng] = getLatLng(tower);
  const offsets: Array<[number, number]> = [
    [0.12, -0.08],
    [0.18, 0.01],
    [0.14, 0.12],
    [0.04, 0.18],
    [-0.06, 0.14],
    [-0.14, 0.04],
    [-0.18, -0.06],
    [-0.08, -0.14],
  ];
  // TODO: Replace with real boundary geometry from backend per tower.
  return [offsets.map(([dy, dx]) => [lat + dy, lng + dx])];
};

const bubblePoints = (tower: TowerView) => {
  // TODO: Replace with real monitoring sites or springs linked to each tower.
  const [lat, lng] = getLatLng(tower);
  return [
    { id: `${tower.id}-p1`, lat: lat + 0.05, lng: lng + 0.05, value: 41 },
    { id: `${tower.id}-p2`, lat: lat - 0.03, lng: lng + 0.08, value: 118 },
    { id: `${tower.id}-p3`, lat: lat + 0.08, lng: lng - 0.06, value: 73 },
  ];
};

const MapControls = () => {
  const map = useMap();
  return (
    <div className="absolute right-4 top-4 z-[1000] flex flex-col gap-2">
      <button
        onClick={() => map.zoomIn()}
        className="rounded-lg bg-white/90 px-2 py-2 text-sm font-semibold text-slate-800 shadow"
      >
        +
      </button>
      <button
        onClick={() => map.zoomOut()}
        className="rounded-lg bg-white/90 px-2 py-2 text-sm font-semibold text-slate-800 shadow"
      >
        -
      </button>
      <button className="rounded-lg bg-white/90 px-2 py-2 text-sm font-semibold text-slate-800 shadow">⛶</button>
      <button className="rounded-lg bg-white/90 px-2 py-2 text-sm font-semibold text-slate-800 shadow">🔗</button>
    </div>
  );
};

const RecenterOnSelect = ({ lat, lng }: { lat: number; lng: number }) => {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], 10, { duration: 0.75 });
  }, [lat, lng, map]);
  return null;
};

const ZoomWatcher = ({ onZoomChange }: { onZoomChange: (z: number) => void }) => {
  useMapEvents({
    zoomend: (e) => onZoomChange(e.target.getZoom()),
  });
  return null;
};

const treePreviewUrl =
  "https://images.unsplash.com/photo-1501004318641-b39e6451bec6?auto=format&fit=crop&w=400&q=60";

const WaterTowersMap = ({
  towers,
  selectedTowerId,
  showBoundary = true,
  showBubbles = true,
  showSatellite = false,
  showNdvi = false,
  showRainfall = false,
  nurseries = [],
  onSelectTower,
}: WaterTowersMapProps) => {
  if (!towers || towers.length === 0) {
    return (
      <div className="flex h-full items-center justify-center rounded-3xl bg-white/80 text-slate-600">
        {/* TODO: wire this to a real empty state once backend returns towers */}
        No water towers available. Check your data source.
      </div>
    );
  }

  const selectedTower = towers.find((t) => t.id === selectedTowerId) ?? towers[0];
  const [lat, lng] = getLatLng(selectedTower);
  const [zoomLevel, setZoomLevel] = useState(10);
  const [selectedNursery, setSelectedNursery] = useState<Nursery | null>(null);

  return (
    <div className="relative h-full w-full rounded-3xl overflow-hidden">
      <MapContainer center={[lat, lng]} zoom={10} className="h-full w-full" scrollWheelZoom>
        <ZoomWatcher onZoomChange={setZoomLevel} />
        {showSatellite ? (
          <TileLayer
            attribution="Tiles c Esri - Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye"
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          />
        ) : (
          <TileLayer attribution="&copy; OpenStreetMap contributors" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        )}

        {showBoundary &&
          towers.map((tower) => {
            const poly = polygonForTower(tower)[0];
            const isSelected = tower.id === selectedTowerId;
            return (
              <Polygon
                key={tower.id}
                pathOptions={{ color: "#d90429", weight: isSelected ? 4 : 2, fillOpacity: isSelected ? 0.12 : 0.06 }}
                positions={poly as any}
                eventHandlers={{ click: () => onSelectTower(tower.id) }}
              />
            );
          })}

        {showNdvi &&
          towers.map((tower) => {
            const poly = polygonForTower(tower)[0];
            return (
              <Polygon
                key={`${tower.id}-ndvi`}
                pathOptions={{ color: "#16a34a", weight: 1, dashArray: "4 4", fillColor: "#16a34a", fillOpacity: 0.08 }}
                positions={poly as any}
                eventHandlers={{ click: () => onSelectTower(tower.id) }}
              />
            );
          })}

        {showRainfall &&
          towers.map((tower) => {
            const poly = polygonForTower(tower)[0];
            return (
              <Polygon
                key={`${tower.id}-rain`}
                pathOptions={{ color: "#0ea5e9", weight: 1, dashArray: "2 6", fillColor: "#0ea5e9", fillOpacity: 0.06 }}
                positions={poly as any}
                eventHandlers={{ click: () => onSelectTower(tower.id) }}
              />
            );
          })}

        {showBubbles &&
          towers.flatMap((tower) => {
            return bubblePoints(tower).map((pt) => (
              <div key={pt.id}>
                <Circle
                  center={[pt.lat, pt.lng]}
                  radius={4000 + pt.value * 20}
                  pathOptions={{ color: "#9C27B0", fillColor: "#E91E63", fillOpacity: 0.25, weight: 0 }}
                />
                <CircleMarker
                  center={[pt.lat, pt.lng]}
                  radius={10}
                  pathOptions={{ color: "#E91E63", fillColor: "#E91E63", fillOpacity: 0.85 }}
                >
                  <Tooltip>
                    <div className="space-y-[4px]">
                      <div className="text-xs font-semibold text-slate-900">Trees planted</div>
                      <div className="text-xs text-slate-900">{pt.value.toLocaleString()}</div>
                      <div className="text-[11px] text-slate-800">
                        Species: Podocarpus, Juniperus, Croton (placeholder)
                      </div>
                      <img
                        src={treePreviewUrl}
                        alt="Tree preview"
                        className="h-14 w-full rounded-md object-cover"
                      />
                    </div>
                  </Tooltip>
                </CircleMarker>
              </div>
            ));
          })}

        {zoomLevel >= 9 &&
          nurseries.map((n) => (
            <CircleMarker
              key={n.id}
              center={[n.latitude ?? lat, n.longitude ?? lng]}
              radius={8}
              pathOptions={{ color: "#10b981", fillColor: "#10b981", fillOpacity: 0.9 }}
              eventHandlers={{ click: () => setSelectedNursery(n) }}
            >
              <Tooltip>
                <div className="space-y-[4px]">
                  <div className="text-xs font-semibold text-slate-900">{n.name}</div>
                  <div className="text-[11px] text-slate-800">
                    {n.species_local} / {n.species_scientific}
                  </div>
                  <div className="text-[11px] text-slate-800">Capacity: {n.capacity_seedlings ?? "N/A"}</div>
                  <img src={treePreviewUrl} alt="Seedling" className="h-12 w-full rounded-md object-cover" />
                </div>
              </Tooltip>
            </CircleMarker>
          ))}

        <RecenterOnSelect lat={lat} lng={lng} />
        <MapControls />
      </MapContainer>

      {nurseries.length > 0 && zoomLevel >= 11 && (
        <div className="absolute left-4 bottom-4 z-[1000] w-72 max-h-64 overflow-y-auto rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-xl">
          <p className="text-sm font-semibold text-brand-gray">Nursery Seedlings</p>
          <p className="text-xs text-slate-500">Within selected tower</p>
          <div className="mt-2 space-y-2">
            {nurseries.map((n) => (
              <div
                key={n.id}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700"
              >
                <p className="font-semibold text-brand-gray">{n.name}</p>
                <p className="text-xs text-slate-500">{n.species_local} / {n.species_scientific}</p>
                <p className="text-xs text-slate-500">Capacity: {n.capacity_seedlings ?? "N/A"}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedNursery && (
        <div className="absolute right-4 bottom-4 z-[1200] w-80 rounded-2xl border border-emerald-200 bg-white/95 p-4 shadow-2xl">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-gray">{selectedNursery.name}</p>
              <p className="text-xs text-slate-600">
                {selectedNursery.species_local} / {selectedNursery.species_scientific}
              </p>
              <p className="text-xs text-slate-600">Capacity: {selectedNursery.capacity_seedlings ?? "N/A"}</p>
            </div>
            <button
              onClick={() => setSelectedNursery(null)}
              className="rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500 hover:bg-slate-200"
            >
              Close
            </button>
          </div>
          <img src={treePreviewUrl} alt="Tree preview" className="mt-2 h-20 w-full rounded-md object-cover" />
          <p className="mt-2 text-xs text-slate-500">Tap a nursery marker or bubble to update this panel.</p>
        </div>
      )}
    </div>
  );
};

export default WaterTowersMap;
