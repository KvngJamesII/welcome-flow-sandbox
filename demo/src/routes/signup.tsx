import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, ChevronDown, Eye, EyeOff, Gift, Loader2, X } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { captureReferralCode } from "@/lib/referral";
import { GoogleButton } from "@/components/google-button";
import { privatePage } from "@/lib/seo";
import { Frame, PrimaryButton, Wordmark } from "@/components/flow";

export const Route = createFileRoute("/signup")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { redirect?: string; ref?: string; auth_error?: string } => ({
    redirect: typeof search.redirect === "string" && search.redirect.startsWith("/") ? search.redirect : undefined,
    ref: typeof search.ref === "string" ? search.ref : undefined,
    auth_error: typeof search.auth_error === "string" ? search.auth_error : undefined,
  }),
  head: () => privatePage("Create account", "/signup"),
  component: SignupPage,
});

const input =
  "w-full rounded-xl border-2 border-border bg-surface px-4 py-3.5 text-base outline-none transition placeholder:text-muted-foreground/70 focus:border-primary";

function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const { auth_error: authError } = Route.useSearch();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [referral, setReferral] = useState("");
  const [refOpen, setRefOpen] = useState(false);
  const [fromLink, setFromLink] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | undefined>(authError);
  const [busy, setBusy] = useState(false);
  const [availability, setAvailability] = useState<"idle" | "checking" | "free" | "taken" | "bad">("idle");

  useEffect(() => {
    const code = captureReferralCode();
    if (code) {
      setReferral(code);
      setFromLink(true);
      setRefOpen(true);
    }
  }, []);

  useEffect(() => {
    if (authError) window.history.replaceState({}, "", window.location.pathname);
  }, [authError]);

  const clean = username.trim().toLowerCase();
  useEffect(() => {
    if (!clean) return setAvailability("idle");
    if (!/^[a-z0-9_]{3,20}$/.test(clean)) return setAvailability("bad");
    setAvailability("checking");
    const t = setTimeout(() => {
      api.checkUsername(clean).then((r) => setAvailability(r.available ? "free" : "taken")).catch(() => setAvailability("idle"));
    }, 400);
    return () => clearTimeout(t);
  }, [clean]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (!/^[a-z0-9_]{3,20}$/.test(clean)) next.username = "3-20 letters, numbers or underscores";
    if (availability === "taken") next.username = "That username is taken";
    if (!email.trim()) next.email = "Enter your email address";
    else if (!/^\S+@\S+\.\S+$/.test(email.trim())) next.email = "Enter a valid email";
    if (password.length < 8) next.password = "Use at least 8 characters";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setFormError(undefined);
    try {
      await signup({ username: clean, email: email.trim(), password, referralCode: referral.trim().toUpperCase() || undefined });
      window.sessionStorage.setItem("sp_demo_username", clean);
      navigate({ to: "/welcome" });
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Could not create your account");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Frame
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" search={{ redirect: undefined, auth_error: undefined }} className="font-bold text-primary">
            Log in
          </Link>
        </>
      }
    >
      <Wordmark />

      <h1 className="mt-8 font-display text-[34px] font-extrabold leading-[1.05] tracking-tight">
        Start punting
        <br />
        <span className="text-primary">smarter.</span>
      </h1>

      <div className="mt-5 flex items-center gap-3.5 rounded-2xl bg-primary p-4 text-primary-foreground animate-fade-up">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/20">
          <Gift className="h-6 w-6" />
        </span>
        <div>
          <p className="font-display text-base font-extrabold leading-tight">150 welcome credits</p>
          <p className="text-sm leading-snug text-white/85">Enough for your first booking code.</p>
        </div>
      </div>

      <div className="mt-6">
        <GoogleButton label="Sign up with Google" intent="signup" returnTo="/welcome" />
      </div>

      <form onSubmit={submit} className="space-y-4" noValidate>
        {formError && (
          <p role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
            {formError}
          </p>
        )}

        <div>
          <label htmlFor="username" className="flex items-center justify-between text-sm font-bold">
            Username
            <span className="text-xs font-semibold">
              {availability === "checking" && (
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> checking
                </span>
              )}
              {availability === "free" && (
                <span className="inline-flex items-center gap-1 text-success">
                  <Check className="h-3.5 w-3.5" /> available
                </span>
              )}
              {availability === "taken" && (
                <span className="inline-flex items-center gap-1 text-destructive">
                  <X className="h-3.5 w-3.5" /> taken
                </span>
              )}
            </span>
          </label>
          <input id="username" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="yourname" autoComplete="username" autoCapitalize="none" className={`mt-2 ${input}`} />
          {errors.username && <p role="alert" className="mt-1.5 text-sm font-semibold text-destructive">{errors.username}</p>}
        </div>

        <div>
          <label htmlFor="email" className="text-sm font-bold">Email</label>
          <input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" autoComplete="email" className={`mt-2 ${input}`} />
          {errors.email && <p role="alert" className="mt-1.5 text-sm font-semibold text-destructive">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="text-sm font-bold">Password</label>
          <div className="relative mt-2">
            <input id="password" type={show ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" autoComplete="new-password" className={`${input} pr-14`} />
            <button type="button" onClick={() => setShow((s) => !s)} aria-label={show ? "Hide password" : "Show password"} className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground">
              {show ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>
          {errors.password && <p role="alert" className="mt-1.5 text-sm font-semibold text-destructive">{errors.password}</p>}
        </div>

        <div>
          <button type="button" onClick={() => setRefOpen((o) => !o)} aria-expanded={refOpen} className="flex min-h-[44px] w-full items-center justify-between text-sm font-bold text-muted-foreground">
            Have a referral code?
            <ChevronDown className={`h-5 w-5 transition-transform ${refOpen ? "rotate-180" : ""}`} />
          </button>
          {refOpen && (
            <div className="animate-fade-up">
              <input id="referral" value={referral} onChange={(e) => { setReferral(e.target.value.toUpperCase()); setFromLink(false); }} placeholder="Enter your code" autoCapitalize="characters" autoComplete="off" spellCheck={false} aria-label="Referral code" className={input} />
              {fromLink && <p className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-success"><Check className="h-4 w-4" /> Applied from your invite link</p>}
            </div>
          )}
        </div>

        <PrimaryButton type="submit" busy={busy} disabled={availability === "taken"}>Create account</PrimaryButton>

        <p className="text-center text-xs leading-relaxed text-muted-foreground">
          18+ only. SportyPunter is an analysis tool, not a guarantee of winning. By continuing you accept our{" "}
          <a href="#terms" className="font-semibold underline">terms</a> and{" "}
          <a href="#privacy" className="font-semibold underline">privacy policy</a>.
        </p>
      </form>
    </Frame>
  );
}
