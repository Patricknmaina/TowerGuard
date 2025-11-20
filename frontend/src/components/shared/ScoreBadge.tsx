interface ScoreBadgeProps {
  score?: number | null;
}

const ScoreBadge = ({ score }: ScoreBadgeProps) => {
  if (score == null) {
    return <span className="rounded-full bg-slate-200 px-3 py-1 text-xs text-slate-500">Awaiting data</span>;
  }

  let label = "Unknown";
  let color = "bg-slate-100 text-slate-700";

  if (score >= 0.75) {
    label = "Healthy";
    color = "bg-green-100 text-green-700";
  } else if (score >= 0.5) {
    label = "At Risk";
    color = "bg-amber-100 text-amber-700";
  } else {
    label = "Critical";
    color = "bg-rose-100 text-rose-700";
  }

  return (
    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${color}`}>
      {label} · {score.toFixed(2)}
    </span>
  );
};

export default ScoreBadge;
