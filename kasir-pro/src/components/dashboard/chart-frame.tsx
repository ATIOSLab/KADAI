"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartFrameProps {
  title: string;
  description: string;
  filter?: ReactNode;
  children: ReactNode;
}

export function ChartFrame({
  title,
  description,
  filter,
  children,
}: ChartFrameProps) {
  return (
    <Card className="flex h-full flex-col">
      <CardHeader className="gap-3">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0">
            <CardTitle>{title}</CardTitle>
            <p className="mt-1 text-sm font-medium text-text-muted">
              {description}
            </p>
          </div>

          {filter ? (
            <div className="w-full xl:max-w-[360px]">{filter}</div>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">{children}</CardContent>
    </Card>
  );
}
