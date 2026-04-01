import { ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = {
  value: string;
  options: SelectOption[];
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  triggerClassName?: string;
  menuClassName?: string;
  optionClassName?: string;
  ariaLabel?: string;
};

function cx(...items: Array<string | undefined | null | false>) {
  return items.filter(Boolean).join(" ");
}

export function Select({
  value,
  options,
  onChange,
  placeholder = "Select...",
  className,
  triggerClassName,
  menuClassName,
  optionClassName,
  ariaLabel
}: SelectProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const selected = useMemo(() => options.find((item) => item.value === value) ?? null, [options, value]);

  useEffect(() => {
    if (!open) return;
    const onWindowMouseDown = (event: MouseEvent) => {
      const root = rootRef.current;
      if (!root) return;
      if (!root.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const onWindowKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };
    window.addEventListener("mousedown", onWindowMouseDown);
    window.addEventListener("keydown", onWindowKeyDown);
    return () => {
      window.removeEventListener("mousedown", onWindowMouseDown);
      window.removeEventListener("keydown", onWindowKeyDown);
    };
  }, [open]);

  return (
    <div ref={rootRef} className={cx("relative", className)}>
      <button
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((valueNow) => !valueNow)}
        onKeyDown={(event) => {
          if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen(true);
          }
        }}
        className={cx(
          "group flex w-full items-center justify-between gap-3 rounded-2xl border border-indigo-200/55 bg-[#111320]/95 px-4 py-2.5 text-left text-sm text-slate-100 shadow-[0_0_0_2px_rgba(148,163,184,0.26)] transition-colors hover:border-indigo-100/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70",
          triggerClassName
        )}
      >
        <span className={cx("truncate", selected ? "text-slate-100" : "text-slate-400")}>{selected?.label ?? placeholder}</span>
        <ChevronDown
          className={cx("h-4 w-4 shrink-0 text-slate-400 transition-transform", open ? "rotate-180 text-slate-200" : "rotate-0")}
        />
      </button>

      {open ? (
        <div
          role="listbox"
          className={cx(
            "absolute z-50 mt-2 w-full overflow-hidden rounded-2xl border border-white/15 bg-[#171922]/98 shadow-[0_22px_48px_rgba(0,0,0,0.48)] backdrop-blur",
            menuClassName
          )}
        >
          <div className="max-h-64 overflow-auto p-1.5">
            {options.map((item) => {
              const active = item.value === value;
              return (
                <button
                  key={item.value}
                  type="button"
                  role="option"
                  aria-selected={active}
                  disabled={item.disabled}
                  onClick={() => {
                    if (item.disabled) return;
                    onChange(item.value);
                    setOpen(false);
                  }}
                  className={cx(
                    "flex w-full cursor-pointer items-center justify-between rounded-xl px-3 py-2 text-left text-sm transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/70",
                    item.disabled
                      ? "cursor-not-allowed text-slate-500"
                      : active
                        ? "bg-slate-100/12 text-slate-100"
                        : "text-slate-200 hover:bg-white/10",
                    optionClassName
                  )}
                >
                  <span className="truncate">{item.label}</span>
                  {active ? <span className="ml-2 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
