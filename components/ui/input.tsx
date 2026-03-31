import * as React from "react";
import { cn } from "@/lib/utils";

export const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "flex h-11 w-full rounded-2xl border border-white/8 bg-[rgba(255,255,255,0.03)] px-4 py-2 text-sm text-white outline-none transition-colors placeholder:text-[rgba(229,238,255,0.42)] focus:border-[rgba(91,140,255,0.32)] focus:bg-[rgba(255,255,255,0.05)]",
        className,
      )}
      {...props}
    />
  ),
);

Input.displayName = "Input";
