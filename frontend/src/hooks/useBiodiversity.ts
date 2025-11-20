import { useQuery } from "@tanstack/react-query";
import { getBiodiversityBySite } from "../api/client";

export const useBiodiversity = (siteId: string) =>
  useQuery({
    queryKey: ["biodiversity", siteId],
    queryFn: () => getBiodiversityBySite(siteId),
    enabled: Boolean(siteId),
  });
