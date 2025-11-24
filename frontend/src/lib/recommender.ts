/**
 * Species Recommender for Water Tower Restoration
 * 
 * Provides data-driven recommendations for indigenous species to plant
 * based on NDVI health, climate conditions, soil properties, and existing biodiversity.
 */

export interface SpeciesRecommendation {
  scientificName: string;
  localName: string | null;
  confidence: number; // 0-1 scale
  reasons: string[];
}

export interface ClimateData {
  temperature?: number | null; // Mean temperature in °C
  rainfall?: number | null; // Annual rainfall in mm
  droughtRisk?: "low" | "medium" | "high" | null;
}

export interface SoilData {
  ph?: number | null;
  organicCarbon?: number | null; // SOC percentage
  clayPercent?: number | null;
}

export interface BiodiversityData {
  existingSpecies: string[]; // Scientific names already present
}

// Indigenous species database for Kenya water towers
const SPECIES_DATABASE = [
  // Pioneer species (hardy, fast-growing, good for degraded areas)
  {
    scientificName: "Acacia xanthophloea",
    localName: "Yellow Fever Tree",
    category: "pioneer",
    minTemp: 15,
    maxTemp: 35,
    minRainfall: 400,
    maxRainfall: 1200,
    phRange: [6.0, 8.5],
    droughtTolerance: "high",
    clayTolerance: "medium",
  },
  {
    scientificName: "Brachylaena huillensis",
    localName: "Muhuhu",
    category: "pioneer",
    minTemp: 18,
    maxTemp: 28,
    minRainfall: 600,
    maxRainfall: 1500,
    phRange: [6.5, 7.5],
    droughtTolerance: "medium",
    clayTolerance: "low",
  },
  {
    scientificName: "Croton megalocarpus",
    localName: "Mukinduri",
    category: "pioneer",
    minTemp: 16,
    maxTemp: 30,
    minRainfall: 500,
    maxRainfall: 1400,
    phRange: [6.0, 7.8],
    droughtTolerance: "high",
    clayTolerance: "medium",
  },
  {
    scientificName: "Ekebergia capensis",
    localName: "Cape Ash",
    category: "pioneer",
    minTemp: 15,
    maxTemp: 28,
    minRainfall: 700,
    maxRainfall: 1600,
    phRange: [6.2, 7.5],
    droughtTolerance: "medium",
    clayTolerance: "medium",
  },
  {
    scientificName: "Ficus sycomorus",
    localName: "Sycomore Fig",
    category: "pioneer",
    minTemp: 18,
    maxTemp: 32,
    minRainfall: 400,
    maxRainfall: 1200,
    phRange: [6.0, 8.0],
    droughtTolerance: "high",
    clayTolerance: "high",
  },
  
  // Mixed pioneers + climax species
  {
    scientificName: "Cordia africana",
    localName: "Large-leaved Cordia",
    category: "mixed",
    minTemp: 16,
    maxTemp: 28,
    minRainfall: 600,
    maxRainfall: 1500,
    phRange: [6.0, 7.5],
    droughtTolerance: "medium",
    clayTolerance: "medium",
  },
  {
    scientificName: "Juniperus procera",
    localName: "African Pencil Cedar",
    category: "mixed",
    minTemp: 10,
    maxTemp: 22,
    minRainfall: 800,
    maxRainfall: 2000,
    phRange: [6.0, 7.0],
    droughtTolerance: "low",
    clayTolerance: "low",
  },
  {
    scientificName: "Podocarpus falcatus",
    localName: "Outeniqua Yellowwood",
    category: "mixed",
    minTemp: 12,
    maxTemp: 24,
    minRainfall: 900,
    maxRainfall: 2000,
    phRange: [5.5, 7.0],
    droughtTolerance: "low",
    clayTolerance: "low",
  },
  
  // Climax forest species (for healthy, established forests)
  {
    scientificName: "Olea europaea",
    localName: "African Olive",
    category: "climax",
    minTemp: 14,
    maxTemp: 26,
    minRainfall: 800,
    maxRainfall: 1800,
    phRange: [6.5, 7.5],
    droughtTolerance: "medium",
    clayTolerance: "medium",
  },
  {
    scientificName: "Prunus africana",
    localName: "African Cherry",
    category: "climax",
    minTemp: 12,
    maxTemp: 24,
    minRainfall: 1000,
    maxRainfall: 2200,
    phRange: [5.5, 7.0],
    droughtTolerance: "low",
    clayTolerance: "low",
  },
  {
    scientificName: "Warburgia ugandensis",
    localName: "East African Greenheart",
    category: "climax",
    minTemp: 15,
    maxTemp: 26,
    minRainfall: 900,
    maxRainfall: 2000,
    phRange: [6.0, 7.0],
    droughtTolerance: "low",
    clayTolerance: "medium",
  },
  {
    scientificName: "Newtonia buchananii",
    localName: "Forest Newtonia",
    category: "climax",
    minTemp: 14,
    maxTemp: 25,
    minRainfall: 1000,
    maxRainfall: 2200,
    phRange: [5.5, 7.0],
    droughtTolerance: "low",
    clayTolerance: "low",
  },
];

