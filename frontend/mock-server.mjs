import http from "node:http";
import url from "node:url";

const PORT = Number(process.env.PORT ?? 8787);

const sites = [
  {
    id: "site-aberdare",
    name: "Aberdare North Block",
    description: "Restoration corridor within Aberdare Range water tower.",
    country: "Kenya",
    geometry: { type: "Point", coordinates: [36.676, -0.353] },
    created_at: "2024-10-01T08:00:00Z",
  },
  {
    id: "site-mau",
    name: "Mau East Pilot",
    description: "Community-led reforestation plot in the Mau Complex.",
    country: "Kenya",
    geometry: { type: "Point", coordinates: [35.556, -0.478] },
    created_at: "2024-11-05T08:00:00Z",
  },
  {
    id: "site-mtkenya",
    name: "Mt. Kenya South Ridge",
    description: "Riparian buffer near Chogoria.",
    country: "Kenya",
    geometry: { type: "Point", coordinates: [37.448, -0.241] },
    created_at: "2025-01-10T08:00:00Z",
  },
];

const features = {
  "site-aberdare": [
    {
      id: "f1",
      site_id: "site-aberdare",
      date: "2025-01-15",
      ndvi_mean: 0.62,
      ndvi_std: 0.08,
      rainfall: 122.4,
      temperature: 18.5,
      soil_properties: { soc: 2.1, ph: 5.8 },
      other_env_features: { slope_deg: 6 },
      created_at: "2025-01-15T08:00:00Z",
    },
    {
      id: "f2",
      site_id: "site-aberdare",
      date: "2025-02-15",
      ndvi_mean: 0.68,
      ndvi_std: 0.07,
      rainfall: 138.2,
      temperature: 18.0,
      soil_properties: { soc: 2.1, ph: 5.8 },
      other_env_features: { slope_deg: 6 },
      created_at: "2025-02-15T08:00:00Z",
    },
  ],
  "site-mau": [
    {
      id: "f3",
      site_id: "site-mau",
      date: "2025-01-10",
      ndvi_mean: 0.54,
      ndvi_std: 0.09,
      rainfall: 110.3,
      temperature: 19.2,
      soil_properties: { soc: 1.9, ph: 6.1 },
      other_env_features: { slope_deg: 4 },
      created_at: "2025-01-10T08:00:00Z",
    },
    {
      id: "f4",
      site_id: "site-mau",
      date: "2025-02-10",
      ndvi_mean: 0.57,
      ndvi_std: 0.1,
      rainfall: 118.8,
      temperature: 18.7,
      soil_properties: { soc: 1.9, ph: 6.1 },
      other_env_features: { slope_deg: 4 },
      created_at: "2025-02-10T08:00:00Z",
    },
  ],
  "site-mtkenya": [
    {
      id: "f5",
      site_id: "site-mtkenya",
      date: "2025-01-20",
      ndvi_mean: 0.71,
      ndvi_std: 0.06,
      rainfall: 146.1,
      temperature: 17.3,
      soil_properties: { soc: 2.4, ph: 5.6 },
      other_env_features: { slope_deg: 8 },
      created_at: "2025-01-20T08:00:00Z",
    },
    {
      id: "f6",
      site_id: "site-mtkenya",
      date: "2025-02-20",
      ndvi_mean: 0.75,
      ndvi_std: 0.05,
      rainfall: 152.9,
      temperature: 17.0,
      soil_properties: { soc: 2.4, ph: 5.6 },
      other_env_features: { slope_deg: 8 },
      created_at: "2025-02-20T08:00:00Z",
    },
  ],
};

