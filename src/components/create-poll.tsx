import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { createEvent } from "@/lib/events.functions";
import { getGuestToken, rememberCreated } from "@/lib/guest";
import { detectTimezone, nextDays, upcomingWeekdays, weekendDates } from "@/lib/time";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { DateMultiPicker } from "./date-multi-picker";
import { cn } from "@/lib/utils";

const HOUR_OPTIONS = Array.from({ length: 24 }, (_, i) => i);

export function CreatePoll({ compact = false }: { compact?: boolean }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [dates, setDates] = useState<string[]>([]);
  const [startHour, setStartHour] = useState(9);
  const [endHour, setEndHour] = useState(17);
  const [slotMinutes, setSlotMinutes] = useState(30);
  const [hideResponses, setHideResponses] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setDates(upcomingWeekdays(5));
  }, []);

  async function submit() {
    if (dates.length === 0) {
      toast.error("Pick at least one day");
      return;
    }
    setBusy(true);
    try {
      const creatorToken = getGuestToken();
      const result = await createEvent({
        data: {
          title,
          timezone: detectTimezone(),
          dates,
          startHour,
          endHour,
          slotMinutes,
          hideResponses,
          creatorToken,
        },
      });
      rememberCreated(result.id, result.creatorToken);
      toast.success("Poll created");
      await navigate({ to: "/e/$eventId", params: { eventId: result.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create poll");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="title">What’s this for?</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Team offsite, dinner, 1:1…"
          autoComplete="off"
        />
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <Label>Which days?</Label>
          <span className="text-xs tabular-nums text-muted-foreground">
            {dates.length} selected
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Preset label="Weekdays" onClick={() => setDates(upcomingWeekdays(5))} />
          <Preset label="Next 7 days" onClick={() => setDates(nextDays(7))} />
          <Preset label="Weekend" onClick={() => setDates(weekendDates())} />
          <Preset label="Clear" onClick={() => setDates([])} />
        </div>
        <DateMultiPicker value={dates} onChange={setDates} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="start">From</Label>
          <HourSelect id="start" value={startHour} onChange={setStartHour} />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="end">To</Label>
          <HourSelect id="end" value={endHour} onChange={setEndHour} allowEnd />
        </div>
      </div>

      {!compact ? (
        <>
          <div className="flex flex-col gap-2">
            <Label>Slot size</Label>
            <div className="grid grid-cols-2 gap-2">
              {[30, 60].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSlotMinutes(n)}
                  className={cn(
                    "h-11 rounded-lg text-sm font-medium shadow-card transition-colors duration-150",
                    slotMinutes === n
                      ? "bg-primary text-primary-foreground"
                      : "bg-card text-foreground hover:bg-muted",
                  )}
                >
                  {n} min
                </button>
              ))}
            </div>
          </div>
          <label className="flex items-start gap-3 rounded-xl bg-card p-4 shadow-card">
            <input
              type="checkbox"
              checked={hideResponses}
              onChange={(e) => setHideResponses(e.target.checked)}
              className="mt-1 size-4 accent-primary"
            />
            <span>
              <span className="block text-sm font-medium">Hide names</span>
              <span className="text-sm text-muted-foreground">
                Only you see who said what. Everyone still sees the heatmap.
              </span>
            </span>
          </label>
        </>
      ) : null}

      <Button type="submit" size="lg" className="w-full" disabled={busy || dates.length === 0}>
        {busy ? "Creating…" : "Create poll"}
      </Button>
    </form>
  );
}

function Preset({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-9 rounded-full bg-secondary px-3 text-xs font-medium text-secondary-foreground"
    >
      {label}
    </button>
  );
}

function HourSelect({
  id,
  value,
  onChange,
  allowEnd,
}: {
  id: string;
  value: number;
  onChange: (v: number) => void;
  allowEnd?: boolean;
}) {
  const options = allowEnd ? [...HOUR_OPTIONS, 24] : HOUR_OPTIONS;
  return (
    <select
      id={id}
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className="h-12 w-full appearance-none rounded-lg bg-card px-3 text-base shadow-card outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
    >
      {options.map((h) => (
        <option key={h} value={h}>
          {h === 24
            ? "Midnight"
            : h === 0
              ? "12 AM"
              : h < 12
                ? `${h} AM`
                : h === 12
                  ? "12 PM"
                  : `${h - 12} PM`}
        </option>
      ))}
    </select>
  );
}
