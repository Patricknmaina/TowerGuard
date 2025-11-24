import React, { useMemo, useRef } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as turf from "@turf/turf";
import L from "leaflet";
import type { GeoJSON as GeoJSONType } from "geojson";

import type { WaterTower } from "../../api/types";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function coerceCoords(c: any): any {
  if (typeof c === "string") {
    const n = Number(c);
    return Number.isFinite(n) ? n : c;
  }
  if (Array.isArray(c)) return c.map(coerceCoords);
  return c;
}

function normalizeGeometry(geom: GeoJSONType | undefined): GeoJSONType | null {
  if (!geom || !(geom as any).coordinates) return null;
  const g: any = { ...geom };
  g.coordinates = coerceCoords((geom as any).coordinates);
  return g;
}

export function getFeatureCentroid(geometry: GeoJSONType | undefined) {
  const numericGeom = normalizeGeometry(geometry);
  if (!numericGeom) return null;

  try {
    const result = turf.centroid(numericGeom as any);
    const [lon, lat] = result.geometry.coordinates;
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
    return { lat, lon };
  } catch (err) {
    console.warn("Centroid failed:", err);
    return null;
  }
}

const KENYA_CENTER: [number, number] = [-0.0236, 37.9062];
const DEFAULT_ZOOM = 6;

export interface WaterTowersMapProps {
  towers: WaterTower[];
  loading?: boolean;
  error?: any;
  selectedTowerId?: string | null;
  onTowerClick?: (tower: WaterTower) => void;
  onSelectTower?: (id: string) => void;
}

export default function WaterTowersMap({
  towers,
  loading = false,
  error,
  selectedTowerId,
  onTowerClick,
  onSelectTower,
}: WaterTowersMapProps) {
  const mapRef = useRef<L.Map | null>(null);

  const features = useMemo(() => {
    return {
      type: "FeatureCollection",
      features: towers
        .map((tower) => {
          const geom = tower.geometry as any;
          if (!geom) return null;
          return {
            type: "Feature",
            properties: {
              id: tower.id,
              name: tower.name,
              counties: (tower as any).counties,
            },
            geometry: geom,
          };
        })
        .filter(Boolean),
    } as GeoJSONType.FeatureCollection;
  }, [towers]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center rounded-2xl border border-warm-200 bg-gradient-to-br from-soft-green-50/30 to-warm-50 p-6">
        <div className="animate-pulse text-charcoal-600">Loading water towers…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
        <div className="font-semibold mb-2">Failed to load water towers</div>
        <pre className="text-xs whitespace-pre-wrap break-words text-rose-600">{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  // Focus on selected tower if provided
  const mapCenter = useMemo(() => {
    if (selectedTowerId) {
      const selectedTower = towers.find((t) => t.id === selectedTowerId);
      if (selectedTower?.geometry) {
        const centroid = getFeatureCentroid(selectedTower.geometry as any);
        if (centroid) {
          return [centroid.lat, centroid.lon] as [number, number];
        }
      }
    }
    return KENYA_CENTER;
  }, [selectedTowerId, towers]);

  const mapZoom = useMemo(() => {
    return selectedTowerId ? 9 : DEFAULT_ZOOM;
  }, [selectedTowerId]);

  return (
    <MapContainer
      center={mapCenter}
      zoom={mapZoom}
      className="w-full h-full"
      whenCreated={(map) => {
        mapRef.current = map;
        // Zoom to selected tower if provided
        if (selectedTowerId) {
          const selectedTower = towers.find((t) => t.id === selectedTowerId);
          if (selectedTower?.geometry) {
            const geom = normalizeGeometry(selectedTower.geometry as any);
            if (geom) {
              try {
                const bounds = turf.bbox(geom as any);
                map.fitBounds(
                  [
                    [bounds[1], bounds[0]],
                    [bounds[3], bounds[2]],
                  ] as any,
                  { padding: [50, 50] }
                );
              } catch (e) {
                console.warn("Failed to fit bounds:", e);
              }
            }
          }
        }
      }}
    >
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      <GeoJSON
        data={features as any}
        style={(feature) => {
          const props = feature?.properties as any;
          const isSelected = props?.id === selectedTowerId;
          return {
            color: isSelected ? "#2d7a4f" : "#3a9660",
            weight: isSelected ? 3 : 2,
            fillOpacity: isSelected ? 0.25 : 0.15,
            fillColor: isSelected ? "#3a9660" : "#5bb37d",
          };
        }}
        onEachFeature={(feature, layer) => {
          const props = feature.properties as any;
          layer.on("click", () => {
            if (onSelectTower) {
              onSelectTower(props.id);
            }
            if (onTowerClick) {
              const tower = towers.find((t) => t.id === props.id);
              if (tower) onTowerClick(tower);
            }
          });
          layer.bindTooltip(props.name, { sticky: true });
        }}
      />

      {towers.map((tower) => {
        const center = getFeatureCentroid(tower.geometry as any);
        if (!center) {
          if (import.meta.env.DEV) {
            console.warn("Skipping tower without valid geometry:", tower.id);
          }
          return null;
        }
        return (
          <Marker
            key={tower.id}
            position={[center.lat, center.lon]}
            eventHandlers={{
              click: () => onTowerClick?.(tower),
            }}
          >
            <Popup>
              <div className="space-y-1">
                <div className="font-semibold text-charcoal-900">{tower.name}</div>
                {(tower as any).counties && (
                  <div className="text-xs text-charcoal-600">
                    Counties:{" "}
                    {Array.isArray((tower as any).counties)
                      ? (tower as any).counties.join(", ")
                      : String((tower as any).counties)}
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
