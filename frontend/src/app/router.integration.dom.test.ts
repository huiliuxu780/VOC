// @vitest-environment happy-dom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import type {
  LabelTaxonomyRecord,
  MonitoringAlertRecord,
  MonitoringDashboardMetrics,
  MonitoringDatasourceMetric,
  MonitoringModelMetric,
  PromptRecord
} from "../lib/api";
import * as apiModule from "../lib/api";
import { AppLayout } from "../layout/AppLayout";
import { LabelTaxonomyListPage } from "../pages/LabelTaxonomyListPage";
import { MonitoringPage } from "../pages/MonitoringPage";
import { PromptManagementPage } from "../pages/PromptManagementPage";
import { clickElement, findLinkByPath, renderComponent, waitFor } from "../test/domTestUtils";

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual("../lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPost: vi.fn(),
    apiPut: vi.fn(),
    apiDelete: vi.fn()
  };
});

const taxonomyRows: LabelTaxonomyRecord[] = [
  {
    id: "tax-route-demo",
    name: "Route Taxonomy",
    code: "ROUTE_TAX",
    description: "demo",
    businessScope: ["service"],
    categoryScope: ["all"],
    owner: "qa",
    status: "draft",
    currentVersionId: "ver-route-v1",
    nodeCount: 2,
    createdAt: "2026-04-02T00:00:00Z",
    updatedAt: "2026-04-02T00:00:00Z"
  }
];

const promptRows: PromptRecord[] = [
  {
    id: 11,
    label_node_id: 1,
    name: "Route Prompt",
    version: "v1.0",
    status: "draft",
    system_prompt: "sys",
    user_prompt_template: "tpl"
  }
];

const monitoringMetrics: MonitoringDashboardMetrics = {
  total_processed: 99,
  model_success_rate: 0.91,
  queue_backlog: 3,
  open_alerts: 1
};

const monitoringDatasources: MonitoringDatasourceMetric[] = [{ datasource: "dwd_orders", success_rate: 0.97, latency_ms: 90 }];

const monitoringModels: MonitoringModelMetric[] = [{ model: "gpt-4.1-mini", calls: 18, avg_latency_ms: 310, error_rate: 0.02 }];

const monitoringAlerts: MonitoringAlertRecord[] = [
  {
    id: 101,
    severity: "P2",
    type: "queue_lag",
    status: "open",
    detail: { message: "queue lag growing" },
    created_at: "2026-04-01T10:00:00Z"
  }
];

function createTestRouter(initialEntries: string[]) {
  return createMemoryRouter(
    [
      {
        path: "/",
        element: React.createElement(AppLayout),
        children: [
          { index: true, element: React.createElement(LabelTaxonomyListPage) },
          { path: "label-taxonomies", element: React.createElement(LabelTaxonomyListPage) },
          { path: "prompt-debug", element: React.createElement(PromptManagementPage) },
          { path: "monitoring", element: React.createElement(MonitoringPage) }
        ]
      }
    ],
    { initialEntries }
  );
}

describe("router integration DOM", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("navigates taxonomy, prompt debug and monitoring pages", async () => {
    const apiGetMock = vi.mocked(apiModule.apiGet);
    apiGetMock.mockImplementation(async (path: string) => {
      if (path === "/label-taxonomies") return taxonomyRows;
      if (path === "/prompts?status=all") return promptRows;
      if (path === "/monitoring/dashboard") return monitoringMetrics;
      if (path === "/monitoring/datasources") return monitoringDatasources;
      if (path === "/monitoring/models") return monitoringModels;
      if (path === "/monitoring/alerts?status=all&severity=all") return monitoringAlerts;
      throw new Error(`unexpected apiGet path: ${path}`);
    });

    const router = createTestRouter(["/label-taxonomies"]);
    const { container, unmount } = await renderComponent(React.createElement(RouterProvider, { router }));

    await waitFor(() => {
      expect(container.textContent).toContain("标签体系管理");
      expect(apiGetMock).toHaveBeenCalledWith("/label-taxonomies");
    });

    await clickElement(findLinkByPath(container, "/prompt-debug"));

    await waitFor(() => {
      expect(container.textContent).toContain("Prompt");
      expect(apiGetMock).toHaveBeenCalledWith("/prompts?status=all");
    });

    await clickElement(findLinkByPath(container, "/monitoring"));

    await waitFor(() => {
      expect(container.textContent).toContain("Alert Queue");
      expect(apiGetMock).toHaveBeenCalledWith("/monitoring/dashboard");
      expect(apiGetMock).toHaveBeenCalledWith("/monitoring/datasources");
      expect(apiGetMock).toHaveBeenCalledWith("/monitoring/models");
      expect(apiGetMock).toHaveBeenCalledWith("/monitoring/alerts?status=all&severity=all");
    });

    await unmount();
  });

  it("shows monitoring load error and can recover by navigating to taxonomy list", async () => {
    const apiGetMock = vi.mocked(apiModule.apiGet);
    apiGetMock.mockImplementation(async (path: string) => {
      if (path === "/label-taxonomies") return taxonomyRows;
      if (path === "/monitoring/dashboard") throw new Error("monitoring down");
      if (path === "/monitoring/datasources") return monitoringDatasources;
      if (path === "/monitoring/models") return monitoringModels;
      if (path === "/monitoring/alerts?status=all&severity=all") return monitoringAlerts;
      throw new Error(`unexpected apiGet path: ${path}`);
    });

    const router = createTestRouter(["/monitoring"]);
    const { container, unmount } = await renderComponent(React.createElement(RouterProvider, { router }));

    await waitFor(() => {
      expect(container.textContent).toContain("monitoring down");
    });

    await clickElement(findLinkByPath(container, "/label-taxonomies"));

    await waitFor(() => {
      expect(container.textContent).toContain("标签体系管理");
      expect(apiGetMock).toHaveBeenCalledWith("/label-taxonomies");
    });

    await unmount();
  });
});
