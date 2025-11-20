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
    onSuccess: () => refetchFeatures(),
  });

  const predictionMutation = useMutation({
    mutationFn: () => triggerPrediction(siteId ?? ""),
    onSuccess: (prediction) => {
      setLastPrediction(prediction);
    },
  });

  const latestFeature = useMemo<SiteFeature | undefined>(() => {
    if (!features?.length) return undefined;
    return features.reduce((latest, item) => (latest.date > item.date ? latest : item));
  }, [features]);

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
            <ScoreBadge score={lastPrediction?.survival_score ?? null} />
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
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Latest NDVI Mean</p>
              <p className="text-2xl font-semibold text-brand-gray">
                {latestFeature?.ndvi_mean != null ? latestFeature.ndvi_mean.toFixed(2) : "Awaiting data"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Rainfall (mm)</p>
              <p className="text-2xl font-semibold text-brand-gray">
                {latestFeature?.rainfall != null ? latestFeature.rainfall.toFixed(1) : "Awaiting data"}
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4">
              <p className="text-sm text-slate-500">Temperature (°C)</p>
              <p className="text-2xl font-semibold text-brand-gray">
                {latestFeature?.temperature != null ? latestFeature.temperature.toFixed(1) : "Awaiting data"}
              </p>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-6">
            {isLoadingFeatures ? (
              <DataState state="loading" />
            ) : isFeaturesError ? (
              <DataState state="error" message={(featuresError as Error).message} />
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
                  <th className="px-4 py-3 text-left font-medium text-slate-600">Observations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {biodiversityRows.map((species) => (
                  <tr key={species.scientific_name}>
                    <td className="px-4 py-3 font-medium text-brand-gray">{species.scientific_name}</td>
                    <td className="px-4 py-3 text-slate-600">{species.local_name}</td>
                    <td className="px-4 py-3 text-slate-600">{species.english_common_name ?? "—"}</td>
                    <td className="px-4 py-3 text-slate-600">{species.records}</td>
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
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {nurseryRows.map((nursery) => (
                  <tr key={nursery.id}>
                    <td className="px-4 py-3 font-medium text-brand-gray">{nursery.name}</td>
                    <td className="px-4 py-3 text-slate-600">
                      {nursery.species_scientific}
                      <span className="text-xs text-slate-400"> · {nursery.species_local}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{nursery.capacity_seedlings ?? "—"}</td>
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
