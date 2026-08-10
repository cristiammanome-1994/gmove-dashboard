import { useMemo } from "react";
import { ProcessedDashboard } from "@/lib/gmove-processor";

export function useSearchFilters(data: ProcessedDashboard | null | undefined, search: string) {
  return useMemo(() => {
    const q = (search ?? "").toLowerCase();
    const match = (name: string) => name.toLowerCase().includes(q);
    return {
      rDays: (data?.rankingDays ?? []).filter((p) => match(p.name)),
      rPts: (data?.rankingPoints ?? []).filter((p) => match(p.name)),
      rHist: (data?.historicalCompare ?? []).filter((p) => match(p.name)),
      rIna: (data?.inactives ?? []).filter((p) => match(p.name)),
      rVids: (data?.videos ?? []).filter((p) => match(p.name)),
    };
  }, [data, search]);
}
