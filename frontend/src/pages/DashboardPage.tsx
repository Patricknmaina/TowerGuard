import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import DataState from "../components/shared/DataState";
import WaterTowersMap from "../components/watertowers/WaterTowersMap";
import TowerInfoPanel from "../components/watertowers/TowerInfoPanel";
import TowerSearchPanel from "../components/watertowers/TowerSearchPanel";
import LayersPanel from "../components/watertowers/LayersPanel";
import TowerAnalyticsPanel from "../components/watertowers/TowerAnalyticsPanel";
import TowerAlertsPanel from "../components/watertowers/TowerAlertsPanel";
import { useWaterTowers } from "../hooks/useWaterTowers";
import { useNurseries } from "../hooks/useNurseries";
import type { WaterTower } from "../api/types";

export type RiskLevel = "High" | "Medium" | "Low";
export type ProtectionStatus = "Gazetted" | "Proposed" | "Degraded" | "Other";

export interface TowerSite {
  id: string;
  name: string;
  lat?: number;
  lng?: number;
}

export interface TowerView extends WaterTower {
  county?: string;
  protectionStatus?: ProtectionStatus;
  riskLevel?: RiskLevel;
  keyMetrics?: {
    forestCoverPct?: number;
    catchmentAreaHa?: number;
    waterYieldIndex?: number;
    populationServed?: number;
  };
  hasCriticalAlert?: boolean;
  imageUrl?: string;
  areaHa?: number;
  sites?: TowerSite[];
  objectives?: string[];
  description?: string;
}

const fallbackRisk: RiskLevel[] = ["High", "Medium", "Low"];
const fallbackProtection: ProtectionStatus[] = ["Gazetted", "Proposed", "Degraded"];

// Gazetted water tower placeholders with quick counties & representative imagery.
const towerMeta: Record<
  string,
  { counties: string[]; imageUrl: string }
> = {
  "aberdare range": {
    counties: ["Nyeri", "Murang'a", "Kiambu", "Nyandarua", "Laikipia"],
    imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80",
  },
  "cherangani hills": {
    counties: ["Elgeyo Marakwet", "West Pokot", "Trans Nzoia", "Uasin Gishu"],
    imageUrl: "https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1400&q=80",
  },
  "chyulu hills": {
    counties: ["Makueni", "Taita Taveta", "Kajiado"],
    imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80",
  },
  "huri hills": {
    counties: ["Marsabit"],
    imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80",
  },
  "lerroghi kirisia hills": {
    counties: ["Samburu"],
    imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80",
  },
  "loita hills": {
    counties: ["Narok"],
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
  },
  "marmanet forest": {
    counties: ["Laikipia", "Nakuru", "Baringo", "Nyandarua"],
    imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=1400&q=80",
  },
  "matthews range": {
    counties: ["Samburu"],
    imageUrl: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1400&q=80",
  },
  "mau forest complex": {
    counties: ["Nakuru", "Baringo", "Kericho", "Narok", "Bomet", "Nandi", "Uasin Gishu"],
    imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80",
  },
  "mount elgon water tower": {
    counties: ["Bungoma", "Trans Nzoia"],
    imageUrl: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1400&q=80",
  },
  "mount kenya water tower": {
    counties: ["Embu", "Tharaka Nithi", "Meru", "Laikipia", "Nyeri", "Kirinyaga"],
    imageUrl: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1400&q=80",
  },
  "mount kipipiri": {
    counties: ["Nyandarua"],
    imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80",
  },
  "mount kulal": {
    counties: ["Marsabit"],
    imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80",
  },
  "mount marsabit": {
    counties: ["Marsabit"],
    imageUrl: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1400&q=80",
  },
  "mount nyiru": {
    counties: ["Samburu"],
    imageUrl: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1400&q=80",
  },
  "ndotos hills": {
    counties: ["Samburu"],
    imageUrl: "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1400&q=80",
  },
  "nyambene hills": {
    counties: ["Meru"],
    imageUrl: "https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1400&q=80",
  },
  "shimba hills": {
    counties: ["Kwale"],
    imageUrl: "https://images.unsplash.com/photo-1489515217757-5fd1be406fef?auto=format&fit=crop&w=1400&q=80",
  },
};

