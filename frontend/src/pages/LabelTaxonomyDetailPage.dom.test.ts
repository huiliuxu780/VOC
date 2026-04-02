// @vitest-environment happy-dom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createMemoryRouter, RouterProvider } from "react-router-dom";
import type {
  LabelNodeConfigRecord,
  LabelNodeConfigVersionDiffRecord,
  LabelNodeConfigVersionRecord,
  LabelNodeRecord,
  LabelNodeTestRecordPage,
  LabelTaxonomyRecord,
  LabelTaxonomyVersionRecord
} from "../lib/api";
import * as apiModule from "../lib/api";
import { LabelTaxonomyDetailPage } from "./LabelTaxonomyDetailPage";
import { changeInputValue, clickElement, findButtonByText, renderComponent, waitFor } from "../test/domTestUtils";

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
    id: "tax-1",
    name: "Install Service Taxonomy",
    code: "INSTALL_SERVICE",
    description: "demo",
    businessScope: ["install"],
    categoryScope: ["all"],
    owner: "qa",
    status: "draft",
    currentVersionId: "ver-1",
    nodeCount: 1,
    createdAt: "2026-04-02T00:00:00Z",
    updatedAt: "2026-04-02T00:00:00Z"
  }
];

const versionRows: LabelTaxonomyVersionRecord[] = [
  {
    id: "ver-1",
    taxonomyId: "tax-1",
    version: "v1.1",
    status: "draft",
    changeLog: "",
    nodeCount: 1,
    publishedAt: undefined,
    createdAt: "2026-04-02T00:00:00Z",
    updatedAt: "2026-04-02T00:00:00Z"
  }
];

const treeRows: LabelNodeRecord[] = [
  {
    id: "node-install-delay",
    taxonomyVersionId: "ver-1",
    parentId: null,
    name: "Install Delay",
    code: "L2_INSTALL_DELAY",
    level: 2,
    pathNames: ["Install", "Install Delay"],
    pathIds: ["node-install", "node-install-delay"],
    isLeaf: true,
    llmEnabled: true,
    sortOrder: 1,
    status: "enabled",
    categoryScope: ["all"],
    businessScope: ["install"],
    remark: "",
    hasConfig: true,
    hasExamples: true,
    configStatus: "draft",
    createdAt: "2026-04-02T00:00:00Z",
    updatedAt: "2026-04-02T00:00:00Z"
  }
];

const nodeConfig: LabelNodeConfigRecord = {
  id: "cfg-current",
  labelNodeId: "node-install-delay",
  version: "v1.1",
  promptName: "Install Delay Decision",
  definition: "Detect install delay",
  decisionRule: "Keyword match",
  excludeRule: "",
  taggingRule: "",
  systemPrompt: "system",
  userPromptTemplate: "{{content_text}}",
  outputSchema: "{\"label\":\"string\"}",
  postProcessRule: "",
  fallbackStrategy: "",
  riskNote: "",
  remark: "",
  modelName: "gpt-4.1-mini",
  temperature: 0.1,
  status: "draft",
  createdAt: "2026-04-02T00:00:00Z",
  updatedAt: "2026-04-02T00:00:00Z"
};

const configVersions: LabelNodeConfigVersionRecord[] = [
  {
    id: "cfgv2",
    labelNodeId: "node-install-delay",
    configId: "cfg-current",
    configVersion: "v1.1",
    status: "published",
    snapshot: { version: "v1.1", temperature: 0.1 },
    createdAt: "2026-04-02T10:00:00Z"
  },
  {
    id: "cfgv1",
    labelNodeId: "node-install-delay",
    configId: "cfg-current",
    configVersion: "v1.0",
    status: "draft",
    snapshot: { version: "v1.0", temperature: 0.2 },
    createdAt: "2026-04-01T10:00:00Z"
  }
];

const configVersionsExtended: LabelNodeConfigVersionRecord[] = [
  {
    id: "cfgv3",
    labelNodeId: "node-install-delay",
    configId: "cfg-current",
    configVersion: "v1.2",
    status: "published",
    snapshot: { version: "v1.2", temperature: 0.05 },
    createdAt: "2026-04-02T11:00:00Z"
  },
  {
    id: "cfgv2",
    labelNodeId: "node-install-delay",
    configId: "cfg-current",
    configVersion: "v1.1",
    status: "published",
    snapshot: { version: "v1.1", temperature: 0.1 },
    createdAt: "2026-04-02T10:00:00Z"
  },
  {
    id: "cfgv1",
    labelNodeId: "node-install-delay",
    configId: "cfg-current",
    configVersion: "v1.0",
    status: "draft",
    snapshot: { version: "v1.0", temperature: 0.2 },
    createdAt: "2026-04-01T10:00:00Z"
  }
];

