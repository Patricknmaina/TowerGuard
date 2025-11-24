import type { TowerView } from "../../pages/DashboardPage";
import { riskBadgeColor, protectionBadgeColor } from "./towerStyles";

interface TowerListProps {
  towers: TowerView[];
  selectedTowerId: string | null;
  onSelect: (id: string) => void;
}

const TowerList = ({ towers, selectedTowerId, onSelect }: TowerListProps) => {
  if (!towers.length) {
    return <p className="text-sm text-slate-500">No towers match the current filters.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Name</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">County</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Risk</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Protection</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Forest Cover %</th>
            <th className="px-4 py-3 text-left font-medium text-slate-600">Catchment (ha)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {towers.map((tower) => (
            <tr
              key={tower.id}
              onClick={() => onSelect(tower.id)}
              className={`${tower.id === selectedTowerId ? "bg-emerald-50/60" : ""} cursor-pointer hover:bg-slate-50`}
            >
              <td className="px-4 py-3 font-semibold text-brand-gray">{tower.name}</td>
              <td className="px-4 py-3 text-slate-600">{tower.county ?? "—"}</td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-1 text-xs ${riskBadgeColor(tower.riskLevel)}`}>
                  {tower.riskLevel ?? "Medium"}
                </span>
              </td>
              <td className="px-4 py-3">
                <span className={`rounded-full px-2 py-1 text-xs ${protectionBadgeColor(tower.protectionStatus)}`}>
                  {tower.protectionStatus ?? "Gazetted"}
                </span>
              </td>
              <td className="px-4 py-3 text-slate-700">{tower.keyMetrics?.forestCoverPct ?? "—"}</td>
              <td className="px-4 py-3 text-slate-700">
                {tower.keyMetrics?.catchmentAreaHa != null
                  ? `${(tower.keyMetrics.catchmentAreaHa * 0.01).toFixed(2)} km²`
                  : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TowerList;
