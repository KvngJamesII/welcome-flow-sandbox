import { Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { AlertCircle, Check, Eye, EyeOff, Gift } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";

export function BrandHeader() {
  return (
    <header className="brand-header">
      <Link to="/" className="brand" aria-label="SportyPunter home">
        <BrandLogo className="brand-mark" />
        <span>
          Sporty<span className="brand-red">Punter</span>
        </span>
      </Link>
      <span className="age-label">18+ only</span>
    </header>
  );
}

export function FlowSteps({ current = 1 }: { current?: number }) {
  return (
    <ol className="flow-steps" aria-label="Getting started">
      {["Your account", "Your first code"].map((label, i) => (
        <li
          key={label}
          aria-current={current === i + 1 ? "step" : undefined}
          className={current >= i + 1 ? "active" : ""}
        >
          <span className="step-number">
            {current > i + 1 ? <Check size={14} /> : i + 1}
          </span>
          <span>{label}</span>
        </li>
      ))}
    </ol>
  );
}

export function WelcomeCredits() {
  return (
    <div className="welcome-credit">
      <Gift size={22} aria-hidden="true" />
      <div>
        <strong>150 credits to get you started</strong>
        <p>Enough for your first Today booking code.</p>
      </div>
    </div>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  signup = false,
}: {
  title: ReactNode;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
  signup?: boolean;
}) {
  return (
    <div className="site-shell">
      <BrandHeader />
      <main id="main" className={`auth-layout ${signup ? "" : "login-layout"}`}>
        <div className="auth-intro">
          {signup && <FlowSteps />}
          <div className="intro-copy">
            <p className="eyebrow">
              {signup ? "Welcome to SportyPunter" : "Your SportyPunter account"}
            </p>
            <h1>{title}</h1>
            <p className="subtitle">{subtitle}</p>
          </div>
          {signup && <WelcomeCredits />}
        </div>
        <section
          className="auth-panel"
          aria-label={signup ? "Create your account" : "Log in"}
        >
          {children}
          <div className="auth-footer">{footer}</div>
        </section>
      </main>
      <footer className="site-footer">
        Only bet what you can afford to lose.
      </footer>
    </div>
  );
}

export function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: ReactNode;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children}
      {(hint || error) && (
        <p
          id={`${id}-hint`}
          className={`field-hint ${error ? "field-error" : ""}`}
          aria-live="polite"
        >
          {error || hint}
        </p>
      )}
    </div>
  );
}
export const inputClass = "text-input";

export function PasswordInput({
  id,
  value,
  onChange,
  placeholder,
  autoComplete,
  error,
  describedBy,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  autoComplete: string;
  error?: string;
  describedBy?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="password-wrap">
      <input
        id={id}
        name="password"
        type={visible ? "text" : "password"}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className={inputClass}
      />
      <button
        type="button"
        onClick={() => setVisible((state) => !state)}
        aria-label={visible ? "Hide password" : "Show password"}
        aria-pressed={visible}
        className="password-toggle"
      >
        {visible ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
    </div>
  );
}

export function InlineError({ children }: { children: ReactNode }) {
  const alert = useRef<HTMLDivElement>(null);
  useEffect(() => {
    alert.current?.focus();
  }, [children]);
  return (
    <div ref={alert} tabIndex={-1} className="inline-error" role="alert">
      <AlertCircle size={20} aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

export function safeRedirect(value: unknown): string | undefined {
  return typeof value === "string" &&
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !/[\\\u0000-\u001f]/.test(value)
    ? value
    : undefined;
}
export function useRedirectAfterAuth() {
  const navigate = useNavigate();
  return (redirect?: string) => {
    const destination = safeRedirect(redirect);
    if (destination) window.location.assign(destination);
    else navigate({ to: "/dashboard" });
  };
}
export function focusFirstError(errors: Record<string, string>) {
  const id = Object.keys(errors)[0];
  if (id) requestAnimationFrame(() => document.getElementById(id)?.focus());
}
