import { fromZonedTime, formatInTimeZone } from "date-fns-tz";

export const DEFAULT_BUSINESS_TIMEZONE = "Asia/Jakarta";
export const DEFAULT_CLOSING_TIME = "22:00";

export type BotAnalyticsPeriod =
  | "today"
  | "yesterday"
  | "last_7_days"
  | "last_30_days"
  | "this_month";

export interface BusinessDaySettings {
  timezone: string;
  closingTimeLocal: string;
}

export interface BusinessWindow {
  start: Date;
  endExclusive: Date;
  labelDate: string;
}

export interface BusinessDayContext {
  timezone: string;
  closingTimeLocal: string;
  localToday: string;
  latestBoundaryDate: string;
  latestBoundary: Date;
  activeWindow: BusinessWindow;
  completedWindow: BusinessWindow;
}

export interface BusinessRange {
  start: Date;
  endExclusive: Date;
  label: string;
  period: BotAnalyticsPeriod;
}

function normalizeClosingTime(closingTimeLocal?: string | null) {
  return closingTimeLocal && /^\d{2}:\d{2}$/.test(closingTimeLocal)
    ? closingTimeLocal
    : DEFAULT_CLOSING_TIME;
}

export function getBusinessDaySettings(
  settings?: Partial<BusinessDaySettings> | null
): BusinessDaySettings {
  return {
    timezone: settings?.timezone || DEFAULT_BUSINESS_TIMEZONE,
    closingTimeLocal: normalizeClosingTime(settings?.closingTimeLocal),
  };
}

export function shiftIsoDate(dateValue: string, days: number) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const shiftedDate = new Date(Date.UTC(year, month - 1, day + days));

  return shiftedDate.toISOString().slice(0, 10);
}

export function getBoundaryForLocalDate(
  dateValue: string,
  closingTimeLocal: string,
  timezone: string
) {
  return fromZonedTime(`${dateValue}T${closingTimeLocal}:00`, timezone);
}

export function toLocalDate(dateValue: Date, timezone: string) {
  return formatInTimeZone(dateValue, timezone, "yyyy-MM-dd");
}

export function toLocalDateTime(dateValue: Date, timezone: string) {
  return formatInTimeZone(dateValue, timezone, "dd MMM yyyy HH:mm");
}

export function getBusinessDayContext(
  now = new Date(),
  settings?: Partial<BusinessDaySettings> | null
): BusinessDayContext {
  const normalized = getBusinessDaySettings(settings);
  const localToday = toLocalDate(now, normalized.timezone);
  const todayBoundary = getBoundaryForLocalDate(
    localToday,
    normalized.closingTimeLocal,
    normalized.timezone
  );
  const latestBoundaryDate =
    now >= todayBoundary ? localToday : shiftIsoDate(localToday, -1);
  const latestBoundary = getBoundaryForLocalDate(
    latestBoundaryDate,
    normalized.closingTimeLocal,
    normalized.timezone
  );
  const previousBoundaryDate = shiftIsoDate(latestBoundaryDate, -1);
  const nextBoundaryDate = shiftIsoDate(latestBoundaryDate, 1);

  return {
    ...normalized,
    localToday,
    latestBoundaryDate,
    latestBoundary,
    activeWindow: {
      start: latestBoundary,
      endExclusive: getBoundaryForLocalDate(
        nextBoundaryDate,
        normalized.closingTimeLocal,
        normalized.timezone
      ),
      labelDate: nextBoundaryDate,
    },
    completedWindow: {
      start: getBoundaryForLocalDate(
        previousBoundaryDate,
        normalized.closingTimeLocal,
        normalized.timezone
      ),
      endExclusive: latestBoundary,
      labelDate: latestBoundaryDate,
    },
  };
}

export function resolveBusinessRange(
  period: BotAnalyticsPeriod,
  now = new Date(),
  settings?: Partial<BusinessDaySettings> | null
): BusinessRange {
  const context = getBusinessDayContext(now, settings);

  if (period === "today") {
    return {
      start: context.activeWindow.start,
      endExclusive: now,
      label: "Hari ini",
      period,
    };
  }

  if (period === "yesterday") {
    return {
      start: context.completedWindow.start,
      endExclusive: context.completedWindow.endExclusive,
      label: "Hari operasional sebelumnya",
      period,
    };
  }

  if (period === "last_7_days") {
    return {
      start: getBoundaryForLocalDate(
        shiftIsoDate(context.latestBoundaryDate, -6),
        context.closingTimeLocal,
        context.timezone
      ),
      endExclusive: now,
      label: "7 hari operasional terakhir",
      period,
    };
  }

  if (period === "last_30_days") {
    return {
      start: getBoundaryForLocalDate(
        shiftIsoDate(context.latestBoundaryDate, -29),
        context.closingTimeLocal,
        context.timezone
      ),
      endExclusive: now,
      label: "30 hari operasional terakhir",
      period,
    };
  }

  const [year, month] = context.localToday.split("-").map(Number);
  const monthStart = `${year}-${String(month).padStart(2, "0")}-01`;

  return {
    start: getBoundaryForLocalDate(
      monthStart,
      context.closingTimeLocal,
      context.timezone
    ),
    endExclusive: now,
    label: "Bulan berjalan",
    period,
  };
}
