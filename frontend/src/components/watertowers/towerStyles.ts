import type { ProtectionStatus, RiskLevel } from "../../pages/DashboardPage";

export const riskBadgeColor = (risk?: RiskLevel) => {
  switch (risk) {
    case "High":
      return "bg-rose-100 text-rose-700";
    case "Medium":
      return "bg-amber-100 text-amber-700";
    case "Low":
      return "bg-emerald-100 text-emerald-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
};

export const protectionBadgeColor = (status?: ProtectionStatus) => {
  switch (status) {
    case "Gazetted":
      return "bg-emerald-50 text-emerald-800";
    case "Proposed":
      return "bg-sky-50 text-sky-700";
    case "Degraded":
      return "bg-amber-50 text-amber-700";
    case "Other":
      return "bg-slate-100 text-slate-700";
    default:
      return "bg-slate-100 text-slate-700";
  }
};
