import { Link } from "@tanstack/react-router";
import { ChevronRight } from "lucide-react";
import type { EventSummary } from "@/lib/types";
import { formatDateRange, formatHour } from "@/lib/time";

export function EventCard({ event }: { event: EventSummary }) {
  return (
    <Link
      to="/e/$eventId"
      params={{ eventId: event.id }}
      className="flex items-center gap-3 rounded-xl bg-card px-4 py-4 shadow-card"
    >
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium">{event.title}</p>
        <p className="mt-0.5 text-sm text-muted-foreground">
          {formatDateRange(event.dates)} · {formatHour(event.startHour)}–{formatHour(event.endHour)}
        </p>
        <p className="mt-1 text-xs tabular-nums text-muted-foreground">
          {event.responseCount} {event.responseCount === 1 ? "person" : "people"}
        </p>
      </div>
      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
