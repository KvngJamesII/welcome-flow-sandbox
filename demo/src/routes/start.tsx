import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CalendarDays, Check, ChevronDown, Copy, Gauge, Rocket, Shield, Target, Zap, type LucideIcon } from "lucide-react";
import { privatePage } from "@/lib/seo";
import { BackButton, Frame, PrimaryButton, Progress } from "@/components/flow";

export const Route = createFileRoute("/start")({
  head: () => privatePage("Your first code", "/start"),
  component: Start,
});

type Option = { key: string; label: string; hint: string; icon: LucideIcon };

const WINDOWS: Option[] = [
  { key: "today", label: "Today's games", hint: "Kicking off in the next 24 hours", icon: CalendarDays },
  { key: "longshot", label: "Longshot", hint: "Anything in the next 7 days", icon: Target },
];
const RISK: Option[] = [
  { key: "safe", label: "Play Safe", hint: "Picks the model rates most likely", icon: Shield },
  { key: "risk", label: "Analysed Risk", hint: "Bolder picks, backed by stats", icon: Zap },
];
const ODDS: Option[] = [
  { key: "2-5", label: "2 - 5", hint: "Small, steady slip", icon: Gauge },
  { key: "5-10", label: "5 - 10", hint: "A step up", icon: Gauge },
  { key: "10-30", label: "10 - 30", hint: "Bigger swing", icon: Gauge },
  { key: "30+", label: "30 and above", hint: "Long shot", icon: Rocket },
];

const STEPS = [
  { title: "When are you playing?", sub: "Choose which matches go on your slip.", options: WINDOWS, detail: undefined },
  {
    title: "How do you want to play?",
    sub: "You can change this any time.",
    options: RISK,
    detail: "Play Safe leans on the picks the model rates most likely. Analysed Risk accepts less certain picks when the stats back them, so slips can pay more and miss more.",
  },
  { title: "Pick your target odds", sub: "Higher odds mean more legs and more risk.", options: ODDS, detail: undefined },
] as const;

const BUILD_LINES = ["Reading today's fixtures", "Checking team form", "Building your slip", "Booking your code"];
const SAMPLE_PICKS = ["Sample pick: Home win", "Sample pick: Over 1.5 goals", "Sample pick: Both teams to score"];

