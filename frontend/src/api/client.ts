import type {
  ApiHealth,
  BiodiversitySpecies,
  FeatureRequestBody,
  Nursery,
  PredictionRequestBody,
  Site,
  SiteCreatePayload,
  SiteFeature,
  SitePrediction,
  WaterTower,
  CFA,
} from "./types";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";

type HttpMethod = "GET" | "POST" | "DELETE";

async function request<T>(path: string, method: HttpMethod = "GET", body?: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers: body
      ? {
          "Content-Type": "application/json",
        }
      : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    let payload: unknown;
    try {
      payload = await response.json();
    } catch {
      payload = await response.text();
    }
    throw payload;
  }

  return (await response.json()) as T;
}

export const getHealth = () => request<ApiHealth>("/health");
export const getSites = () => request<Site[]>("/sites");
export const createSite = (payload: SiteCreatePayload) => request<Site>("/sites", "POST", payload);
export const getSite = (siteId: string) => request<Site>(`/sites/${siteId}`);
export const getSiteFeatures = (siteId: string) => request<SiteFeature[]>(`/sites/${siteId}/features`);
export const getSitePredictions = (siteId: string) => request<SitePrediction[]>(`/sites/${siteId}/predictions`);
export const triggerFeatureExtraction = (siteId: string, body: FeatureRequestBody) =>
  request<SiteFeature>(`/sites/${siteId}/features`, "POST", body);
export const triggerPrediction = (siteId: string, body?: PredictionRequestBody) =>
  request<SitePrediction>(`/sites/${siteId}/predict`, "POST", body);
export const getWaterTowers = () => request<WaterTower[]>("/water-towers");
export async function getBiodiversityByWaterTower(waterTowerId: string) {
  const res = await fetch(`${API_BASE_URL}/biodiversity?water_tower_id=${encodeURIComponent(waterTowerId)}`);
  if (!res.ok) {
    throw await res.json();
  }
  return res.json() as Promise<BiodiversitySpecies[]>;
}
export async function getBiodiversityBySite(siteId: string) {
  const res = await fetch(`${API_BASE_URL}/biodiversity?site_id=${encodeURIComponent(siteId)}`);
  if (!res.ok) {
    throw await res.json();
  }
  return res.json() as Promise<BiodiversitySpecies[]>;
}
export const getNurseries = () => request<Nursery[]>("/nurseries");
export const getCFAs = (waterTowerId?: string) =>
  request<CFA[]>(waterTowerId ? `/cfas?water_tower_id=${encodeURIComponent(waterTowerId)}` : "/cfas");

// Enrich all water towers (NDVI, climate, soil)
export const enrichAllWaterTowers = (ndviStart: string, ndviEnd: string) =>
  request<WaterTower[]>(`/water-towers/enrich-all?ndvi_start=${encodeURIComponent(ndviStart)}&ndvi_end=${encodeURIComponent(ndviEnd)}`, "POST");
