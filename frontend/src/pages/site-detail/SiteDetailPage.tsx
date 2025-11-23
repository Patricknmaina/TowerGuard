import { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import ScoreBadge from "../../components/shared/ScoreBadge";
import DataState from "../../components/shared/DataState";
import NdviTrend from "../../components/shared/NdviTrend";
import { triggerFeatureExtraction, triggerPrediction } from "../../api/client";
import type { SiteFeature, SitePrediction } from "../../api/types";
import { useBiodiversity } from "../../hooks/useBiodiversity";
import { useNurseries } from "../../hooks/useNurseries";
import { useSite, useSiteFeatures } from "../../hooks/useSite";

const tabs = [
  { id: "project", label: "Project" },
  { id: "biodiversity", label: "Biodiversity" },
  { id: "nurseries", label: "Nurseries" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const formatErrorMessage = (error?: unknown) => {
  if (!error) return undefined;
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  try {
    return JSON.stringify(error);
  } catch {
    return "Unknown error";
  }
};

const SiteDetailPage = () => {
  const { siteId } = useParams();
  const [activeTab, setActiveTab] = useState<TabId>("project");
  const [lastPrediction, setLastPrediction] = useState<SitePrediction | null>(null);

  const {
    data: site,
    isLoading: isLoadingSite,
    isError: isSiteError,
    error: siteError,
  } = useSite(siteId ?? "");

  const {
    data: features,
    isLoading: isLoadingFeatures,
    isError: isFeaturesError,
    error: featuresError,
    refetch: refetchFeatures,
  } = useSiteFeatures(siteId ?? "");

  const { data: biodiversity, isLoading: isLoadingBio } = useBiodiversity(siteId ?? "");
  const { data: nurseries, isLoading: isLoadingNurseries } = useNurseries();

  const featureExtraction = useMutation({
    mutationFn: () => {
      const end = new Date();
      const start = new Date();
      start.setDate(end.getDate() - 30);
      return triggerFeatureExtraction(siteId ?? "", {
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
      });
    },
    onSuccess: () => {
      refetchFeatures();
    },
  });

  const predictionMutation = useMutation({
    mutationFn: () => triggerPrediction(siteId ?? ""),
    onSuccess: (prediction) => {
      setLastPrediction(prediction);
    },
  });

  const latestFeature = useMemo<SiteFeature | undefined>(() => {
    if (!features?.length) return undefined;
    return features.reduce((latest, item) =>
      new Date(latest.created_at).getTime() > new Date(item.created_at).getTime() ? latest : item,
    );
  }, [features]);

  const featureCards = [
    {
      label: "NDVI Mean",
      value: latestFeature?.ndvi_mean,
      suffix: "",
    },
    {
      label: "Rainfall (mm)",
      value: latestFeature?.rainfall_total_mm,
      suffix: "mm",
    },
    {
      label: "Temperature (°C)",
      value:
        latestFeature?.tmin_c != null && latestFeature?.tmax_c != null
          ? ((latestFeature.tmin_c + latestFeature.tmax_c) / 2).toFixed(1)
          : undefined,
      suffix: "°C",
    },
    {
      label: "Soil pH",
      value: latestFeature?.ph,
      suffix: "",
    },
  ];

  if (!siteId) {
    return <DataState state="error" message="Missing site ID" />;
  }

  if (isLoadingSite) {
    return <DataState state="loading" />;
  }

  if (isSiteError || !site) {
    return <DataState state="error" message={(siteError as Error)?.message ?? "Site not found"} />;
  }

  const biodiversityRows = biodiversity ?? [];
  const nurseryRows = nurseries ?? [];

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-brand-teal">Site</p>
            <h2 className="text-3xl font-semibold text-brand-gray">{site.name}</h2>
            <p className="text-sm text-slate-500">{site.description}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <ScoreBadge score={lastPrediction?.score ?? null} />
            <div className="flex gap-2 text-sm">
              <button
                type="button"
                onClick={() => featureExtraction.mutate()}
                className="rounded-md border border-brand-green px-4 py-2 font-semibold text-brand-green"
                disabled={featureExtraction.isPending}
              >
                {featureExtraction.isPending ? "Fetching…" : "Fetch Latest Features"}
              </button>
              <button
                type="button"
                onClick={() => predictionMutation.mutate()}
                className="rounded-md bg-brand-green px-4 py-2 font-semibold text-white"
                disabled={predictionMutation.isPending}
              >
                {predictionMutation.isPending ? "Scoring…" : "Compute Health Score"}
              </button>
            </div>
            {(featureExtraction.isError || predictionMutation.isError) && (
              <div className="text-xs text-rose-600">
                {formatErrorMessage(featureExtraction.error) ?? formatErrorMessage(predictionMutation.error)}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`border-b-2 pb-4 text-sm font-semibold ${
              activeTab === tab.id ? "border-brand-green text-brand-green" : "border-transparent text-slate-500"
            }`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "project" && (
        <section className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map((card) => (
              <div
                key={card.label}
                className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-slate-50 p-4 shadow-sm"
              >
                <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">{card.label}</p>
                <p className="mt-2 text-2xl font-semibold text-slate-900">
                  {card.value != null ? `${parseFloat(card.value.toString()).toFixed(2)}${card.suffix}` : "Awaiting data"}
                </p>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-slate-500">Latest Feature Snapshot</p>
              <p className="text-xs text-slate-400">
                {latestFeature
                  ? `Extracted ${new Date(latestFeature.created_at).toLocaleString()}`
                  : "No features extracted yet."}
              </p>
            </div>
            {latestFeature?.partial && (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs text-amber-700">Partial data</span>
            )}
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            {isLoadingFeatures ? (
              <DataState state="loading" />
            ) : isFeaturesError ? (
              <DataState state="error" message={formatErrorMessage(featuresError)} />
            ) : (
              <NdviTrend features={features} />
            )}
          </div>
        </section>
      )}

      {activeTab === "biodiversity" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          {isLoadingBio ? (
            <DataState state="loading" />
          ) : biodiversityRows.length ? (
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Scientific Name</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Local Name</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Common</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Records</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Most Recent</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {biodiversityRows.map((species) => (
                  <tr key={species.scientific_name}>
                    <td className="px-4 py-3 font-medium text-brand-gray">{species.scientific_name}</td>
                    <td className="px-4 py-3 text-slate-600">{species.local_name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{species.english_common_name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{species.records.length}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {species.records[0]?.observed_at
                        ? new Date(species.records[0].observed_at).toLocaleDateString()
                        : "Date n/a"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <DataState state="empty" message="No biodiversity observations yet." />
          )}
        </section>
      )}

      {activeTab === "nurseries" && (
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          {isLoadingNurseries ? (
            <DataState state="loading" />
          ) : nurseryRows.length ? (
            <table className="min-w-full divide-y divide-slate-200 text-sm">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Nursery</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Species</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Capacity</th>
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {nurseryRows.map((nursery) => (
                  <tr key={nursery.id}>
                    <td className="px-4 py-3 font-medium text-brand-gray">{nursery.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {nursery.species_scientific ?? "Unknown"}
                      <span className="ml-2 text-xs text-slate-400">· {nursery.species_local ?? "Local name"}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{nursery.capacity_seedlings ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {nursery.lat?.toFixed(3)}, {nursery.lon?.toFixed(3)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <DataState state="empty" message="No nursery data nearby yet." />
          )}
        </section>
      )}
    </div>
  );
};

export default SiteDetailPage;
