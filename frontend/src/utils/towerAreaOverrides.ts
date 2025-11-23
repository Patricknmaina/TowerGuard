const towerAreaKm2: Record<string, number> = {
  cherangani_hills: 2637.7,
  mau_forest_complex: 4047.1,
  mount_elgon: 1709.8,
  mount_kenya: 2500.0,
  aberdare_range: 1200.0,
  huri_hills: 600.0,
  lerroghi_kirisia_hills: 700.0,
  loita_hills: 1100.0,
  marmanet_forest: 350.0,
  matthews_range: 900.0,
  mount_kipipiri: 150.0,
  mount_kulal: 1300.0,
  mount_marsabit: 2000.0,
  mount_nyiru: 800.0,
  ndotos_hills: 500.0,
  nyambene_hills: 400.0,
  shimba_hills: 250.0,
  chyulu_hills: 230.0,
};

export function getTowerAreaHa(towerId?: string | null, areaHa?: number | null): number | null {
  if (typeof areaHa === "number" && !Number.isNaN(areaHa)) {
    return areaHa;
  }
  if (!towerId) {
    return null;
  }
  const overrideKm2 = towerAreaKm2[towerId];
  return overrideKm2 ? overrideKm2 * 100 : null;
}

