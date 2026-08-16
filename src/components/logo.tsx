import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";

export function Logo({ className, wordmark = true }: { className?: string; wordmark?: boolean }) {
  return (
    <Link
      to="/"
      className={cn("inline-flex items-center gap-2 text-foreground", className)}
    >
      <svg viewBox="0 0 32 32" className="size-7" aria-hidden="true">
        <rect x="4" y="7" width="15" height="15" rx="4.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="13" y="10" width="15" height="15" rx="4.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <rect x="13.5" y="10.5" width="5.5" height="11.5" rx="1" className="fill-primary/30" />
      </svg>
      {wordmark ? (
        <span className="font-display text-xl font-medium tracking-tight">Overlap</span>
      ) : (
        <span className="sr-only">Overlap</span>
      )}
    </Link>
  );
}
