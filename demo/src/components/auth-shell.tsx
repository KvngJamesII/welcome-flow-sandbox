import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";

/**
 * Shared shell for the auth screens, so login and signup are visually identical
 * and the decorative background lives in one place.
 */
export function AuthShell({
 title,
 subtitle,
 children,
 footer,
}: {
 title: ReactNode;
 subtitle: string;
 children: ReactNode;
 footer: ReactNode;
}) {
 return (
 <div className="relative min-h-screen overflow-hidden bg-background">
 <div className="pointer-events-none absolute inset-0 -z-10">
 <div className="absolute -left-24 -top-40 h-96 w-96 rounded-full bg-primary/25 blur-3xl" />
 <div className="absolute -right-28 top-1/4 h-96 w-96 rounded-full bg-primary/15 blur-3xl" />
 <div
 className="absolute inset-0 text-primary opacity-[0.05]"
 style={{
 backgroundImage:
 "linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)",
 backgroundSize: "32px 32px",
 }}
 />
 </div>

 <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 pb-10 pt-8">
 <Link to="/" className="flex items-center gap-2.5 self-start">
 <BrandLogo className="h-9 w-9 text-primary" />
 <span className="font-display text-xl font-extrabold tracking-tight">
 Sporty<span className="text-primary">Punter</span>
 </span>
 </Link>

 <div className="mt-10">
 <h1 className="font-display text-[32px] font-extrabold leading-[1.08] tracking-tight">
 {title}
 </h1>
 <p className="mt-2.5 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>
 </div>

 <div className="mt-8">{children}</div>

 <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>
 </div>
 </div>
 );
}

/** Labelled input with inline error, used by both auth screens. */
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
 <div>
 <label htmlFor={id} className="flex items-baseline justify-between">
 <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
 {label}
 </span>
 {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
 </label>
 <div className="mt-2">{children}</div>
 {error && <p className="mt-1.5 text-xs font-semibold text-destructive">{error}</p>}
 </div>
 );
}

export const inputClass =
 "w-full rounded-xl border border-border bg-surface px-4 py-3.5 text-sm outline-none transition placeholder:text-muted-foreground/70 focus:border-primary";

/** Password field with a show/hide toggle. */
export function PasswordInput({
 id,
 value,
 onChange,
 placeholder,
 autoComplete,
}: {
 id: string;
 value: string;
 onChange: (value: string) => void;
 placeholder: string;
 autoComplete: string;
}) {
 const [visible, setVisible] = useState(false);
 return (
 <div className="relative">
 <input
 id={id}
 type={visible ? "text" : "password"}
 value={value}
 onChange={(event) => onChange(event.target.value)}
 placeholder={placeholder}
 autoComplete={autoComplete}
 className={`${inputClass} pr-12`}
 />
 <button
 type="button"
 onClick={() => setVisible((state) => !state)}
 aria-label={visible ? "Hide password" : "Show password"}
 className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-muted-foreground hover:bg-muted"
 >
 {visible ? <EyeOffIcon /> : <EyeIcon />}
 </button>
 </div>
 );
}

function EyeIcon() {
 return (
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
 <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" />
 <circle cx="12" cy="12" r="3" />
 </svg>
 );
}

function EyeOffIcon() {
 return (
 <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
 <path d="m3 3 18 18M10.6 10.6a3 3 0 0 0 4.2 4.2M9.4 5.4A9.9 9.9 0 0 1 12 5c6.4 0 10 7 10 7a17 17 0 0 1-2.2 3M6.2 6.2A17 17 0 0 0 2 12s3.6 7 10 7a9.9 9.9 0 0 0 2.6-.4" />
 </svg>
 );
}

export function useRedirectAfterAuth() {
 const navigate = useNavigate();
 return (redirect?: string) => {
 if (redirect) window.location.assign(redirect);
 else navigate({ to: "/dashboard" });
 };
}
