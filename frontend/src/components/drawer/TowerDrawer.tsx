import React from "react";
import type { BiodiversitySpecies, Nursery, WaterTower, CFA } from "../../api/types";
import TowerTabs from "./TowerTabs";
import TowerOverviewTab from "./TowerOverviewTab";
import TowerHydrologyTab from "./TowerHydrologyTab";
import TowerBiodiversityTab from "./TowerBiodiversityTab";

interface TowerDrawerProps {
  tower: WaterTower | null;
  open: boolean;
  onClose: () => void;
  activeTab: string;
  setActiveTab: (id: string) => void;
  biodiversity: BiodiversitySpecies[];
  nurseries: Nursery[];
  cfas: CFA[];
  biodiversityError?: any;
  areaHa?: number | null;
}

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "nurseries", label: "Nurseries" },
  { id: "cfas", label: "CFAs" },
  { id: "hydrology", label: "Hydrology" },
  { id: "biodiversity", label: "Biodiversity" },
];

const TowerDrawer = ({
  tower,
  open,
  onClose,
  activeTab,
  setActiveTab,
  biodiversity,
  nurseries,
  cfas,
  biodiversityError,
  areaHa,
}: TowerDrawerProps) => {
  if (!open || !tower) return null;

  return (
    <div
      className="
        fixed z-30 bg-white/95 backdrop-blur-xl border-warm-200 shadow-2xl
        transition-all duration-300
        w-full md:w-96 md:right-0 md:inset-y-0
        bottom-0 left-0 right-0 md:left-auto md:bottom-auto
        h-[70vh] md:h-full
        rounded-t-2xl md:rounded-t-none md:rounded-tl-2xl
        md:border-l
        p-6 overflow-y-auto
      "
      role="region"
      aria-label="Tower story drawer"
    >
      <button
        onClick={onClose}
        className="mb-4 text-xs uppercase tracking-[0.4em] text-charcoal-500 hover:text-charcoal-700 transition-colors"
      >
        Close
      </button>
      <h2 className="text-2xl font-bold text-charcoal-900">{tower.name}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {(() => {
          const counties =
            Array.isArray(tower.counties) || typeof tower.counties === "string"
              ? (Array.isArray(tower.counties) ? tower.counties : [tower.counties])
                  .map((county) => (typeof county === "string" ? county : (county as any)?.name))
                  .filter(Boolean)
              : [];
          return counties.length ? (
            counties.map((county) => (
              <span
                key={county}
                className="rounded-full bg-soft-green-50 px-3 py-1 text-xs font-medium text-soft-green-700 border border-soft-green-200"
              >
                {county}
              </span>
            ))
          ) : (
            <span className="rounded-full bg-soft-green-50 px-3 py-1 text-xs font-medium text-soft-green-700 border border-soft-green-200">
              Kenya
            </span>
          );
        })()}
      </div>

      <div className="mt-4 flex items-center gap-3 text-xs uppercase tracking-[0.3em] text-charcoal-600">
        <span>
          {(() => {
            const gazetted = tower.metadata?.gazetted;
            if (typeof gazetted === "boolean") {
              return gazetted ? "Gazetted" : "Not gazetted";
            }
            return gazetted ?? "Gazetted";
          })()}
        </span>
        <span className="rounded-full bg-soft-green-100 px-3 py-1 text-soft-green-700 border border-soft-green-200">Priority</span>
      </div>

      {areaHa != null && (
        <div className="mt-2 text-xs text-charcoal-500">Area (km²): {(areaHa * 0.01).toFixed(2)}</div>
      )}

      {biodiversityError && (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 p-3 text-xs text-rose-700">
          {import.meta.env.DEV ? (
            <pre className="whitespace-pre-wrap text-[11px] text-rose-600">
              {JSON.stringify(biodiversityError, null, 2)}
            </pre>
          ) : (
            "Biodiversity data unavailable. Partial data shown."
          )}
        </div>
      )}

      <TowerTabs tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

      <div className="content mt-6 space-y-4">
        {activeTab === "overview" && (
          <TowerOverviewTab
            tower={tower}
            nurseryCount={nurseries.length}
            cfaCount={cfas.length}
            speciesCount={biodiversity.length}
            areaHa={areaHa}
          />
        )}
        {activeTab === "nurseries" && (
          <div className="space-y-3">
            {nurseries.length ? (
              nurseries.map((n) => (
                <div
                  key={n.id}
                  className="rounded-2xl border border-warm-200 bg-warm-50/50 p-4 text-sm shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="font-semibold text-charcoal-900">{n.name}</div>
                  <div className="text-xs text-charcoal-600 mt-1">
                    Species: {n.species_scientific ?? "Unknown"} · {n.species_local ?? "Local name pending"}
                  </div>
                  <div className="text-[11px] text-charcoal-500 mt-1">Capacity: {n.capacity_seedlings ?? "N/A"}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-charcoal-500">No registered nurseries for this tower yet.</div>
            )}
          </div>
        )}
        {activeTab === "cfas" && (
          <div className="space-y-3">
            {cfas.length ? (
              cfas.map((cfa) => (
                <div
                  key={cfa.id}
                  className="rounded-2xl border border-warm-200 bg-warm-50/50 p-4 text-sm shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="font-semibold text-charcoal-900">{cfa.name}</div>
                  <div className="text-xs text-charcoal-600 mt-1">{cfa.county ?? "County pending"}</div>
                  {cfa.contact_email && (
                    <div className="text-xs text-soft-green-700 mt-2 break-all">
                      <a href={`mailto:${cfa.contact_email}`} className="underline hover:text-soft-green-800">
                        {cfa.contact_email}
                      </a>
                    </div>
                  )}
                  {cfa.notes && <div className="text-[11px] text-charcoal-500 mt-2">{cfa.notes}</div>}
                  {cfa.website && (
                    <div className="text-[11px] text-soft-green-700 mt-1">
                      <a href={cfa.website} target="_blank" rel="noreferrer" className="underline">
                        Visit website
                      </a>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="text-sm text-charcoal-500">No CFAs linked to this water tower yet.</div>
            )}
          </div>
        )}
        {activeTab === "hydrology" && <TowerHydrologyTab tower={tower} />}
        {activeTab === "biodiversity" && <TowerBiodiversityTab biodiversity={biodiversity} />}
      </div>
    </div>
  );
};

export default TowerDrawer;
