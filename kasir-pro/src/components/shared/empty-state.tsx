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
      <div className="w-20 h-20 rounded-2xl bg-bg-main neo-border flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-text-muted" />
      </div>
      <h3 className="text-lg font-extrabold mb-1">{title}</h3>
      <p className="text-sm text-text-muted font-medium max-w-sm mb-6">
        {description}
      </p>
      {actionLabel && onAction && (
        <Button onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
