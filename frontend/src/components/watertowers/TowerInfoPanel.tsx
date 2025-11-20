import { useMemo } from "react";
import type { TowerSite, TowerView } from "../../pages/DashboardPage";
import { protectionBadgeColor, riskBadgeColor } from "./towerStyles";

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
            <div className="flex h-full items-center justify-center text-sm text-slate-200">Hero image</div>
          )}
        </div>
      </div>

      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.2em] text-emerald-300">Water Tower</p>
            <h2 className="text-2xl font-semibold text-white">{tower.name}</h2>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
              <span className="rounded-full bg-slate-800 px-3 py-1 text-emerald-100">{tower.county ?? "Kenya"}</span>
              <span className="rounded-full bg-slate-800 px-3 py-1 text-emerald-100">{tower.areaHa ?? 0} ha</span>
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
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-white">Description</h3>
            <p className="leading-relaxed text-slate-200">{tower.description ?? "No description provided."}</p>
            <h4 className="pt-2 text-sm font-semibold text-white">Objective</h4>
            <div className="flex flex-wrap gap-2">
              {(tower.objectives ?? ["Water Regulation", "Biodiversity", "Hydropower"]).map((obj) => (
                <span key={obj} className="rounded-full bg-emerald-100/20 px-3 py-1 text-emerald-100">
                  {obj}
                </span>
              ))}
            </div>
          </div>
        )}

        {activeTab === "communities" && (
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-white">Communities</h3>
            <table className="min-w-full divide-y divide-slate-800 text-sm">
              <thead className="text-emerald-100">
                <tr>
                  <th className="py-2 text-left">Community</th>
                  <th className="py-2 text-left">Population Served</th>
                  <th className="py-2 text-left">Primary Use</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-100">
                {[{ name: "Aberdare North", pop: 180000, use: "Domestic & Irrigation" }, { name: "Kericho South", pop: 220000, use: "Tea estates & domestic" }, { name: "Tharaka Ridge", pop: 140000, use: "Hydropower & domestic" }].map((row) => (
                  <tr key={row.name}>
                    <td className="py-2">{row.name}</td>
                    <td className="py-2">{row.pop.toLocaleString()}</td>
                    <td className="py-2">{row.use}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === "hydrology" && (
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-white">Hydrology</h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg bg-slate-800 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-emerald-200">Baseflow Index</p>
                <p className="text-lg font-semibold text-white">0.72</p>
              </div>
              <div className="rounded-lg bg-slate-800 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-emerald-200">Springs</p>
                <p className="text-lg font-semibold text-white">36</p>
              </div>
              <div className="rounded-lg bg-slate-800 px-3 py-2">
                <p className="text-xs uppercase tracking-wide text-emerald-200">Main Rivers</p>
                <p className="text-lg font-semibold text-white">4</p>
              </div>
            </div>
            <div className="rounded-lg border border-dashed border-slate-700 bg-slate-800/70 p-4 text-center text-slate-300">
              {/* TODO: Replace with real hydrology time series (e.g., flow or rainfall). */}
              Hydrology chart placeholder
            </div>
          </div>
        )}

        {activeTab === "biodiversity" && (
          <div className="space-y-3">
            <h3 className="text-base font-semibold text-white">Biodiversity</h3>
            <p className="text-slate-200">
              Key ecosystems include montane forest, grassland, and riparian corridors. {/* TODO: Replace with real ecosystem/species data. */}
            </p>
            <div className="flex flex-wrap gap-2">
              {["Montane forest", "Grassland", "Riparian", "Bird habitat"].map((tag) => (
                <span key={tag} className="rounded-full bg-emerald-100/20 px-3 py-1 text-emerald-100">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TowerInfoPanel;
