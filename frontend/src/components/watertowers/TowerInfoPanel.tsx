import { useMemo } from "react";
import type { TowerSite, TowerView } from "../../pages/DashboardPage";
import DataState from "../shared/DataState";
import { useBiodiversityByTower } from "../../hooks/useBiodiversityByTower";
import { protectionBadgeColor, riskBadgeColor } from "./towerStyles";
import { getTowerAreaHa } from "../../utils/towerAreaOverrides";

interface TowerInfoPanelProps {
  tower?: TowerView;
  towers: TowerView[];
  activeTab: "tower" | "communities" | "hydrology" | "biodiversity";
  onTabChange: (tab: TowerInfoPanelProps["activeTab"]) => void;
  selectedSiteId: string | null;
  onSelectSite: (id: string | null) => void;
  onOpenSearch: () => void;
  onOpenLayers: () => void;
  onOpenAnalytics: () => void;
  onOpenAlerts?: () => void;
}

const tabs: { id: TowerInfoPanelProps["activeTab"]; label: string }[] = [
  { id: "tower", label: "Tower Info" },
  { id: "communities", label: "Communities" },
  { id: "hydrology", label: "Hydrology" },
  { id: "biodiversity", label: "Biodiversity" },
];

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

const TowerInfoPanel = ({
  tower,
  activeTab,
  onTabChange,
  selectedSiteId,
  onSelectSite,
  onOpenSearch,
  onOpenLayers,
  onOpenAnalytics,
  onOpenAlerts,
}: TowerInfoPanelProps) => {
  const availableSites = tower?.sites ?? [];

  const activeSite = useMemo<TowerSite | undefined>(() => {
    if (!availableSites.length) return undefined;
    return availableSites.find((s) => s.id === selectedSiteId) ?? availableSites[0];
  }, [availableSites, selectedSiteId]);

  if (!tower) {
    return <div className="p-6 text-sm text-slate-200">Select a water tower to view details.</div>;
  }

  const metadata = tower.metadata as Record<string, unknown> | undefined;
  const {
    data: biodiversity,
    isLoading: isBiodiversityLoading,
    isError: isBiodiversityError,
    error: biodiversityError,
  } = useBiodiversityByTower(tower.id);

  const resolvedAreaHa = getTowerAreaHa(tower.id, tower.area_ha ?? null);

  const counties = tower.counties ?? [];
  const majorRivers = Array.isArray(metadata?.major_rivers as unknown)
    ? (metadata?.major_rivers as string[])
    : [];
  const elevation = typeof (metadata?.elevation_m as number) === "number" ? (metadata?.elevation_m as number) : undefined;
  const hydrologyCards = [
    {
      label: "Elevation",
      value: elevation ? `${elevation.toFixed(0)} m` : "Data pending",
      desc: "Approximate elevation from GeoJSON",
    },
    {
      label: "Catchment Area",
      value: resolvedAreaHa ? `${(resolvedAreaHa * 0.01).toLocaleString()} km²` : "—",
      desc: "Gazetted footprint",
    },
    {
      label: "Major Rivers",
      value: majorRivers.length ? majorRivers.join(", ") : "Awaiting data",
      desc: "Primary drainage routes",
    },
  ];

  return (
    <div className="flex h-full flex-col">
      <header className="flex items-center justify-between px-5 py-4 text-sm font-semibold text-emerald-50">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-emerald-300">Kenya Water Towers Observatory</p>
          <p className="text-base text-slate-200">18 gazetted towers</p>
        </div>
        <nav className="flex items-center gap-2 text-xs font-medium text-slate-200">
          <button onClick={onOpenSearch} className="rounded-full bg-slate-800 px-3 py-1 hover:bg-slate-700">
            Search
          </button>
          <button onClick={onOpenLayers} className="rounded-full bg-slate-800 px-3 py-1 hover:bg-slate-700">
            Layers
          </button>
          <button onClick={onOpenAnalytics} className="rounded-full bg-emerald-600 px-3 py-1 hover:bg-emerald-500">
            Analytics
          </button>
          {onOpenAlerts && (
            <button onClick={onOpenAlerts} className="rounded-full bg-rose-600 px-3 py-1 hover:bg-rose-500">
              Alerts
            </button>
          )}
        </nav>
      </header>

      <div className="px-5">
        <div className="h-40 overflow-hidden rounded-2xl bg-slate-800">
          {tower.imageUrl ? (
            <img src={tower.imageUrl} alt={tower.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-slate-200">Tower hero image</div>
          )}
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Water Tower</p>
            <h2 className="text-2xl font-semibold text-white">{tower.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-slate-800 px-3 py-1 text-emerald-100">{counties[0] ?? "Kenya"}</span>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-emerald-100">
                {resolvedAreaHa ? `${resolvedAreaHa.toLocaleString()} ha` : "Area unknown"}
              </span>
              <span className={`rounded-full px-3 py-1 ${protectionBadgeColor(tower.protectionStatus)}`}>
                {tower.protectionStatus ?? "Gazetted"}
              </span>
              <span className={`rounded-full px-3 py-1 ${riskBadgeColor(tower.riskLevel)}`}>
                {tower.riskLevel ?? "Medium"}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-200">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`rounded-lg px-3 py-2 font-medium ${
                activeTab === tab.id ? "bg-white/15 text-white" : "bg-slate-800 text-slate-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-4 text-sm text-slate-200">
          <label className="mb-1 block text-xs uppercase tracking-wide text-emerald-200">Tower Sites</label>
          <select
            value={activeSite?.id ?? ""}
            onChange={(e) => onSelectSite(e.target.value || null)}
            className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-white focus:border-emerald-300 focus:outline-none"
          >
            {availableSites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.name}
              </option>
            ))}
            {!availableSites.length && <option value="">No sites</option>}
          </select>
        </div>
      </div>

      <div className="mt-auto flex-1 overflow-y-auto px-5 pb-6 text-sm text-slate-100">
        {activeTab === "tower" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 shadow-md">
              <h3 className="text-base font-semibold text-white">Description</h3>
              <p className="mt-2 leading-relaxed text-slate-200">
                {tower.description ?? "This tower anchors a priority ecosystem network focused on conservation."}
              </p>
            </div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {hydrologyCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-slate-200 bg-gradient-to-br from-emerald-50 to-slate-800/10 p-4 shadow-sm"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-700">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold text-slate-900">{card.value}</p>
                  <p className="text-xs text-slate-500">{card.desc}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "communities" && (
          <div className="space-y-4">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-slate-200">
              <h3 className="text-base font-semibold text-white">Counties Served</h3>
              {counties.length ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {counties.map((county) => (
                    <span key={county} className="rounded-2xl border border-slate-700 bg-slate-800/70 px-3 py-1 text-xs font-semibold">
                      {county}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="mt-2 text-xs text-slate-400">County coverage data not yet available.</p>
              )}
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-4 text-slate-200">
              <h3 className="text-base font-semibold text-white">Stakeholder Brief</h3>
              <p className="mt-2 text-xs text-slate-400">
                Communities near this tower rely on the upland catchment for agriculture, domestic, and hydropower
                supply.
              </p>
            </div>
          </div>
        )}

        {activeTab === "hydrology" && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {hydrologyCards.map((card) => (
                <div
                  key={card.label}
                  className="rounded-2xl border border-slate-800 bg-gradient-to-br from-emerald-50 to-slate-50 p-4 shadow-sm text-slate-900"
                >
                  <p className="text-xs uppercase tracking-[0.3em] text-emerald-600">{card.label}</p>
                  <p className="mt-2 text-2xl font-semibold">{card.value}</p>
                  <p className="text-xs text-slate-500">{card.desc}</p>
                </div>
              ))}
            </div>
            <div className="rounded-2xl border border-dashed border-slate-700 bg-slate-900/70 p-4 text-slate-300">
              Hydrology charts are synced to backend datasets when available. Use the analytics overlay for time
              series and rainfall/flood monitoring.
            </div>
          </div>
        )}

        {activeTab === "biodiversity" && (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-base font-semibold text-white">Species observations</h3>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-700">
                {biodiversity?.length ?? 0} species
              </span>
            </div>
            {isBiodiversityLoading ? (
              <DataState state="loading" />
            ) : isBiodiversityError ? (
              <DataState state="error" message={formatErrorMessage(biodiversityError)} />
            ) : biodiversity?.length ? (
              <div className="space-y-3">
                {biodiversity.map((species) => (
                  <div
                    key={species.scientific_name}
                    className="rounded-2xl border border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 p-4 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <h4 className="text-base font-semibold text-white">{species.scientific_name}</h4>
                        <p className="text-xs text-slate-400">
                          {species.local_name ?? "Local name unknown"} · {species.english_common_name ?? "Common name pending"}
                        </p>
                      </div>
                      <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs text-emerald-800">
                        {species.records.length} observations
                      </span>
                    </div>
                    <ul className="mt-3 space-y-1 text-[11px] text-slate-300">
                      {species.records.slice(0, 3).map((record) => (
                        <li key={record.id}>
                          {record.observed_at ? new Date(record.observed_at).toLocaleDateString() : "Unknown date"} ·{" "}
                          {record.source ?? "Local field team"}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <DataState state="empty" message="No biodiversity observations for this tower yet." />
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TowerInfoPanel;
