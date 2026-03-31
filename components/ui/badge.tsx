import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em]",
  {
    variants: {
      variant: {
        default: "border-[rgba(91,140,255,0.2)] bg-[rgba(91,140,255,0.12)] text-[#b7ccff]",
        success: "border-[rgba(16,185,129,0.2)] bg-[rgba(16,185,129,0.12)] text-[#baf6df]",
        danger: "border-[rgba(244,63,94,0.2)] bg-[rgba(244,63,94,0.12)] text-[#ffc2cf]",
        warning: "border-[rgba(245,158,11,0.2)] bg-[rgba(245,158,11,0.12)] text-[#ffe3ae]",
        cyan: "border-[rgba(34,211,238,0.2)] bg-[rgba(34,211,238,0.12)] text-[#b9f5ff]",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

type BadgeProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof badgeVariants>;

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}
