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
          "bg-accent-primary text-white neo-border neo-shadow-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#1A1A1A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        secondary:
          "bg-accent-secondary text-white neo-border neo-shadow-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#1A1A1A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        success:
          "bg-accent-success text-white neo-border neo-shadow-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#1A1A1A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        danger:
          "bg-accent-danger text-white neo-border neo-shadow-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#1A1A1A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        destructive:
          "bg-accent-danger text-white neo-border neo-shadow-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#1A1A1A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        warning:
          "bg-accent-warning text-text-primary neo-border neo-shadow-sm hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#1A1A1A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
        outline:
          "bg-bg-card text-text-primary neo-border neo-shadow-sm hover:bg-bg-main hover:translate-x-[-1px] hover:translate-y-[-1px] hover:shadow-[4px_4px_0px_#1A1A1A] active:translate-x-[2px] active:translate-y-[2px] active:shadow-none",
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
