import * as React from "react";
import { cn } from "@/lib/utils";

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg bg-bg-main neo-border-thin",
        className
      )}
      {...props}
    />
  );
}

export { Skeleton };
