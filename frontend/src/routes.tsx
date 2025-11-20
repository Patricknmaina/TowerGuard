import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./components/layout/AppLayout";
import DashboardPage from "./pages/DashboardPage";
import SitesPage from "./pages/sites/SitesPage";
import SiteDetailPage from "./pages/site-detail/SiteDetailPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      {
        path: "sites",
        element: <SitesPage />,
      },
      {
        path: "sites/:siteId",
        element: <SiteDetailPage />,
      },
    ],
  },
]);
