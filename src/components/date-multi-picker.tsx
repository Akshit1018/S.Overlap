import { useEffect, useMemo, useState } from "react";
import { addMonths, format, isSameMonth, startOfDay } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WEEKDAYS, monthGrid } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Button } from "./ui/button";

export function DateMultiPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const [anchor, setAnchor] = useState(() => startOfDay(new Date()));
  const [today, setToday] = useState<string>("");
  const selected = useMemo(() => new Set(value), [value]);
  const days = useMemo(() => monthGrid(anchor), [anchor]);

  useEffect(() => {
    setToday(format(new Date(), "yyyy-MM-dd"));
  }, []);

  function toggle(iso: string) {
    if (selected.has(iso)) onChange(value.filter((d) => d !== iso));
    else onChange([...value, iso].sort());
  }

  return (
    <div className="rounded-xl bg-card p-3 shadow-card">
      <div className="mb-2 flex items-center justify-between">
        <p className="px-1 text-sm font-medium">{format(anchor, "MMMM yyyy")}</p>
        <div className="flex">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            onClick={() => setAnchor((d) => addMonths(d, -1))}
            aria-label="Previous month"
          >
            <ChevronLeft />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-11"
            onClick={() => setAnchor((d) => addMonths(d, 1))}
            aria-label="Next month"
          >
            <ChevronRight />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {WEEKDAYS.map((d) => (
          <div key={d} className="py-1 text-xs font-medium text-muted-foreground">
            {d}
          </div>
        ))}
        {days.map((day) => {
          const iso = format(day, "yyyy-MM-dd");
          const inMonth = isSameMonth(day, anchor);
          const isPast = today !== "" && iso < today;
          const on = selected.has(iso);
          return (
            <button
              key={iso}
              type="button"
              disabled={isPast}
              onClick={() => toggle(iso)}
              className={cn(
                "flex size-10 items-center justify-center justify-self-center rounded-lg text-sm tabular-nums transition-colors duration-150",
                !inMonth && "text-muted-foreground/50",
                isPast && "opacity-30",
                on && "bg-primary text-primary-foreground",
                !on && !isPast && "hover:bg-muted",
                iso === today && !on && "ring-1 ring-primary/40",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
