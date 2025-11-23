import React, { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, GeoJSON, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import * as turf from "@turf/turf";
import L from "leaflet";
import type { GeoJSON } from "geojson";

import { getWaterTowers } from "../../api/client";
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

function normalizeGeometry(geom: GeoJSON.Geometry | undefined): GeoJSON.Geometry | null {
  if (!geom || !(geom as any).coordinates) return null;
  const g: any = { ...geom };
  g.coordinates = coerceCoords((geom as any).coordinates);
  return g;
}

export function getFeatureCentroid(geometry: GeoJSON.Geometry | undefined) {
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

export default function WaterTowersMap() {
  const [towers, setTowers] = useState<WaterTower[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any>(null);
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getWaterTowers();
        if (!mounted) return;
        setTowers(Array.isArray(data) ? data : []);
      } catch (err) {
        if (!mounted) return;
        setError(err);
      } finally {
        if (!mounted) return;
        setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

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
    } as GeoJSON.FeatureCollection;
  }, [towers]);

  const selectedTower = useMemo(
    () => towers.find((t) => t.id === selectedTowerId) ?? null,
    [towers, selectedTowerId]
  );

  if (loading) {
    return (
      <div className="w-full h-[70vh] md:h-[75vh] flex items-center justify-center rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-slate-50 p-6">
        <div className="animate-pulse text-slate-600">Loading water towers…</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-900">
        <div className="font-semibold mb-2">Failed to load water towers</div>
        <pre className="text-xs whitespace-pre-wrap break-words">{JSON.stringify(error, null, 2)}</pre>
      </div>
    );
  }

  return (
    <div className="w-full h-[70vh] md:h-[75vh] rounded-2xl overflow-hidden border border-slate-200 shadow-sm relative bg-white">
      <MapContainer center={KENYA_CENTER} zoom={DEFAULT_ZOOM} className="w-full h-full">
        <TileLayer
          attribution="&copy; OpenStreetMap contributors"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <GeoJSON
          data={features as any}
          style={(feature) => {
            const id = (feature?.properties as any)?.id;
            const isSelected = id && id === selectedTowerId;
            return {
              color: isSelected ? "#0f766e" : "#16a34a",
              weight: isSelected ? 3 : 1.5,
              fillOpacity: isSelected ? 0.25 : 0.12,
            };
          }}
          onEachFeature={(feature, layer) => {
            const props = feature.properties as any;
            layer.on("click", () => setSelectedTowerId(props.id));
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
                click: () => setSelectedTowerId(tower.id),
              }}
            >
              <Popup>
                <div className="space-y-1">
                  <div className="font-semibold text-slate-900">{tower.name}</div>
                  {(tower as any).counties && (
                    <div className="text-xs text-slate-600">
                      Counties: {Array.isArray((tower as any).counties) ? (tower as any).counties.join(", ") : (tower as any).counties}
                    </div>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      <div className="absolute bottom-3 left-3 right-3 md:right-auto md:w-[360px] rounded-2xl bg-white/95 backdrop-blur border border-slate-200 shadow-sm p-3">
        {selectedTower ? (
          <div className="space-y-1">
            <div className="text-sm font-semibold">{selectedTower.name}</div>
            {(selectedTower as any).counties && (
              <div className="text-xs text-slate-600">
                Counties:{" "}
                {Array.isArray((selectedTower as any).counties)
                  ? (selectedTower as any).counties.join(", ")
                  : String((selectedTower as any).counties)}
              </div>
            )}
            <div className="text-[11px] text-slate-500">Click another tower to update the selection.</div>
          </div>
        ) : (
          <div className="text-xs text-slate-600">Click a tower polygon or marker to view details.</div>
        )}
      </div>
    </div>
  );
}
