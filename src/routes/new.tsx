import { createFileRoute, Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/app-header";
import { BottomNav } from "@/components/bottom-nav";
import { CreatePoll } from "@/components/create-poll";

export const Route = createFileRoute("/new")({ component: NewPoll });

function NewPoll() {
  return (
    <div className="min-h-dvh pb-24">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-4 pt-2">
        <div>
          <h1 className="font-display text-3xl font-medium tracking-tight">New poll</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Choose the window. Your group fills in the rest.
          </p>
        </div>
        <CreatePoll />
        <p className="text-center text-sm text-muted-foreground">
          Want to see it first?{" "}
          <Link to="/e/$eventId" params={{ eventId: "demo" }} className="text-primary underline-offset-4 hover:underline">
            Open the demo
          </Link>
        </p>
      </main>
      <BottomNav />
    </div>
  );
}
