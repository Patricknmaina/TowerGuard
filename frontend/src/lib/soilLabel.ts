/**
 * Soil texture classification utilities
 * Based on USDA soil texture triangle
 */

export interface SoilTexture {
  label: string;
  description: string;
}

/**
 * Classify soil texture from sand, clay, silt percentages
 * 
 * @param sand - Sand content (as decimal 0-1 or percentage 0-100)
 * @param clay - Clay content (as decimal 0-1 or percentage 0-100)  
 * @param silt - Silt content (as decimal 0-1 or percentage 0-100)
 * @returns Soil texture classification
 */
export function classifySoilTexture(
  sand: number | null | undefined,
  clay: number | null | undefined,
  silt: number | null | undefined
): string {
  if (sand == null || clay == null || silt == null) {
    return "Not available yet";
  }

  // Normalize to percentages if given as decimals
  let sandPct = sand > 1 ? sand : sand * 100;
  let clayPct = clay > 1 ? clay : clay * 100;
  let siltPct = silt > 1 ? silt : silt * 100;

  const total = sandPct + clayPct + siltPct;
  if (total === 0 || Math.abs(total - 100) > 5) {
    // If values don't sum to ~100%, recalculate percentages
    sandPct = (sandPct / total) * 100;
    clayPct = (clayPct / total) * 100;
    siltPct = (siltPct / total) * 100;
  }

  // USDA soil texture triangle classification
  // High clay content
  if (clayPct >= 40) {
    if (sandPct <= 45 && siltPct < 40) return "Clay";
    if (sandPct > 45) return "Sandy Clay";
    return "Silty Clay";
  }

  // Clay loams
  if (clayPct >= 27) {
    if (sandPct >= 20 && sandPct < 45) return "Clay Loam";
    if (sandPct >= 45) return "Sandy Clay Loam";
    return "Silty Clay Loam";
  }

  // Loams
  if (clayPct >= 7 && clayPct < 27) {
    if (sandPct < 52) {
      if (siltPct >= 50) return "Silt Loam";
      if (siltPct >= 28 && sandPct < 45) return "Loam";
      return "Sandy Loam";
    }
    if (sandPct >= 52) {
      if (sandPct < 70) return "Sandy Loam";
      return "Loamy Sand";
    }
  }

  // High sand/silt content
  if (siltPct >= 80) return "Silt";
  if (siltPct >= 50) return "Silt Loam";
  if (sandPct >= 85) return "Sand";
  if (sandPct >= 70) return "Loamy Sand";

  return "Loam"; // Default
}

/**
 * Get detailed soil texture information
 */
export function getSoilTextureInfo(
  sand: number | null | undefined,
  clay: number | null | undefined,
  silt: number | null | undefined
): SoilTexture {
  const label = classifySoilTexture(sand, clay, silt);

  const descriptions: Record<string, string> = {
    "Clay": "Heavy, nutrient-rich soil with high water retention",
    "Silty Clay": "Fine-textured, fertile soil with good water holding capacity",
    "Sandy Clay": "Coarse clay with moderate drainage",
    "Clay Loam": "Well-balanced, fertile soil ideal for most crops",
    "Silty Clay Loam": "Rich, moisture-retentive soil excellent for agriculture",
    "Sandy Clay Loam": "Well-draining, workable soil with good fertility",
    "Loam": "Ideal balanced soil with excellent properties",
    "Silt Loam": "Fertile, smooth-textured soil with good moisture retention",
    "Sandy Loam": "Well-draining, easy to work soil suitable for many species",
    "Loamy Sand": "Quick-draining sandy soil with some nutrient retention",
    "Silt": "Very fine-textured, fertile but prone to compaction",
    "Sand": "Coarse, fast-draining soil requiring amendments",
    "Not available yet": "Soil data pending enrichment",
  };

  return {
    label,
    description: descriptions[label] || "Soil classification available",
  };
}