const diffResult: LabelNodeConfigVersionDiffRecord = {
  fromVersionId: "cfgv1",
  toVersionId: "cfgv2",
  changes: [
    {
      field: "version",
      fromValue: "v1.0",
      toValue: "v1.1"
    },
    {
      field: "temperature",
      fromValue: 0.2,
      toValue: 0.1
    }
  ]
};

const diffResultSwitchCompare: LabelNodeConfigVersionDiffRecord = {
  fromVersionId: "cfgv1",
  toVersionId: "cfgv2",
  changes: [
    {
      field: "decisionRule",
      fromValue: "old rule",
      toValue: "new rule"
    }
  ]
};

function createRouter() {
  return createMemoryRouter(
    [
      {
        path: "/label-taxonomies/:taxonomyId/version/:versionId/node/:nodeId",
        element: React.createElement(LabelTaxonomyDetailPage)
      }
    ],
    {
      initialEntries: ["/label-taxonomies/tax-1/version/ver-1/node/node-install-delay"]
    }
  );
}

describe("LabelTaxonomyDetailPage DOM interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("loads default config version diff on node detail fetch", async () => {
    const apiGetMock = vi.mocked(apiModule.apiGet);
    apiGetMock.mockImplementation(async (path: string) => {
      if (path === "/label-taxonomies") return taxonomyRows;
      if (path === "/label-taxonomies/tax-1") return taxonomyRows[0];
      if (path === "/label-taxonomies/tax-1/versions") return versionRows;
      if (path === "/label-taxonomies/tax-1/versions/ver-1") return versionRows[0];
      if (path === "/label-taxonomies/tax-1/versions/ver-1/tree") return treeRows;
      if (path === "/label-nodes/node-install-delay/config") return nodeConfig;
      if (path === "/label-nodes/node-install-delay/examples") return [];
      if (path === "/label-nodes/node-install-delay/config/versions") return configVersions;
      if (path === "/label-nodes/node-install-delay/config/versions/compare?fromVersionId=cfgv1&toVersionId=cfgv2") return diffResult;
      if (path === "/label-nodes/node-install-delay/test-records?offset=0&limit=10") {
        return {
          items: [],
          total: 0,
          offset: 0,
          limit: 10,
          hasMore: false
        } satisfies LabelNodeTestRecordPage;
      }
      throw new Error(`unexpected apiGet path: ${path}`);
    });

    const router = createRouter();
    const { container, unmount } = await renderComponent(React.createElement(RouterProvider, { router }));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/label-nodes/node-install-delay/config/versions/compare?fromVersionId=cfgv1&toVersionId=cfgv2");
    });

    await clickElement(findButtonByText(container, "Versions"));
    await waitFor(() => {
      expect(container.textContent).toContain("Compare Config Versions");
      expect(container.textContent).toContain("temperature");
    });

    await unmount();
  });

  it("applies testing filters and requests next page", async () => {
    const apiGetMock = vi.mocked(apiModule.apiGet);
    apiGetMock.mockImplementation(async (path: string) => {
      if (path === "/label-taxonomies") return taxonomyRows;
      if (path === "/label-taxonomies/tax-1") return taxonomyRows[0];
      if (path === "/label-taxonomies/tax-1/versions") return versionRows;
      if (path === "/label-taxonomies/tax-1/versions/ver-1") return versionRows[0];
      if (path === "/label-taxonomies/tax-1/versions/ver-1/tree") return treeRows;
      if (path === "/label-nodes/node-install-delay/config") return nodeConfig;
      if (path === "/label-nodes/node-install-delay/examples") return [];
      if (path === "/label-nodes/node-install-delay/config/versions") return configVersions;
      if (path === "/label-nodes/node-install-delay/config/versions/compare?fromVersionId=cfgv1&toVersionId=cfgv2") return diffResult;
      if (path === "/label-nodes/node-install-delay/test-records?offset=0&limit=10") {
        return {
          items: [],
          total: 0,
          offset: 0,
          limit: 10,
          hasMore: false
        } satisfies LabelNodeTestRecordPage;
      }
      if (path === "/label-nodes/node-install-delay/test-records?offset=0&limit=10&hitLabel=UNMATCHED&q=timeout") {
        return {
          items: [
            {
              id: "tr-1",
              nodeId: "node-install-delay",
              inputText: "timeout complaint",
              rawOutput: "{\"label\":\"UNMATCHED\"}",
              parsedOutput: { label: "UNMATCHED" },
              hitLabel: "UNMATCHED",
              confidence: 0.41,
              latency: 120,
              errorMessage: null,
              createdAt: "2026-04-02T10:01:00Z"
            }
          ],
          total: 12,
          offset: 0,
          limit: 10,
          hasMore: true
        } satisfies LabelNodeTestRecordPage;
      }
      if (path === "/label-nodes/node-install-delay/test-records?offset=10&limit=10&hitLabel=UNMATCHED&q=timeout") {
        return {
          items: [
            {
              id: "tr-2",
              nodeId: "node-install-delay",
              inputText: "timeout second page",
              rawOutput: "{\"label\":\"UNMATCHED\"}",
              parsedOutput: { label: "UNMATCHED" },
              hitLabel: "UNMATCHED",
              confidence: 0.39,
              latency: 110,
              errorMessage: null,
              createdAt: "2026-04-02T10:02:00Z"
            }
          ],
          total: 12,
          offset: 10,
          limit: 10,
          hasMore: false
        } satisfies LabelNodeTestRecordPage;
      }
      throw new Error(`unexpected apiGet path: ${path}`);
    });

    const router = createRouter();
    const { container, unmount } = await renderComponent(React.createElement(RouterProvider, { router }));

    await clickElement(findButtonByText(container, "Testing"));
    await waitFor(() => {
      expect(container.textContent).toContain("Record Filters");
    });

    const filterInput = container.querySelector("input[placeholder='Search input / label / output...']");
    expect(filterInput).not.toBeNull();
    await changeInputValue(filterInput as HTMLInputElement, "timeout");

    const filterTitle = Array.from(container.querySelectorAll("p")).find((node) => node.textContent?.trim() === "Record Filters");
    expect(filterTitle).not.toBeUndefined();
    const filterPanel = filterTitle?.closest("div");
    const selectTrigger = filterPanel?.querySelector("button[aria-haspopup='listbox']") as HTMLButtonElement | null;
    expect(selectTrigger).not.toBeNull();
    await clickElement(selectTrigger as HTMLButtonElement);
    await waitFor(() => {
      expect(container.textContent).toContain("UNMATCHED");
    });
    await clickElement(findButtonByText(container, "UNMATCHED"));
    await clickElement(findButtonByText(container, "Apply"));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/label-nodes/node-install-delay/test-records?offset=0&limit=10&hitLabel=UNMATCHED&q=timeout");
      expect(container.textContent).toContain("Showing 1-1 / 12");
      expect(container.textContent).toContain("timeout complaint");
    });

    await clickElement(findButtonByText(container, "Next"));
    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/label-nodes/node-install-delay/test-records?offset=10&limit=10&hitLabel=UNMATCHED&q=timeout");
      expect(container.textContent).toContain("timeout second page");
    });

    await unmount();
  });

  it("renders workspace layout sections for testing and versions tabs", async () => {
    const apiGetMock = vi.mocked(apiModule.apiGet);
    apiGetMock.mockImplementation(async (path: string) => {
      if (path === "/label-taxonomies") return taxonomyRows;
      if (path === "/label-taxonomies/tax-1") return taxonomyRows[0];
      if (path === "/label-taxonomies/tax-1/versions") return versionRows;
      if (path === "/label-taxonomies/tax-1/versions/ver-1") return versionRows[0];
      if (path === "/label-taxonomies/tax-1/versions/ver-1/tree") return treeRows;
      if (path === "/label-nodes/node-install-delay/config") return nodeConfig;
      if (path === "/label-nodes/node-install-delay/examples") return [];
      if (path === "/label-nodes/node-install-delay/config/versions") return configVersions;
      if (path === "/label-nodes/node-install-delay/config/versions/compare?fromVersionId=cfgv1&toVersionId=cfgv2") return diffResult;
      if (path === "/label-nodes/node-install-delay/test-records?offset=0&limit=10") {
        return {
          items: [],
          total: 0,
          offset: 0,
          limit: 10,
          hasMore: false
        } satisfies LabelNodeTestRecordPage;
      }
      throw new Error(`unexpected apiGet path: ${path}`);
    });

    const router = createRouter();
    const { container, unmount } = await renderComponent(React.createElement(RouterProvider, { router }));

    await clickElement(findButtonByText(container, "Testing"));
    await waitFor(() => {
      expect(container.textContent).toContain("Debug Console");
      expect(container.textContent).toContain("Record Explorer");
    });

    await clickElement(findButtonByText(container, "Versions"));
    await waitFor(() => {
      expect(container.textContent).toContain("Compare Workspace");
      expect(container.textContent).toContain("Version Timeline");
    });

    await unmount();
  });

  it("renders examples editor controls and grouped empty states", async () => {
    const apiGetMock = vi.mocked(apiModule.apiGet);
    apiGetMock.mockImplementation(async (path: string) => {
      if (path === "/label-taxonomies") return taxonomyRows;
      if (path === "/label-taxonomies/tax-1") return taxonomyRows[0];
      if (path === "/label-taxonomies/tax-1/versions") return versionRows;
      if (path === "/label-taxonomies/tax-1/versions/ver-1") return versionRows[0];
      if (path === "/label-taxonomies/tax-1/versions/ver-1/tree") return treeRows;
      if (path === "/label-nodes/node-install-delay/config") return nodeConfig;
      if (path === "/label-nodes/node-install-delay/examples") return [];
      if (path === "/label-nodes/node-install-delay/config/versions") return configVersions;
      if (path === "/label-nodes/node-install-delay/config/versions/compare?fromVersionId=cfgv1&toVersionId=cfgv2") return diffResult;
      if (path === "/label-nodes/node-install-delay/test-records?offset=0&limit=10") {
        return {
          items: [],
          total: 0,
          offset: 0,
          limit: 10,
          hasMore: false
        } satisfies LabelNodeTestRecordPage;
      }
      throw new Error(`unexpected apiGet path: ${path}`);
    });

    const router = createRouter();
    const { container, unmount } = await renderComponent(React.createElement(RouterProvider, { router }));

    await clickElement(findButtonByText(container, "Examples"));
    await waitFor(() => {
      expect(container.textContent).toContain("Add Example");
      expect(container.textContent).toContain("positive (0)");
      expect(container.textContent).toContain("negative (0)");
      expect(container.textContent).toContain("boundary (0)");
      expect(container.textContent).toContain("counter (0)");
    });

    await unmount();
  });

  it("shows empty state when current node has no config versions", async () => {
    const apiGetMock = vi.mocked(apiModule.apiGet);
    apiGetMock.mockImplementation(async (path: string) => {
      if (path === "/label-taxonomies") return taxonomyRows;
      if (path === "/label-taxonomies/tax-1") return taxonomyRows[0];
      if (path === "/label-taxonomies/tax-1/versions") return versionRows;
      if (path === "/label-taxonomies/tax-1/versions/ver-1") return versionRows[0];
      if (path === "/label-taxonomies/tax-1/versions/ver-1/tree") return treeRows;
      if (path === "/label-nodes/node-install-delay/config") return nodeConfig;
      if (path === "/label-nodes/node-install-delay/examples") return [];
      if (path === "/label-nodes/node-install-delay/config/versions") return [];
      if (path === "/label-nodes/node-install-delay/test-records?offset=0&limit=10") {
        return {
          items: [],
          total: 0,
          offset: 0,
          limit: 10,
          hasMore: false
        } satisfies LabelNodeTestRecordPage;
      }
      throw new Error(`unexpected apiGet path: ${path}`);
    });

    const router = createRouter();
    const { container, unmount } = await renderComponent(React.createElement(RouterProvider, { router }));

    await clickElement(findButtonByText(container, "Versions"));
    await waitFor(() => {
      expect(container.textContent).toContain("No config versions yet.");
    });
    expect(container.textContent).not.toContain("Compare Config Versions");
    expect(apiGetMock.mock.calls.some(([path]) => String(path).includes("/config/versions/compare"))).toBe(false);

    await unmount();
  });

  it("shows compare error feedback when version diff request fails", async () => {
    const apiGetMock = vi.mocked(apiModule.apiGet);
    apiGetMock.mockImplementation(async (path: string) => {
      if (path === "/label-taxonomies") return taxonomyRows;
      if (path === "/label-taxonomies/tax-1") return taxonomyRows[0];
      if (path === "/label-taxonomies/tax-1/versions") return versionRows;
      if (path === "/label-taxonomies/tax-1/versions/ver-1") return versionRows[0];
      if (path === "/label-taxonomies/tax-1/versions/ver-1/tree") return treeRows;
      if (path === "/label-nodes/node-install-delay/config") return nodeConfig;
      if (path === "/label-nodes/node-install-delay/examples") return [];
      if (path === "/label-nodes/node-install-delay/config/versions") return configVersions;
      if (path === "/label-nodes/node-install-delay/config/versions/compare?fromVersionId=cfgv1&toVersionId=cfgv2") {
        throw new Error("compare failed");
      }
      if (path === "/label-nodes/node-install-delay/test-records?offset=0&limit=10") {
        return {
          items: [],
          total: 0,
          offset: 0,
          limit: 10,
          hasMore: false
        } satisfies LabelNodeTestRecordPage;
      }
      throw new Error(`unexpected apiGet path: ${path}`);
    });

    const router = createRouter();
    const { container, unmount } = await renderComponent(React.createElement(RouterProvider, { router }));

    await clickElement(findButtonByText(container, "Versions"));
    await waitFor(() => {
      expect(container.textContent).toContain("Failed to load version diff. Please retry.");
    });

    await unmount();
  });

  it("switches compare params and requests diff with the selected version pair", async () => {
    const apiGetMock = vi.mocked(apiModule.apiGet);
    apiGetMock.mockImplementation(async (path: string) => {
      if (path === "/label-taxonomies") return taxonomyRows;
      if (path === "/label-taxonomies/tax-1") return taxonomyRows[0];
      if (path === "/label-taxonomies/tax-1/versions") return versionRows;
      if (path === "/label-taxonomies/tax-1/versions/ver-1") return versionRows[0];
      if (path === "/label-taxonomies/tax-1/versions/ver-1/tree") return treeRows;
      if (path === "/label-nodes/node-install-delay/config") return nodeConfig;
      if (path === "/label-nodes/node-install-delay/examples") return [];
      if (path === "/label-nodes/node-install-delay/config/versions") return configVersionsExtended;
      if (path === "/label-nodes/node-install-delay/config/versions/compare?fromVersionId=cfgv2&toVersionId=cfgv3") return diffResult;
      if (path === "/label-nodes/node-install-delay/config/versions/compare?fromVersionId=cfgv1&toVersionId=cfgv2") return diffResultSwitchCompare;
      if (path === "/label-nodes/node-install-delay/test-records?offset=0&limit=10") {
        return {
          items: [],
          total: 0,
          offset: 0,
          limit: 10,
          hasMore: false
        } satisfies LabelNodeTestRecordPage;
      }
      throw new Error(`unexpected apiGet path: ${path}`);
    });

    const router = createRouter();
    const { container, unmount } = await renderComponent(React.createElement(RouterProvider, { router }));

    await clickElement(findButtonByText(container, "Versions"));
    await waitFor(() => {
      expect(container.textContent).toContain("Compare Config Versions");
    });

    const fromSelectTrigger = container.querySelector("button[aria-label='Compare from version']");
    expect(fromSelectTrigger).not.toBeNull();
    await clickElement(fromSelectTrigger as HTMLButtonElement);
    await clickElement(findButtonByText(container, "v1.0 | draft"));

    const toSelectTrigger = container.querySelector("button[aria-label='Compare to version']");
    expect(toSelectTrigger).not.toBeNull();
    await clickElement(toSelectTrigger as HTMLButtonElement);
    await clickElement(findButtonByText(container, "v1.1 | published"));

    await clickElement(findButtonByText(container, "Compare"));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/label-nodes/node-install-delay/config/versions/compare?fromVersionId=cfgv1&toVersionId=cfgv2");
      expect(container.textContent).toContain("decisionRule");
    });

    await unmount();
  });
});
