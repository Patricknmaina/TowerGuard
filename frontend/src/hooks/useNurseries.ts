import { useQuery } from "@tanstack/react-query";
import { getNurseries } from "../api/client";

export const useNurseries = () => useQuery({ queryKey: ["nurseries"], queryFn: getNurseries });
