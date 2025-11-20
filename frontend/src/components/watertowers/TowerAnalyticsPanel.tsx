import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface TowerAnalyticsPanelProps {
  onClose: () => void;
  ndviData: { month: string; ndvi: number }[];
  climateCards: { label: string; value: string; desc: string }[];
}

const TowerAnalyticsPanel = ({ onClose, ndviData, climateCards }: TowerAnalyticsPanelProps) => {
  return (
    <div className="absolute inset-y-0 left-0 z-20 flex h-full w-full max-w-full flex-col overflow-y-auto rounded-3xl bg-slate-950/95 p-4 text-white shadow-2xl lg:w-[calc(100%-16px)]">
      <div className="mb-3 flex items-center justify-between text-sm text-slate-200">
        <div className="flex items-center gap-2 text-base font-semibold">
          <span>Analytics</span>
        </div>
        <button onClick={onClose} className="rounded-full bg-slate-800 px-3 py-1 text-xs hover:bg-slate-700">
          Close
        </button>
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
          <p className="text-sm font-semibold text-white">NDVI Trend</p>
          <p className="text-xs text-slate-400">
            {/* TODO: Replace with real NDVI series per tower from backend. */}
            Placeholder NDVI time series.
          </p>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={ndviData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="month" stroke="#cbd5e1" />
                <YAxis domain={[0, 1]} stroke="#cbd5e1" />
                <Tooltip />
                <Line type="monotone" dataKey="ndvi" stroke="#22c55e" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {climateCards.map((card) => (
            <div key={card.label} className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-3">
              <p className="text-xs uppercase tracking-wide text-emerald-200">{card.label}</p>
              <p className="text-lg font-semibold text-white">{card.value}</p>
              <p className="text-xs text-slate-400">
                {card.desc} {/* TODO: Replace with real NASA POWER / Open-Meteo data. */}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TowerAnalyticsPanel;