const predictions = {
  "site-aberdare": {
    id: "p1",
    site_id: "site-aberdare",
    date: "2025-02-16",
    survival_score: 0.81,
    model_version: "rule-based-v1",
    raw_outputs: { ndvi: 0.68, rainfall: 138.2 },
    created_at: "2025-02-16T08:00:00Z",
  },
  "site-mau": {
    id: "p2",
    site_id: "site-mau",
    date: "2025-02-11",
    survival_score: 0.63,
    model_version: "rule-based-v1",
    raw_outputs: { ndvi: 0.57, rainfall: 118.8 },
    created_at: "2025-02-11T08:00:00Z",
  },
  "site-mtkenya": {
    id: "p3",
    site_id: "site-mtkenya",
    date: "2025-02-21",
    survival_score: 0.89,
    model_version: "rule-based-v1",
    raw_outputs: { ndvi: 0.75, rainfall: 152.9 },
    created_at: "2025-02-21T08:00:00Z",
  },
};

const waterTowers = [
  { id: "aberdare", name: "Aberdare Range", counties: ["Nyeri", "Murang'a", "Kiambu", "Nyandarua", "Laikipia"], category: "gazetted", geometry: { type: "FeatureCollection", features: [] } },
  { id: "cherangani", name: "Cherangani Hills", counties: ["Elgeyo Marakwet", "West Pokot", "Trans Nzoia", "Uasin Gishu"], category: "gazetted", geometry: { type: "FeatureCollection", features: [] } },
  { id: "chyulu", name: "Chyulu Hills", counties: ["Makueni", "Taita Taveta", "Kajiado"], category: "gazetted", geometry: { type: "FeatureCollection", features: [] } },
  { id: "huri", name: "Huri Hills", counties: ["Marsabit"], category: "gazetted", geometry: { type: "FeatureCollection", features: [] } },
  { id: "kirisia", name: "Lerroghi Kirisia Hills", counties: ["Samburu"], category: "gazetted", geometry: { type: "FeatureCollection", features: [] } },
  { id: "loita", name: "Loita Hills", counties: ["Narok"], category: "gazetted", geometry: { type: "FeatureCollection", features: [] } },
  { id: "marmanet", name: "Marmanet Forest", counties: ["Laikipia", "Nakuru", "Baringo", "Nyandarua"], category: "gazetted", geometry: { type: "FeatureCollection", features: [] } },
  { id: "matthews", name: "Matthews Range", counties: ["Samburu"], category: "gazetted", geometry: { type: "FeatureCollection", features: [] } },
  { id: "mau", name: "Mau Forest Complex", counties: ["Nakuru", "Baringo", "Kericho", "Narok", "Bomet", "Nandi", "Uasin Gishu"], category: "gazetted", geometry: { type: "FeatureCollection", features: [] } },
  { id: "mtelgon", name: "Mount Elgon Water Tower", counties: ["Bungoma", "Trans Nzoia"], category: "gazetted", geometry: { type: "FeatureCollection", features: [] } },
  { id: "mtkenya", name: "Mount Kenya Water Tower", counties: ["Embu", "Tharaka Nithi", "Meru", "Laikipia", "Nyeri", "Kirinyaga"], category: "gazetted", geometry: { type: "FeatureCollection", features: [] } },
  { id: "mtkipipiri", name: "Mount Kipipiri", counties: ["Nyandarua"], category: "gazetted", geometry: { type: "FeatureCollection", features: [] } },
  { id: "mtkulal", name: "Mount Kulal", counties: ["Marsabit"], category: "gazetted", geometry: { type: "FeatureCollection", features: [] } },
  { id: "mtmarsabit", name: "Mount Marsabit", counties: ["Marsabit"], category: "gazetted", geometry: { type: "FeatureCollection", features: [] } },
  { id: "mtnyiru", name: "Mount Nyiru", counties: ["Samburu"], category: "gazetted", geometry: { type: "FeatureCollection", features: [] } },
  { id: "ndotos", name: "Ndotos Hills", counties: ["Samburu"], category: "gazetted", geometry: { type: "FeatureCollection", features: [] } },
  { id: "nyambene", name: "Nyambene Hills", counties: ["Meru"], category: "gazetted", geometry: { type: "FeatureCollection", features: [] } },
  { id: "shimba", name: "Shimba Hills", counties: ["Kwale"], category: "gazetted", geometry: { type: "FeatureCollection", features: [] } },
];

