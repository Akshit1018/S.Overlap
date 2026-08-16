import { Link } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { UserButton } from "@/lib/auth/gates";

export function AuthSlot() {
  const { user, isPending } = useCurrentUserState();
  if (isPending) {
    return <div className="size-9 animate-pulse rounded-full bg-muted" />;
  }
  if (user) {
    return (
      <div className="max-w-40 truncate [&_span]:text-sm">
        <UserButton />
      </div>
    );
  }
  return (
    <Link
      to="/login"
      className="inline-flex h-11 items-center rounded-lg px-3 text-sm font-medium text-foreground hover:bg-muted"
    >
      Sign in
    </Link>
  );
}
