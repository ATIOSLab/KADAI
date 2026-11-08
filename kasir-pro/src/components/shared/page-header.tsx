import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface PageHeaderProps {
  title: string;
  description?: string;
  eyebrow?: string;
  icon?: LucideIcon;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
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
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-card shadow-xs">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        )}
        <div>
          {eyebrow && (
            <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">
              {eyebrow}
            </p>
          )}
          <h1
            className="text-2xl font-bold tracking-tight lg:text-3xl text-slate-950 dark:text-white"
            style={{ fontFamily: "var(--font-heading)" }}
          >
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
