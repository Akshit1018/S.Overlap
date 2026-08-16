import { useMemo, useRef, useState } from "react";
import { Drawer } from "vaul";
import type { EventWithResponses, SlotMark, SlotsMap } from "@/lib/types";
import { formatDateChip, formatHourCompact, slotKey, uniqueTimes } from "@/lib/time";
import { heatLevel, tallySlot } from "@/lib/score";
import { cn } from "@/lib/utils";

type Mode = "view" | "edit";

export function AvailabilityGrid({
  event,
  mode,
  draft,
  paint,
  onPaint,
  selected,
}: {
  event: EventWithResponses;
  mode: Mode;
  draft: SlotsMap;
  paint: SlotMark | "erase";
  onPaint: (keys: string[], value: SlotMark | null) => void;
  selected?: string | null;
}) {
  const times = useMemo(
    () => uniqueTimes(event.startHour, event.endHour, event.slotMinutes),
    [event.startHour, event.endHour, event.slotMinutes],
  );
  const total = event.responses.length;
  const painting = useRef<{ value: SlotMark | null } | null>(null);
  const lastKey = useRef<string | null>(null);
  const [detailKey, setDetailKey] = useState<string | null>(null);

  function paintAt(key: string) {
    if (!painting.current || lastKey.current === key) return;
    lastKey.current = key;
    onPaint([key], painting.current.value);
  }

  function keyFromPoint(clientX: number, clientY: number): string | null {
    const el = document.elementFromPoint(clientX, clientY);
    const cell = el?.closest("[data-slot]") as HTMLElement | null;
    return cell?.dataset.slot ?? null;
  }

  function onGridPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const key = keyFromPoint(e.clientX, e.clientY);
    if (!key) return;
    if (mode !== "edit") {
      setDetailKey(key);
      return;
    }
    if (e.pointerType === "mouse" && e.button !== 0) return;
    const current = draft[key] ?? null;
    const next: SlotMark | null = paint === "erase" || current === paint ? null : paint;
    painting.current = { value: next };
    lastKey.current = null;
    e.currentTarget.setPointerCapture(e.pointerId);
    paintAt(key);
  }

  function onGridPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    if (!painting.current) return;
    const key = keyFromPoint(e.clientX, e.clientY);
    if (key) paintAt(key);
  }

  function endPaint() {
    painting.current = null;
    lastKey.current = null;
  }

  const detail = detailKey ? tallySlot(event.responses, detailKey) : null;
  const detailMeta = detailKey
    ? (() => {
        const [date, time] = detailKey.split("T");
        const [h, m] = (time ?? "00:00").split(":").map(Number);
        return { date: date ?? "", hour: h ?? 0, minute: m ?? 0 };
      })()
    : null;

  return (
    <>
      <div
        className="overflow-x-auto overscroll-x-contain rounded-xl bg-card shadow-card touch-pan-x"
        onPointerDown={onGridPointerDown}
        onPointerMove={onGridPointerMove}
        onPointerUp={endPaint}
        onPointerCancel={endPaint}
      >
        <div
          className="min-w-max select-none"
          style={{
            display: "grid",
            gridTemplateColumns: `3rem repeat(${event.dates.length}, minmax(3.25rem, 1fr))`,
          }}
        >
          <div className="sticky left-0 z-10 bg-card" />
          {event.dates.map((date) => {
            const chip = formatDateChip(date);
            return (
              <div
                key={date}
                className={cn(
                  "sticky top-0 z-10 bg-card px-1 py-2 text-center",
                  selected === date && "text-primary",
                )}
              >
                <div className="text-xs font-medium text-muted-foreground">{chip.dow}</div>
                <div className="text-sm font-medium tabular-nums">{chip.day}</div>
              </div>
            );
          })}

          {times.map((t) => (
            <TimeRow
              key={`${t.hour}:${t.minute}`}
              time={t}
              dates={event.dates}
              event={event}
              mode={mode}
              draft={draft}
              total={total}
              selected={selected}
            />
          ))}
        </div>
      </div>

      <Drawer.Root open={detailKey != null} onOpenChange={(o) => !o && setDetailKey(null)}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-40 bg-foreground/25" />
          <Drawer.Content className="safe-pb fixed inset-x-0 bottom-0 z-50 rounded-t-xl bg-card px-5 pt-3 shadow-card outline-none">
            <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-border" />
            {detail && detailMeta ? (
              <div className="pb-6">
                <Drawer.Title className="font-display text-xl font-medium">
                  {formatDateChip(detailMeta.date).dow} {formatHourCompact(detailMeta.hour, detailMeta.minute)}
                </Drawer.Title>
                <p className="mt-1 text-sm text-muted-foreground">
                  {detail.available} available
                  {detail.ifNeeded > 0 ? ` · ${detail.ifNeeded} if needed` : ""}
                </p>
                <ul className="mt-4 flex flex-col gap-2">
                  {detail.namesAvailable.map((n) => (
                    <li key={`a-${n}`} className="flex items-center gap-2 text-sm">
                      <span className="size-2 rounded-full bg-primary" />
                      {n}
                    </li>
                  ))}
                  {detail.namesIfNeeded.map((n) => (
                    <li key={`n-${n}`} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <span className="size-2 rounded-full bg-need" />
                      {n}
                      <span className="text-xs">if needed</span>
                    </li>
                  ))}
                  {detail.available + detail.ifNeeded === 0 ? (
                    <li className="text-sm text-muted-foreground">Nobody marked this slot.</li>
                  ) : null}
                </ul>
              </div>
            ) : null}
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    </>
  );
}

function TimeRow({
  time,
  dates,
  event,
  mode,
  draft,
  total,
  selected,
}: {
  time: { hour: number; minute: number };
  dates: string[];
  event: EventWithResponses;
  mode: Mode;
  draft: SlotsMap;
  total: number;
  selected?: string | null;
}) {
  return (
    <>
      <div className="sticky left-0 z-10 flex items-start justify-end bg-card pr-2 pt-0 text-right text-xs tabular-nums text-muted-foreground">
        {time.minute === 0 ? formatHourCompact(time.hour, 0) : ""}
      </div>
      {dates.map((date) => {
        const key = slotKey(date, time.hour, time.minute);
        const mine = draft[key];
        const tally = tallySlot(event.responses, key);
        const heat = heatLevel(tally.available, total);
        return (
          <div
            key={key}
            data-slot={key}
            role="button"
            aria-label={`${date} ${formatHourCompact(time.hour, time.minute)}`}
            className={cn(
              "h-7 border-t border-l border-border/70",
              selected === date && "ring-1 ring-inset ring-primary/30",
              mode === "edit" && mine === "available" && "bg-primary",
              mode === "edit" && mine === "if_needed" && "bg-need",
              mode === "edit" && !mine && "bg-card",
              mode === "view" && heatClass(heat),
              mode === "view" && tally.ifNeeded > 0 && tally.available === 0 && "bg-need/40",
            )}
          />
        );
      })}
    </>
  );
}

function heatClass(level: 0 | 1 | 2 | 3 | 4 | 5): string {
  switch (level) {
    case 0:
      return "bg-card";
    case 1:
      return "bg-primary/15";
    case 2:
      return "bg-primary/30";
    case 3:
      return "bg-primary/50";
    case 4:
      return "bg-primary/75";
    case 5:
      return "bg-primary";
  }
}
