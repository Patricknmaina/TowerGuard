import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useWaterTowers } from "../hooks/useWaterTowers";
import { useSites } from "../hooks/useSites";
import { useBiodiversityByTower } from "../hooks/useBiodiversityByTower";
import DataState from "../components/shared/DataState";
import { enrichAllWaterTowers } from "../api/client";
import { classifySoilTexture } from "../lib/soilLabel";
import type { WaterTower } from "../api/types";
import { formatAreaKm2 } from "../utils/formatArea";
import { getTowerAreaHa } from "../utils/towerAreaOverrides";

// Helper to get NDVI health score color
const getHealthScoreColor = (score: number | null | undefined): string => {
  if (score == null) return "bg-charcoal-200 text-charcoal-600";
  if (score >= 0.7) return "bg-soft-green-100 text-soft-green-700";
  if (score >= 0.4) return "bg-amber-100 text-amber-700";
  return "bg-rose-100 text-rose-700";
};

// Helper to get health score label
const getHealthScoreLabel = (score: number | null | undefined): string => {
  if (score == null) return "Awaiting data";
  if (score >= 0.7) return "Healthy";
  if (score >= 0.4) return "Moderate";
  return "Critical";
};



interface TowerCardData {
  tower: WaterTower;
  healthScore: number | null;
  temperatureRange: string;
  rainfallSummary: string;
  soilClass: string;
  biodiversityCount: number;
}

