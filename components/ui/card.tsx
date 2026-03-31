import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const cardVariants = cva("rounded-[28px] border panel-hover panel-sheen", {
  variants: {
    variant: {
      glass: "glass-card",
      solid: "glass-card-solid",
      focus:
        "border-[rgba(91,140,255,0.22)] bg-[linear-gradient(135deg,rgba(17,25,40,0.94),rgba(13,23,43,0.9))] shadow-[0_24px_60px_rgba(7,11,20,0.74)]",
    },
  },
  defaultVariants: {
    variant: "glass",
  },
});

type CardProps = React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof cardVariants>;

export function Card({ className, variant, ...props }: CardProps) {
  return <div className={cn(cardVariants({ variant }), className)} {...props} />;
}

export function CardContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("p-6", className)} {...props} />;
}
