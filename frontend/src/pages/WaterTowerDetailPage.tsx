import { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWaterTowers } from "../hooks/useWaterTowers";
import { useSites } from "../hooks/useSites";
import { useBiodiversityByTower } from "../hooks/useBiodiversityByTower";
import { useSiteFeatures } from "../hooks/useSite";
import WaterTowersMap from "../components/map/WaterTowersMap";
import DataState from "../components/shared/DataState";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { recommendSpeciesForTower } from "../lib/recommender";
import type { SpeciesRecommendation } from "../lib/recommender";
import SeedlingMarketplace from "../components/marketplace/SeedlingMarketplace";

// Helper to get trend indicator
const getTrendIcon = (value: number | null, previous: number | null) => {
  if (value == null || previous == null) return <Minus className="w-4 h-4 text-charcoal-400" />;
  if (value > previous) return <TrendingUp className="w-4 h-4 text-soft-green-600" />;
  if (value < previous) return <TrendingDown className="w-4 h-4 text-rose-600" />;
  return <Minus className="w-4 h-4 text-charcoal-400" />;
};

// Helper to get health score color
const getHealthScoreColor = (score: number | null | undefined): string => {
  if (score == null) return "text-charcoal-500";
  if (score >= 0.7) return "text-soft-green-600";
  if (score >= 0.4) return "text-amber-600";
  return "text-rose-600";
};

const WaterTowerDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: towers, isLoading: towersLoading, isError: towersError, error } = useWaterTowers();
  const { data: sites } = useSites();
  const [marketplaceOpen, setMarketplaceOpen] = useState(false);
  const [selectedSpecies, setSelectedSpecies] = useState<SpeciesRecommendation | null>(null);

  const tower = useMemo(() => {
    if (!towers || !id) return null;
    return towers.find((t) => t.id === id) ?? null;
  }, [towers, id]);

  // Find associated sites
  const associatedSites = useMemo(() => {
    if (!sites || !tower) return [];
    return sites.filter((site) => {
      const siteMetadata = site as any;
      return siteMetadata.water_tower_id === tower.id;
    });
  }, [sites, tower]);

  // Get features from first associated site
  const firstSite = associatedSites[0];
  const { data: features = [] } = useSiteFeatures(firstSite?.id ?? "");
  const latestFeature = useMemo(() => {
    if (!features.length) return null;
    return features.reduce((latest, current) =>
      new Date(current.created_at) > new Date(latest.created_at) ? current : latest
    );
  }, [features]);

  // Get biodiversity data
  const {
    data: biodiversity = [],
    isLoading: biodiversityLoading,
  } = useBiodiversityByTower(tower?.id ?? "");

  // Calculate KPIs from metadata and features
  const metadata = tower?.metadata as Record<string, unknown> | undefined;
  
  // NDVI Health Score
  const healthScore = useMemo(() => {
    if (metadata?.health_score != null) {
      const score = typeof metadata.health_score === "number" 
        ? metadata.health_score 
        : parseFloat(String(metadata.health_score));
      if (!isNaN(score)) return score;
    }
    if (latestFeature?.ndvi_mean != null) {
      const ndvi = latestFeature.ndvi_mean;
      return (ndvi + 1) / 2; // Normalize -1 to 1 range to 0 to 1
    }
    if (metadata?.ndvi_mean != null) {
      const ndvi = typeof metadata.ndvi_mean === "number" 
        ? metadata.ndvi_mean 
        : parseFloat(String(metadata.ndvi_mean));
      if (!isNaN(ndvi)) return (ndvi + 1) / 2;
    }
    return null;
  }, [metadata, latestFeature]);

  // Temperature
  const temperature = useMemo(() => {
    if (latestFeature?.tmin_c != null && latestFeature?.tmax_c != null) {
      return (latestFeature.tmin_c + latestFeature.tmax_c) / 2;
    }
    if (metadata?.temp_mean_c != null) {
      return typeof metadata.temp_mean_c === "number" 
        ? metadata.temp_mean_c 
        : parseFloat(String(metadata.temp_mean_c));
    }
    return null;
  }, [latestFeature, metadata]);

  // Rainfall
  const rainfall = useMemo(() => {
    if (latestFeature?.rainfall_total_mm != null) {
      return latestFeature.rainfall_total_mm;
    }
    if (metadata?.rainfall_mm != null) {
      return typeof metadata.rainfall_mm === "number" 
        ? metadata.rainfall_mm 
        : parseFloat(String(metadata.rainfall_mm));
    }
    return null;
  }, [latestFeature, metadata]);

  // Soil pH
  const soilPh = useMemo(() => {
    if (latestFeature?.ph != null) return latestFeature.ph;
    if (metadata?.ph != null) {
      return typeof metadata.ph === "number" ? metadata.ph : parseFloat(String(metadata.ph));
    }
    return null;
  }, [latestFeature, metadata]);

  // Threatened species count (stub - would need IUCN status in real data)
  const threatenedCount = useMemo(() => {
    // For now, return 0 or a placeholder
    return 0;
  }, [biodiversity]);

  // Calculate drought risk (stub - would use historical data)
  const droughtRisk = useMemo<"low" | "medium" | "high" | null>(() => {
    if (rainfall == null) return null;
    if (rainfall < 600) return "high";
    if (rainfall < 1000) return "medium";
    return "low";
  }, [rainfall]);

  // Get soil organic carbon and clay from features
  const soilOrganicCarbon = useMemo(() => {
    if (latestFeature?.soc != null) return latestFeature.soc;
    const metadata = tower?.metadata as Record<string, unknown> | undefined;
    if (metadata?.soc != null) {
      return typeof metadata.soc === "number" ? metadata.soc : parseFloat(String(metadata.soc));
    }
    return null;
  }, [latestFeature, tower]);

  const clayPercent = useMemo(() => {
    if (latestFeature?.clay != null) {
      // Convert to percentage if needed
      return latestFeature.clay > 1 ? latestFeature.clay : latestFeature.clay * 100;
    }
    const metadata = tower?.metadata as Record<string, unknown> | undefined;
    if (metadata?.clay != null) {
      const clay = typeof metadata.clay === "number" ? metadata.clay : parseFloat(String(metadata.clay));
      return clay > 1 ? clay : clay * 100;
    }
    return null;
  }, [latestFeature, tower]);

  // Recommended species using the recommender utility
  const recommendedSpecies = useMemo(() => {
    if (!tower) return [];

    return recommendSpeciesForTower(
      tower.id,
      healthScore, // Using health score as NDVI proxy
      {
        temperature,
        rainfall,
        droughtRisk,
      },
      {
        ph: soilPh,
        organicCarbon: soilOrganicCarbon,
        clayPercent,
      },
      {
        existingSpecies: biodiversity.map((s) => s.scientific_name),
      }
    );
  }, [tower, healthScore, temperature, rainfall, droughtRisk, soilPh, soilOrganicCarbon, clayPercent, biodiversity]);

  if (towersLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50">
        <DataState state="loading" />
      </div>
    );
  }

  if (towersError || !tower) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50 px-6">
        <DataState state="error" message={(error as Error)?.message ?? "Water tower not found"} />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        backgroundImage: `radial-gradient(120% 120% at 50% 0%, rgba(255,255,255,0.18), rgba(10, 28, 14, 0.78) 45%, rgba(10, 28, 14, 0.9)), linear-gradient(180deg, rgba(10, 28, 14, 0.8), rgba(255,255,255,0.96) 62%, rgba(255,255,255,0.98)), url(/images/karuru-falls-aberdares2-1.jpg)`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      {/* Hero Section */}
      <div className="border-b border-white/20 bg-white/10 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 py-12 md:px-12 md:py-16 text-white drop-shadow">
          <button
            onClick={() => navigate("/towers")}
            className="text-sm text-white/85 hover:text-white mb-6 inline-flex items-center gap-2"
          >
            ← Back to directory
          </button>
          
          <h1 className="text-4xl md:text-5xl font-semibold mb-8">{tower.name}</h1>

          {/* KPI Row */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 md:gap-6">
            {/* NDVI Health Score - Large */}
            <div className="col-span-2 md:col-span-1 rounded-2xl border border-white/25 bg-white/12 p-6 shadow-xl backdrop-blur">
              <p className="text-xs uppercase tracking-[0.3em] text-white/75 font-medium mb-2">Health Score</p>
              <p className={`text-4xl font-bold ${getHealthScoreColor(healthScore).replace("text-charcoal-500","text-white/80")} mb-1`}>
                {healthScore != null ? healthScore.toFixed(2) : "—"}
              </p>
              {healthScore != null && (
                <div className="w-full bg-white/20 rounded-full h-2 mt-2">
                  <div
                    className={`h-2 rounded-full ${
                      healthScore >= 0.7
                        ? "bg-soft-green-400"
                        : healthScore >= 0.4
                        ? "bg-amber-400"
                        : "bg-rose-400"
                    }`}
                    style={{ width: `${healthScore * 100}%` }}
                  />
                </div>
              )}
            </div>

            {/* Temp Trend */}
            <div className="rounded-2xl border border-white/25 bg-white/12 p-4 shadow-xl backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/75 font-medium mb-1">Temperature</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-semibold text-white">
                  {temperature != null ? `${temperature.toFixed(1)}°C` : "—"}
                </p>
                {getTrendIcon(temperature, temperature)}
              </div>
            </div>

            {/* Rainfall Trend */}
            <div className="rounded-2xl border border-white/25 bg-white/12 p-4 shadow-xl backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/75 font-medium mb-1">Rainfall</p>
              <div className="flex items-center gap-2">
                <p className="text-2xl font-semibold text-white">
                  {rainfall != null ? `${rainfall.toFixed(0)} mm` : "—"}
                </p>
                {getTrendIcon(rainfall, rainfall)}
              </div>
            </div>

            {/* Soil Fertility/pH */}
            <div className="rounded-2xl border border-white/25 bg-white/12 p-4 shadow-xl backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/75 font-medium mb-1">Soil pH</p>
              <p className="text-2xl font-semibold text-white">
                {soilPh != null ? soilPh.toFixed(1) : "—"}
              </p>
            </div>

            {/* Biodiversity */}
            <div className="rounded-2xl border border-white/25 bg-white/12 p-4 shadow-xl backdrop-blur">
              <p className="text-xs uppercase tracking-[0.2em] text-white/75 font-medium mb-1">Biodiversity</p>
              <p className="text-2xl font-semibold text-white">{biodiversity.length}</p>
              <p className="text-xs text-white/75 mt-1">
                {threatenedCount > 0 ? `${threatenedCount} threatened` : "species"}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Map Section */}
      <div className="max-w-7xl mx-auto px-6 py-12 md:px-12">
        <div className="rounded-2xl border border-warm-200 bg-white shadow-lg overflow-hidden">
          <div className="h-[60vh] md:h-[70vh]">
            <WaterTowersMap
              towers={tower ? [tower] : []}
              loading={false}
              selectedTowerId={tower.id}
              onSelectTower={() => {}}
            />
          </div>
        </div>
      </div>

      {/* Indigenous Species Section */}
      <div
        className="max-w-7xl mx-auto px-6 py-12 md:px-12"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(10, 28, 14, 0.82), rgba(10, 28, 14, 0.78)), linear-gradient(180deg, rgba(10,28,14,0.05), rgba(255,255,255,0.9))",
        }}
      >
        <h2 className="text-3xl font-semibold text-white drop-shadow mb-6">Indigenous Species Thriving Here</h2>
        {biodiversityLoading ? (
          <DataState state="loading" />
        ) : biodiversity.length === 0 ? (
          <div className="rounded-2xl border border-white/25 bg-white/92 p-8 text-center shadow-lg backdrop-blur">
            <p className="text-charcoal-700">No biodiversity records available for this tower yet.</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {biodiversity.map((species) => (
              <div
                key={species.scientific_name}
                className="rounded-2xl border border-white/25 bg-white/95 p-6 shadow-lg hover:shadow-xl transition-shadow backdrop-blur"
              >
                <h3 className="font-semibold text-charcoal-900 mb-2">{species.scientific_name}</h3>
                <p className="text-sm text-charcoal-600 mb-2">
                  {species.local_name ?? species.english_common_name ?? "Local name pending"}
                </p>
                <p className="text-xs text-charcoal-500">
                  {species.records.length} observation{species.records.length === 1 ? "" : "s"}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Recommended Species Section */}
      <div
        className="px-6 py-12 md:px-12 pb-20"
        style={{
          backgroundImage:
            "linear-gradient(180deg, rgba(10, 28, 14, 0.9), rgba(10, 28, 14, 0.82)), linear-gradient(180deg, rgba(10,28,14,0.12), rgba(255,255,255,0.97))",
        }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3 mb-2">
            <h2 className="text-3xl font-semibold text-white drop-shadow">Recommended Species to Plant Next</h2>
            <p className="text-sm text-white/80 drop-shadow">Curated from NDVI, climate, soil, and biodiversity signals</p>
          </div>
          <p className="text-sm text-white/85 mb-4 drop-shadow">Rooted for {tower.name} so you can plant with confidence.</p>

          <div className="rounded-3xl border border-white/20 bg-white/90 shadow-xl p-5 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 backdrop-blur">
            <div>
              <p className="text-base font-semibold text-charcoal-900">New planter? Get seedlings from a nearby community nursery</p>
              <p className="text-sm text-charcoal-700 mt-1">
                We’ll show nurseries closest to {tower.name} with indigenous species ready to pick up.
              </p>
            </div>
            <button
              onClick={() => navigate(`/towers/${tower.id}/nurseries`)}
              className="inline-flex items-center justify-center rounded-full bg-soft-green-600 hover:bg-soft-green-700 text-white px-5 py-3 text-sm font-semibold shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              Find Community Nurseries Near Me
            </button>
          </div>
          {recommendedSpecies.length === 0 ? (
            <div className="rounded-3xl border border-white/30 bg-white/10 p-12 text-center shadow-2xl backdrop-blur">
              <p className="text-lg font-semibold text-white mb-3 drop-shadow">All common indigenous species are already present.</p>
              <p className="text-base text-white/90 drop-shadow">Check again after the next monitoring cycle for fresh recommendations.</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recommendedSpecies.map((species) => (
                <div
                  key={species.scientificName}
                  className="rounded-3xl border border-white/20 bg-white/92 p-6 shadow-lg hover:shadow-xl transition-all duration-300 backdrop-blur"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-semibold text-charcoal-900 mb-1">{species.scientificName}</h3>
                      {species.localName && (
                        <p className="text-sm text-charcoal-600">{species.localName}</p>
                      )}
                    </div>
                    <div className="ml-4">
                      <div className="rounded-full bg-soft-green-100 px-3 py-1">
                        <span className="text-xs font-semibold text-soft-green-700">
                          {Math.round(species.confidence * 100)}% match
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Reasons */}
                  <div className="mb-4 space-y-2">
                    {species.reasons.slice(0, 3).map((reason, idx) => (
                      <p key={idx} className="text-xs text-charcoal-600 leading-relaxed">
                        • {reason}
                      </p>
                    ))}
                    {species.reasons.length > 3 && (
                      <p className="text-xs text-charcoal-500 italic">
                        +{species.reasons.length - 3} more factors
                      </p>
                    )}
                  </div>

                  {/* Get Seedling Button */}
                  <button
                    onClick={() => {
                      setSelectedSpecies(species);
                      setMarketplaceOpen(true);
                    }}
                    className="w-full rounded-full bg-soft-green-600 hover:bg-soft-green-700 text-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    Get Seedling
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <SeedlingMarketplace
        open={marketplaceOpen}
        onClose={() => setMarketplaceOpen(false)}
        tower={tower}
        speciesName={selectedSpecies?.scientificName ?? ""}
      />
    </div>
  );
};

export default WaterTowerDetailPage;

