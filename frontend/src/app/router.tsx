import { type ReactNode, Suspense, lazy } from "react";
import { createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../layout/AppLayout";

const DashboardPage = lazy(() => import("../pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const DataSourcePage = lazy(() => import("../pages/DataSourcePage").then((m) => ({ default: m.DataSourcePage })));
const MappingStudioPage = lazy(() => import("../pages/MappingStudioPage").then((m) => ({ default: m.MappingStudioPage })));
const LabelManagementPage = lazy(() => import("../pages/LabelManagementPage").then((m) => ({ default: m.LabelManagementPage })));
const PromptManagementPage = lazy(() => import("../pages/PromptManagementPage").then((m) => ({ default: m.PromptManagementPage })));
const JobManagementPage = lazy(() => import("../pages/JobManagementPage").then((m) => ({ default: m.JobManagementPage })));
const PipelineDesignerPage = lazy(() => import("../pages/PipelineDesignerPage").then((m) => ({ default: m.PipelineDesignerPage })));
const MonitoringPage = lazy(() => import("../pages/MonitoringPage").then((m) => ({ default: m.MonitoringPage })));

function withSuspense(element: ReactNode) {
  return (
    <Suspense fallback={<div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-textSecondary">Loading page...</div>}>
      {element}
    </Suspense>
  );
}

export const appRouter = createBrowserRouter([
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: withSuspense(<DashboardPage />) },
      { path: "datasources", element: withSuspense(<DataSourcePage />) },
      { path: "mapping", element: withSuspense(<MappingStudioPage />) },
      { path: "labels", element: withSuspense(<LabelManagementPage />) },
      { path: "prompts", element: withSuspense(<PromptManagementPage />) },
      { path: "jobs", element: withSuspense(<JobManagementPage />) },
      { path: "pipeline", element: withSuspense(<PipelineDesignerPage />) },
      { path: "monitoring", element: withSuspense(<MonitoringPage />) }
    ]
  }
]);
