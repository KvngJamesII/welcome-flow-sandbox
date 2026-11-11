import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { GoogleButton } from "@/components/google-button";
import { privatePage } from "@/lib/seo";
import { Frame, PrimaryButton, Wordmark } from "@/components/flow";

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>): { redirect?: string; auth_error?: string } => ({
    redirect: typeof search.redirect === "string" && search.redirect.startsWith("/") ? search.redirect : undefined,
    auth_error: typeof search.auth_error === "string" ? search.auth_error : undefined,
  }),
  head: () => privatePage("Log in", "/login"),
  component: LoginPage,
});

const input =
  "w-full rounded-xl border-2 border-border bg-surface px-4 py-3.5 text-base outline-none transition placeholder:text-muted-foreground/70 focus:border-primary";

function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (identifier.trim().length < 3) next.identifier = "Enter your username or email";
    if (password.length < 8) next.password = "Password must be at least 8 characters";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    try {
      await login(identifier.trim(), password);
      window.sessionStorage.setItem("sp_demo_username", identifier.trim());
      navigate({ to: "/start" });
    } catch (error) {
      setErrors({ form: error instanceof Error ? error.message : "Login failed" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Frame
      footer={
        <>
          New here?{" "}
          <Link to="/signup" search={{ redirect: undefined, ref: undefined, auth_error: undefined }} className="font-bold text-primary">
            Create an account
          </Link>
        </>
      }
    >
      <Wordmark />
      <h1 className="mt-8 font-display text-[34px] font-extrabold leading-[1.05] tracking-tight">
        Welcome back,
        <br />
        <span className="text-primary">punter.</span>
      </h1>
      <p className="mb-6 mt-3 text-base leading-relaxed text-muted-foreground">Pick up where you left off.</p>

      <GoogleButton label="Sign in with Google" returnTo="/start" />

      <form onSubmit={submit} className="space-y-4" noValidate>
        {errors.form && <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">{errors.form}</p>}
        <div>
          <label htmlFor="identifier" className="text-sm font-bold">Username or email</label>
          <input id="identifier" value={identifier} onChange={(e) => setIdentifier(e.target.value)} placeholder="yourname" autoComplete="username" autoCapitalize="none" className={`mt-2 ${input}`} />
          {errors.identifier && <p role="alert" className="mt-1.5 text-sm font-semibold text-destructive">{errors.identifier}</p>}
        </div>
        <div>
          <label htmlFor="password" className="flex items-center justify-between text-sm font-bold">
            Password
            <a href="#forgot" className="text-primary">Forgot?</a>
          </label>
          <div className="relative mt-2">
            <input id="password" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Your password" autoComplete="current-password" className={`${input} pr-14`} />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground">
              {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && <p role="alert" className="mt-1.5 text-sm font-semibold text-destructive">{errors.password}</p>}
        </div>
        <PrimaryButton type="submit" busy={busy}>Log in</PrimaryButton>
      </form>
    </Frame>
  );
       }
