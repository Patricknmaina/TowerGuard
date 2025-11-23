import { NavLink, Outlet } from "react-router-dom";
import { useHealthPing } from "../hooks/useHealthPing";

const NAV_ITEMS = [
  { label: "Home", to: "/" },
  { label: "Story", to: "/story" },
  { label: "Towers", to: "/towers" },
  { label: "Dashboard", to: "/dashboard" },
  { label: "Explore", to: "/explore" },
  { label: "Analytics", to: "/analytics" },
  { label: "Alerts", to: "/alerts" },
];

const AppShell = () => {
  const { data: health } = useHealthPing();
  const status = health?.status ?? "unknown";
  const statusLabel =
    status === "ok" ? "API Online" : status === "disconnected" ? "API Offline" : status;
  const statusClass =
    status === "ok"
      ? "bg-emerald-100 text-emerald-700"
      : status === "disconnected"
      ? "bg-rose-100 text-rose-700"
      : "bg-amber-100 text-amber-700";

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <header className="sticky top-0 z-30 border-b border-slate-800 bg-slate-950/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-emerald-300">TowerGuard</p>
            <h1 className="text-lg font-semibold">Kenya Water Towers Observatory</h1>
          </div>
          <nav className="flex flex-wrap gap-2 text-sm font-semibold">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  `rounded-full px-4 py-1 transition ${isActive ? "bg-emerald-500 text-white" : "text-slate-300 hover:text-white"}`
                }
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
          <div className={`rounded-full px-4 py-1 text-xs font-semibold ${statusClass}`}>
            {statusLabel}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
};

export default AppShell;
