import { Link } from "@tanstack/react-router";
import { ArrowLeft, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { BrandLogo } from "@/components/brand-logo";

export function Wordmark({ size = "md" }: { size?: "md" | "lg" }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 self-start">
      <BrandLogo className={size === "lg" ? "h-11 w-11 text-primary" : "h-9 w-9 text-primary"} />
      <span className={`font-display font-extrabold tracking-tight ${size === "lg" ? "text-2xl" : "text-xl"}`}>
        Sporty<span className="text-primary">Punter</span>
      </span>
    </Link>
  );
}

/** Page frame: phone-width column on a warm background, with a soft red corner block. */
export function Frame({ children, footer }: { children: ReactNode; footer?: ReactNode }) {
  return (
    <div className="relative min-h-[100dvh] overflow-hidden bg-background">
      <div className="pointer-events-none absolute -right-24 -top-24 h-72 w-72 rotate-12 rounded-[3rem] bg-primary/10" />
      <div className="pointer-events-none absolute -left-16 top-[38%] h-40 w-40 -rotate-12 rounded-[2rem] bg-primary/[0.06]" />
      <div className="relative mx-auto flex min-h-[100dvh] max-w-md flex-col px-5 pb-8 pt-7">
        {children}
        {footer && <div className="mt-auto pt-6 text-center text-sm text-muted-foreground">{footer}</div>}
      </div>
    </div>
  );
}

export function PrimaryButton({
  children,
  busy,
  disabled,
  onClick,
  type = "button",
}: {
  children: ReactNode;
  busy?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || busy}
      className="flex min-h-[54px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-base font-extrabold text-primary-foreground shadow-[0_6px_0_0_oklch(0.42_0.2_20)] transition active:translate-y-[3px] active:shadow-[0_3px_0_0_oklch(0.42_0.2_20)] disabled:opacity-60"
    >
      {busy ? <Loader2 className="h-5 w-5 animate-spin" /> : children}
    </button>
  );
}

export function BackButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Back"
      className="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-foreground transition active:scale-95"
    >
      <ArrowLeft className="h-5 w-5" />
    </button>
  );
}

/** Segmented progress: rectangles, not pills. */
export function Progress({ step, total }: { step: number; total: number }) {
  return (
    <div className="flex flex-1 gap-1.5" role="progressbar" aria-valuenow={step} aria-valuemax={total}>
      {Array.from({ length: total }).map((_, i) => (
        <span key={i} className={`h-1.5 flex-1 rounded-sm transition-colors duration-300 ${i < step ? "bg-primary" : "bg-border"}`} />
      ))}
    </div>
  );
}
