import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Check, ChevronDown, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { captureReferralCode } from "@/lib/referral";
import {
  AuthShell,
  Field,
  PasswordInput,
  InlineError,
  inputClass,
  useRedirectAfterAuth,
  safeRedirect,
  focusFirstError,
} from "@/components/auth-shell";
import { GoogleButton } from "@/components/google-button";
import { privatePage } from "@/lib/seo";

export const Route = createFileRoute("/signup")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { redirect?: string; ref?: string; auth_error?: string } => ({
    redirect: safeRedirect(search.redirect),
    ref: typeof search.ref === "string" ? search.ref : undefined,
    auth_error:
      typeof search.auth_error === "string" ? search.auth_error : undefined,
  }),
  head: () => privatePage("Create account", "/signup"),
  component: SignupPage,
});

function SignupPage() {
  const { signup } = useAuth();
  const { redirect, auth_error: authError } = Route.useSearch();
  const goOn = useRedirectAfterAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [referralOpen, setReferralOpen] = useState(false);
  const [fromLink, setFromLink] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState(authError || "");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  const [availability, setAvailability] = useState<
    "idle" | "checking" | "free" | "taken" | "unavailable"
  >("idle");
  const clean = username.trim().toLowerCase();
  useEffect(() => {
    const code = captureReferralCode();
    if (code) {
      setReferralCode(code);
      setFromLink(true);
      setReferralOpen(true);
    }
  }, []);
  useEffect(() => {
    if (authError) {
      const url = new URL(window.location.href);
      url.searchParams.delete("auth_error");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [authError]);
  useEffect(() => {
    let active = true;
    if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
      setAvailability("idle");
      return;
    }
    setAvailability("checking");
    const timer = setTimeout(() => {
      api
        .checkUsername(clean)
        .then((result) => {
          if (active) setAvailability(result.available ? "free" : "taken");
        })
        .catch(() => {
          if (active) setAvailability("unavailable");
        });
    }, 400);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [clean]);
  const clearError = (key: string) =>
    setErrors((previous) => ({ ...previous, [key]: "" }));
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting.current) return;
    const next: Record<string, string> = {};
    if (!/^[a-z0-9_]{3,20}$/.test(clean))
      next.username = "Use 3–20 letters, numbers or underscores.";
    else if (availability === "taken")
      next.username = "That username is taken. Try another.";
    if (!/^\S+@\S+\.\S+$/.test(email.trim()))
      next.email = "Enter a valid email address.";
    if (password.length < 8)
      next.password = "Use at least 8 characters for your password.";
    setErrors(next);
    setServerError("");
    if (Object.keys(next).length) {
      focusFirstError(next);
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      await signup({
        username: clean,
        email: email.trim(),
        password,
        referralCode: referralCode.trim().toUpperCase() || undefined,
      });
      goOn(redirect ?? "/generate?starter=1");
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "We couldn’t create your account. Please try again.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };
  const usernameHint =
    availability === "checking" ? (
      <>
        <Loader2 className="spin" size={14} /> Checking availability…
      </>
    ) : availability === "free" ? (
      <>
        <Check size={16} className="success-icon" /> Username available
      </>
    ) : availability === "unavailable" ? (
      "We’ll check availability when you create your account."
    ) : (
      "3–20 letters, numbers or underscores."
    );
  return (
    <AuthShell
      signup
      title={
        <>
          Create your <br />
          account.
        </>
      }
      subtitle="Create an account to turn football analysis into a SportyBet booking code."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" search={{ redirect }}>
            Log in <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </>
      }
    >
      {serverError && <InlineError>{serverError}</InlineError>}
      <GoogleButton
        intent="signup"
        returnTo={redirect ?? "/generate?starter=1"}
        disabled={busy}
        referralCode={referralCode}
      />
      <form onSubmit={submit} noValidate aria-busy={busy}>
        <fieldset disabled={busy} className="form-fields">
          <Field
            id="username"
            label="Username"
            error={
              errors.username ||
              (availability === "taken"
                ? "That username is taken. Try another."
                : undefined)
            }
            hint={usernameHint}
          >
            <input
              id="username"
              name="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                clearError("username");
              }}
              placeholder="Choose a username"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              aria-describedby="username-hint"
              aria-invalid={!!errors.username || availability === "taken"}
              className={inputClass}
            />
          </Field>
          <Field id="email" label="Email address" error={errors.email}>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                clearError("email");
              }}
              placeholder="you@example.com"
              autoComplete="email"
              autoCapitalize="none"
              spellCheck={false}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? "email-hint" : undefined}
              className={inputClass}
            />
          </Field>
          <Field
            id="password"
            label="Password"
            error={errors.password}
            hint="At least 8 characters."
          >
            <PasswordInput
              id="password"
              value={password}
              onChange={(value) => {
                setPassword(value);
                clearError("password");
              }}
              placeholder="Create a password"
              autoComplete="new-password"
              error={errors.password}
              describedBy="password-hint"
            />
          </Field>
          <div className="referral-section">
            <button
              className="disclosure"
              type="button"
              aria-expanded={referralOpen}
              aria-controls="referral-field"
              onClick={() => setReferralOpen(!referralOpen)}
            >
              <span>
                Have a referral code? <span className="optional">Optional</span>
              </span>
              <ChevronDown
                size={18}
                className={referralOpen ? "rotated" : ""}
              />
            </button>
            {referralOpen && (
              <div id="referral-field">
                <Field
                  id="referral"
                  label="Referral code"
                  hint={
                    fromLink
                      ? "Added from your invite link. You can change it."
                      : "Enter the code shared with you."
                  }
                >
                  <input
                    id="referral"
                    name="referralCode"
                    value={referralCode}
                    onChange={(e) => {
                      setReferralCode(e.target.value.toUpperCase());
                      setFromLink(false);
                    }}
                    placeholder="Enter referral code"
                    autoCapitalize="characters"
                    autoComplete="off"
                    spellCheck={false}
                    aria-describedby="referral-hint"
                    className={inputClass}
                  />
                </Field>
              </div>
            )}
          </div>
          <button type="submit" className="button primary" disabled={busy}>
            {busy ? (
              <>
                <Loader2 size={19} className="spin" /> Creating your account…
              </>
            ) : (
              <>
                Create account <ArrowRight size={19} />
              </>
            )}
          </button>
        </fieldset>
      </form>
      <p className="terms-notice">
        By continuing, you confirm you’re 18+ and agree to our{" "}
        <Link to="/terms">Terms</Link> and{" "}
        <Link to="/privacy">Privacy Policy</Link>. SportyPunter provides
        analysis, not guaranteed wins.
      </p>
    </AuthShell>
  );
}
