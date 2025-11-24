export function formatAreaKm2(areaHa?: number | null): string {
  if (areaHa == null) return "Area unknown";
  return `${(areaHa * 0.01).toFixed(2)} km²`;
}