const WaterTowersDirectory = () => {
  const navigate = useNavigate();
  const { data: towers, isLoading: towersLoading, isError: towersError, error } = useWaterTowers();
  const { data: sites } = useSites();
  const queryClient = useQueryClient();
  const [selectedDays, setSelectedDays] = useState(30);
  const heroBgUrl = "/images/karuru-falls-aberdares2-1.jpg";

  // Compute date window based on selected days
  const ndviEnd = useMemo(() => new Date(), []);
  const ndviStart = useMemo(() => {
    const d = new Date(ndviEnd);
    d.setDate(d.getDate() - selectedDays);
    return d;
  }, [ndviEnd, selectedDays]);
  const ndviStartStr = ndviStart.toISOString().slice(0, 10);
  const ndviEndStr = ndviEnd.toISOString().slice(0, 10);

  const enrichMutation = useMutation({
    mutationFn: () => enrichAllWaterTowers(ndviStartStr, ndviEndStr),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["water-towers"] });
    },
  });

  // Get all biodiversity data for all towers (we'll batch this)
  const towerCards = useMemo(() => {
    if (!towers) return [];

    return towers.map((tower) => {
      // Find sites associated with this tower (by matching geometry or metadata)
      const associatedSites = sites?.filter((site) => {
        // Check if site metadata has water_tower_id or if we can match by name/geometry
        const siteMetadata = site as any;
        return siteMetadata.water_tower_id === tower.id;
      }) ?? [];

      // Get health score and features from tower metadata
      const metadata = tower.metadata as Record<string, unknown> | undefined;
      let healthScore: number | null = null;
      let latestFeature: any = null;
      
      // Try to get health score from metadata
      if (metadata?.health_score != null) {
        const score = typeof metadata.health_score === "number" 
          ? metadata.health_score 
          : parseFloat(String(metadata.health_score));
        if (!isNaN(score)) healthScore = score;
      }
      
      // Try to get NDVI score as health indicator if health_score not available
      if (healthScore == null && metadata?.ndvi_mean != null) {
        const ndvi = typeof metadata.ndvi_mean === "number" 
          ? metadata.ndvi_mean 
          : parseFloat(String(metadata.ndvi_mean));
        if (!isNaN(ndvi) && ndvi >= 0 && ndvi <= 1) {
          // Use NDVI as a proxy for health (normalize to 0-1)
          healthScore = (ndvi + 1) / 2; // Convert -1 to 1 range to 0 to 1
        }
      }

      // Build feature object from metadata
      if (metadata) {
        latestFeature = {
          tmin_c: metadata.tmin_c,
          tmax_c: metadata.tmax_c,
          temp_mean_c: metadata.temp_mean_c,
          rainfall_total_mm: metadata.rainfall_total_mm ?? metadata.rainfall_mm,
          sand: metadata.sand,
          clay: metadata.clay,
          silt: metadata.silt,
        };
      }

      // Temperature range
      let temperatureRange = "Awaiting data";
      if (latestFeature?.tmin_c != null && latestFeature?.tmax_c != null) {
        const min = latestFeature.tmin_c.toFixed(1);
        const max = latestFeature.tmax_c.toFixed(1);
        temperatureRange = `${min} - ${max} °C`;
      } else if (metadata?.temp_mean_c != null) {
        const temp =
          typeof metadata.temp_mean_c === "number" ? metadata.temp_mean_c : parseFloat(String(metadata.temp_mean_c));
        temperatureRange = `${temp.toFixed(1)} °C (avg)`;
      }

      // Rainfall summary
      let rainfallSummary = "Awaiting data";
      if (latestFeature?.rainfall_total_mm != null) {
        rainfallSummary = `${latestFeature.rainfall_total_mm.toFixed(0)} mm`;
      } else if (metadata?.rainfall_mm != null) {
        const rain = typeof metadata.rainfall_mm === "number" ? metadata.rainfall_mm : parseFloat(String(metadata.rainfall_mm));
        rainfallSummary = `${rain.toFixed(0)} mm`;
      }

      // Soil class - extract from metadata or latestFeature
      const sand = latestFeature?.sand ?? 
        (metadata?.sand != null ? (typeof metadata.sand === "number" ? metadata.sand : parseFloat(String(metadata.sand))) : null);
      const clay = latestFeature?.clay ?? 
        (metadata?.clay != null ? (typeof metadata.clay === "number" ? metadata.clay : parseFloat(String(metadata.clay))) : null);
      const silt = latestFeature?.silt ?? 
        (metadata?.silt != null ? (typeof metadata.silt === "number" ? metadata.silt : parseFloat(String(metadata.silt))) : null);
      
      const soilClass = classifySoilTexture(sand, clay, silt);

      return {
        tower,
        healthScore,
        temperatureRange,
        rainfallSummary,
        soilClass,
        biodiversityCount: 0, // Will be set by individual queries
      };
    });
  }, [towers, sites]);

  if (towersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50">
        <DataState state="loading" />
      </div>
    );
  }

  if (towersError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50 px-6">
        <DataState state="error" message={(error as Error)?.message ?? "Unable to load water towers"} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen px-6 py-12 md:px-12 md:py-16"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(12, 37, 14, 0.72), rgba(255, 255, 255, 0.92) 38%, rgba(255, 255, 255, 0.98)), url(${heroBgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12 space-y-6 text-center md:text-left text-white drop-shadow">
          <p className="text-xs uppercase tracking-[0.4em] text-soft-green-50 font-medium">Directory</p>
          <h1 className="text-4xl md:text-5xl font-semibold leading-tight">Kenya's 18 Gazetted Water Towers</h1>
          <p className="text-lg max-w-2xl text-white/90">
            Explore each water tower's health, climate data, and biodiversity to understand restoration opportunities.
          </p>
          <div className="flex flex-wrap items-center gap-2 text-xs text-white/90">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-3 py-1 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-soft-green-500" /> Healthy
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-3 py-1 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-amber-500" /> Moderate
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/20 px-3 py-1 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-rose-500" /> Critical
            </span>
          </div>
          <div className="flex items-center gap-4">
            <select
              value={selectedDays}
              onChange={(e) => setSelectedDays(Number(e.target.value))}
              className="rounded-full bg-white/90 border border-warm-200 text-charcoal-700 px-4 py-2 text-sm font-medium shadow-sm hover:border-soft-green-400 focus:outline-none focus:ring-2 focus:ring-soft-green-500 focus:border-transparent transition-all backdrop-blur"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
            </select>
            <button
              type="button"
              onClick={() => enrichMutation.mutate()}
              disabled={enrichMutation.isPending}
              className="rounded-full bg-soft-green-600 hover:bg-soft-green-700 disabled:bg-soft-green-300 text-white px-6 py-2.5 text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200 backdrop-blur"
            >
              {enrichMutation.isPending ? `Refreshing last ${selectedDays} days…` : `Refresh data (last ${selectedDays} days)`}
            </button>
            {enrichMutation.isSuccess && (
              <span className="text-xs text-soft-green-50 font-medium">
                Updated {ndviStartStr} → {ndviEndStr}
              </span>
            )}
            {enrichMutation.isError && (
              <span className="text-xs text-rose-50 font-medium">Refresh failed</span>
            )}
          </div>
        </header>

        {/* Grid of Tower Cards */}
        <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
          {towerCards.map((cardData) => (
            <TowerCard
              key={cardData.tower.id}
              data={cardData}
              onSelect={() => navigate(`/towers/${cardData.tower.id}`)}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

interface TowerCardProps {
  data: TowerCardData;
  onSelect: () => void;
}

const TowerCard = ({ data, onSelect }: TowerCardProps) => {
  const { tower, healthScore, temperatureRange, rainfallSummary, soilClass } = data;
  const { data: biodiversity = [] } = useBiodiversityByTower(tower.id);
  const biodiversityCount = biodiversity.length;

  return (
    <button
      onClick={onSelect}
      className="text-left rounded-3xl border border-warm-200 bg-white/95 p-6 shadow-sm hover:shadow-lg transition-all duration-300"
    >
      {/* Tower Name */}
      <h3 className="text-xl font-semibold text-charcoal-900 mb-4">{tower.name}</h3>

      {/* NDVI Health Score */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs uppercase tracking-[0.2em] text-charcoal-500 font-medium">Health Score</span>
          <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getHealthScoreColor(healthScore)}`}>
            {getHealthScoreLabel(healthScore)}
          </span>
        </div>
        {healthScore != null && (
          <div className="w-full bg-warm-100 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                healthScore >= 0.7
                  ? "bg-soft-green-500"
                  : healthScore >= 0.4
                  ? "bg-amber-500"
                  : "bg-rose-500"
              }`}
              style={{ width: `${healthScore * 100}%` }}
            />
          </div>
        )}
      </div>

      {/* Stats Grid */}
      <div className="space-y-3">
        {/* Temperature Range */}
        <div className="flex items-center justify-between py-2 border-b border-warm-100">
          <span className="text-sm text-charcoal-600">Temperature</span>
          <span className="text-sm font-medium text-charcoal-900">{temperatureRange}</span>
        </div>

        {/* Rainfall Summary */}
        <div className="flex items-center justify-between py-2 border-b border-warm-100">
          <span className="text-sm text-charcoal-600">Rainfall</span>
          <span className="text-sm font-medium text-charcoal-900">{rainfallSummary}</span>
        </div>

        {/* Soil Class */}
        <div className="flex items-center justify-between py-2 border-b border-warm-100">
          <span className="text-sm text-charcoal-600">Soil Class</span>
          <span className="text-sm font-medium text-charcoal-900">{soilClass}</span>
        </div>

        {/* Biodiversity Richness */}
        <div className="flex items-center justify-between py-2">
          <span className="text-sm text-charcoal-600">Biodiversity</span>
          <span className="text-sm font-medium text-charcoal-900">
            {biodiversityCount} {biodiversityCount === 1 ? "species" : "species"}
          </span>
        </div>
      </div>

      {/* Click indicator */}
      <div className="mt-4 pt-4 border-t border-warm-100">
        <p className="text-xs text-soft-green-600 font-medium text-center">View details →</p>
      </div>
    </button>
  );
};

export default WaterTowersDirectory;

