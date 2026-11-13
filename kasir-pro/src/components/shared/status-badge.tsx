import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type StatusTone = "success" | "warning" | "danger" | "info" | "muted" | "neutral";

const toneClass: Record<StatusTone, string> = {
  success: "bg-emerald-50 text-emerald-700 border-emerald-200",
  warning: "bg-amber-50 text-amber-700 border-amber-200",
  danger: "bg-rose-50 text-rose-700 border-rose-200",
  info: "bg-sky-50 text-sky-700 border-sky-200",
  muted: "bg-slate-100 text-slate-600 border-slate-200",
  neutral: "bg-card text-text-muted border-border",
};

interface StatusBadgeProps {
  tone?: StatusTone;
  className?: string;
  children: React.ReactNode;
}

/** Badge status seragam untuk seluruh modul (platform, tenant, billing). */
export function StatusBadge({ tone = "neutral", className, children }: StatusBadgeProps) {
  return (
    <Badge variant="outline" className={cn(toneClass[tone], className)}>
      {children}
    </Badge>
  );
}

/** Tone standar untuk status akun owner. */
export function ownerStatusTone(isActive: boolean): StatusTone {
  return isActive ? "success" : "danger";
}
