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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="space-y-1">
        <Label className="text-xs font-bold text-text-muted">Dari</Label>
        <Input
          type="date"
          value={startDate}
          max={endDate}
          onChange={(event) => onStartDateChange(event.target.value)}
          className="h-9 bg-white"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-bold text-text-muted">Sampai</Label>
        <Input
          type="date"
          value={endDate}
          min={startDate}
          onChange={(event) => onEndDateChange(event.target.value)}
          className="h-9 bg-white"
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
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className="space-y-1 sm:col-span-2">
        <Label className="text-xs font-bold text-text-muted">
          Pilih Tanggal Minggu
        </Label>
        <Input
          type="date"
          value={anchorDate}
          onChange={(event) => onAnchorDateChange(event.target.value)}
          className="h-9 bg-white"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-bold text-text-muted">Dari</Label>
        <Input
          type="date"
          value={startDate}
          readOnly
          disabled
          className="h-9 bg-bg-main text-text-primary"
        />
      </div>
      <div className="space-y-1">
        <Label className="text-xs font-bold text-text-muted">Sampai</Label>
        <Input
          type="date"
          value={endDate}
          readOnly
          disabled
          className="h-9 bg-bg-main text-text-primary"
        />
      </div>
      <p className="sm:col-span-2 text-xs font-medium text-text-muted">
        Rentang otomatis mengikuti 1 minggu penuh, dari Senin sampai Minggu.
      </p>
    </div>
  );
}
