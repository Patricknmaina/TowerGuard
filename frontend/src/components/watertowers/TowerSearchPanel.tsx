import { useMemo, useState } from "react";
import type { TowerView } from "../../pages/DashboardPage";

interface TowerSearchPanelProps {
  towers: TowerView[];
  selectedTowerId: string | null;
  onSelect: (id: string) => void;
  onClose: () => void;
}

const TowerSearchPanel = ({ towers, selectedTowerId, onSelect, onClose }: TowerSearchPanelProps) => {
  const [term, setTerm] = useState("");

  const filtered = useMemo(() => {
    const t = term.toLowerCase();
    return towers.filter(
      (tw) => tw.name.toLowerCase().includes(t) || (tw.county?.toLowerCase() ?? "").includes(t),
    );
  }, [towers, term]);

  return (
    <div className="absolute inset-y-0 left-0 z-20 flex h-full w-full max-w-full flex-col overflow-y-auto rounded-3xl bg-slate-950/95 p-4 text-white shadow-2xl lg:w-[calc(100%-16px)]">
      <div className="mb-3 flex items-center justify-between text-sm text-slate-200">
        <div className="flex items-center gap-2 text-base font-semibold">
          <span>Search Towers</span>
          <span className="rounded-full bg-slate-800 px-2 py-1 text-xs">{filtered.length}</span>
        </div>
        <button onClick={onClose} className="rounded-full bg-slate-800 px-3 py-1 text-xs hover:bg-slate-700">
          Close
        </button>
      </div>
      <input
        type="search"
        placeholder="Search towers by name or county"
        className="mb-4 w-full rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm text-white focus:border-emerald-300 focus:outline-none"
        value={term}
        onChange={(e) => setTerm(e.target.value)}
      />
      <div className="space-y-2">
        {filtered.map((tower) => (
          <button
            key={tower.id}
            onClick={() => onSelect(tower.id)}
            className={`flex w-full items-center justify-between rounded-2xl border px-3 py-3 text-left text-sm transition hover:bg-slate-800 ${
              tower.id === selectedTowerId ? "border-emerald-400 bg-slate-800/80" : "border-slate-800 bg-slate-900/80"
            }`}
          >
            <div>
              <p className="text-base font-semibold text-white">{tower.name}</p>
              <p className="text-xs text-slate-300">{tower.county ?? "Kenya"}</p>
            </div>
            <span className="rounded-full bg-slate-800 px-2 py-1 text-xs text-slate-200">{tower.areaHa ?? "—"} ha</span>
          </button>
        ))}
        {!filtered.length && <p className="text-sm text-slate-400">No towers match the search.</p>}
      </div>
    </div>
  );
};

export default TowerSearchPanel;
