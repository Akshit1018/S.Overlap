import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "muted",
  ...props
}: React.ComponentProps<"span"> & { tone?: "muted" | "primary" | "need" }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium tabular-nums",
        tone === "muted" && "bg-muted text-muted-foreground",
        tone === "primary" && "bg-primary/12 text-primary",
        tone === "need" && "bg-need/25 text-need-foreground",
        className,
      )}
      {...props}
    />
  );
}
