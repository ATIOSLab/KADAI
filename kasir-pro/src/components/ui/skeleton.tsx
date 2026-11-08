import * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-slate-100 border border-slate-200/60 dark:bg-slate-800/60 dark:border-slate-700/60",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
