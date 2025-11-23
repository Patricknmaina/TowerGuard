import type { TowerView } from "../../pages/DashboardPage";
import { riskBadgeColor, protectionBadgeColor } from "./towerStyles";

interface TowerGridProps {
  towers: TowerView[];
  selectedTowerId: string | null;
  onSelect: (id: string) => void;
}

const TowerGrid = ({ towers, selectedTowerId, onSelect }: TowerGridProps) => {
  if (!towers.length) {
    return <p className="text-sm text-slate-500">No towers match the current filters.</p>;
  }

  return (
    <div className="grid gap-3 md:grid-cols-2">
      {towers.map((tower) => (
        <button
          key={tower.id}
          type="button"
          onClick={() => onSelect(tower.id)}
          className={`flex flex-col gap-2 rounded-2xl border px-4 py-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md ${
            tower.id === selectedTowerId ? "border-brand-green bg-emerald-50/60" : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-xs uppercase tracking-wide text-brand-teal">{tower.county ?? "Kenya"}</p>
              <p className="text-lg font-semibold text-brand-gray">{tower.name}</p>
            </div>
            <div className="flex flex-col items-end gap-1 text-xs">
              <span className={`rounded-full px-2 py-1 ${protectionBadgeColor(tower.protectionStatus)}`}>
                {tower.protectionStatus ?? "Gazetted"}
              </span>
              <span className={`rounded-full px-2 py-1 ${riskBadgeColor(tower.riskLevel)}`}>
                {tower.riskLevel ?? "Medium"}
              </span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 text-sm text-slate-600">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Forest Cover</p>
              <p className="font-semibold text-brand-gray">{tower.keyMetrics?.forestCoverPct ?? 0}%</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-400">Catchment Area</p>
              <p className="font-semibold text-brand-gray">
                {tower.keyMetrics?.catchmentAreaHa != null
                  ? `${(tower.keyMetrics.catchmentAreaHa * 0.01).toFixed(2)} km²`
                  : "0 km²"}
              </p>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default TowerGrid;
