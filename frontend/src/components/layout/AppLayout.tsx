import { Outlet, useLocation } from "react-router-dom";
import { useHealthPing } from "../../hooks/useHealthPing";
import clsx from "clsx";

const AppLayout = () => {
  const location = useLocation();
  const { data: health } = useHealthPing();

  return (
    <div className="min-h-screen bg-slate-50/60 text-brand-gray">
      <header className="border-b border-slate-200 bg-white">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-brand-teal">TowerGuard</p>
            <h1 className="text-3xl font-semibold text-brand-gray">Kenya Water Towers Observatory</h1>
            <p className="text-sm text-slate-500">
              Monitoring Kenya's 18 gazetted water towers through data-driven conservation.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-500">
            <span className="text-xs uppercase tracking-wide text-slate-400">API Status</span>
            <span
              className={clsx(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium",
                health?.status === "ok" ? "bg-green-100 text-green-700" : "bg-rose-100 text-rose-700",
              )}
            >
              {health?.status === "ok" ? "Online" : "Disconnected"}
            </span>
          </div>
        </div>
      </header>
      <main className="px-0 pb-0">
        <Outlet key={location.pathname} />
      </main>
    </div>
  );
};

export default AppLayout;
