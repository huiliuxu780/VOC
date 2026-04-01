// @vitest-environment happy-dom
import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PromptRecord } from "../lib/api";
import * as apiModule from "../lib/api";
import { PromptManagementPage } from "./PromptManagementPage";
import { clickElement, findButtonByText, renderComponent, waitFor } from "../test/domTestUtils";

vi.mock("../lib/api", async () => {
  const actual = await vi.importActual("../lib/api");
  return {
    ...actual,
    apiGet: vi.fn(),
    apiPost: vi.fn(),
    apiPut: vi.fn()
  };
});

const promptRows: PromptRecord[] = [
  {
    id: 1,
    label_node_id: 3,
    name: "Install Failure",
    version: "v1.0",
    status: "draft",
    system_prompt: "sys",
    user_prompt_template: "template"
  }
];

describe("PromptManagementPage DOM interactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    document.body.innerHTML = "";
  });

  afterEach(() => {
    document.body.innerHTML = "";
  });

  it("requests prompts again when status filter is changed", async () => {
    const apiGetMock = vi.mocked(apiModule.apiGet);
    apiGetMock.mockResolvedValue(promptRows);

    const { container, unmount } = await renderComponent(React.createElement(PromptManagementPage));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/prompts?status=all");
    });

    await clickElement(findButtonByText(container, "published"));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/prompts?status=published");
    });

    await unmount();
  });

  it("shows guard notice when publishing without a selected prompt", async () => {
    const apiGetMock = vi.mocked(apiModule.apiGet);
    const apiPostMock = vi.mocked(apiModule.apiPost);
    apiGetMock.mockResolvedValue([]);

    const { container, unmount } = await renderComponent(React.createElement(PromptManagementPage));

    await waitFor(() => {
      expect(apiGetMock).toHaveBeenCalledWith("/prompts?status=all");
    });

    await clickElement(findButtonByText(container, "Publish"));

    await waitFor(() => {
      expect(container.textContent).toContain("Please save draft first, then publish.");
    });
    expect(apiPostMock).not.toHaveBeenCalled();

    await unmount();
  });
});
