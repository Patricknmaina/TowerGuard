import { useMemo, useState } from "react";
import WaterTowersMap from "../components/map/WaterTowersMap";
import TowerDrawer from "../components/drawer/TowerDrawer";
import DataState from "../components/shared/DataState";
import StatCard from "../components/cards/StatCard";
import { useWaterTowers } from "../hooks/useWaterTowers";
import { useNurseries } from "../hooks/useNurseries";
import { useBiodiversityByTower } from "../hooks/useBiodiversityByTower";
import { useHealthPing } from "../hooks/useHealthPing";
import * as turf from "@turf/turf";
import { getTowerAreaHa } from "../utils/towerAreaOverrides";

const DashboardPage = () => {
  const { data: towers, isLoading, isError, error } = useWaterTowers();
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("overview");

  const selectedTower = useMemo(
    () => towers?.find((tower) => tower.id === selectedTowerId) ?? null,
    [towers, selectedTowerId]
  );

  const { data: nurseries } = useNurseries();
  const associatedNurseries = useMemo(() => {
    if (!selectedTower || !nurseries) return [];
    return nurseries.filter((n) => n.water_tower_id === selectedTower.id);
  }, [selectedTower, nurseries]);

  const {
    data: biodiversity = [],
    isError: isBiodiversityError,
    error: biodiversityError,
  } = useBiodiversityByTower(selectedTower?.id ?? "");

  const health = useHealthPing();

  const selectedAreaHa = useMemo(() => {
    if (!selectedTower) return null;
    const override = getTowerAreaHa(selectedTower.id, selectedTower.area_ha ?? null);
    if (override != null) return override;
    if (!selectedTower.geometry) return null;
    return turf.area(selectedTower.geometry as any) / 10000;
  }, [selectedTower]);

  if (isLoading || !towers) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50">
        <DataState state="loading" />
      </div>
    );
  }

  if (isError) {
    return <DataState state="error" message={(error as Error)?.message ?? "Unable to load towers"} />;
  }

  const statusLabel = health.data?.status ?? "Checking API";
  const statusColor =
    statusLabel.toLowerCase().includes("online") || statusLabel.toLowerCase() === "ok"
      ? "bg-soft-green-100 text-soft-green-700"
      : statusLabel.toLowerCase().includes("offline") || statusLabel.toLowerCase().includes("error")
      ? "bg-rose-50 text-rose-600"
      : "bg-amber-50 text-amber-700";

  const towerHighlights = towers.slice(0, 3);
  const nurseryHighlights = nurseries?.slice(0, 3) ?? [];

  return (
    <div className="min-h-screen w-full bg-warm-50 px-4 py-8 md:px-12 md:py-12 space-y-8">
      <header className="space-y-4 max-w-7xl mx-auto">
        <p className="text-xs uppercase tracking-[0.4em] text-soft-green-600 font-medium">TowerGuard</p>
        <div className="flex flex-wrap items-center gap-4">
          <h1 className="text-4xl font-semibold text-charcoal-900">Kenya Water Towers Observatory</h1>
          <span className={`rounded-full px-4 py-1.5 text-xs font-semibold ${statusColor} shadow-sm`}>
            API Status: {statusLabel}
          </span>
        </div>
        <p className="max-w-2xl text-sm text-charcoal-600 leading-relaxed">
          Map-driven overview of Kenya's gazetted catchments. Click a tower to open the right-side story panel
          with biodiversity, nurseries, and hydrology data.
        </p>
      </header>

      <section className="rounded-2xl border border-warm-200 bg-white shadow-lg max-w-7xl mx-auto">
        <div className="h-[65vh] md:h-[75vh]">
          <WaterTowersMap
            towers={towers}
            loading={isLoading}
            error={error}
            selectedTowerId={selectedTowerId}
            onSelectTower={(id) => setSelectedTowerId(id)}
          />
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3 max-w-7xl mx-auto">
        <StatCard label="Water towers" value={towers.length} description="Mapped catchments across Kenya" />
        <StatCard label="Active nurseries" value={nurseries?.length ?? 0} description="Field propagation sites" />
        <StatCard
          label="Species (selected)"
          value={selectedTower ? biodiversity.length : "-"}
          description="Observations for the highlighted tower"
        />
      </section>

      <section className="grid gap-6 lg:grid-cols-2 max-w-7xl mx-auto">
        <div className="rounded-2xl border border-warm-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-charcoal-900">Featured towers</h2>
            <span className="text-xs text-charcoal-500 font-medium">Top 3</span>
          </div>
          <div className="space-y-3">
            {towerHighlights.map((tower) => (
              <div
                key={tower.id}
                className="rounded-2xl border border-warm-200 bg-warm-50/50 p-4 hover:shadow-md transition-shadow"
              >
                <p className="font-semibold text-charcoal-900">{tower.name}</p>
                <p className="text-xs text-charcoal-600 mt-1">
                  Counties: {(Array.isArray(tower.counties) ? tower.counties : [tower.counties])
                    .flat()
                    .filter(Boolean)
                    .join(", ")}
                </p>
                <button
                  type="button"
                  className="mt-3 text-xs font-semibold text-soft-green-600 hover:text-soft-green-700 underline"
                  onClick={() => setSelectedTowerId(tower.id)}
                >
                  View tower story
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-warm-200 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-charcoal-900">Nursery network</h2>
            <span className="text-xs text-charcoal-500 font-medium">Connected</span>
          </div>
          <div className="space-y-3">
            {nurseryHighlights.map((nursery) => (
              <div
                key={nursery.id}
                className="rounded-2xl border border-warm-200 bg-warm-50/50 p-4 hover:shadow-md transition-shadow"
              >
                <p className="font-semibold text-charcoal-900">{nursery.name}</p>
                <p className="text-xs text-charcoal-600 mt-1">
                  Species: {nursery.species_scientific ?? "Unknown"} / {nursery.species_local ?? "Local pending"}
                </p>
                <p className="text-[11px] text-charcoal-500 mt-1">
                  Tower link: {nursery.water_tower_id ?? "Unassigned"}
                </p>
              </div>
            ))}
            {!nurseryHighlights.length && (
              <p className="text-sm text-charcoal-500">No nurseries seeded yet.</p>
            )}
          </div>
        </div>
      </section>

      <TowerDrawer
        tower={selectedTower}
        open={Boolean(selectedTower)}
        onClose={() => setSelectedTowerId(null)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        biodiversity={biodiversity}
        nurseries={associatedNurseries}
        biodiversityError={isBiodiversityError ? biodiversityError : undefined}
        areaHa={selectedAreaHa}
      />
      {selectedTower && (
        <div
          className="fixed inset-0 z-20 bg-charcoal-900/10 md:hidden"
          onClick={() => setSelectedTowerId(null)}
        />
      )}
    </div>
  );
};

export default DashboardPage;
