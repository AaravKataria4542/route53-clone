import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { getMockSession, signInMock } from "@/lib/mockAuth";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Route 53 Console" },
      { name: "description", content: "Sign in to the Route 53 management console." },
    ],
  }),
  component: AuthPage,
});

const schema = z.object({
  email: z.string().trim().email("Enter a valid email"),
  password: z.string().min(6, "Password must be at least 6 characters").max(72),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
    if (getMockSession()) navigate({ to: "/console/route53", replace: true });
  }, [navigate]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      signInMock(parsed.data.email);
      toast.success(mode === "signin" ? "Signed in" : "Account created");
      navigate({ to: "/console/route53", replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }

  function useDemoAccount() {
    setLoading(true);
    signInMock("demo@route53.local");
    toast.success("Signed in with demo account");
    navigate({ to: "/console/route53", replace: true });
  }

  return (
    <div className="min-h-screen flex flex-col bg-aws-surface">
      {/* AWS top bar */}
      <header className="h-10 bg-aws-nav text-aws-nav-foreground flex items-center px-4 text-[13px]">
        <span className="font-semibold tracking-tight">
          <span className="text-aws-orange">aws</span>
        </span>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[420px]">
          <div className="bg-aws-panel border border-border rounded-sm shadow-sm">
            <div className="px-6 pt-6 pb-2">
              <h1 className="text-[20px] font-bold text-foreground leading-tight">
                Sign in
              </h1>
              <p className="text-[13px] text-muted-foreground mt-1">
                {mode === "signin"
                  ? "Sign in to access the Route 53 console."
                  : "Create an account to manage hosted zones."}
              </p>
            </div>

            <form onSubmit={onSubmit} className="px-6 py-4 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-[13px] font-bold">
                  Root user email address
                </Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="username@example.com"
                  className="h-9 rounded-sm"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-[13px] font-bold">
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  autoComplete={mode === "signin" ? "current-password" : "new-password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-9 rounded-sm"
                />
              </div>

              <Button
                type="submit"
                disabled={loading || !ready}
                variant="aws"
                className="w-full h-9"
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {mode === "signin" ? "Sign in" : "Create account"}
              </Button>
              <Button
                type="button"
                disabled={loading || !ready}
                variant="aws-secondary"
                className="w-full h-9"
                onClick={useDemoAccount}
              >
                Continue with demo account
              </Button>
            </form>

            <div className="px-6 py-4 border-t border-border text-[13px] text-center">
              {mode === "signin" ? (
                <>
                  New to Route 53?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signup")}
                    className="text-aws-link hover:underline font-medium"
                  >
                    Create an account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    onClick={() => setMode("signin")}
                    className="text-aws-link hover:underline font-medium"
                  >
                    Sign in
                  </button>
                </>
              )}
            </div>
          </div>

          <p className="mt-6 text-center text-[12px] text-muted-foreground">
            By continuing, you agree to the mock AWS Customer Agreement.{" "}
            <Link to="/auth" className="text-aws-link hover:underline">
              Terms
            </Link>
          </p>
        </div>
      </main>

      <footer className="text-[12px] text-muted-foreground text-center py-4 border-t border-border">
        © 2026, Route 53 Clone. All rights reserved.
      </footer>
    </div>
  );
}
