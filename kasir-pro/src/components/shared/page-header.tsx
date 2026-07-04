import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  icon: Icon,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        "mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between",
        className
      )}
    >
      <div className="flex items-center gap-3">
        {Icon && (
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-black/10 bg-white shadow-[0_14px_30px_rgba(15,23,42,0.06)]">
            <Icon className="h-5 w-5 text-accent-primary" />
          </div>
        )}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-text-muted">
            Workspace
          </p>
          <h1 className="text-2xl font-black tracking-tight lg:text-3xl">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm font-medium text-text-muted">
              {description}
            </p>
          )}
        </div>
      </div>
      {children && (
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {children}
        </div>
      )}
    </div>
  );
}
