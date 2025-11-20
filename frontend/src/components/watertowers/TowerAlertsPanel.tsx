interface AlertItem {
  id: string;
  title: string;
  tower: string;
  severity: "High" | "Medium" | "Low";
  time: string;
  detail: string;
}

interface TowerAlertsPanelProps {
  onClose: () => void;
  whatsappNumber: string;
  onNumberChange?: (val: string) => void;
  alertIntervalMinutes?: number;
  onIntervalChange?: (val: number) => void;
  alerts: AlertItem[];
}

const severityColor = (severity: AlertItem["severity"]) => {
  if (severity === "High") return "bg-rose-100 text-rose-700";
  if (severity === "Medium") return "bg-amber-100 text-amber-700";
  return "bg-emerald-100 text-emerald-700";
};

const TowerAlertsPanel = ({
  onClose,
  whatsappNumber,
  onNumberChange,
  alertIntervalMinutes,
  onIntervalChange,
  alerts,
}: TowerAlertsPanelProps) => {
  const encodedMsg = encodeURIComponent("TowerGuard alert: check latest incidents on the dashboard.");
  const waLink = `https://wa.me/${whatsappNumber.replace(/[+\\s-]/g, "")}?text=${encodedMsg}`;

  return (
    <div className="absolute inset-y-0 left-0 z-20 flex h-full w-full max-w-full flex-col overflow-y-auto rounded-3xl bg-slate-950/95 p-4 text-white shadow-2xl lg:w-[calc(100%-16px)]">
      <div className="mb-3 flex items-center justify-between text-sm text-slate-200">
        <div className="flex items-center gap-2 text-base font-semibold">
          <span>Alerts & WhatsApp Dispatch</span>
        </div>
        <button onClick={onClose} className="rounded-full bg-slate-800 px-3 py-1 text-xs hover:bg-slate-700">
          Close
        </button>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => (
          <div
            key={alert.id}
            className="flex flex-col gap-1 rounded-2xl border border-slate-800 bg-slate-900/80 px-3 py-3"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-white">{alert.title}</p>
                <p className="text-xs text-slate-400">{alert.tower}</p>
              </div>
              <span className={`rounded-full px-2 py-1 text-xs ${severityColor(alert.severity)}`}>{alert.severity}</span>
            </div>
            <p className="text-xs text-slate-300">{alert.detail}</p>
            <p className="text-[11px] text-slate-500">{alert.time}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded-2xl border border-emerald-500/40 bg-emerald-900/20 p-4">
        <p className="text-sm font-semibold text-white">Send WhatsApp Update</p>
        <p className="text-xs text-slate-300">Dispatch alerts to the ranger group via WhatsApp.</p>
        <div className="mt-2 flex items-center gap-2">
          <input
            type="tel"
            value={whatsappNumber}
            onChange={(e) => onNumberChange?.(e.target.value)}
            className="w-full rounded-lg border border-emerald-500/40 bg-slate-950/70 px-3 py-2 text-sm text-white focus:border-emerald-300 focus:outline-none"
            placeholder="+2547XXXXXXX"
          />
        </div>
        <div className="mt-2">
          <label className="text-xs text-emerald-100">Alert interval (minutes)</label>
          <input
            type="number"
            min={5}
            value={alertIntervalMinutes ?? ""}
            onChange={(e) => onIntervalChange?.(Number(e.target.value) || 0)}
            className="mt-1 w-full rounded-lg border border-emerald-500/40 bg-slate-950/70 px-3 py-2 text-sm text-white focus:border-emerald-300 focus:outline-none"
            placeholder="e.g. 30"
          />
          <p className="pt-1 text-[11px] text-emerald-200/80">
            {/* TODO: wire this interval to your alert scheduler/cron job in the backend. */}
            Alerts will be sent automatically based on this interval; ensure your backend scheduler uses this value.
          </p>
        </div>
        <a
          href={waLink}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center rounded-full bg-emerald-600 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-500"
        >
          Open WhatsApp
        </a>
      </div>
    </div>
  );
};

export default TowerAlertsPanel;
