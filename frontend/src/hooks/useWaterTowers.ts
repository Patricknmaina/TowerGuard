import { useQuery } from "@tanstack/react-query";
import { getWaterTowers } from "../api/client";

export const useWaterTowers = () =>
  useQuery({ queryKey: ["water-towers"], queryFn: getWaterTowers });
