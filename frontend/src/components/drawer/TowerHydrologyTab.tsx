import React from "react";
import type { WaterTower } from "../../api/types";
import StatCard from "../cards/StatCard";

interface HydrologyProps {
  tower: WaterTower;
}

const TowerHydrologyTab = ({ tower }: HydrologyProps) => {
  const elevation =
    typeof tower.metadata?.elevation_m === "number"
      ? `${tower.metadata.elevation_m.toFixed(0)} m`
      : "Awaiting data";
  const rainfall = (tower.metadata as any)?.rainfall_mm ? `${(tower.metadata as any).rainfall_mm} mm` : "Unknown";
  const ndvi = (tower.metadata as any)?.ndvi_mean ? (tower.metadata as any).ndvi_mean.toFixed(2) : "N/A";

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <StatCard label="Elevation" value={elevation} description="Source: GeoJSON metadata" />
      <StatCard label="Rainfall" value={rainfall} description="Annual estimate" />
      <StatCard label="NDVI" value={ndvi} description="Last computed mean" />
    </div>
  );
};

export default TowerHydrologyTab;
