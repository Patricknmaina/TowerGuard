import { useQuery } from "@tanstack/react-query";
import { getBiodiversityByWaterTower } from "../api/client";

export const useBiodiversityByTower = (towerId: string) =>
  useQuery({
    queryKey: ["biodiversity", "tower", towerId],
    queryFn: () => getBiodiversityByWaterTower(towerId),
    enabled: Boolean(towerId),
  });
