import { createContext, type ReactNode, useContext, useMemo } from "react";

type TabsContextValue = {
  value: string;
  onValueChange: (nextValue: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

function cx(...items: Array<string | undefined | null | false>) {
  return items.filter(Boolean).join(" ");
}

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within Tabs root.");
  }
  return context;
}

type TabsProps = {
  value: string;
  onValueChange: (nextValue: string) => void;
  className?: string;
  children: ReactNode;
};

export function Tabs({ value, onValueChange, className, children }: TabsProps) {
  const contextValue = useMemo(() => ({ value, onValueChange }), [value, onValueChange]);

  return (
    <TabsContext.Provider value={contextValue}>
      <div className={cx("space-y-4", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cx("flex flex-wrap gap-2", className)}>{children}</div>;
}

export function TabsTrigger({ value, className, children }: { value: string; className?: string; children: ReactNode }) {
  const context = useTabsContext();
  const active = context.value === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => context.onValueChange(value)}
      className={cx(
        "cursor-pointer rounded-lg border px-3 py-1.5 text-xs transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60",
        active ? "border-indigo-400/45 bg-indigo-500/20 text-indigo-100" : "border-white/15 text-textSecondary hover:border-white/25",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children }: { value: string; className?: string; children: ReactNode }) {
  const context = useTabsContext();
  if (context.value !== value) return null;
  return <div className={className}>{children}</div>;
}