const DashboardPage = () => {
  const { data: waterTowers, isLoading, isError, error } = useWaterTowers();
  const { data: nurseries } = useNurseries();
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedTowerId, setSelectedTowerId] = useState<string | null>(null);
  const [selectedSiteId, setSelectedSiteId] = useState<string | null>(null);
  const [activeLeftTab, setActiveLeftTab] = useState<"tower" | "communities" | "hydrology" | "biodiversity">("tower");
  const [activeOverlay, setActiveOverlay] = useState<"search" | "layers" | "analytics" | "alerts" | null>(null);
  const [whatsappNumber, setWhatsappNumber] = useState("+254712345678");
  const [alertIntervalMinutes, setAlertIntervalMinutes] = useState(30);
  const [panelOpen, setPanelOpen] = useState(true);
  const [layerState, setLayerState] = useState<{
    boundary: boolean;
    bubbles: boolean;
    satellite: boolean;
    ndvi: boolean;
    rainfall: boolean;
  }>({
    boundary: true,
    bubbles: true,
    satellite: false,
    ndvi: false,
    rainfall: false,
  });

  const towersEnriched: TowerView[] = useMemo(() => {
    if (!waterTowers) return [];
    return waterTowers.map((tower, idx) => {
      const protectionStatus = (tower.category as ProtectionStatus) ?? fallbackProtection[idx % fallbackProtection.length];
      const riskLevel = fallbackRisk[idx % fallbackRisk.length];
      const sites: TowerSite[] = [
        { id: `${tower.id}-site-a`, name: `${tower.name} Site A`, lat: 0.1 + idx * 0.02, lng: 37.2 + idx * 0.03 },
        { id: `${tower.id}-site-b`, name: `${tower.name} Site B`, lat: -0.1 + idx * 0.01, lng: 36.9 + idx * 0.02 },
      ];
      const meta = towerMeta[tower.name?.toLowerCase?.() ?? ""] ?? undefined;
      const incomingImage = (tower as any).imageUrl as string | undefined;
      return {
        ...tower,
        county: tower.counties?.[0] ?? meta?.counties?.[0],
        counties: tower.counties?.length ? tower.counties : meta?.counties,
        protectionStatus,
        riskLevel,
        keyMetrics: {
          forestCoverPct: 40 + idx * 3,
          catchmentAreaHa: 80000 + idx * 2500,
          waterYieldIndex: 0.7 + (idx % 3) * 0.05,
          populationServed: 1500000 + idx * 200000,
        },
        hasCriticalAlert: riskLevel === "High",
        imageUrl: incomingImage ?? meta?.imageUrl,
        areaHa: 120000 + idx * 3500,
        sites,
        objectives: ["Water Regulation", "Biodiversity", "Hydropower"],
        description:
          "This water tower plays a critical role in regulating downstream water availability, sustaining biodiversity, and supporting community livelihoods.",
      };
    });
  }, [waterTowers]);

  const selectedTower = towersEnriched.find((t) => t.id === selectedTowerId) ?? towersEnriched[0];
  const activeSiteId = selectedSiteId ?? selectedTower?.sites?.[0]?.id ?? null;

  const handleSelectTower = (id: string) => {
    setSelectedTowerId(id);
    setSelectedSiteId(null);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("tower", id);
      return next;
    });
  };

  return (
    <div className="relative min-h-[720px] w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900 text-white shadow-xl">
      <div className="absolute inset-0 z-0">
        {isLoading ? (
          <div className="flex h-full items-center justify-center">
            <DataState state="loading" />
          </div>
        ) : isError ? (
          <div className="flex h-full items-center justify-center p-6">
            <DataState state="error" message={(error as Error).message} />
          </div>
        ) : (
          <WaterTowersMap
            towers={towersEnriched}
            selectedTowerId={selectedTower?.id ?? null}
            selectedSiteId={activeSiteId}
            onSelectTower={handleSelectTower}
            showBoundary={layerState.boundary}
            showBubbles={layerState.bubbles}
            showSatellite={layerState.satellite}
            showNdvi={layerState.ndvi}
            showRainfall={layerState.rainfall}
            nurseries={
              selectedTower
                ? (nurseries ?? []).filter((n) => n.water_tower_id === selectedTower.id || n.water_tower_id === selectedTower.name)
                : []
            }
          />
        )}
      </div>

      <div className="absolute left-4 top-4 z-[1200] flex flex-col gap-2">
        <button
          onClick={() => setPanelOpen((p) => !p)}
          className="inline-flex items-center self-start rounded-full bg-slate-900/80 px-3 py-1 text-xs font-semibold text-emerald-100 shadow-lg backdrop-blur transition hover:bg-slate-800"
        >
          {panelOpen ? "Hide Panel" : "Show Panel"}
        </button>

        {panelOpen && (
          <div className="relative w-[480px] max-w-[94vw] max-h-[88vh] overflow-y-auto rounded-3xl">
            <div className="relative h-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/95 shadow-2xl backdrop-blur">
              {isLoading ? (
                <div className="p-6">
                  <DataState state="loading" />
                </div>
              ) : isError ? (
                <div className="p-6">
                  <DataState state="error" message={(error as Error).message} />
                </div>
              ) : (
                <TowerInfoPanel
                  tower={selectedTower}
                  activeTab={activeLeftTab}
                  onTabChange={setActiveLeftTab}
                  selectedSiteId={activeSiteId}
                  onSelectSite={setSelectedSiteId}
                  onOpenSearch={() => setActiveOverlay(activeOverlay === "search" ? null : "search")}
                  onOpenLayers={() => setActiveOverlay(activeOverlay === "layers" ? null : "layers")}
                  onOpenAnalytics={() => setActiveOverlay(activeOverlay === "analytics" ? null : "analytics")}
                  onOpenAlerts={() => setActiveOverlay(activeOverlay === "alerts" ? null : "alerts")}
                  towers={towersEnriched}
                />
              )}

              {activeOverlay === "search" && (
                <TowerSearchPanel
                  towers={towersEnriched}
                  selectedTowerId={selectedTower?.id ?? null}
                  onClose={() => setActiveOverlay(null)}
                  onSelect={(id) => {
                    handleSelectTower(id);
                    setActiveOverlay(null);
                  }}
                />
              )}

              {activeOverlay === "layers" && (
                <LayersPanel
                  layerState={layerState}
                  onToggle={(key) =>
                    setLayerState((prev) => ({
                      ...prev,
                      [key]: !prev[key as keyof typeof prev],
                    }))
                  }
                  onClose={() => setActiveOverlay(null)}
                />
              )}

              {activeOverlay === "analytics" && (
                <TowerAnalyticsPanel
                  onClose={() => setActiveOverlay(null)}
                  ndviData={[
                    { month: "Jan", ndvi: 0.45 },
                    { month: "Feb", ndvi: 0.52 },
                    { month: "Mar", ndvi: 0.59 },
                    { month: "Apr", ndvi: 0.62 },
                    { month: "May", ndvi: 0.66 },
                    { month: "Jun", ndvi: 0.61 },
                  ]}
                  climateCards={[
                    { label: "Rainfall (mm)", value: "142", desc: "Last 30 days" },
                    { label: "Temp (°C)", value: "18.5", desc: "Avg last 30 days" },
                    { label: "Solar (MJ/m2)", value: "17.2", desc: "NASA POWER" },
                  ]}
                />
              )}

              {activeOverlay === "alerts" && (
                <TowerAlertsPanel
                  onClose={() => setActiveOverlay(null)}
                  whatsappNumber={whatsappNumber}
                  onNumberChange={setWhatsappNumber}
                  alertIntervalMinutes={alertIntervalMinutes}
                  onIntervalChange={setAlertIntervalMinutes}
                  alerts={[
                    {
                      id: "a1",
                      title: "Illegal logging detected",
                      tower: selectedTower?.name ?? "Unknown tower",
                      severity: "High",
                      time: "5 mins ago",
                      detail: "Rapid canopy loss detected on NW perimeter.",
                    },
                    {
                      id: "a2",
                      title: "NDVI drop",
                      tower: selectedTower?.name ?? "Unknown tower",
                      severity: "Medium",
                      time: "1 day ago",
                      detail: "Vegetation index dropped 12% vs last week.",
                    },
                  ]}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DashboardPage;
