"use client";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (value: string) => void;
  onEndDateChange: (value: string) => void;
}

interface WeekRangeFilterProps {
  anchorDate: string;
  startDate: string;
  endDate: string;
  onAnchorDateChange: (value: string) => void;
}

export function ChartDateRangeFilter({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
}: DateRangeFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-bold text-muted-foreground">Dari</span>
        <Input
          type="date"
          value={startDate}
          max={endDate}
          onChange={(event) => onStartDateChange(event.target.value)}
          className="h-8 text-xs bg-card w-[135px]"
        />
      </div>
      <div className="flex items-center gap-1.5">
        <span className="text-[11px] font-bold text-muted-foreground">Sampai</span>
        <Input
          type="date"
          value={endDate}
          min={startDate}
          onChange={(event) => onEndDateChange(event.target.value)}
          className="h-8 text-xs bg-card w-[135px]"
        />
      </div>
    </div>
  );
}

export function ChartWeekFilter({
  anchorDate,
  startDate,
  endDate,
  onAnchorDateChange,
}: WeekRangeFilterProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <Input
        type="date"
        value={anchorDate}
        onChange={(event) => onAnchorDateChange(event.target.value)}
        className="h-8 text-xs bg-card w-[140px]"
      />
      <span className="text-[11px] font-semibold text-muted-foreground whitespace-nowrap">
        {startDate} s/d {endDate}
      </span>
    </div>
  );
}
