import { createBrowserRouter } from "react-router-dom";
import AppShell from "./pages/AppShell";
import GlobalLayout from "./pages/GlobalLayout";
import LandingPage from "./pages/LandingPage";
import StoryPage from "./pages/StoryPage";
import DashboardPage from "./pages/DashboardPage";
import ExplorePage from "./pages/ExplorePage";
import WaterTowersDirectory from "./pages/WaterTowersDirectory";
import WaterTowerDetailPage from "./pages/WaterTowerDetailPage";
import TowerNurseriesPage from "./pages/TowerNurseriesPage";
import TowersPage from "./pages/TowersPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import AlertsPage from "./pages/AlertsPage";

export const router = createBrowserRouter([
  {
    element: <GlobalLayout />,
    children: [
      {
        path: "/",
        element: <LandingPage />,
      },
      {
        path: "/story",
        element: <StoryPage />,
      },
      {
        path: "/towers",
        element: <WaterTowersDirectory />,
      },
      {
        path: "/towers/:id",
        element: <WaterTowerDetailPage />,
      },
      {
        path: "/towers/:id/nurseries",
        element: <TowerNurseriesPage />,
      },
      {
        element: <AppShell />,
        children: [
          {
            path: "dashboard",
            element: <DashboardPage />,
          },
          {
            path: "explore",
            element: <ExplorePage />,
          },
          {
            path: "analytics",
            element: <AnalyticsPage />,
          },
          {
            path: "alerts",
            element: <AlertsPage />,
          },
        ],
      },
    ],
  },
]);
