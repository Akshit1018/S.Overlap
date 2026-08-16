import { useEffect, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { CreatePoll } from "@/components/create-poll";
import { EventCard } from "@/components/event-card";
import { Button } from "@/components/ui/button";
import { getEventsByIds } from "@/lib/events.functions";
import { listCreated } from "@/lib/guest";
import type { EventSummary } from "@/lib/types";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const [recent, setRecent] = useState<EventSummary[]>([]);

  useEffect(() => {
    const ids = listCreated().map((item) => item.id);
    if (ids.length === 0) return;
    void getEventsByIds({ data: { ids } }).then(setRecent).catch(() => setRecent([]));
  }, []);

  return (
    <div className="min-h-dvh pb-24 md:pb-10">
      <AppHeader
        trailing={
          <Link
            to="/mine"
            className="hidden h-11 items-center px-3 text-sm font-medium text-muted-foreground hover:text-foreground md:inline-flex"
          >
            My polls
          </Link>
        }
      />

      <main className="mx-auto flex w-full max-w-5xl flex-col gap-10 px-4 pt-2 md:grid md:grid-cols-2 md:items-start md:gap-12 md:pt-8">
        <section className="flex flex-col gap-6">
          <div className="flex flex-col gap-3">
            <p className="text-xs font-medium uppercase tracking-widest text-primary">
              Group scheduling
            </p>
            <h1 className="font-display text-4xl font-medium leading-tight tracking-tight md:text-5xl">
              Find the hour that works for everyone.
            </h1>
            <p className="max-w-md text-base text-muted-foreground">
              Share a poll. People paint when they’re free. Overlap shows the
              slot the group can actually make.
            </p>
          </div>

          <div className="rounded-xl bg-card p-4 shadow-card md:p-6">
            <CreatePoll compact />
          </div>

          <Link to="/e/$eventId" params={{ eventId: "demo" }} className="block">
            <Button variant="outline" className="w-full">
              Open the demo poll
              <ArrowRight />
            </Button>
          </Link>
        </section>

        <section className="flex flex-col gap-6">
          <figure className="overflow-hidden rounded-xl shadow-card">
            <img
              src="/images/hero.jpg"
              alt="Brass desk clock on an open planner"
              className="aspect-4/3 w-full object-cover"
              crossOrigin="anonymous"
            />
          </figure>

          <ol className="grid gap-3">
            {[
              { n: "01", t: "Name the meeting", d: "Pick the days and the hours you’re willing to meet." },
              { n: "02", t: "Send the link", d: "No accounts required. People tap their free slots." },
              { n: "03", t: "Book the overlap", d: "The heatmap ranks times the whole group can make." },
            ].map((step) => (
              <li key={step.n} className="rounded-xl bg-card px-4 py-4 shadow-card">
                <p className="text-xs tabular-nums text-primary">{step.n}</p>
                <p className="mt-1 font-medium">{step.t}</p>
                <p className="mt-1 text-sm text-muted-foreground">{step.d}</p>
              </li>
            ))}
          </ol>

          {recent.length > 0 ? (
            <div className="flex flex-col gap-2">
              <h2 className="px-1 text-sm font-medium">Recently created</h2>
              {recent.slice(0, 3).map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          ) : null}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
