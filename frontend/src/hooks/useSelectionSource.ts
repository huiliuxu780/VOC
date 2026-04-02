import { useCallback, useRef } from "react";

export type SelectionSource = "keyboard" | "pointer";

export function useSelectionSource() {
  const sourceRef = useRef<SelectionSource | null>(null);

  const setSelectionSource = useCallback((source: SelectionSource) => {
    sourceRef.current = source;
  }, []);

  const getSelectionSource = useCallback(() => {
    return sourceRef.current;
  }, []);

  const clearSelectionSource = useCallback(() => {
    sourceRef.current = null;
  }, []);

  return {
    setSelectionSource,
    getSelectionSource,
    clearSelectionSource
  };
}
