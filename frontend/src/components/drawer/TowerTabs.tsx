import React from "react";

interface TowerTabsProps {
  tabs: { id: string; label: string }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

const TowerTabs = ({ tabs, activeTab, onTabChange }: TowerTabsProps) => (
  <div className="tabs mt-4 flex gap-2 text-sm font-semibold">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onTabChange(tab.id)}
        className={`rounded-full px-4 py-2 transition-all ${
          activeTab === tab.id
            ? "bg-soft-green-600 text-white shadow-md"
            : "bg-warm-100 text-charcoal-600 hover:bg-warm-200 border border-warm-200"
        }`}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

export default TowerTabs;
