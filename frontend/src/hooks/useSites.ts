import { useQuery } from "@tanstack/react-query";
import { getSites } from "../api/client";

export const useSites = () => useQuery({ queryKey: ["sites"], queryFn: getSites });
