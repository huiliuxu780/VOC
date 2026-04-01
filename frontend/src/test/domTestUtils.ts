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

export function findLinkByText(container: HTMLElement, text: string): HTMLAnchorElement {
  const link = Array.from(container.querySelectorAll("a")).find((node) => node.textContent?.trim().includes(text));
  if (!link) {
    throw new Error(`link not found: ${text}`);
  }
  return link as HTMLAnchorElement;
}

export function findLinkByPath(container: HTMLElement, path: string): HTMLAnchorElement {
  const link = Array.from(container.querySelectorAll("a")).find((node) => {
    const href = (node as HTMLAnchorElement).getAttribute("href");
    return href === path;
  });
  if (!link) {
    throw new Error(`link not found by path: ${path}`);
  }
  return link as HTMLAnchorElement;
}

export async function clickElement(element: HTMLElement): Promise<void> {
  await act(async () => {
    element.dispatchEvent(new MouseEvent("click", { bubbles: true }));
  });
}

export async function changeInputValue(
  element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
  value: string
): Promise<void> {
  const elementPrototype =
    element instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : element instanceof HTMLSelectElement
        ? HTMLSelectElement.prototype
        : HTMLInputElement.prototype;
  const valueSetter = Object.getOwnPropertyDescriptor(elementPrototype, "value")?.set;

  await act(async () => {
    if (valueSetter) {
      valueSetter.call(element, value);
    } else {
      element.value = value;
    }
    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  });
}

export async function keyDownElement(element: HTMLElement, key: string): Promise<void> {
  await act(async () => {
    element.dispatchEvent(new KeyboardEvent("keydown", { key, bubbles: true }));
  });
}
