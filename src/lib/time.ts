import {
  addDays,
  addMinutes,
  format,
  isBefore,
  parseISO,
  startOfDay,
  startOfWeek,
} from "date-fns";

export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

export function detectTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

export function formatHour(hour: number, minute = 0): string {
  const h = Math.floor(hour);
  const m = minute;
  const period = h >= 12 ? "PM" : "AM";
  const twelve = h % 12 === 0 ? 12 : h % 12;
  if (m === 0) return `${twelve} ${period}`;
  return `${twelve}:${String(m).padStart(2, "0")} ${period}`;
}

export function formatHourCompact(hour: number, minute = 0): string {
  const h = Math.floor(hour);
  const m = minute;
  const period = h >= 12 ? "p" : "a";
  const twelve = h % 12 === 0 ? 12 : h % 12;
  if (m === 0) return `${twelve}${period}`;
  return `${twelve}:${String(m).padStart(2, "0")}${period}`;
}

export function slotKey(date: string, hour: number, minute: number): string {
  return `${date}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export type TimeSlot = {
  key: string;
  date: string;
  hour: number;
  minute: number;
};

export function buildSlots(
  dates: string[],
  startHour: number,
  endHour: number,
  slotMinutes: number,
): TimeSlot[] {
  const slots: TimeSlot[] = [];
  for (const date of dates) {
    let cursor = parseISO(`${date}T00:00:00`);
    cursor = addMinutes(cursor, startHour * 60);
    const end = addMinutes(startOfDay(parseISO(`${date}T00:00:00`)), endHour * 60);
    while (isBefore(cursor, end)) {
      slots.push({
        key: slotKey(date, cursor.getHours(), cursor.getMinutes()),
        date,
        hour: cursor.getHours(),
        minute: cursor.getMinutes(),
      });
      cursor = addMinutes(cursor, slotMinutes);
    }
  }
  return slots;
}

export function uniqueTimes(
  startHour: number,
  endHour: number,
  slotMinutes: number,
): { hour: number; minute: number }[] {
  const times: { hour: number; minute: number }[] = [];
  let minutes = startHour * 60;
  const end = endHour * 60;
  while (minutes < end) {
    times.push({ hour: Math.floor(minutes / 60), minute: minutes % 60 });
    minutes += slotMinutes;
  }
  return times;
}

export function formatDateChip(isoDate: string): { dow: string; day: string; month: string } {
  const d = parseISO(`${isoDate}T12:00:00`);
  return {
    dow: format(d, "EEE"),
    day: format(d, "d"),
    month: format(d, "MMM"),
  };
}

export function formatDateLong(isoDate: string): string {
  return format(parseISO(`${isoDate}T12:00:00`), "EEE, MMM d");
}

export function formatDateRange(dates: string[]): string {
  if (dates.length === 0) return "No dates";
  const sorted = [...dates].sort();
  const first = parseISO(`${sorted[0]}T12:00:00`);
  const last = parseISO(`${sorted[sorted.length - 1]}T12:00:00`);
  if (sorted.length === 1) return format(first, "MMM d");
  if (first.getMonth() === last.getMonth() && first.getFullYear() === last.getFullYear()) {
    return `${format(first, "MMM d")} – ${format(last, "d")}`;
  }
  return `${format(first, "MMM d")} – ${format(last, "MMM d")}`;
}

export function upcomingWeekdays(count = 5, from = new Date()): string[] {
  const dates: string[] = [];
  let cursor = startOfDay(from);
  while (dates.length < count) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 6) dates.push(format(cursor, "yyyy-MM-dd"));
    cursor = addDays(cursor, 1);
  }
  return dates;
}

export function nextDays(count: number, from = new Date()): string[] {
  return Array.from({ length: count }, (_, i) => format(addDays(startOfDay(from), i), "yyyy-MM-dd"));
}

export function weekendDates(from = new Date()): string[] {
  const start = startOfWeek(from, { weekStartsOn: 1 });
  const sat = addDays(start, 5);
  const sun = addDays(start, 6);
  const today = startOfDay(from);
  if (isBefore(sun, today)) {
    return [format(addDays(sat, 7), "yyyy-MM-dd"), format(addDays(sun, 7), "yyyy-MM-dd")];
  }
  if (isBefore(sat, today)) return [format(sun, "yyyy-MM-dd")];
  return [format(sat, "yyyy-MM-dd"), format(sun, "yyyy-MM-dd")];
}

export function monthGrid(anchor: Date): Date[] {
  const start = startOfWeek(startOfDay(new Date(anchor.getFullYear(), anchor.getMonth(), 1)), {
    weekStartsOn: 1,
  });
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export const HOURS = Array.from({ length: 24 }, (_, i) => i);
