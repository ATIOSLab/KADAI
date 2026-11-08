import * as React from "react";
import { type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: LucideIcon;
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "danger" | "neutral";
  trend?: {
    value: string;
    isUp?: boolean;
    isGood?: boolean;
  };
  className?: string;
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  badge,
  badgeVariant = "neutral",
  trend,
  className,
}: StatCardProps) {
  const badgeClasses: Record<string, string> = {
    default: "bg-primary/10 text-primary border-primary/20",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-rose-50 text-rose-700 border-rose-200",
    neutral: "bg-slate-100 text-slate-700 border-slate-200",
  };

  return (
    <Card className={cn("neo-card p-4 sm:p-5 flex flex-col justify-between transition-all hover:shadow-sm", className)}>
      <CardContent className="p-0 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground truncate">
            {title}
          </span>
          {badge ? (
            <Badge
              variant="outline"
              className={cn("text-[10px] font-bold px-2 py-0.5 rounded-md", badgeClasses[badgeVariant])}
            >
              {badge}
            </Badge>
          ) : Icon ? (
            <div className="size-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-700 shrink-0">
              <Icon className="size-4" />
            </div>
          ) : null}
        </div>

        <div>
          <div className="text-xl sm:text-2xl font-black text-foreground tabular-nums tracking-tight">
            {value}
          </div>
          {description && (
            <p className="text-xs text-muted-foreground mt-0.5 leading-normal">
              {description}
            </p>
          )}
        </div>

        {trend && (
          <div className="pt-2 border-t border-slate-100 flex items-center gap-1.5 text-xs font-semibold">
            <span
              className={
                trend.isGood !== undefined
                  ? trend.isGood
                    ? "text-emerald-700"
                    : "text-rose-600"
                  : "text-slate-600"
              }
            >
              {trend.isUp ? "↑" : "↓"} {trend.value}
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
