import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
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
export const Route = createFileRoute("/login")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { redirect?: string; auth_error?: string } => ({
    redirect: safeRedirect(search.redirect),
    auth_error:
      typeof search.auth_error === "string" ? search.auth_error : undefined,
  }),
  head: () => privatePage("Log in", "/login"),
  component: LoginPage,
});
function LoginPage() {
  const { login } = useAuth();
  const { redirect, auth_error: authError } = Route.useSearch();
  const goOn = useRedirectAfterAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [serverError, setServerError] = useState(authError || "");
  const [busy, setBusy] = useState(false);
  const submitting = useRef(false);
  useEffect(() => {
    if (authError) {
      const url = new URL(window.location.href);
      url.searchParams.delete("auth_error");
      window.history.replaceState({}, "", url.pathname + url.search);
    }
  }, [authError]);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting.current) return;
    const next: Record<string, string> = {};
    if (identifier.trim().length < 3)
      next.identifier = "Enter your username or email.";
    if (!password) next.password = "Enter your password.";
    setErrors(next);
    setServerError("");
    if (Object.keys(next).length) {
      focusFirstError(next);
      return;
    }
    submitting.current = true;
    setBusy(true);
    try {
      await login(identifier.trim(), password);
      goOn(redirect);
    } catch (error) {
      setServerError(
        error instanceof Error
          ? error.message
          : "We couldn’t log you in. Please try again.",
      );
    } finally {
      submitting.current = false;
      setBusy(false);
    }
  };
  return (
    <AuthShell
      title="Welcome back."
      subtitle="Log in to pick up where you left off."
      footer={
        <>
          New to SportyPunter?{" "}
          <Link to="/signup" search={{ redirect }}>
            Create an account
          </Link>
        </>
      }
    >
      {serverError && <InlineError>{serverError}</InlineError>}
      <GoogleButton
        label="Continue with Google"
        returnTo={redirect ?? "/dashboard"}
        disabled={busy}
      />
      <form onSubmit={submit} noValidate aria-busy={busy}>
        <fieldset disabled={busy} className="form-fields">
          <Field
            id="identifier"
            label="Username or email"
            error={errors.identifier}
          >
            <input
              id="identifier"
              name="username"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setErrors((previous) => ({ ...previous, identifier: "" }));
              }}
              placeholder="Your username or email"
              autoComplete="username"
              autoCapitalize="none"
              aria-invalid={!!errors.identifier}
              aria-describedby={
                errors.identifier ? "identifier-hint" : undefined
              }
              className={inputClass}
            />
          </Field>
          <Field id="password" label="Password" error={errors.password}>
            <PasswordInput
              id="password"
              value={password}
              onChange={(value) => {
                setPassword(value);
                setErrors((previous) => ({ ...previous, password: "" }));
              }}
              placeholder="Your password"
              autoComplete="current-password"
              error={errors.password}
              describedBy={errors.password ? "password-hint" : undefined}
            />
          </Field>
          <Link
            to="/forgot-password"
            search={{ email: identifier.includes("@") ? identifier : "" }}
            className="forgot-link"
          >
            Forgot password?
          </Link>
          <button type="submit" disabled={busy} className="button primary">
            {busy ? (
              <>
                <Loader2 size={19} className="spin" /> Logging in…
              </>
            ) : (
              <>
                Log in <ArrowRight size={19} />
              </>
            )}
          </button>
        </fieldset>
      </form>
    </AuthShell>
  );
}
