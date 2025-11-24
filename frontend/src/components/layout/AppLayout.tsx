import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useHealthPing } from "../../hooks/useHealthPing";
import clsx from "clsx";

const AppLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { data: health } = useHealthPing();

  return (
    <div className="min-h-screen bg-warm-50 text-charcoal-900">
      {/* Back/Forward Navigation */}
      <div className="fixed top-4 left-4 flex gap-2 z-50">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full p-2 shadow-sm bg-white hover:bg-warm-100 transition-all duration-200 border border-warm-200"
          aria-label="Go back"
        >
          <svg className="w-5 h-5 text-charcoal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={() => navigate(1)}
          className="rounded-full p-2 shadow-sm bg-white hover:bg-warm-100 transition-all duration-200 border border-warm-200"
          aria-label="Go forward"
        >
          <svg className="w-5 h-5 text-charcoal-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <header className="border-b border-warm-200 bg-white shadow-sm">
        <div className="container mx-auto flex flex-col gap-4 px-4 py-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-widest text-soft-green-600 font-medium">TowerGuard</p>
            <h1 className="text-3xl font-semibold text-charcoal-900">Kenya Water Towers Observatory</h1>
            <p className="text-sm text-charcoal-600">
              Monitoring Kenya's 18 gazetted water towers through data-driven conservation.
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-charcoal-600">
            <span className="text-xs uppercase tracking-wide text-charcoal-500">API Status</span>
            <span
              className={clsx(
                "inline-flex items-center rounded-full px-3 py-1 text-xs font-medium shadow-sm",
                health?.status === "ok" ? "bg-soft-green-100 text-soft-green-700" : "bg-rose-50 text-rose-600",
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
