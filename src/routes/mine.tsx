import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { getEventsByIds, listMyEvents } from "@/lib/events.functions";
import { listCreated, listResponded } from "@/lib/guest";
import type { EventSummary } from "@/lib/types";

export const Route = createFileRoute("/mine")({ component: Mine });

function Mine() {
  const { user, isPending } = useCurrentUserState();
  const [created, setCreated] = useState<EventSummary[]>([]);
  const [responded, setResponded] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const localCreated = listCreated().map((item) => item.id);
      const localResponded = listResponded().map((item) => item.id);
      try {
        const [owned, fromCreated, fromResponded] = await Promise.all([
          user
            ? listMyEvents().catch(() => [] as EventSummary[])
            : Promise.resolve([] as EventSummary[]),
          getEventsByIds({ data: { ids: localCreated } }),
          getEventsByIds({ data: { ids: localResponded } }),
        ]);
        if (cancelled) return;
        const ownedIds = new Set(owned.map((e) => e.id));
        const mergedCreated = [
          ...owned,
          ...fromCreated.filter((e) => !ownedIds.has(e.id)),
        ];
        const createdIds = new Set(mergedCreated.map((e) => e.id));
        setCreated(mergedCreated);
        setResponded(fromResponded.filter((e) => !createdIds.has(e.id)));
      } catch {
        if (!cancelled) {
          setCreated([]);
          setResponded([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    if (!isPending) void load();
    return () => {
      cancelled = true;
    };
  }, [user, isPending]);

  return (
    <div className="min-h-dvh pb-24">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-lg flex-col gap-8 px-4 pt-2">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">Your polls</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Created on this device{user ? ", plus anything on your account" : ""}.
          </p>
        </div>

        {loading || isPending ? (
          <div className="flex flex-col gap-2">
            <div className="h-20 animate-pulse rounded-xl bg-muted" />
            <div className="h-20 animate-pulse rounded-xl bg-muted" />
          </div>
        ) : created.length === 0 && responded.length === 0 ? (
          <div className="overflow-hidden rounded-xl bg-card shadow-card">
            <img
              src="/images/empty.jpg"
              alt=""
              className="aspect-4/3 w-full object-cover"
              crossOrigin="anonymous"
            />
            <div className="px-5 py-5">
              <p className="font-medium">Nothing here yet</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Create a poll, or mark your times on one someone sent you.
              </p>
              <Button asChild className="mt-4 w-full">
                <Link to="/new">Create a poll</Link>
              </Button>
            </div>
          </div>
        ) : (
          <>
            {created.length > 0 ? (
              <section className="flex flex-col gap-2">
                <h2 className="px-1 text-sm font-medium">Created</h2>
                {created.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </section>
            ) : null}
            {responded.length > 0 ? (
              <section className="flex flex-col gap-2">
                <h2 className="px-1 text-sm font-medium">Responded</h2>
                {responded.map((event) => (
                  <EventCard key={event.id} event={event} />
                ))}
              </section>
            ) : null}
          </>
        )}
      </main>
      <BottomNav />
    </div>
  );
}
