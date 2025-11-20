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
    const text = await response.text();
    throw new Error(text || `API error ${response.status}`);
  }
  return (await response.json()) as T;
}

export const getHealth = () => request<ApiHealth>("/health");
export const getSites = () => request<Site[]>("/sites");
export const createSite = (payload: SiteCreatePayload) => request<Site>("/sites", "POST", payload);
export const getSite = (siteId: string) => request<Site>(`/sites/${siteId}`);
export const getSiteFeatures = (siteId: string) => request<SiteFeature[]>(`/sites/${siteId}/features`);
export const triggerFeatureExtraction = (siteId: string, body: FeatureRequestBody) =>
  request<SiteFeature>(`/sites/${siteId}/features`, "POST", body);
export const triggerPrediction = (siteId: string, body?: PredictionRequestBody) =>
  request<SitePrediction>(`/sites/${siteId}/predict`, "POST", body);
export const getWaterTowers = () => request<WaterTower[]>("/water-towers");
export const getBiodiversityBySite = (siteId: string) =>
  request<BiodiversitySpecies[]>(`/biodiversity?site_id=${siteId}`);
export const getNurseries = () => request<Nursery[]>("/nurseries");
