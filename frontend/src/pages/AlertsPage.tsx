import { useEffect, useMemo, useState } from "react";

import DataState from "../components/shared/DataState";
import { useSiteFeatures } from "../hooks/useSite";
import { useSites } from "../hooks/useSites";

const AlertsPage = () => {
  const { data: sites, isLoading: sitesLoading, isError: sitesError, error: sitesErrorMsg } = useSites();
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);

  useEffect(() => {
    if (!selectedSiteId && sites?.length) {
      setSelectedSiteId(sites[0].id);
    }
  }, [sites, selectedSiteId]);

  const { data: features, isLoading, isError, error } = useSiteFeatures(selectedSiteId ?? "");

  const latestFeature = useMemo(() => {
    if (!features?.length) return null;
    return features.reduce((latest, current) =>
      new Date(current.created_at) > new Date(latest.created_at) ? current : latest,
    );
  }, [features]);

  const alerts = useMemo(() => {
    if (!latestFeature) return [];
    const generated = [];
    if (latestFeature.ndvi_mean != null && latestFeature.ndvi_mean < 0.2) {
      generated.push({
        id: "ndvi",
        title: "Low vegetation index",
        detail: `NDVI dropped to ${latestFeature.ndvi_mean.toFixed(2)} (${new Date(
          latestFeature.created_at,
        ).toLocaleDateString()})`,
        severity: "High",
      });
    }
    if (latestFeature.rainfall_total_mm != null && latestFeature.rainfall_total_mm < 50) {
      generated.push({
        id: "rainfall",
        title: "Rainfall deficit",
        detail: `Only ${latestFeature.rainfall_total_mm.toFixed(1)} mm recorded`,
        severity: "Medium",
      });
    }
    if (latestFeature.tmax_c != null && latestFeature.tmax_c > 32) {
      generated.push({
        id: "temp",
        title: "High temperature",
        detail: `Max temp ${latestFeature.tmax_c.toFixed(1)}°C`,
        severity: "Medium",
      });
    }
    return generated;
  }, [latestFeature]);

  if (sitesLoading || !sites) {
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

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Alerts</p>
        <h2 className="text-2xl font-semibold">Environmental rule-based alerts</h2>
        <p className="text-sm text-slate-400">
          Low NDVI, rainfall deficits, or abnormal temperatures trigger alerts instantly.
        </p>
      </header>

      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-4">
        <p className="text-xs uppercase tracking-[0.4em] text-slate-400">Site</p>
        <select
          className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm"
          value={selectedSiteId ?? ""}
          onChange={(event) => setSelectedSiteId(event.target.value)}
        >
          {sites.map((site) => (
            <option key={site.id} value={site.id}>
              {site.name}
            </option>
          ))}
        </select>
      </div>

      <section className="space-y-4">
        {isLoading ? (
          <DataState state="loading" />
        ) : isError ? (
          <DataState state="error" message={(error as Error)?.message ?? "Failed to load feature data"} />
        ) : alerts.length ? (
          alerts.map((alert) => (
            <article
              key={alert.id}
              className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5 shadow-sm"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{alert.title}</h3>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                  {alert.severity}
                </span>
              </div>
              <p className="mt-2 text-sm text-slate-300">{alert.detail}</p>
            </article>
          ))
        ) : (
          <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-5 text-sm text-slate-400">
            No alerts detected for the selected site. Trigger a feature extraction if you expect fresh data.
          </div>
        )}
      </section>
    </div>
  );
};

export default AlertsPage;
