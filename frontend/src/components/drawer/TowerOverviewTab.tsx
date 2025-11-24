import React from "react";
import type { WaterTower } from "../../api/types";
import StatCard from "../cards/StatCard";
import { formatAreaKm2 } from "../../utils/formatArea";

interface OverviewProps {
  tower: WaterTower;
  nurseryCount: number;
  speciesCount: number;
  cfaCount: number;
  areaHa?: number | null;
}

const TowerOverviewTab = ({ tower, nurseryCount, speciesCount, cfaCount, areaHa }: OverviewProps) => {
  const counties =
    Array.isArray(tower.counties) || typeof tower.counties === "string"
      ? (Array.isArray(tower.counties) ? tower.counties : [tower.counties])
          .map((county) => (typeof county === "string" ? county : (county as any)?.name))
          .filter(Boolean)
      : [];
  const countiesLabel = counties.length ? counties.join(", ") : "Kenya";
  const areaLabel = formatAreaKm2(areaHa);

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <StatCard label="Area" value={areaLabel} description="Gazetted footprint" />
      <StatCard label="Counties" value={countiesLabel} description="Counties served by the tower" />
      <StatCard label="Nurseries" value={nurseryCount} description="Registered nurseries nearby" />
      <StatCard label="CFAs" value={cfaCount} description="Community Forest Associations" />
      <StatCard label="Species" value={speciesCount} description="Recorded species observations" />
    </div>
  );
};

export default TowerOverviewTab;
