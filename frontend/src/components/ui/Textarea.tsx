import { forwardRef, type TextareaHTMLAttributes } from "react";

function cx(...items: Array<string | undefined | null | false>) {
  return items.filter(Boolean).join(" ");
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea(
  { className, ...props },
  ref
) {
  return (
    <textarea
      ref={ref}
      className={cx(
        "w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2 text-sm text-textPrimary outline-none transition-colors placeholder:text-textSecondary focus:border-indigo-300/60",
        className
      )}
      {...props}
    />
  );
});
