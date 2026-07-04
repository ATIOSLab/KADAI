import { formatCurrency } from "@/lib/utils";
import { cn } from "@/lib/utils";

interface CurrencyDisplayProps {
  amount: number | string;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

export function CurrencyDisplay({
  amount,
  className,
  size = "md",
}: CurrencyDisplayProps) {
  const sizeClasses = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-2xl",
  };

  return (
    <span
      className={cn(
        "font-bold tabular-nums",
        sizeClasses[size],
        className
      )}
    >
      {formatCurrency(amount)}
    </span>
  );
}