/**
 * Determines NDVI category for species selection
 */
function getNDVICategory(ndvi: number | null | undefined): "low" | "medium" | "high" {
  if (ndvi == null) return "medium"; // Default to medium if unknown
  
  // Handle different NDVI ranges:
  // - Health score: 0-1 range (0 = poor, 1 = excellent)
  // - Raw NDVI: -1 to 1 range (-1 = no vegetation, 1 = dense vegetation)
  let normalizedNDVI: number;
  
  if (ndvi >= 0 && ndvi <= 1) {
    // Likely a health score (0-1), use directly
    normalizedNDVI = ndvi;
  } else if (ndvi >= -1 && ndvi <= 1) {
    // Raw NDVI (-1 to 1), normalize to 0-1
    normalizedNDVI = (ndvi + 1) / 2;
  } else {
    // Out of range, default to medium
    return "medium";
  }
  
  // Categorize based on normalized 0-1 scale
  if (normalizedNDVI < 0.3) return "low";
  if (normalizedNDVI < 0.6) return "medium";
  return "high";
}

/**
 * Checks if a species is suitable for given climate conditions
 */
function isClimateSuitable(
  species: typeof SPECIES_DATABASE[0],
  climate: ClimateData
): { suitable: boolean; reason?: string } {
  if (climate.temperature != null) {
    if (climate.temperature < species.minTemp || climate.temperature > species.maxTemp) {
      return {
        suitable: false,
        reason: `Temperature ${climate.temperature.toFixed(1)}°C outside optimal range (${species.minTemp}-${species.maxTemp}°C)`,
      };
    }
  }

  if (climate.rainfall != null) {
    if (climate.rainfall < species.minRainfall || climate.rainfall > species.maxRainfall) {
      return {
        suitable: false,
        reason: `Rainfall ${climate.rainfall.toFixed(0)}mm outside optimal range (${species.minRainfall}-${species.maxRainfall}mm)`,
      };
    }
  }

  // Check drought risk
  if (climate.droughtRisk === "high" && species.droughtTolerance === "low") {
    return { suitable: false, reason: "Low drought tolerance for high-risk area" };
  }

  return { suitable: true };
}

/**
 * Checks if a species is suitable for given soil conditions
 */
function isSoilSuitable(
  species: typeof SPECIES_DATABASE[0],
  soil: SoilData
): { suitable: boolean; reason?: string } {
  if (soil.ph != null) {
    if (soil.ph < species.phRange[0] || soil.ph > species.phRange[1]) {
      return {
        suitable: false,
        reason: `Soil pH ${soil.ph.toFixed(1)} outside optimal range (${species.phRange[0]}-${species.phRange[1]})`,
      };
    }
  }

  // High clay content may be problematic for some species
  if (soil.clayPercent != null && soil.clayPercent > 40) {
    if (species.clayTolerance === "low") {
      return { suitable: false, reason: "Low clay tolerance for heavy clay soil" };
    }
  }

  return { suitable: true };
}

/**
 * Calculates confidence score for a species recommendation
 */
