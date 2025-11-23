import { useMemo } from "react";
import { X, Phone, MapPin } from "lucide-react";
import { useNurseries } from "../../hooks/useNurseries";
import { getFeatureCentroid } from "../map/WaterTowersMap";
import { calculateDistance } from "../../utils/distance";
import type { WaterTower, Nursery } from "../../api/types";
import DataState from "../shared/DataState";

interface SeedlingMarketplaceProps {
  open: boolean;
  onClose: () => void;
  tower: WaterTower | null;
  speciesName: string;
}

interface NurseryWithDistance extends Nursery {
  distanceKm: number;
}

const SeedlingMarketplace = ({ open, onClose, tower, speciesName }: SeedlingMarketplaceProps) => {
  const { data: nurseries = [], isLoading } = useNurseries();

  // Filter and sort nurseries
  const availableNurseries = useMemo(() => {
    if (!tower || !nurseries.length) return [];

    // Get tower centroid for distance calculation
    const towerCentroid = getFeatureCentroid(tower.geometry as any);
    if (!towerCentroid) return [];

    // Filter nurseries by species availability
    // Check if nursery's species_scientific matches (case-insensitive partial match)
    const filtered = nurseries.filter((nursery) => {
      if (!nursery.species_scientific) return false;
      const nurserySpecies = nursery.species_scientific.toLowerCase();
      const targetSpecies = speciesName.toLowerCase();
      // Allow partial match or exact match
      return nurserySpecies.includes(targetSpecies) || targetSpecies.includes(nurserySpecies);
    });

    // Calculate distances and sort
    const withDistance: NurseryWithDistance[] = filtered.map((nursery) => {
      const distance = calculateDistance(
        towerCentroid.lat,
        towerCentroid.lon,
        nursery.lat,
        nursery.lon
      );
      return { ...nursery, distanceKm: distance };
    });

    // Sort by distance (closest first)
    return withDistance.sort((a, b) => a.distanceKm - b.distanceKm).slice(0, 10); // Top 10
  }, [nurseries, tower, speciesName]);

  // Get county from nursery metadata or tower
  const getCounty = (nursery: Nursery): string => {
    const metadata = nursery.metadata as Record<string, unknown> | undefined;
    if (metadata?.county && typeof metadata.county === "string") {
      return metadata.county;
    }
    // Fallback: try to get from tower counties
    if (tower?.counties && Array.isArray(tower.counties) && tower.counties.length > 0) {
      return tower.counties[0];
    }
    return "Kenya";
  };

  if (!open) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-charcoal-900/20 md:hidden"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className={`
          fixed z-50 bg-white border-warm-200 shadow-2xl
          transition-all duration-300
          w-full md:w-96 md:right-0 md:inset-y-0
          bottom-0 left-0 right-0 md:left-auto md:bottom-auto
          h-[70vh] md:h-full
          rounded-t-2xl md:rounded-t-none md:rounded-tl-2xl
          md:border-l
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-warm-200">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-charcoal-900">Find Seedlings</h2>
            <p className="text-sm text-charcoal-600 mt-1">{speciesName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-full p-2 hover:bg-warm-100 transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-charcoal-600" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <DataState state="loading" />
          ) : availableNurseries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-charcoal-600 mb-2">No nurseries found</p>
              <p className="text-sm text-charcoal-500">
                No nurseries currently stock {speciesName} near this water tower.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {availableNurseries.map((nursery) => (
                <div
                  key={nursery.id}
                  className="rounded-2xl border border-warm-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold text-charcoal-900 mb-1">{nursery.name}</h3>
                      <div className="flex items-center gap-2 text-sm text-charcoal-600">
                        <MapPin className="w-4 h-4" />
                        <span>{getCounty(nursery)}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-soft-green-600">
                        {nursery.distanceKm.toFixed(1)} km
                      </p>
                      <p className="text-xs text-charcoal-500">away</p>
                    </div>
                  </div>

                  {/* Stock Info */}
                  <div className="mb-4 space-y-2">
                    {nursery.capacity_seedlings != null && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-charcoal-600">Stock available:</span>
                        <span className="font-medium text-charcoal-900">
                          {nursery.capacity_seedlings.toLocaleString()} seedlings
                        </span>
                      </div>
                    )}
                    {nursery.species_local && (
                      <div className="text-xs text-charcoal-500">
                        Local name: {nursery.species_local}
                      </div>
                    )}
                  </div>

                  {/* Contact Button */}
                  <button
                    onClick={() => {
                      // TODO: Implement contact functionality
                      console.log("Contact nursery:", nursery.id);
                    }}
                    className="w-full rounded-full bg-soft-green-600 hover:bg-soft-green-700 text-white px-4 py-2.5 text-sm font-semibold shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    Contact Nursery
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default SeedlingMarketplace;

