// @vitest-environment happy-dom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { Job, JobRun, PagedRunFailures, RunFailureSummary } from "../lib/api";
import * as apiModule from "../lib/api";
import { JobManagementPage } from "./JobManagementPage";
import { clickElement, findButtonByText, renderComponent, waitFor } from "../test/domTestUtils";

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual("../lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPost: vi.fn()
  };
});

const jobs: Job[] = [
  {
    id: 1,
    name: "VOC Job 1",
    code: "job_voc_1",
    job_type: "pipeline",
    datasource_id: 10,
    schedule_expr: "*/5 * * * *",
    output_type: "json",
    enabled: true
  }
];

const runs: JobRun[] = [
  {
    run_id: "run-1",
    status: "success",
    success_count: 3,
    failed_count: 0,
    started_at: "2026-04-01T10:00:00Z",
    ended_at: "2026-04-01T10:00:03Z"
  }
];

const emptyFailures: PagedRunFailures = {
  items: [],
  total: 0,
  offset: 0,
  limit: 5
};

const emptySummary: RunFailureSummary = {
  total: 0,
  by_category: {}
};

describe("JobManagementPage DOM interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("triggers job run from trigger button", async () => {
    const apiGetMock = vi.mocked(apiModule.apiGet);
    const apiPostMock = vi.mocked(apiModule.apiPost);

    apiGetMock.mockImplementation(async (path: string) => {
      if (path === "/jobs") return jobs;
      if (path === "/jobs/1/runs?status=all") return runs;
      if (path === "/jobs/runs/run-1/stages") return [];
      if (path === "/jobs/runs/run-2/stages") return [];
      if (path.startsWith("/jobs/runs/run-1/failures?")) return emptyFailures;
      if (path.startsWith("/jobs/runs/run-2/failures?")) return emptyFailures;
      if (path === "/jobs/runs/run-1/failure-summary") return emptySummary;
      if (path === "/jobs/runs/run-2/failure-summary") return emptySummary;
      if (path === "/jobs/runs/run-1/failure-node-stats") return [];
      if (path === "/jobs/runs/run-2/failure-node-stats") return [];
      throw new Error(`unexpected apiGet path: ${path}`);
    });

    apiPostMock.mockImplementation(async (path: string) => {
      if (path === "/jobs/1/trigger") {
        return { run_id: "run-2", status: "queued" };
      }
      throw new Error(`unexpected apiPost path: ${path}`);
    });

    const { container, unmount } = await renderComponent(React.createElement(JobManagementPage));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/jobs");
      expect(container.textContent).toContain("job_voc_1");
    });

    await clickElement(findButtonByText(container, "Trigger"));

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledWith("/jobs/1/trigger");
      expect(container.textContent).toContain("Triggered run: run-2");
    });

    await unmount();
  });
});
