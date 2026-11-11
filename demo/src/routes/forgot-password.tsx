import { createFileRoute, Link } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import {
  BrandHeader,
  Field,
  InlineError,
  inputClass,
} from "@/components/auth-shell";
import { delay, demoFailure } from "@/lib/demo-state";
export const Route = createFileRoute("/forgot-password")({
  validateSearch: (search: Record<string, unknown>) => ({
    email: typeof search.email === "string" ? search.email : "",
  }),
  component: ForgotPassword,
});
function ForgotPassword() {
  const search = Route.useSearch();
  const [email, setEmail] = useState(search.email);
  const [error, setError] = useState("");
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const submitting = useRef(false);
  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (submitting.current) return;
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      document.getElementById("email")?.focus();
      return;
    }
    setError("");
    setServerError("");
    setBusy(true);
    submitting.current = true;
    await delay(850);
    if (demoFailure("reset"))
      setServerError("We couldn’t send the reset link. Please try again.");
    else setSent(true);
    setBusy(false);
    submitting.current = false;
  };
  return (
    <div className="site-shell">
      <BrandHeader />
      <main id="main" className="simple-page">
        {sent ? (
          <>
            <span className="state-icon">
              <Check size={24} />
            </span>
            <h1>Check your email.</h1>
            <p role="status">
              If an account exists for <strong>{email}</strong>, you’ll receive
              a password reset link.
            </p>
            <p className="demo-note">Demo only. No email has been sent.</p>
            <button className="text-action" onClick={() => setSent(false)}>
              Use another email or try again
            </button>
          </>
        ) : (
          <>
            <p className="eyebrow">Account help</p>
            <h1>Forgot your password?</h1>
            <p>Enter the email you used to create your account.</p>
            {serverError && <InlineError>{serverError}</InlineError>}
            <form onSubmit={submit} noValidate>
              <fieldset className="form-fields" disabled={busy}>
                <Field id="email" label="Email address" error={error}>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(event) => {
                      setEmail(event.target.value);
                      setError("");
                    }}
                    placeholder="you@example.com"
                    className={inputClass}
                    aria-invalid={!!error}
                    aria-describedby={error ? "email-hint" : undefined}
                  />
                </Field>
                <button className="button primary" disabled={busy}>
                  {busy ? (
                    <>
                      <Loader2 className="spin" size={18} /> Sending reset link…
                    </>
                  ) : (
                    "Send reset link"
                  )}
                </button>
              </fieldset>
            </form>
          </>
        )}
        <div className="center-action">
          <Link to="/login" className="text-action">
            <ArrowLeft size={16} /> Back to log in
          </Link>
        </div>
      </main>
    </div>
  );
}
