import type { BestWindow, ResponseRecord } from "./types";
import { uniqueTimes, slotKey } from "./time";

export type CellTally = {
  available: number;
  ifNeeded: number;
  namesAvailable: string[];
  namesIfNeeded: string[];
};

export function tallySlot(responses: ResponseRecord[], key: string): CellTally {
  const namesAvailable: string[] = [];
  const namesIfNeeded: string[] = [];
  for (const response of responses) {
    const mark = response.slots[key];
    if (mark === "available") namesAvailable.push(response.name);
    else if (mark === "if_needed") namesIfNeeded.push(response.name);
  }
  return {
    available: namesAvailable.length,
    ifNeeded: namesIfNeeded.length,
    namesAvailable,
    namesIfNeeded,
  };
}

export function heatLevel(available: number, total: number): 0 | 1 | 2 | 3 | 4 | 5 {
  if (total <= 0 || available <= 0) return 0;
  const ratio = available / total;
  if (ratio >= 0.95) return 5;
  if (ratio >= 0.75) return 4;
  if (ratio >= 0.5) return 3;
  if (ratio >= 0.3) return 2;
  return 1;
}

export function bestWindows(
  dates: string[],
  startHour: number,
  endHour: number,
  slotMinutes: number,
  responses: ResponseRecord[],
  minSlots = 2,
): BestWindow[] {
  const times = uniqueTimes(startHour, endHour, slotMinutes);
  const windows: BestWindow[] = [];
  const total = responses.length;
  if (total === 0 || times.length === 0) return [];

  for (const date of dates) {
    for (let i = 0; i < times.length; i += 1) {
      const start = times[i];
      if (!start) continue;
      let available = Infinity;
      let ifNeeded = 0;
      let length = 0;
      for (let j = i; j < times.length; j += 1) {
        const t = times[j];
        if (!t) break;
        const key = slotKey(date, t.hour, t.minute);
        const cell = tallySlot(responses, key);
        if (cell.available === 0 && cell.ifNeeded === 0) break;
        available = Math.min(available, cell.available);
        ifNeeded = Math.max(ifNeeded, cell.ifNeeded);
        length += 1;
        if (length < minSlots) continue;
        const endAbs = t.hour * 60 + t.minute + slotMinutes;
        const score = available * 10 + ifNeeded * 3 + length;
        windows.push({
          startKey: slotKey(date, start.hour, start.minute),
          endKey: key,
          date,
          startHour: start.hour,
          startMinute: start.minute,
          endHour: Math.floor(endAbs / 60),
          endMinute: endAbs % 60,
          available: available === Infinity ? 0 : available,
          ifNeeded,
          score,
          slotCount: length,
        });
      }
    }
  }

  windows.sort((a, b) => b.score - a.score || a.date.localeCompare(b.date));
  const picked: BestWindow[] = [];
  for (const window of windows) {
    if (picked.length >= 4) break;
    const overlaps = picked.some(
      (p) => p.date === window.date && rangesOverlap(p, window, slotMinutes),
    );
    if (!overlaps) picked.push(window);
  }
  return picked;
}

function rangesOverlap(a: BestWindow, b: BestWindow, slotMinutes: number): boolean {
  const aStart = a.startHour * 60 + a.startMinute;
  const aEnd = a.endHour * 60 + a.endMinute;
  const bStart = b.startHour * 60 + b.startMinute;
  const bEnd = b.endHour * 60 + b.endMinute;
  return aStart < bEnd && bStart < aEnd && Math.min(aEnd, bEnd) - Math.max(aStart, bStart) >= slotMinutes;
}
