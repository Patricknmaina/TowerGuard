import { useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import StatCard from "../components/cards/StatCard";
import DataState from "../components/shared/DataState";
import { triggerFeatureExtraction, triggerPrediction } from "../api/client";
import { useSiteFeatures } from "../hooks/useSite";
import { useSites } from "../hooks/useSites";
import { useWaterTowers } from "../hooks/useWaterTowers";
import { useBiodiversityByTower } from "../hooks/useBiodiversityByTower";
import type { SitePrediction } from "../api/types";

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const AnalyticsPage = () => {
  const [searchParams] = useSearchParams();
  const towerIdFromUrl = searchParams.get("tower_id");
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(towerIdFromUrl);

  const { data: towers = [], isLoading: towersLoading } = useWaterTowers();
  const { data: sites, isLoading: sitesLoading, isError: sitesError, error: sitesErrorMsg } = useSites();

  useEffect(() => {
    if (towerIdFromUrl) {
      setSelectedTowerId(towerIdFromUrl);
    }
  }, [towerIdFromUrl]);

  const selectedTower = towers.find((tower) => tower.id === selectedTowerId);
  const selectedSite = sites?.find((site) => site.water_tower_id === selectedTowerId);
  const selectedSiteId = selectedSite?.id ?? null;

  const defaultEnd = new Date();
  const defaultStart = new Date(defaultEnd);
  defaultStart.setDate(defaultEnd.getDate() - 30);
  const [dateRange, setDateRange] = useState({
    start: formatDate(defaultStart),
    end: formatDate(defaultEnd),
  });

  const {
    data: features,
    isLoading: featuresLoading,
    isError: featuresError,
    error: featuresErrorMsg,
    refetch: refetchFeatures,
  } = useSiteFeatures(selectedSiteId ?? "");

  const [lastPrediction, setLastPrediction] = useState<SitePrediction | null>(null);

  const featureMutation = useMutation({
    mutationFn: () =>
      triggerFeatureExtraction(selectedSiteId ?? "", {
        start_date: dateRange.start,
        end_date: dateRange.end,
      }),
    onSuccess: () => {
      refetchFeatures();
    },
  });

  const predictionMutation = useMutation({
    mutationFn: () => triggerPrediction(selectedSiteId ?? ""),
    onSuccess: (prediction) => {
      setLastPrediction(prediction);
    },
  });

  const latestFeature = useMemo(() => {
    if (!features?.length) return null;
    return features.reduce((latest, current) =>
      new Date(current.created_at) > new Date(latest.created_at) ? current : latest,
    );
  }, [features]);

  const {
    data: biodiversity = [],
    isLoading: biodiversityLoading,
    isError: biodiversityError,
    error: biodiversityErrorMsg,
  } = useBiodiversityByTower(selectedTowerId ?? "");

  const analyticsCards = [
    {
      label: "NDVI mean",
      value: latestFeature?.ndvi_mean != null ? latestFeature.ndvi_mean.toFixed(2) : "Awaiting data",
      description: "Vegetation index (latest extract)",
    },
    {
      label: "Rainfall",
      value:
        latestFeature?.rainfall_total_mm != null
          ? `${latestFeature.rainfall_total_mm.toFixed(1)} mm`
          : "Awaiting data",
      description: "Rainfall total (latest extract)",
    },
    {
      label: "Temperature",
      value:
        latestFeature?.tmin_c != null && latestFeature?.tmax_c != null
          ? `${((latestFeature.tmin_c + latestFeature.tmax_c) / 2).toFixed(1)} °C`
          : "Awaiting data",
      description: "Mean of min/max temps",
    },
    {
      label: "Model score",
      value:
        lastPrediction?.score != null ? lastPrediction.score.toFixed(2) : "Awaiting scoring",
      description: "Latest prediction run",
    },
  ];

  if (towersLoading || sitesLoading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <DataState state="loading" />
      </div>
    );
  }

  if (sitesError) {
    return (
      <div className="rounded-3xl border border-rose-500 bg-rose-500/10 p-6">
        <DataState state="error" message={(sitesErrorMsg as Error)?.message ?? "Unable to load sites"} />
      </div>
    );
  }

  if (!selectedTowerId) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6 text-center text-slate-400">
        Select a tower from <Link className="text-emerald-300" to="/">Explore</Link> to begin analytics.
      </div>
    );
  }

  if (!selectedSite) {
    return (
      <div className="rounded-3xl border border-rose-500 bg-rose-500/10 p-6">
        <p className="text-sm text-slate-100">
          No analytics site is linked to tower {selectedTowerId}. Create a site entry first.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.4em] text-slate-400">
          <Link to="/" className="text-emerald-300">Explore</Link>
          <span className="text-slate-500">→</span>
          <span className="text-slate-300">{selectedTower?.name ?? "Tower"} analytics</span>
        </div>
        <h2 className="text-2xl font-semibold">Site health and prediction metrics</h2>
        <p className="text-sm text-slate-400">
          NDVI, rainfall, temperature, and model scoring for the selected water tower.
        </p>
      </header>

      <div className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900/70 p-4 md:grid-cols-3">
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Tower</p>
          <p className="mt-2 text-sm text-slate-200">{selectedTower?.name ?? "Unnamed"}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Date range</p>
          <div className="mt-2 flex gap-2">
            <input
              type="date"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={dateRange.start}
              onChange={(event) => setDateRange((prev) => ({ ...prev, start: event.target.value }))}
            />
            <input
              type="date"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
              value={dateRange.end}
              onChange={(event) => setDateRange((prev) => ({ ...prev, end: event.target.value }))}
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <button
            type="button"
            disabled={featureMutation.isPending}
            onClick={() => featureMutation.mutate()}
            className="rounded-full border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20 disabled:opacity-40"
          >
            {featureMutation.isPending ? "Extracting…" : "Fetch features"}
          </button>
          <button
            type="button"
            disabled={predictionMutation.isPending || !latestFeature}
            onClick={() => predictionMutation.mutate()}
            className="rounded-full border border-amber-400 px-4 py-2 text-sm font-semibold text-amber-200 transition hover:bg-amber-400/20 disabled:opacity-40"
          >
            {predictionMutation.isPending ? "Scoring…" : "Run prediction"}
          </button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {analyticsCards.map((card) => (
          <StatCard
            key={card.label}
            label={card.label}
            value={card.value}
            description={card.description}
          />
        ))}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        {featuresLoading ? (
          <DataState state="loading" />
        ) : featuresError ? (
          <DataState state="error" message={(featuresErrorMsg as Error)?.message ?? "Failed to load features"} />
        ) : latestFeature ? (
          <p className="text-sm text-slate-300">
            Latest features extracted on {new Date(latestFeature.created_at).toLocaleString()}.
          </p>
        ) : (
          <p className="text-sm text-slate-400">No feature data yet. Trigger an extraction to begin.</p>
        )}
      </section>

      <section className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-semibold text-white">Species observations</h3>
          <span className="text-xs uppercase tracking-[0.3em] text-emerald-300">
            {biodiversity.length} species
          </span>
        </div>
        {biodiversityLoading ? (
          <DataState state="loading" />
        ) : biodiversityError ? (
          <DataState state="error" message={(biodiversityErrorMsg as Error)?.message ?? "Failed to load biodiversity"} />
        ) : biodiversity.length ? (
          <div className="grid gap-4 md:grid-cols-2">
            {biodiversity.map((species) => (
              <div key={species.species_id} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-base font-semibold text-white">{species.scientific_name}</h4>
                    <p className="text-xs text-slate-400">
                      {species.local_name ?? "Local name unknown"} · {species.english_common_name ?? "Common name pending"}
                    </p>
                  </div>
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-800">
                    {species.records.length} obs
                  </span>
                </div>
                <ul className="mt-3 space-y-1 text-xs text-slate-400">
                  {species.records.slice(0, 2).map((record) => (
                    <li key={record.id}>
                      {record.observed_at ? new Date(record.observed_at).toLocaleDateString() : "Date unknown"} ·
                      {record.source ?? "Source unknown"}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No biodiversity records synced for this tower yet.</p>
        )}
      </section>
    </div>
  );
};

export default AnalyticsPage;