function calculateConfidence(
  species: typeof SPECIES_DATABASE[0],
  ndviCategory: "low" | "medium" | "high",
  climate: ClimateData,
  soil: SoilData
): number {
  let confidence = 0.5; // Base confidence

  // Category match bonus
  if (
    (ndviCategory === "low" && species.category === "pioneer") ||
    (ndviCategory === "high" && species.category === "climax") ||
    (ndviCategory === "medium" && (species.category === "mixed" || species.category === "pioneer"))
  ) {
    confidence += 0.2;
  }

  // Climate suitability bonus
  const climateCheck = isClimateSuitable(species, climate);
  if (climateCheck.suitable) {
    confidence += 0.15;
    if (climate.temperature != null && climate.rainfall != null) {
      confidence += 0.1; // Both climate variables available
    }
  }

  // Soil suitability bonus
  const soilCheck = isSoilSuitable(species, soil);
  if (soilCheck.suitable) {
    confidence += 0.15;
    if (soil.ph != null) {
      confidence += 0.05; // pH data available
    }
  }

  // Drought risk adjustment
  if (climate.droughtRisk === "high" && species.droughtTolerance === "high") {
    confidence += 0.1;
  }

  return Math.min(1.0, confidence);
}

/**
 * Generates reasons for recommending a species
 */
function generateReasons(
  species: typeof SPECIES_DATABASE[0],
  ndviCategory: "low" | "medium" | "high",
  climate: ClimateData,
  soil: SoilData
): string[] {
  const reasons: string[] = [];

  // NDVI-based reason
  if (ndviCategory === "low") {
    reasons.push("Pioneer species ideal for degraded areas with low vegetation cover");
  } else if (ndviCategory === "high") {
    reasons.push("Climax species suitable for established forest ecosystems");
  } else {
    reasons.push("Mixed species appropriate for moderate vegetation health");
  }

  // Climate reasons
  if (climate.temperature != null) {
    reasons.push(`Thrives in temperature range ${species.minTemp}-${species.maxTemp}°C (current: ${climate.temperature.toFixed(1)}°C)`);
  }
  if (climate.rainfall != null) {
    reasons.push(`Optimal rainfall range ${species.minRainfall}-${species.maxRainfall}mm (current: ${climate.rainfall.toFixed(0)}mm)`);
  }
  if (climate.droughtRisk === "high" && species.droughtTolerance === "high") {
    reasons.push("High drought tolerance for water-stressed conditions");
  }

  // Soil reasons
  if (soil.ph != null) {
    reasons.push(`Soil pH ${soil.ph.toFixed(1)} within optimal range (${species.phRange[0]}-${species.phRange[1]})`);
  }
  if (soil.organicCarbon != null && soil.organicCarbon > 2) {
    reasons.push("Good soil organic carbon content supports growth");
  }

  // Category-specific reasons
  if (species.category === "pioneer") {
    reasons.push("Fast-growing pioneer species helps establish forest structure");
  } else if (species.category === "climax") {
    reasons.push("Climax species contributes to mature forest ecosystem");
  }

  return reasons;
}

/**
 * Main recommendation function
 */
export function recommendSpeciesForTower(
  towerId: string,
  ndvi: number | null | undefined,
  climate: ClimateData,
  soil: SoilData,
  biodiversity: BiodiversityData
): SpeciesRecommendation[] {
  const ndviCategory = getNDVICategory(ndvi);
  const existingSpecies = biodiversity.existingSpecies.map((name) => name.toLowerCase());

  // Filter and score species
  const candidates = SPECIES_DATABASE.filter((species) => {
    // Exclude already present species
    if (existingSpecies.includes(species.scientificName.toLowerCase())) {
      return false;
    }

    // Filter by NDVI category
    if (ndviCategory === "low" && species.category !== "pioneer") {
      return false;
    }
    if (ndviCategory === "high" && species.category !== "climax") {
      return false;
    }
    // Medium NDVI can use all categories

    // Check climate suitability
    const climateCheck = isClimateSuitable(species, climate);
    if (!climateCheck.suitable) {
      return false;
    }

    // Check soil suitability
    const soilCheck = isSoilSuitable(species, soil);
    if (!soilCheck.suitable) {
      return false;
    }

    return true;
  });

  // Score and rank candidates
  const scored = candidates.map((species) => {
    const confidence = calculateConfidence(species, ndviCategory, climate, soil);
    const reasons = generateReasons(species, ndviCategory, climate, soil);

    return {
      scientificName: species.scientificName,
      localName: species.localName,
      confidence,
      reasons,
    };
  });

  // Sort by confidence (highest first) and return top recommendations
  return scored.sort((a, b) => b.confidence - a.confidence).slice(0, 8);
}
