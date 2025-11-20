import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import type { SiteFeature } from "../../api/types";

interface NdviTrendProps {
  features?: SiteFeature[];
}

const NdviTrend = ({ features }: NdviTrendProps) => {
  if (!features?.length) {
    return <p className="text-sm text-slate-500">No NDVI records available yet.</p>;
  }

  const chartData = features
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((item) => ({
      date: new Date(item.date).toLocaleDateString(),
      ndvi: item.ndvi_mean ?? 0,
    }));

  return (
    <ResponsiveContainer width="100%" height={320}>
      <LineChart data={chartData} margin={{ left: 24, right: 24 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis dataKey="date" tick={{ fontSize: 12 }} />
        <YAxis domain={[0, 1]} tick={{ fontSize: 12 }} />
        <Tooltip />
        <Line type="monotone" dataKey="ndvi" stroke="#2D6A4F" strokeWidth={3} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  );
};

export default NdviTrend;
