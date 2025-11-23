import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import * as turf from "@turf/turf";

import StatCard from "../components/cards/StatCard";
import DataState from "../components/shared/DataState";
import { useWaterTowers } from "../hooks/useWaterTowers";
import { getTowerAreaHa } from "../utils/towerAreaOverrides";

const TowersPage = () => {
  const { data: towers, isLoading, isError, error } = useWaterTowers();
  const navigate = useNavigate();

  const towerCount = towers?.length ?? 0;

  const cards = useMemo(() => {
    return towers?.map((tower) => {
      const counties =
        Array.isArray(tower.counties) || typeof tower.counties === "string"
          ? (Array.isArray(tower.counties) ? tower.counties : [tower.counties])
              .map((county) => (typeof county === "string" ? county : (county as any)?.name))
              .filter(Boolean)
          : [];
      const areaHa =
        getTowerAreaHa(tower.id, tower.area_ha ?? null) ??
        (tower.geometry ? turf.area(tower.geometry as any) / 10000 : null);
      return (
        <div
          key={tower.id}
          className="flex flex-col justify-between rounded-2xl border border-slate-800 bg-slate-900/60 p-5 shadow-sm"
        >
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Water Tower</p>
            <h3 className="mt-1 text-xl font-semibold">{tower.name}</h3>
            <p className="mt-2 text-sm text-slate-400">
              Counties: {counties.length ? counties.join(", ") : "Kenya"}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Area: {areaHa != null ? `${(areaHa * 0.01).toFixed(2)} km²` : "Awaiting geometry"}
            </p>
          </div>
          <button
            type="button"
            className="mt-4 rounded-full border border-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-500/20"
            onClick={() => navigate("/", { state: { towerId: tower.id } })}
          >
            View on map
          </button>
        </div>
      );
    });
  }, [towers, navigate]);

  if (isLoading) {
    return (
      <div className="rounded-3xl border border-slate-800 bg-slate-900/40 p-6">
        <DataState state="loading" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-3xl border border-rose-500 bg-rose-500/10 p-6">
        <DataState state="error" message={(error as Error)?.message ?? "Unable to load towers"} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">Directory</p>
        <h2 className="text-2xl font-semibold">All gazetted water towers</h2>
        <p className="text-sm text-slate-400">Currently tracking {towerCount} catchments across Kenya.</p>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        {cards}
      </section>
    </div>
  );
};

export default TowersPage;
