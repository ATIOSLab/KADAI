import { cn } from "@/lib/utils";
import { LucideIcon, PackageOpen } from "lucide-react";
import { Button } from "@/components/ui/button";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  actionHref?: string;
  className?: string;
}

export function EmptyState({
  icon: Icon = PackageOpen,
  title,
  description,
  actionLabel,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center py-16 px-4 text-center",
        className
      )}
    >
      <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-center mb-4 text-slate-400 shadow-2xs">
        <Icon className="w-8 h-8 text-slate-500" />
      </div>
      <h3
        className="text-lg font-bold mb-1 text-slate-900 dark:text-white"
        style={{ fontFamily: "var(--font-heading)" }}
      >
        {title}
      </h3>
      <p className="text-sm text-text-muted font-medium max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
