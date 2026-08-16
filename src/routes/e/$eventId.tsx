import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Copy, Pencil, Users } from "lucide-react";
import { toast } from "sonner";
import { AvailabilityGrid } from "@/components/availability-grid";
import { BestTimes } from "@/components/best-times";
import { ShareBar } from "@/components/share-bar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";
import { deleteEvent, duplicateEvent, getEvent, saveResponse } from "@/lib/events.functions";
import {
  forgetCreated,
  getGuestToken,
  getSavedName,
  listCreated,
  rememberCreated,
  rememberResponded,
  setSavedName,
} from "@/lib/guest";
import { bestWindows } from "@/lib/score";
import { detectTimezone, formatDateRange, formatHour } from "@/lib/time";
import type { EventWithResponses, SlotMark, SlotsMap } from "@/lib/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/e/$eventId")({
  loader: async ({ params }) => {
    return getEvent({ data: { id: params.eventId } });
  },
  component: EventPage,
});

function EventPage() {
  const loaded = Route.useLoaderData();
  const { eventId } = Route.useParams();
  const router = useRouter();
  const [event, setEvent] = useState<EventWithResponses | null>(loaded);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [paint, setPaint] = useState<SlotMark | "erase">("available");
  const [name, setName] = useState("");
  const [draft, setDraft] = useState<SlotsMap>({});
  const [saving, setSaving] = useState(false);
  const [guestToken, setGuestToken] = useState("");

  const [viewerTz, setViewerTz] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    const token = getGuestToken();
    setGuestToken(token);
    setName(getSavedName());
    setViewerTz(detectTimezone());
    setIsOwner(listCreated().some((item) => item.id === eventId));
    void getEvent({ data: { id: eventId, guestToken: token } }).then((next) => {
      if (!next) return;
      setEvent(next);
      const mine = next.responses.find((r) => r.guestToken === token);
      if (mine) {
        setDraft(mine.slots);
        setName(mine.name);
      }
    });
  }, [eventId]);

  const windows = useMemo(
    () =>
      event
        ? bestWindows(event.dates, event.startHour, event.endHour, event.slotMinutes, event.responses)
        : [],
    [event],
  );

  if (!event) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 px-6 text-center">
        <Logo />
        <h1 className="font-display text-2xl font-medium">Poll not found</h1>
        <p className="text-sm text-muted-foreground">This link may be wrong, or the poll was deleted.</p>
        <Button asChild>
          <Link to="/">Back home</Link>
        </Button>
      </main>
    );
  }

  function paintKeys(keys: string[], value: SlotMark | null) {
    setDraft((prev) => {
      const next = { ...prev };
      for (const key of keys) {
        if (value) next[key] = value;
        else delete next[key];
      }
      return next;
    });
  }

  async function save() {
    if (!name.trim()) {
      toast.error("Add your name so people know who you are");
      setMode("edit");
      return;
    }
    setSaving(true);
    try {
      await saveResponse({
        data: { eventId, guestToken, name: name.trim(), slots: draft },
      });
      setSavedName(name.trim());
      rememberResponded(eventId);
      const next = await getEvent({ data: { id: eventId, guestToken } });
      if (next) setEvent(next);
      setMode("view");
      toast.success("Availability saved");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save");
    } finally {
      setSaving(false);
    }
  }

  async function onDuplicate() {
    try {
      const result = await duplicateEvent({ data: { id: eventId, creatorToken: getGuestToken() } });
      rememberCreated(result.id, result.creatorToken);
      toast.success("Duplicated");
      await router.navigate({ to: "/e/$eventId", params: { eventId: result.id } });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not duplicate");
    }
  }

  async function onDelete() {
    if (!window.confirm("Delete this poll?")) return;
    const token = listCreated().find((item) => item.id === eventId)?.token;
    try {
      await deleteEvent({ data: { id: eventId, creatorToken: token } });
      forgetCreated(eventId);
      toast.success("Deleted");
      await router.navigate({ to: "/mine" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
    }
  }

  return (
    <div className="min-h-dvh pb-28">
      <header className="safe-pt sticky top-0 z-30 flex items-center gap-2 bg-background/90 px-3 py-2 backdrop-blur-md">
        <Link
          to="/"
          className="grid size-11 place-items-center rounded-lg text-foreground hover:bg-muted"
          aria-label="Home"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-display text-lg font-medium tracking-tight">{event.title}</h1>
          <p className="truncate text-xs text-muted-foreground">
            {formatDateRange(event.dates)} · {formatHour(event.startHour)}–{formatHour(event.endHour)}
          </p>
        </div>
        <button
          type="button"
          className="grid size-11 place-items-center rounded-lg hover:bg-muted"
          aria-label="Copy link"
          onClick={() => {
            void navigator.clipboard.writeText(window.location.href);
            toast.success("Link copied");
          }}
        >
          <Copy className="size-4" />
        </button>
      </header>

      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 pt-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="primary">
            <Users className="mr-1 size-3" />
            {event.responses.length} {event.responses.length === 1 ? "person" : "people"}
          </Badge>
          <Badge>{event.slotMinutes} min slots</Badge>
          <Badge>{event.timezone}</Badge>
          {viewerTz && viewerTz !== event.timezone ? <Badge tone="need">You: {viewerTz}</Badge> : null}
        </div>

        <ShareBar title={event.title} />

        <BestTimes windows={windows} total={event.responses.length} />

        {event.responses.length > 0 ? (
          <section>
            <h2 className="mb-2 px-1 text-sm font-medium">Who’s in</h2>
            <ul className="flex flex-wrap gap-2">
              {event.responses.map((r) => (
                <li
                  key={r.id}
                  className="inline-flex items-center gap-2 rounded-full bg-card px-2.5 py-1.5 text-sm shadow-card"
                >
                  <span
                    className="size-2.5 rounded-full"
                    style={{ backgroundColor: `hsl(${r.hue} 28% 38%)` }}
                  />
                  {r.name}
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <h2 className="px-1 text-sm font-medium">
              {mode === "edit" ? "Paint your times" : "Everyone’s availability"}
            </h2>
            <Button
              type="button"
              variant={mode === "edit" ? "secondary" : "outline"}
              size="sm"
              onClick={() => setMode((m) => (m === "edit" ? "view" : "edit"))}
            >
              <Pencil />
              {mode === "edit" ? "View heatmap" : "Add mine"}
            </Button>
          </div>

          {mode === "edit" ? (
            <div className="grid grid-cols-3 gap-2">
              {(
                [
                  ["available", "Available"],
                  ["if_needed", "If needed"],
                  ["erase", "Erase"],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setPaint(value)}
                  className={cn(
                    "h-11 rounded-lg text-sm font-medium shadow-card",
                    paint === value
                      ? value === "if_needed"
                        ? "bg-need text-need-foreground"
                        : value === "erase"
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-primary text-primary-foreground"
                      : "bg-card text-foreground",
                  )}
                >
                  {label}
                </button>
              ))}
            </div>
          ) : (
            <>
            <p className="px-1 text-xs text-muted-foreground">
              Darker green means more people are free. Tap a cell to see who.
            </p>
            <div className="flex items-center gap-3 px-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <span className="size-3 rounded-sm bg-card shadow-card" />
                None
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-3 rounded-sm bg-primary/30" />
                Some
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-3 rounded-sm bg-primary" />
                Most
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="size-3 rounded-sm bg-need/70" />
                If needed
              </span>
            </div>
            </>
          )}

          <AvailabilityGrid
            event={event}
            mode={mode}
            draft={mode === "edit" ? draft : {}}
            paint={paint}
            onPaint={paintKeys}
          />
        </section>

        {mode === "edit" ? (
          <div className="flex flex-col gap-3 rounded-xl bg-card p-4 shadow-card">
            <label className="flex flex-col gap-2">
              <span className="text-sm font-medium">Your name</span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Maya"
                autoComplete="name"
              />
            </label>
            <Button type="button" size="lg" disabled={saving} onClick={() => void save()}>
              {saving ? "Saving…" : "Save my availability"}
            </Button>
          </div>
        ) : null}

        {isOwner ? (
          <div className="flex gap-2 pb-4">
            <Button type="button" variant="outline" className="flex-1" onClick={() => void onDuplicate()}>
              Duplicate
            </Button>
            <Button type="button" variant="ghost" className="flex-1 text-destructive" onClick={() => void onDelete()}>
              Delete
            </Button>
          </div>
        ) : null}
      </main>

      {mode === "view" ? (
        <div className="safe-pb fixed inset-x-0 bottom-0 z-20 border-t border-border bg-card/95 px-4 py-3 backdrop-blur-md">
          <Button type="button" size="lg" className="w-full max-w-3xl mx-auto flex" onClick={() => setMode("edit")}>
            {Object.keys(draft).length > 0 ? "Edit my times" : "Add my availability"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
