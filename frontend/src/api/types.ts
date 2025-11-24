import type { Geometry } from "geojson";

export interface Site {
  id: string;
  name: string;
  description?: string | null;
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
  start_date: string;
  end_date: string;
  ndvi_mean?: number | null;
  ndvi_std?: number | null;
  rainfall_total_mm?: number | null;
  rainfall_mean_mm_per_day?: number | null;
  tmin_c?: number | null;
  tmax_c?: number | null;
  solar_radiation?: number | null;
  soc?: number | null;
  sand?: number | null;
  clay?: number | null;
  silt?: number | null;
  ph?: number | null;
  source_breakdown?: Record<string, unknown> | null;
  partial: boolean;
  created_at: string;
  updated_at: string;
}

export interface FeatureRequestBody {
  start_date: string;
  end_date: string;
}

export interface RuleBreakdown {
  rule: string;
  points_awarded: number;
  max_points: number;
}

export interface SitePrediction {
  id: string;
  site_id: string;
  features_id: string;
  score: number;
  model_version: string;
  partial: boolean;
  prediction_metadata?: {
    raw_score: number;
    category: string;
    explanation: string;
    rule_breakdown: RuleBreakdown[];
  };
  created_at: string;
  updated_at: string;
}

export interface PredictionRequestBody {
  features_id?: string;
}

export interface WaterTower {
  id: string;
  name: string;
  counties: string[];
  geometry: Geometry;
  area_ha?: number;
  description?: string | null;
  metadata?: Record<string, unknown>;
}

export interface Nursery {
  id: string;
  name: string;
  lat: number;
  lon: number;
  water_tower_id?: string;
  species_scientific?: string;
  species_local?: string;
  capacity_seedlings?: number;
  contact_phone?: string;
  contact_email?: string;
  contact_address?: string;
  metadata?: Record<string, unknown>;
}

export interface CFA {
  id: string;
  name: string;
  water_tower_id?: string;
  county?: string;
  contact_email?: string;
  website?: string;
  notes?: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface BiodiversityRecord {
  id: string;
  scientific_name: string;
  local_name?: string | null;
  english_common_name?: string | null;
  lat?: number;
  lon?: number;
  site_id?: string | null;
  water_tower_id?: string | null;
  observed_at?: string | null;
  source?: string;
  created_at: string;
  updated_at: string;
}

export interface BiodiversitySpecies {
  scientific_name: string;
  local_name?: string | null;
  english_common_name?: string | null;
  records: BiodiversityRecord[];
}

export interface ApiHealth {
  status: string;
  message?: string;
  detail?: string;
}
