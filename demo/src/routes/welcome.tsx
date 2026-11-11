import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Gift, Ticket } from "lucide-react";
import { BrandLogo } from "@/components/brand-logo";
import { privatePage } from "@/lib/seo";

export const Route = createFileRoute("/welcome")({
  head: () => privatePage("Welcome", "/welcome"),
  component: Welcome,
});

/** Full-screen splash shown right after the account is created. */
function Welcome() {
  const navigate = useNavigate();
  const [name, setName] = useState("punter");
  useEffect(() => {
    const n = window.sessionStorage.getItem("sp_demo_username");
    if (n) setName(n);
  }, []);

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-primary text-primary-foreground">
      <div className="pointer-events-none absolute -left-20 -top-20 h-72 w-72 rotate-12 rounded-[3rem] bg-white/10" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-80 w-80 -rotate-12 rounded-[3.5rem] bg-black/10" />

      <div className="relative mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 text-center">
        <div className="sp-pop relative flex h-28 w-28 items-center justify-center rounded-[1.75rem] bg-white shadow-[0_10px_0_0_rgba(0,0,0,0.18)]">
          <BrandLogo className="h-20 w-20 text-primary" />
          <span className="sp-badge absolute -bottom-3 -right-3 flex h-10 w-10 items-center justify-center rounded-xl bg-success text-white shadow-md">
            <Check className="h-6 w-6" strokeWidth={3} />
          </span>
        </div>

        <p className="sp-rise mt-10 text-base font-bold text-white/80" style={{ animationDelay: ".35s" }}>
          Account created
        </p>
        <h1 className="sp-rise mt-2 font-display text-[40px] font-extrabold leading-[1.05] tracking-tight" style={{ animationDelay: ".45s" }}>
          Welcome to
          <br />
          SportyPunter
        </h1>
        <p className="sp-rise mt-3 text-lg font-semibold text-white/90" style={{ animationDelay: ".6s" }}>
          Good to have you, {name}.
        </p>

        <div className="sp-rise mt-9 flex w-full items-center gap-4 rounded-2xl bg-white p-4 text-left text-foreground" style={{ animationDelay: ".8s" }}>
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Gift className="h-6 w-6" />
          </span>
          <div>
            <p className="font-display text-lg font-extrabold leading-tight">150 credits are ready</p>
            <p className="text-sm text-muted-foreground">They cover your first booking code.</p>
          </div>
        </div>
      </div>

      <div className="sp-rise relative mx-auto w-full max-w-md px-6 pb-8" style={{ animationDelay: "1s" }}>
        <button
          type="button"
          onClick={() => navigate({ to: "/start" })}
          className="flex min-h-[56px] w-full items-center justify-center gap-2 rounded-xl bg-white px-5 text-base font-extrabold text-primary shadow-[0_6px_0_0_rgba(0,0,0,0.2)] transition active:translate-y-[3px] active:shadow-[0_3px_0_0_rgba(0,0,0,0.2)]"
        >
          <Ticket className="h-5 w-5" /> Get my first code <ArrowRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}
