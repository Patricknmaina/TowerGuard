import { useQuery } from "@tanstack/react-query";
import { getCFAs } from "../api/client";

export const useCFAs = (waterTowerId?: string) =>
  useQuery({
    queryKey: ["cfas", waterTowerId ?? "all"],
    queryFn: () => getCFAs(waterTowerId),
  });
