// @vitest-environment happy-dom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { LabelRecord } from "../lib/api";
import * as apiModule from "../lib/api";
import { LabelManagementPage } from "./LabelManagementPage";
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

const rootLabel: LabelRecord = {
  id: 1,
  category_id: 1,
  parent_id: null,
  level: 1,
  name: "Root",
  code: "L1_ROOT",
  is_leaf: false,
  llm_enabled: true,
  default_prompt_version: "v1"
};

const childLabel: LabelRecord = {
  id: 2,
  category_id: 1,
  parent_id: 1,
  level: 2,
  name: "Install Delay",
  code: "L2_INSTALL_DELAY",
  is_leaf: true,
  llm_enabled: true,
  default_prompt_version: "v2"
};

describe("LabelManagementPage DOM interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("creates a new label when New Label + Save is clicked", async () => {
    const apiGetMock = vi.mocked(apiModule.apiGet);
    const apiPostMock = vi.mocked(apiModule.apiPost);
    let labels: LabelRecord[] = [rootLabel];

    apiGetMock.mockImplementation(async (path: string) => {
      if (path === "/labels/tree") return labels;
      throw new Error(`unexpected apiGet path: ${path}`);
    });

    apiPostMock.mockImplementation(async (path: string, payload?: unknown) => {
      if (path === "/labels") {
        expect(payload).toEqual({
          category_id: 1,
          parent_id: null,
          level: 1,
          name: "New Label",
          code: "L1_NEW_LABEL",
          is_leaf: false,
          llm_enabled: true,
          default_prompt_version: "v1"
        });
        const created: LabelRecord = {
          id: 2,
          category_id: 1,
          parent_id: null,
          level: 1,
          name: "New Label",
          code: "L1_NEW_LABEL",
          is_leaf: false,
          llm_enabled: true,
          default_prompt_version: "v1"
        };
        labels = [rootLabel, created];
        return created;
      }
      throw new Error(`unexpected apiPost path: ${path}`);
    });

    const { container, unmount } = await renderComponent(React.createElement(LabelManagementPage));

    await waitFor(() => {
      expect(container.textContent).toContain("Loaded 1 labels");
    });

    await clickElement(findButtonByText(container, "New Label"));
    await clickElement(findButtonByText(container, "Save"));

    await waitFor(() => {
      expect(apiPostMock).toHaveBeenCalledWith("/labels", expect.any(Object));
      expect(container.textContent).toContain("Loaded 2 labels");
    });

    await unmount();
  });

  it("disables move action for unsaved label", async () => {
    const apiGetMock = vi.mocked(apiModule.apiGet);
    const apiPostMock = vi.mocked(apiModule.apiPost);
    apiGetMock.mockResolvedValue([rootLabel]);

    const { container, unmount } = await renderComponent(React.createElement(LabelManagementPage));

    await waitFor(() => {
      expect(container.textContent).toContain("Loaded 1 labels");
    });

    await clickElement(findButtonByText(container, "New Label"));
    const moveButton = findButtonByText(container, "Move");
    expect(moveButton.disabled).toBe(true);
    expect(apiPostMock).not.toHaveBeenCalled();

    await unmount();
  });

  it("highlights matched keyword in label name and code", async () => {
    const apiGetMock = vi.mocked(apiModule.apiGet);
    apiGetMock.mockResolvedValue([rootLabel, childLabel]);

    const { container, unmount } = await renderComponent(React.createElement(LabelManagementPage));

    await waitFor(() => {
      expect(container.textContent).toContain("Loaded 2 labels");
    });

    const searchInput = container.querySelector("input[placeholder='Search by name or code...']");
    expect(searchInput).not.toBeNull();

    await changeInputValue(searchInput as HTMLInputElement, "install");

    await waitFor(() => {
      const marks = Array.from(container.querySelectorAll("mark"));
      expect(marks.length).toBeGreaterThan(0);
      expect(marks.map((node) => node.textContent?.toLowerCase())).toContain("install");
    });

    await unmount();
  });
});
