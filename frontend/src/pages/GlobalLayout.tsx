import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";

const GlobalLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [historyIdx, setHistoryIdx] = useState<number>(0);

  useEffect(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0;
    setHistoryIdx(idx);
  }, [location]);

  const handleBack = () => {
    if (historyIdx > 0) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  const handleForward = () => {
    navigate(1);
  };

  return (
    <>
      <div className="fixed top-4 left-4 flex gap-2 z-50">
        <button
          onClick={handleBack}
          className="rounded-full bg-white p-2 shadow-sm text-gray-700 border border-gray-200 hover:bg-gray-100 hover:-translate-y-0.5 transition-all duration-200"
          aria-label="Go back"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <button
          onClick={handleForward}
          className="rounded-full bg-white p-2 shadow-sm text-gray-700 border border-gray-200 hover:bg-gray-100 hover:-translate-y-0.5 transition-all duration-200"
          aria-label="Go forward"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
      <Outlet />
    </>
  );
};

export default GlobalLayout;
