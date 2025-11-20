import { MapContainer, TileLayer, GeoJSON, CircleMarker, Tooltip } from "react-leaflet";
import type { Site, WaterTower } from "../../api/types";

interface WaterTowerMapProps {
  sites: Site[];
  waterTowers: WaterTower[];
  onSelectSite?: (siteId: string) => void;
}

const KENYA_CENTER: [number, number] = [-0.0236, 37.9062];

const WaterTowerMap = ({ sites, waterTowers, onSelectSite }: WaterTowerMapProps) => (
  <MapContainer center={KENYA_CENTER} zoom={6} className="h-[420px] w-full rounded-2xl border border-slate-200">
    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution="&copy; OpenStreetMap contributors" />
    {waterTowers.map((tower) => (
      <GeoJSON key={tower.id} data={tower.geometry as any} style={{ color: "#3A7D8C", weight: 1, fillOpacity: 0.1 }} />
    ))}
    {sites.map((site) => {
      if (site.geometry.type !== "Point") {
        return null;
      }
      const [lon, lat] = site.geometry.coordinates as [number, number];
      return (
        <CircleMarker
          key={site.id}
          center={[lat, lon]}
          radius={8}
          pathOptions={{ color: "#2D6A4F", fillColor: "#2D6A4F", fillOpacity: 0.8 }}
          eventHandlers={{
            click: () => onSelectSite?.(site.id),
          }}
        >
          <Tooltip>
            <span className="text-sm font-medium">{site.name}</span>
          </Tooltip>
        </CircleMarker>
      );
    })}
  </MapContainer>
);

export default WaterTowerMap;
