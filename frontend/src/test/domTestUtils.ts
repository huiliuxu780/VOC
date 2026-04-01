import React from "react";
import { act } from "react";
import { createRoot, Root } from "react-dom/client";

// Required by React tests to avoid act-environment warnings.
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

type RenderResult = {
  container: HTMLDivElement;
  unmount: () => Promise<void>;
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function renderComponent(element: React.ReactElement): Promise<RenderResult> {
  const container = document.createElement("div");
  document.body.appendChild(container);
  const root: Root = createRoot(container);
  await act(async () => {
    root.render(element);
  });
  return {
    container,
    unmount: async () => {
      await act(async () => {
        root.unmount();
      });
      container.remove();
    }
  };
}

export async function waitFor(assertion: () => void, timeoutMs = 3000): Promise<void> {
  const startedAt = Date.now();
  while (true) {
    try {
      assertion();
      return;
    } catch (error) {
      if (Date.now() - startedAt > timeoutMs) {
        throw error;
      }
      await sleep(20);
    }
  }
}

export function findButtonByText(container: HTMLElement, text: string): HTMLButtonElement {
  const button = Array.from(container.querySelectorAll("button")).find((node) => node.textContent?.trim() === text);
  if (!button) {
    throw new Error(`button not found: ${text}`);
  }
  return button as HTMLButtonElement;
}

export async function clickElement(element: HTMLElement): Promise<void> {
  await act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}
