import { useQuery } from "@tanstack/react-query";
import { getSite, getSiteFeatures } from "../api/client";

export const useSite = (siteId: string) =>
  useQuery({ queryKey: ["site", siteId], queryFn: () => getSite(siteId), enabled: Boolean(siteId) });

export const useSiteFeatures = (siteId: string) =>
  useQuery({
    queryKey: ["site", siteId, "features"],
    queryFn: () => getSiteFeatures(siteId),
    enabled: Boolean(siteId),
  });
