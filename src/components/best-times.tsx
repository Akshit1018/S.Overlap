import { Clock3 } from "lucide-react";
import type { BestWindow } from "@/lib/types";
import { formatDateLong, formatHour } from "@/lib/time";
import { cn } from "@/lib/utils";

export function BestTimes({
  windows,
  total,
}: {
  windows: BestWindow[];
  total: number;
}) {
  if (windows.length === 0) {
    return (
      <div className="rounded-xl bg-card p-4 shadow-card">
        <p className="text-sm font-medium">Best times</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Waiting on more availability. Paint a few slots to see overlaps.
        </p>
      </div>
    );
  }

  return (
    <section className="flex flex-col gap-2">
      <div className="flex items-center gap-2 px-1">
        <Clock3 className="size-4 text-primary" />
        <h2 className="text-sm font-medium">Best overlap</h2>
      </div>
      <ul className="flex flex-col gap-2">
        {windows.map((w, i) => (
          <li
            key={w.startKey}
            className={cn(
              "flex items-center justify-between gap-3 rounded-xl bg-card px-4 py-3 shadow-card",
              i === 0 && "ring-1 ring-primary/25",
            )}
          >
            <div>
              <p className="font-medium">
                {formatDateLong(w.date)}
              </p>
              <p className="text-sm text-muted-foreground">
                {formatHour(w.startHour, w.startMinute)} – {formatHour(w.endHour, w.endMinute)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium tabular-nums text-primary">
                {w.available}/{total}
              </p>
              <p className="text-xs text-muted-foreground">free</p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
