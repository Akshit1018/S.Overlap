import { createFileRoute, Link } from "@tanstack/react-router";
import { GROK_PROVIDERS, authEnabled, signIn } from "@/lib/auth/client";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-6 py-10">
      <div className="flex flex-col items-start gap-4">
        <Logo />
        <h1 className="font-display text-3xl font-medium tracking-tight">
          Sign in to keep your polls
        </h1>
        <p className="text-sm text-muted-foreground">
          You can create and answer polls as a guest. Sign in if you want them
          tied to an account.
        </p>
      </div>

      {authEnabled ? (
        <div className="flex flex-col gap-3">
          {GROK_PROVIDERS.map((p) => (
            <Button
              key={p.providerId}
              type="button"
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => signIn(p.providerId, { callbackURL: "/mine" })}
            >
              Continue with {p.label}
            </Button>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">Sign-in is disabled.</p>
      )}

      <Link to="/" className="text-center text-sm text-muted-foreground underline-offset-4 hover:underline">
        Continue as guest
      </Link>
    </main>
  );
}
