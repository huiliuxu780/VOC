import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[120px] w-full rounded-[24px] border border-white/8 bg-[rgba(255,255,255,0.03)] px-4 py-3 text-sm text-white outline-none transition-colors placeholder:text-[rgba(229,238,255,0.42)] focus:border-[rgba(91,140,255,0.32)] focus:bg-[rgba(255,255,255,0.05)]",
        className,
      )}
      {...props}
    />
  ),
);

Textarea.displayName = "Textarea";
