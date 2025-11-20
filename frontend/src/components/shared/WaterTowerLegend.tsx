import type { WaterTower } from "../../api/types";

interface WaterTowerLegendProps {
  towers: WaterTower[];
}

const WaterTowerLegend = ({ towers }: WaterTowerLegendProps) => (
  <div className="rounded-xl border border-slate-200 bg-white p-4">
    <h3 className="text-sm font-semibold text-brand-gray">Gazetted Water Towers</h3>
    <ul className="mt-3 space-y-2 text-sm text-slate-600">
      {towers.map((tower) => (
        <li key={tower.id} className="flex items-center justify-between">
          <span>{tower.name}</span>
          <span className="text-xs uppercase tracking-wide text-slate-400">{tower.category}</span>
        </li>
      ))}
    </ul>
  </div>
);

export default WaterTowerLegend;