const biodiversity = {
  "site-aberdare": [
    { scientific_name: "Juniperus procera", local_name: "Mũnunga", english_common_name: "African pencil cedar", records: 12 },
    { scientific_name: "Prunus africana", local_name: "Muiri", english_common_name: "African cherry", records: 7 },
  ],
  "site-mau": [
    { scientific_name: "Olea capensis", local_name: "Muteret", english_common_name: "Cape ash", records: 9 },
    { scientific_name: "Podocarpus latifolius", local_name: "Podo", english_common_name: "Real yellowwood", records: 5 },
  ],
  "site-mtkenya": [
    { scientific_name: "Hagenia abyssinica", local_name: "Kosso", english_common_name: "African redwood", records: 8 },
    { scientific_name: "Dombeya torrida", local_name: "Muthitho", english_common_name: "Rope Dome", records: 6 },
  ],
};

const nurseries = [
  {
    id: "nursery-1",
    name: "Aberdare Youth Nursery",
    latitude: -0.345,
    longitude: 36.69,
    water_tower_id: "aberdare",
    species_scientific: "Juniperus procera",
    species_local: "Mũnunga",
    capacity_seedlings: 12000,
    source: "community",
  },
  {
    id: "nursery-2",
    name: "Mau East Community Nursery",
    latitude: -0.49,
    longitude: 35.57,
    water_tower_id: "mau",
    species_scientific: "Olea capensis",
    species_local: "Muteret",
    capacity_seedlings: 10000,
    source: "CFA",
  },
  {
    id: "nursery-3",
    name: "Chogoria Ridge Nursery",
    latitude: -0.25,
    longitude: 37.45,
    water_tower_id: "mtkenya",
    species_scientific: "Hagenia abyssinica",
    species_local: "Kosso",
    capacity_seedlings: 8000,
    source: "community",
  },
];

function notFound(res) {
  res.writeHead(404, { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" });
  res.end(JSON.stringify({ detail: "Not found" }));
}

function sendJson(res, data) {
  res.writeHead(200, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
  });
  res.end(JSON.stringify(data));
}

const server = http.createServer((req, res) => {
  const parsed = url.parse(req.url, true);
  const path = parsed.pathname ?? "";

  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    return res.end();
  }

  if (path === "/api/health") {
    return sendJson(res, { status: "ok", message: "Mock API online" });
  }

  if (path === "/api/sites" && req.method === "GET") {
    return sendJson(res, sites);
  }

  if (path?.startsWith("/api/sites/")) {
    const [, , , siteId, maybeFeatures] = path.split("/");
    const site = sites.find((s) => s.id === siteId);
    if (!site) return notFound(res);

    if (!maybeFeatures && req.method === "GET") {
      return sendJson(res, site);
    }

    if (maybeFeatures === "features" && req.method === "GET") {
      return sendJson(res, features[siteId] ?? []);
    }

    if (maybeFeatures === "predict" && req.method === "POST") {
      return sendJson(res, predictions[siteId] ?? { detail: "No prediction" });
    }

    if (maybeFeatures === "features" && req.method === "POST") {
      // Echo back latest as if extraction succeeded
      const list = features[siteId] ?? [];
      return sendJson(res, list[list.length - 1] ?? {});
    }
  }

  if (path === "/api/water-towers") {
    return sendJson(res, waterTowers);
  }

  if (path === "/api/biodiversity") {
    const siteId = parsed.query.site_id;
    return sendJson(res, biodiversity[siteId] ?? []);
  }

  if (path === "/api/nurseries") {
    return sendJson(res, nurseries);
  }

  notFound(res);
});

server.listen(PORT, () => {
  console.log(`Mock API running at http://localhost:${PORT}/api`);
});
