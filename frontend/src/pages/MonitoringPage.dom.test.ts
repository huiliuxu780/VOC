// @vitest-environment happy-dom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type {
  MonitoringAlertRecord,
  MonitoringDashboardMetrics,
  MonitoringDatasourceMetric,
  MonitoringModelMetric
} from "../lib/api";
import * as apiModule from "../lib/api";
import { MonitoringPage } from "./MonitoringPage";
import { clickElement, findButtonByText, renderComponent, waitFor } from "../test/domTestUtils";

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual("../lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPost: vi.fn()
  };
});

const metrics: MonitoringDashboardMetrics = {
  total_processed: 1200,
  model_success_rate: 0.92,
  queue_backlog: 7,
  open_alerts: 1
};

const datasourceRows: MonitoringDatasourceMetric[] = [{ datasource: "dwd_orders", success_rate: 0.96, latency_ms: 80 }];
const modelRows: MonitoringModelMetric[] = [{ model: "gpt-4.1-mini", calls: 200, avg_latency_ms: 320, error_rate: 0.03 }];

const openAlert: MonitoringAlertRecord = {
  id: 1,
  severity: "P1",
  type: "pipeline_error",
  status: "open",
  detail: { message: "job failed" },
  created_at: "2026-04-01T10:00:00Z"
};

describe("MonitoringPage DOM interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("acknowledges open alert and refreshes alert queue", async () => {
    const apiGetMock = vi.mocked(apiModule.apiGet);
    const apiPostMock = vi.mocked(apiModule.apiPost);
    let alertRows: MonitoringAlertRecord[] = [openAlert];

    apiGetMock.mockImplementation(async (path: string) => {
      if (path === "/monitoring/dashboard") return metrics;
      if (path === "/monitoring/datasources") return datasourceRows;
      if (path === "/monitoring/models") return modelRows;
      if (path === "/monitoring/alerts?status=all&severity=all") return alertRows;
      throw new Error(`unexpected apiGet path: ${path}`);
    });

    apiPostMock.mockImplementation(async (path: string) => {
      if (path === "/monitoring/alerts/1/ack?actor=codex_ui") {
        const updated = { ...openAlert, status: "ack" as const };
        alertRows = [updated];
        return updated;
      }
      throw new Error(`unexpected apiPost path: ${path}`);
    });

    const { container, unmount } = await renderComponent(React.createElement(MonitoringPage));

    await waitFor(() => {
      expect(container.textContent).toContain("pipeline_error");
      expect(findButtonByText(container, "Ack")).toBeTruthy();
    });

    await clickElement(findButtonByText(container, "Ack"));

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledWith("/monitoring/alerts/1/ack?actor=codex_ui");
      expect(container.textContent).toContain("pipeline_error");
      expect(container.textContent).toContain("ack");
    });

    await unmount();
  });
});
