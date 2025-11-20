import type { ProtectionStatus, RiskLevel } from "../../pages/DashboardPage";

interface TowerFiltersToolbarProps {
  searchTerm: string;
  onSearchChange: (v: string) => void;
  riskFilter: RiskLevel | "All";
  onRiskChange: (v: RiskLevel | "All") => void;
  protectionFilter: ProtectionStatus | "All";
  onProtectionChange: (v: ProtectionStatus | "All") => void;
  viewMode: "grid" | "list";
  onViewModeChange: (v: "grid" | "list") => void;
}

const riskOptions: Array<RiskLevel | "All"> = ["All", "High", "Medium", "Low"];
const protectionOptions: Array<ProtectionStatus | "All"> = ["All", "Gazetted", "Proposed", "Degraded", "Other"];

const TowerFiltersToolbar = ({
  searchTerm,
  onSearchChange,
  riskFilter,
  onRiskChange,
  protectionFilter,
  onProtectionChange,
  viewMode,
  onViewModeChange,
}: TowerFiltersToolbarProps) => {
  return (
    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-1 flex-wrap items-center gap-3">
        <input
          type="search"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search by tower name or county"
          className="w-full max-w-xs rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-brand-green focus:outline-none"
        />
        <select
          value={riskFilter}
          onChange={(e) => onRiskChange(e.target.value as RiskLevel | "All")}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-brand-green focus:outline-none"
        >
          {riskOptions.map((opt) => (
            <option key={opt} value={opt}>
              Risk: {opt}
            </option>
          ))}
        </select>
        <select
          value={protectionFilter}
          onChange={(e) => onProtectionChange(e.target.value as ProtectionStatus | "All")}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm shadow-sm focus:border-brand-green focus:outline-none"
        >
          {protectionOptions.map((opt) => (
            <option key={opt} value={opt}>
              Protection: {opt}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-2 text-sm">
        <button
          type="button"
          onClick={() => onViewModeChange("grid")}
          className={`rounded-md px-3 py-2 font-medium ${
            viewMode === "grid" ? "bg-brand-green text-white" : "border border-slate-200 bg-white text-slate-600"
          }`}
        >
          Grid
        </button>
        <button
          type="button"
          onClick={() => onViewModeChange("list")}
          className={`rounded-md px-3 py-2 font-medium ${
            viewMode === "list" ? "bg-brand-green text-white" : "border border-slate-200 bg-white text-slate-600"
          }`}
        >
          List
        </button>
      </div>
    </div>
  );
};

export default TowerFiltersToolbar;