function Start() {
  const [step, setStep] = useState(0);
  const [choice, setChoice] = useState<string[]>(["today", "safe", "2-5"]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [phase, setPhase] = useState<"pick" | "build" | "done">("pick");
  const [line, setLine] = useState(0);
  const [copied, setCopied] = useState(false);
  const [picksOpen, setPicksOpen] = useState(false);

  useEffect(() => {
    if (phase !== "build") return;
    setLine(0);
    const timers = BUILD_LINES.map((_, i) => setTimeout(() => setLine(i), i * 1100));
    const done = setTimeout(() => setPhase("done"), BUILD_LINES.length * 1100 + 300);
    return () => [...timers, done].forEach(clearTimeout);
  }, [phase]);

  const goBack = () => {
    setDetailOpen(false);
    setStep((s) => Math.max(0, s - 1));
  };
  const next = () => {
    setDetailOpen(false);
    if (step < 2) setStep(step + 1);
    else setPhase("build");
  };
  const restart = () => {
    setPhase("pick");
    setStep(0);
    setCopied(false);
    setPicksOpen(false);
  };

  if (phase === "build") {
    return (
      <Frame>
        <div className="flex flex-1 flex-col items-center justify-center text-center">
          <div className="relative h-24 w-24">
            <span className="absolute inset-0 animate-ping rounded-3xl bg-primary/20" />
            <span className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-primary text-primary-foreground">
              <Target className="h-11 w-11 animate-spin [animation-duration:3s]" />
            </span>
          </div>
          <h1 className="mt-8 font-display text-2xl font-extrabold tracking-tight">Building your code</h1>
          <p key={line} className="sp-rise mt-2 min-h-[1.5rem] text-base font-semibold text-muted-foreground">{BUILD_LINES[line]}</p>
          <div className="mt-6 h-2 w-56 overflow-hidden rounded-sm bg-border">
            <div className="h-full origin-left rounded-sm bg-primary" style={{ animation: `sp-bar ${BUILD_LINES.length * 1.1}s linear both` }} />
          </div>
        </div>
      </Frame>
    );
  }

  if (phase === "done") {
    return (
      <Frame>
        <div className="mt-6 flex flex-1 flex-col">
          <div className="sp-pop flex h-16 w-16 items-center justify-center rounded-2xl bg-success text-white">
            <Check className="h-9 w-9" strokeWidth={3} />
          </div>
          <h1 className="sp-rise mt-6 font-display text-[32px] font-extrabold leading-[1.08] tracking-tight">Your booking code is ready</h1>
          <p className="sp-rise mt-2 text-base text-muted-foreground" style={{ animationDelay: ".1s" }}>Paste it into SportyBet to load your slip.</p>

          <div className="sp-rise mt-6 rounded-2xl border-2 border-primary bg-surface p-5 text-center" style={{ animationDelay: ".2s" }}>
            <p className="text-sm font-bold text-muted-foreground">Booking code</p>
            <p className="mt-1 font-display text-5xl font-extrabold tracking-wider text-primary">SAMPLE1</p>
            <p className="mt-2 text-xs text-muted-foreground">Demo preview. This is a placeholder, not a real code.</p>
          </div>

          <div className="mt-4">
            <button type="button" onClick={() => setPicksOpen((o) => !o)} aria-expanded={picksOpen} className="flex min-h-[48px] w-full items-center justify-between rounded-xl px-1 text-sm font-bold">
              See the picks on this slip
              <ChevronDown className={`h-5 w-5 transition-transform ${picksOpen ? "rotate-180" : ""}`} />
            </button>
            {picksOpen && (
              <ul className="animate-fade-up space-y-2">
                {SAMPLE_PICKS.map((p) => (
                  <li key={p} className="flex items-center gap-3 rounded-xl border border-border bg-surface px-4 py-3 text-sm font-semibold">
                    <Check className="h-4 w-4 text-success" /> {p}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-auto space-y-3 pt-8">
            <PrimaryButton
              onClick={() => {
                navigator.clipboard?.writeText("SAMPLE1").catch(() => {});
                setCopied(true);
              }}
            >
              {copied ? <><Check className="h-5 w-5" /> Copied</> : <><Copy className="h-5 w-5" /> Copy booking code</>}
            </PrimaryButton>
            <button type="button" onClick={restart} className="min-h-[48px] w-full text-sm font-bold text-muted-foreground">
              Start over
            </button>
          </div>
        </div>
      </Frame>
    );
  }

  const s = STEPS[step];
  const value = choice[step];
  return (
    <Frame>
      <div className="flex items-center gap-4">
        {step > 0 ? <BackButton onClick={goBack} /> : <span className="h-11 w-11" />}
        <Progress step={step + 1} total={3} />
        <span className="w-8 text-right text-sm font-bold text-muted-foreground">{step + 1}/3</span>
      </div>

      <div key={step} className="sp-rise mt-8 flex flex-1 flex-col">
        <h1 className="font-display text-[32px] font-extrabold leading-[1.08] tracking-tight">{s.title}</h1>
        <p className="mt-2 text-base text-muted-foreground">{s.sub}</p>

        <div className="mt-6 space-y-3" role="radiogroup" aria-label={s.title}>
          {s.options.map((o) => {
            const active = value === o.key;
            const Icon = o.icon;
            return (
              <button
                key={o.key}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setChoice((c) => c.map((v, i) => (i === step ? o.key : v)))}
                className={`flex min-h-[72px] w-full items-center gap-4 rounded-2xl border-2 px-4 py-3 text-left transition active:scale-[0.99] ${active ? "border-primary bg-primary/[0.07]" : "border-border bg-surface"}`}
              >
                <span className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl transition ${active ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  <Icon className="h-6 w-6" />
                </span>
                <span className="flex-1">
                  <span className="block font-display text-lg font-extrabold leading-tight">{o.label}</span>
                  <span className="mt-0.5 block text-sm text-muted-foreground">{o.hint}</span>
                </span>
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border-2 transition ${active ? "border-primary bg-primary text-primary-foreground" : "border-border"}`}>
                  {active && <Check className="h-4 w-4" strokeWidth={3} />}
                </span>
              </button>
            );
          })}
        </div>

        {s.detail && (
          <div className="mt-3">
            <button type="button" onClick={() => setDetailOpen((o) => !o)} aria-expanded={detailOpen} className="flex min-h-[44px] items-center gap-1 text-sm font-bold text-primary">
              What is the difference?
              <ChevronDown className={`h-4 w-4 transition-transform ${detailOpen ? "rotate-180" : ""}`} />
            </button>
            {detailOpen && <p className="animate-fade-up rounded-xl bg-muted px-4 py-3 text-sm leading-relaxed">{s.detail}</p>}
          </div>
        )}

        <div className="mt-auto pt-8">
          <PrimaryButton onClick={next}>{step < 2 ? "Continue" : "Build my code"}</PrimaryButton>
          {step === 2 && <p className="mt-3 text-center text-sm text-muted-foreground">Uses your welcome credits.</p>}
        </div>
      </div>
    </Frame>
  );
                                             }
