import * as React from "react";
import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const badgeVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap neo-badge transition-colors text-xs font-semibold rounded-lg",
  {
    variants: {
      variant: {
        default: "bg-accent-primary text-white shadow-2xs",
        secondary: "bg-accent-secondary text-white shadow-2xs",
        success: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800",
        warning: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
        danger: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800",
        amber: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800",
        ember: "bg-orange-50 text-[#EA580C] border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-800",
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
