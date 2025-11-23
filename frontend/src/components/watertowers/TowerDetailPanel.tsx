import type { TowerView } from "../../pages/DashboardPage";
import { riskBadgeColor, protectionBadgeColor } from "./towerStyles";
import { useState } from "react";

const detailTabs = ["overview", "data", "risk", "communities"] as const;
type DetailTab = (typeof detailTabs)[number];

interface TowerDetailPanelProps {
  tower?: TowerView;
}

const placeholderCommunities = [
  { communityName: "Nyandarua North", populationServed: 180000, primaryUse: "Domestic & irrigation" },
  { communityName: "Kericho South", populationServed: 220000, primaryUse: "Tea estates & domestic" },
  { communityName: "Tharaka Ridge", populationServed: 140000, primaryUse: "Hydropower & domestic" },
];

const TowerDetailPanel = ({ tower }: TowerDetailPanelProps) => {
  const [tab, setTab] = useState<DetailTab>("overview");

  if (!tower) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <p className="text-sm text-slate-500">Select a water tower to view details.</p>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-brand-teal">{tower.county ?? "Kenya"}</p>
          <h3 className="text-xl font-semibold text-brand-gray">{tower.name}</h3>
        </div>
        <div className="flex flex-wrap gap-2 text-xs">
          <span className={`rounded-full px-2 py-1 ${protectionBadgeColor(tower.protectionStatus)}`}>
            {tower.protectionStatus ?? "Gazetted"}
          </span>
          <span className={`rounded-full px-2 py-1 ${riskBadgeColor(tower.riskLevel)}`}>
            {tower.riskLevel ?? "Medium"}
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 text-sm text-slate-600 md:grid-cols-4">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Forest Cover</p>
          <p className="text-lg font-semibold text-brand-gray">{tower.keyMetrics?.forestCoverPct ?? 0}%</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Catchment Area</p>
          <p className="text-lg font-semibold text-brand-gray">
            {tower.keyMetrics?.catchmentAreaHa != null
              ? `${(tower.keyMetrics.catchmentAreaHa * 0.01).toFixed(2)} km²`
              : "N/A"}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Population Served</p>
          <p className="text-lg font-semibold text-brand-gray">{tower.keyMetrics?.populationServed ?? 0}</p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-400">Water Yield Index</p>
          <p className="text-lg font-semibold text-brand-gray">{tower.keyMetrics?.waterYieldIndex?.toFixed(2) ?? "0.00"}</p>
        </div>
      </div>

      <div className="mt-6 flex gap-4 border-b border-slate-200 text-sm font-semibold text-slate-600">
        {detailTabs.map((t) => (
          <button
            key={t}
            className={`border-b-2 pb-3 ${t === tab ? "border-brand-green text-brand-green" : "border-transparent"}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          <p>
            {tower.name} is a key water tower supporting downstream communities and hydrological services. {/* TODO: Replace with real description if available. */}
          </p>
          <div className="flex flex-wrap gap-2 text-xs">
            {"Montane forest, Grassland, Riparian".split(",").map((tag) => (
              <span key={tag.trim()} className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700">
                {tag.trim()}
              </span>
            ))}
          </div>
        </div>
      )}

      {tab === "data" && (
        <div className="mt-4 space-y-2 text-sm text-slate-600">
          <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 p-4 text-center text-slate-500">
            {/* TODO: Swap this placeholder with an actual time-series chart (e.g., Recharts) for forest/water trends. */}
            Chart placeholder: timeseries for NDVI/forest cover or water yield.
          </div>
        </div>
      )}

      {tab === "risk" && (
        <div className="mt-4 space-y-3 text-sm text-slate-600">
          {tower.hasCriticalAlert && (
            <div className="rounded-lg bg-rose-100 px-4 py-3 text-rose-700">
              High risk detected — prioritize monitoring and enforcement.
            </div>
          )}
          <ul className="space-y-2">
            {["Encroachment", "Illegal logging", "Agriculture expansion", "Climate stress"].map((driver) => (
              <li key={driver} className="flex items-center justify-between rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                <span>{driver}</span>
                <span className="text-xs text-slate-500">Observed</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {tab === "communities" && (
        <div className="mt-4 overflow-hidden rounded-lg border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Community</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Population Served</th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">Primary Use</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {placeholderCommunities.map((row) => (
                <tr key={row.communityName}>
                  <td className="px-3 py-2 font-semibold text-brand-gray">{row.communityName}</td>
                  <td className="px-3 py-2 text-slate-600">{row.populationServed.toLocaleString()}</td>
                  <td className="px-3 py-2 text-slate-600">{row.primaryUse}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default TowerDetailPanel;
