import { useQuery } from "@tanstack/react-query";
import { getHealth } from "../api/client";

export const useHealthPing = () =>
  useQuery({
    queryKey: ["health"],
    queryFn: getHealth,
    refetchInterval: 60_000,
  });
