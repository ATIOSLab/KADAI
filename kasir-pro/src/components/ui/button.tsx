import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-semibold transition-all duration-150 cursor-pointer disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 rounded-lg",
  {
    variants: {
      variant: {
        default:
          "bg-accent-primary text-white shadow-xs hover:brightness-110 active:scale-[0.98] transition-all",
        secondary:
          "bg-accent-secondary text-white shadow-xs hover:bg-slate-900 active:scale-[0.98] transition-all",
        success:
          "bg-accent-success text-white shadow-xs hover:brightness-110 active:scale-[0.98] transition-all",
        danger:
          "bg-accent-danger text-white shadow-xs hover:brightness-110 active:scale-[0.98] transition-all",
        destructive:
          "bg-accent-danger text-white shadow-xs hover:brightness-110 active:scale-[0.98] transition-all",
        warning:
          "bg-accent-warning text-slate-950 shadow-xs hover:brightness-105 active:scale-[0.98] transition-all",
        outline:
          "bg-card text-foreground border border-border hover:bg-muted/60 active:scale-[0.98] transition-all shadow-2xs",
        ghost:
          "border border-transparent bg-transparent text-text-primary shadow-none hover:border-border-default/15 hover:bg-bg-card/80",
        link:
          "border-transparent bg-transparent p-0 text-accent-secondary shadow-none underline-offset-4 hover:underline",
      },
      size: {
        default: "h-9 sm:h-10 px-3.5 sm:px-4 text-xs sm:text-sm rounded-lg",
        xs: "h-7 px-2 text-[11px] sm:text-xs rounded-md",
        sm: "h-8 px-2.5 sm:px-3 text-xs rounded-md",
        lg: "h-11 sm:h-12 px-6 sm:px-8 text-sm sm:text-base rounded-lg",
        xl: "h-12 sm:h-14 px-8 sm:px-10 text-base sm:text-lg rounded-xl",
        icon: "h-9 w-9 sm:h-10 sm:w-10 rounded-lg",
        "icon-sm": "h-7 w-7 sm:h-8 sm:w-8 rounded-md",
        "icon-lg": "h-11 w-11 sm:h-12 sm:w-12 rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
