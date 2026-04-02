import { type ReactNode, Suspense, lazy } from "react";
import { Navigate, createBrowserRouter } from "react-router-dom";
import { AppLayout } from "../layout/AppLayout";

const DashboardPage = lazy(() => import("../pages/DashboardPage").then((m) => ({ default: m.DashboardPage })));
const DataSourcePage = lazy(() => import("../pages/DataSourcePage").then((m) => ({ default: m.DataSourcePage })));
const MappingStudioPage = lazy(() => import("../pages/MappingStudioPage").then((m) => ({ default: m.MappingStudioPage })));
const LabelTaxonomyListPage = lazy(() => import("../pages/LabelTaxonomyListPage").then((m) => ({ default: m.LabelTaxonomyListPage })));
const LabelTaxonomyFormPage = lazy(() => import("../pages/LabelTaxonomyFormPage").then((m) => ({ default: m.LabelTaxonomyFormPage })));
const LabelTaxonomyDetailPage = lazy(() => import("../pages/LabelTaxonomyDetailPage").then((m) => ({ default: m.LabelTaxonomyDetailPage })));
const LabelManagementPage = lazy(() => import("../pages/LabelManagementPage").then((m) => ({ default: m.LabelManagementPage })));
const PromptManagementPage = lazy(() => import("../pages/PromptManagementPage").then((m) => ({ default: m.PromptManagementPage })));
const JobManagementPage = lazy(() => import("../pages/JobManagementPage").then((m) => ({ default: m.JobManagementPage })));
const PipelineDesignerPage = lazy(() => import("../pages/PipelineDesignerPage").then((m) => ({ default: m.PipelineDesignerPage })));
const MonitoringPage = lazy(() => import("../pages/MonitoringPage").then((m) => ({ default: m.MonitoringPage })));
const SettingsPage = lazy(() => import("../pages/SettingsPage").then((m) => ({ default: m.SettingsPage })));

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
      { path: "label-taxonomies", element: withSuspense(<LabelTaxonomyListPage />) },
      { path: "label-taxonomies/new", element: withSuspense(<LabelTaxonomyFormPage />) },
      { path: "label-taxonomies/:taxonomyId/edit", element: withSuspense(<LabelTaxonomyFormPage />) },
      { path: "label-taxonomies/:taxonomyId/version/:versionId", element: withSuspense(<LabelTaxonomyDetailPage />) },
      { path: "label-taxonomies/:taxonomyId/version/:versionId/node/:nodeId", element: withSuspense(<LabelTaxonomyDetailPage />) },
      { path: "labels", element: <Navigate to="/label-taxonomies" replace /> },
      { path: "labels/legacy", element: withSuspense(<LabelManagementPage />) },
      { path: "prompt-debug", element: withSuspense(<PromptManagementPage />) },
      { path: "prompts", element: <Navigate to="/prompt-debug" replace /> },
      { path: "jobs", element: withSuspense(<JobManagementPage />) },
      { path: "pipeline", element: withSuspense(<PipelineDesignerPage />) },
      { path: "monitoring", element: withSuspense(<MonitoringPage />) },
      { path: "settings", element: withSuspense(<SettingsPage />) }
    ]
  }
]);
