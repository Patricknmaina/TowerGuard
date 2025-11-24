import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { MapPin, Leaf, Phone, Mail, ArrowLeft } from "lucide-react";
import { useWaterTowers } from "../hooks/useWaterTowers";
import { useNurseries } from "../hooks/useNurseries";
import { useCFAs } from "../hooks/useCFAs";
import { getFeatureCentroid } from "../components/map/WaterTowersMap";
import { calculateDistance } from "../utils/distance";
import DataState from "../components/shared/DataState";
import { formatAreaKm2 } from "../utils/formatArea";
import { getTowerAreaHa } from "../utils/towerAreaOverrides";
import type { Nursery, CFA } from "../api/types";

interface NurseryWithDistance extends Nursery {
  distanceKm: number | null;
}

interface CFAWithBadge extends CFA {
  badge?: string;
}

const TowerNurseriesPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: towers = [], isLoading: towersLoading, isError: towersError, error: towersErrorObj } = useWaterTowers();
  const { data: nurseries = [], isLoading: nurseriesLoading } = useNurseries();
  const { data: cfas = [], isLoading: cfasLoading } = useCFAs();

  const tower = useMemo(() => towers.find((t) => t.id === id) ?? null, [towers, id]);
  const centroid = useMemo(() => (tower ? getFeatureCentroid(tower.geometry as any) : null), [tower]);
  const areaKm2Label = useMemo(() => {
    if (!tower) return null;
    const areaHa = getTowerAreaHa(tower.id, tower.area_ha ?? null);
    return formatAreaKm2(areaHa);
  }, [tower]);

  const towerNurseries = useMemo(() => {
    if (!tower) return [];

    const directMatches = nurseries.filter((n) => n.water_tower_id === tower.id);
    const source = directMatches.length > 0 ? directMatches : nurseries;

    const withDistance: NurseryWithDistance[] = source.map((nursery) => ({
      ...nursery,
      distanceKm: centroid
        ? calculateDistance(centroid.lat, centroid.lon, nursery.lat, nursery.lon)
        : null,
    }));

    return withDistance
      .sort((a, b) => (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity))
      .slice(0, directMatches.length > 0 ? directMatches.length : 12);
  }, [centroid, nurseries, tower]);

  const towerCFAs = useMemo<CFAWithBadge[]>(() => {
    if (!tower) return [];
    const matches = cfas.filter((cfa) => cfa.water_tower_id === tower.id);
    return matches.length ? matches.map((cfa) => ({ ...cfa, badge: "CFA partner" })) : [];
  }, [cfas, tower]);

  const getCounty = (nursery: Nursery): string => {
    const metadata = nursery.metadata as Record<string, unknown> | undefined;
    if (metadata?.county && typeof metadata.county === "string") {
      return metadata.county;
    }
    if (tower?.counties && tower.counties.length > 0) {
      return tower.counties[0];
    }
    return "Kenya";
  };

  const handleContactNursery = (nursery: Nursery) => {
    if (nursery.contact_email) {
      const subject = encodeURIComponent(`Inquiry about ${nursery.name}`);
      const body = encodeURIComponent(
        `Hello,\n\nI am interested in learning more about your nursery and the indigenous seedlings you have available for the ${tower?.name} water tower restoration.\n\nThank you!`
      );
      window.open(`mailto:${nursery.contact_email}?subject=${subject}&body=${body}`, "_blank");
    } else if (nursery.contact_phone) {
      const phone = nursery.contact_phone.replace(/[^0-9+]/g, "");
      window.open(`tel:${phone}`, "_blank");
    } else {
      alert(`Contact Information:\n\nNursery: ${nursery.name}\n${nursery.contact_address || "No contact details available"}`);
    }
  };

  if (towersLoading || nurseriesLoading || cfasLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50">
        <DataState state="loading" />
      </div>
    );
  }

  if (towersError || !tower) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-50 px-6">
        <DataState state="error" message={(towersErrorObj as Error)?.message ?? "Water tower not found"} />
      </div>
    );
  }

  const heroBgUrl = "/images/Feature_PlantingSeeds.jpg";

  return (
    <div
      className="min-h-screen pb-20"
      style={{
        backgroundImage: `linear-gradient(180deg, rgba(10, 28, 14, 0.78), rgba(255, 255, 255, 0.94)), url(${heroBgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 md:px-10 py-10">
        <button
          onClick={() => navigate(`/towers/${tower.id}`)}
          className="inline-flex items-center gap-2 text-sm text-white/85 hover:text-white mb-6 drop-shadow"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to tower
        </button>

        <div className="flex flex-col gap-3 mb-8">
          <p className="text-xs uppercase tracking-[0.3em] text-soft-green-50 font-semibold drop-shadow">
            Community nurseries
          </p>
          <h1 className="text-3xl md:text-4xl font-semibold text-white drop-shadow">
            Nurseries near {tower.name}
          </h1>
          <p className="text-sm text-white/90 drop-shadow">
            Distances are measured from the tower centroid—your device location isn’t used. We link nearby nurseries and CFAs to help you source seedlings for restoration.
          </p>
          {areaKm2Label && (
            <p className="text-xs text-white/80 drop-shadow">
              Tower footprint: {areaKm2Label}
            </p>
          )}
        </div>

        {towerCFAs.length > 0 && (
          <div className="mb-10 rounded-3xl border border-white/25 bg-white/90 p-6 shadow-lg backdrop-blur">
            <p className="text-xs uppercase tracking-[0.3em] text-soft-green-700 font-semibold mb-2">Community partners</p>
            <h3 className="text-xl font-semibold text-charcoal-900 mb-2">CFAs linked to this tower</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {towerCFAs.map((cfa) => (
                <div key={cfa.id} className="rounded-2xl border border-soft-green-200 bg-white p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-1">
                    <p className="font-semibold text-charcoal-900">{cfa.name}</p>
                    {cfa.badge && (
                      <span className="rounded-full bg-soft-green-100 px-3 py-1 text-[11px] font-semibold text-soft-green-700">
                        {cfa.badge}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-charcoal-600">{cfa.county ?? "County pending"}</p>
                  {cfa.notes && <p className="text-[11px] text-charcoal-500 mt-1">{cfa.notes}</p>}
                  <div className="text-[11px] text-soft-green-700 mt-2 space-y-1">
                    {cfa.contact_email && (
                      <a href={`mailto:${cfa.contact_email}`} className="block underline break-all">
                        {cfa.contact_email}
                      </a>
                    )}
                    {cfa.website && (
                      <a href={cfa.website} target="_blank" rel="noreferrer" className="block underline">
                        {cfa.website}
                      </a>
                    )}
                    {!cfa.contact_email && !cfa.website && (
                      <span className="text-charcoal-500">Contact not provided in dataset.</span>
                    )}
                    {cfa.source && <span className="block text-charcoal-500">Source: {cfa.source}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {towerNurseries.length === 0 ? (
          <div className="rounded-3xl border border-white/25 bg-white/92 p-10 text-center shadow-lg backdrop-blur">
            <p className="text-charcoal-800 mb-2">No nurseries are registered near this tower yet.</p>
            <p className="text-sm text-charcoal-600">
              Check back soon or reach out to local community groups to add their nurseries.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {towerNurseries.map((nursery) => (
              <div
                key={nursery.id}
                className="rounded-3xl border border-warm-200 bg-white p-6 shadow-sm hover:shadow-md transition-all duration-200 flex flex-col gap-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-xl font-semibold text-charcoal-900 mb-1">{nursery.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-charcoal-600">
                      <MapPin className="w-4 h-4" />
                      <span>{getCounty(nursery)}</span>
                      {nursery.distanceKm != null && (
                        <span className="rounded-full bg-warm-100 px-3 py-1 text-xs text-charcoal-700 shadow-inner">
                          {nursery.distanceKm.toFixed(1)} km away
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="rounded-full bg-soft-green-100 px-3 py-1 text-xs font-semibold text-soft-green-700 shadow-sm">
                    Nearby
                  </div>
                </div>

                <div className="space-y-2 text-sm text-charcoal-700">
                  {nursery.species_scientific && (
                    <div className="flex items-center gap-2 flex-wrap">
                      <Leaf className="w-4 h-4 text-soft-green-600" />
                      <span className="font-semibold text-charcoal-900">{nursery.species_scientific}</span>
                      {nursery.species_local && (
                        <span className="text-charcoal-500">({nursery.species_local})</span>
                      )}
                    </div>
                  )}
                  {nursery.capacity_seedlings != null && (
                    <p className="text-charcoal-600">
                      Capacity:{" "}
                      <span className="font-semibold text-charcoal-900">
                        {nursery.capacity_seedlings.toLocaleString()} seedlings
                      </span>
                    </p>
                  )}
                  <p className="text-xs text-charcoal-500">
                    Community-run nursery supporting restoration efforts.
                  </p>
                </div>

                {/* Contact Information */}
                {(nursery.contact_email || nursery.contact_phone || nursery.contact_address) && (
                  <div className="rounded-xl bg-warm-50 border border-warm-200 p-3 space-y-1.5 text-xs">
                    {nursery.contact_email && (
                      <div className="flex items-center gap-2 text-charcoal-700">
                        <Mail className="w-3.5 h-3.5 text-soft-green-600" />
                        <span className="break-all">{nursery.contact_email}</span>
                      </div>
                    )}
                    {nursery.contact_phone && (
                      <div className="flex items-center gap-2 text-charcoal-700">
                        <Phone className="w-3.5 h-3.5 text-soft-green-600" />
                        <span>{nursery.contact_phone}</span>
                      </div>
                    )}
                    {nursery.contact_address && (
                      <div className="flex items-center gap-2 text-charcoal-700">
                        <MapPin className="w-3.5 h-3.5 text-soft-green-600" />
                        <span className="text-xs">{nursery.contact_address}</span>
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleContactNursery(nursery)}
                    className="flex-1 rounded-full bg-white border border-soft-green-200 px-4 py-3 text-sm font-semibold text-charcoal-800 shadow-sm hover:-translate-y-0.5 hover:shadow-md hover:bg-warm-50 transition-all duration-200"
                  >
                    Contact nursery
                  </button>
                  <button
                    onClick={() => navigate(`/towers/${tower.id}`)}
                    className="rounded-full bg-soft-green-600 hover:bg-soft-green-700 text-white px-4 py-3 text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    Back to tower
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TowerNurseriesPage;
