import type { FeatureCollection, Geometry } from "geojson";

export interface Site {
  id: string;
  name: string;
  description?: string;
  geometry: Geometry;
  country: string;
  created_at?: string;
  updated_at?: string | null;
}

export interface SiteCreatePayload {
  name: string;
  description?: string;
  geometry: Geometry;
  country?: string;
}

export interface SiteFeature {
  id: string;
  site_id: string;
  date: string;
  ndvi_mean?: number | null;
  ndvi_std?: number | null;
  rainfall?: number | null;
  soil_properties?: Record<string, unknown> | null;
  temperature?: number | null;
  other_env_features?: Record<string, unknown> | null;
  created_at: string;
}

export interface FeatureRequestBody {
  start_date: string;
  end_date: string;
}

export interface SitePrediction {
  id: string;
  site_id: string;
  date: string;
  survival_score: number;
  model_version: string;
  raw_outputs?: Record<string, unknown> | null;
  created_at: string;
}

export interface PredictionRequestBody {
  features_id?: string;
}

export interface WaterTower {
  id: string;
  name: string;
  counties: string[];
  geometry: FeatureCollection;
  area_hectares?: number;
  category?: string;
}

export interface Nursery {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  water_tower_id: string;
  species_scientific: string;
  species_local: string;
  capacity_seedlings?: number;
  source?: string;
}

export interface BiodiversitySpecies {
  scientific_name: string;
  local_name: string;
  english_common_name?: string;
  records: number;
}

export interface ApiHealth {
  status: string;
  message?: string;
}
