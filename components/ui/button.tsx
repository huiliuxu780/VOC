import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-medium transition-all disabled:pointer-events-none disabled:opacity-50 outline-none focus-visible:ring-2 focus-visible:ring-[rgba(91,140,255,0.35)]",
  {
    variants: {
      variant: {
        primary:
          "border border-[rgba(91,140,255,0.24)] bg-[linear-gradient(135deg,rgba(91,140,255,0.18),rgba(124,58,237,0.18))] text-white shadow-[0_14px_34px_rgba(7,11,20,0.42)] hover:-translate-y-0.5 hover:border-[rgba(91,140,255,0.34)]",
        secondary:
          "border border-white/8 bg-[rgba(255,255,255,0.04)] text-white hover:-translate-y-0.5 hover:border-[rgba(120,180,255,0.24)] hover:bg-[rgba(255,255,255,0.06)]",
        ghost: "text-muted hover:bg-white/6 hover:text-white",
        danger:
          "border border-[rgba(244,63,94,0.24)] bg-[rgba(244,63,94,0.12)] text-[rgba(255,220,228,0.92)] hover:bg-[rgba(244,63,94,0.16)]",
      },
      size: {
        sm: "h-9 px-3",
        md: "h-11 px-4",
        lg: "h-12 px-5",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "secondary",
      size: "md",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size, className }))} {...props} />;
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
