import React from "react";

interface StatCardProps {
  label: string;
  value: string | number;
  description?: string;
}

const StatCard = ({ label, value, description }: StatCardProps) => (
  <div className="rounded-2xl border border-warm-200 bg-gradient-to-br from-white to-warm-50/50 p-6 shadow-sm hover:shadow-md transition-shadow">
    <p className="text-xs uppercase tracking-[0.4em] text-soft-green-600 font-medium">{label}</p>
    <p className="mt-2 text-3xl font-semibold text-charcoal-900">{value}</p>
    {description && <p className="mt-2 text-xs text-charcoal-600 leading-relaxed">{description}</p>}
  </div>
);

export default StatCard;
