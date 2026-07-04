import {
  addDays,
  endOfWeek,
  format,
  startOfWeek,
  subDays,
} from "date-fns";
import { id as indonesianLocale } from "date-fns/locale";

export interface DashboardDateRange {
  startDate: string;
  endDate: string;
}

function toIsoDate(value: Date) {
  return format(value, "yyyy-MM-dd");
}

function fromIsoDate(value: string) {
  return new Date(`${value}T00:00:00`);
}

export function formatDashboardDate(value: string) {
  return format(fromIsoDate(value), "dd MMM yyyy", {
    locale: indonesianLocale,
  });
}

export function formatDashboardDateRange(range: DashboardDateRange) {
  return `${formatDashboardDate(range.startDate)} - ${formatDashboardDate(
    range.endDate
  )}`;
}

export function createDateRange(startDate: string, endDate: string): DashboardDateRange {
  return { startDate, endDate };
}

export function getDefaultDashboardRange(now = new Date()): DashboardDateRange {
  return {
    startDate: toIsoDate(subDays(now, 6)),
    endDate: toIsoDate(now),
  };
}

export function getWeekRangeFromDate(dateValue: string): DashboardDateRange {
  const baseDate = fromIsoDate(dateValue);
  const weekStart = startOfWeek(baseDate, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(baseDate, { weekStartsOn: 1 });

  return {
    startDate: toIsoDate(weekStart),
    endDate: toIsoDate(weekEnd),
  };
}

export function getCurrentWeekRange(now = new Date()): DashboardDateRange {
  return getWeekRangeFromDate(toIsoDate(now));
}

export function getPreviousWeekRange(now = new Date()): DashboardDateRange {
  return getWeekRangeFromDate(toIsoDate(subDays(now, 7)));
}

export function getWeekAnchorDate(range: DashboardDateRange) {
  return range.startDate;
}

export function getWeekEndDateFromAnchor(anchorDate: string) {
  return toIsoDate(addDays(fromIsoDate(anchorDate), 6));
}
