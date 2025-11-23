import React from "react";
import { BiodiversitySpecies } from "../../api/types";

interface BioProps {
  biodiversity: BiodiversitySpecies[];
}

const TowerBiodiversityTab = ({ biodiversity }: BioProps) => (
  <div className="space-y-4">
    <div className="rounded-2xl border border-warm-200 bg-gradient-to-br from-white to-soft-green-50/30 p-5 shadow-sm">
      <p className="text-xs uppercase tracking-[0.3em] text-soft-green-600 font-medium">Species Count</p>
      <p className="mt-2 text-3xl font-semibold text-charcoal-900">{biodiversity.length}</p>
      <p className="text-xs text-charcoal-600 mt-1">Aggregated by scientific name</p>
    </div>
    <div className="grid gap-3">
      {biodiversity.slice(0, 5).map((species) => (
        <div
          key={species.scientific_name}
          className="rounded-2xl border border-warm-200 bg-warm-50/50 p-4 shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="text-sm font-semibold text-charcoal-900">{species.scientific_name}</div>
          <div className="text-xs text-charcoal-600 mt-1">
            {species.local_name ?? species.english_common_name ?? "Local names pending"}
          </div>
          <div className="text-[11px] text-charcoal-500 mt-1">
            {species.records.length} observation{species.records.length === 1 ? "" : "s"}
          </div>
        </div>
      ))}
      {!biodiversity.length && <p className="text-sm text-charcoal-500">No biodiversity records yet.</p>}
    </div>
  </div>
);

export default TowerBiodiversityTab;
