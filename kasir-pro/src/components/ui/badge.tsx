import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap neo-badge transition-colors text-xs font-semibold rounded-lg",
  {
    variants: {
      variant: {
        default: "bg-accent-primary text-white",
        secondary: "bg-accent-secondary text-white",
        success: "bg-accent-success text-white",
        warning: "bg-accent-warning text-text-primary",
        danger: "bg-accent-danger text-white",
        purple: "bg-accent-purple text-white",
        outline: "bg-bg-card text-text-primary",
        muted: "bg-bg-main text-text-secondary border-border-light",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
