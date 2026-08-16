import type { ReactNode } from "react";
import { Logo } from "./logo";
import { AuthSlot } from "./auth-slot";
import { cn } from "@/lib/utils";

export function AppHeader({
  trailing,
  className,
}: {
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "safe-pt sticky top-0 z-30 flex items-center justify-between gap-3 bg-background/90 px-4 py-3 backdrop-blur-md",
        className,
      )}
    >
      <Logo />
      <div className="flex items-center gap-1">
        {trailing}
        <AuthSlot />
      </div>
    </header>
  );
}
