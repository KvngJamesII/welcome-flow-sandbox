import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Loader2, Shield, Target, Ticket, Zap } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
  api,
  type GameWindow,
  type OddsChoice,
  type PredictionResult,
  type PuntingType,
} from "@/lib/api";
// Aliased: the DOM has its own global ProgressEvent, and an unaliased import here
// silently resolves to that one inside JSX prop positions.
import type { ProgressEvent as PipelineProgress } from "@/lib/stream";
import { AppPage } from "@/components/app-page";
import { Coin, CreditAmount } from "@/components/coin";
import { LeagueStrip } from "@/components/league-badge";
import { lockedToast } from "@/components/locked-toast";
import { ShortfallPrompt } from "@/components/shortfall-prompt";
import { useJobRun } from "@/lib/use-job-run";
import { ConvertRow, useAutoConvert } from "@/components/convert-row";
import { track } from "@/lib/analytics";
import { Choice, Step, StepActions, type StepState } from "@/components/stepper";
import { PredictionPanel } from "@/components/prediction-parts";
import { privatePage } from "@/lib/seo";

export const Route = createFileRoute("/generate")({
  head: () => privatePage("Book Game", "/generate"),
  component: BookGamePage,
  errorComponent: GenerateError,
});

function GenerateError({ error, reset }: { error: Error; reset: () => void }) {
  return (
    <AppPage eyebrow="Error" title="Generation Failed" description="The prediction engine encountered an unexpected error.">
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-6 text-destructive">
        <h3 className="font-bold">Error</h3>
        <p className="mt-2 text-sm">{error.message || "Unknown error occurred."}</p>
        <button onClick={reset} className="mt-4 rounded-lg bg-destructive px-4 py-2 text-sm font-bold text-destructive-foreground">Try again</button>
      </div>
    </AppPage>
  );
}

const WINDOWS: { key: GameWindow; label: string; hint: string; icon: typeof CalendarDays }[] = [
  {
    key: "today",
    label: "Today's games",
    hint: "Kicking off in the next 24 hours",
    icon: CalendarDays,
  },
  { key: "longshot", label: "Longshot", hint: "Anything in the next 7 days", icon: Target },
];

const RISK: { key: PuntingType; label: string; hint: string; icon: typeof Shield }[] = [
  { key: "safe", label: "Play Safe", hint: "80% Probability", icon: Shield },
  { key: "risk", label: "Analysed Risk", hint: "50% Probability But Backed by stats", icon: Zap },
];

/** Toast when a band (or custom target) sits above what the window can support. */
function reachabilityToast(
  _matchCount: number,
  _windowKey: GameWindow,
  _target: number,
  _puntingType?: PuntingType | null,
) {
  // Michael 2026-10-22: one lock message, his exact wording, for every locked range.
  toast.message("The games left today cannot reach this odds");
}

function BookGamePage() {
  const { user, setUser } = useAuth();
  const queryClient = useQueryClient();
  const { data: planData } = useQuery({ queryKey: ["plan"], queryFn: api.plan, enabled: !!user });
  const plan = planData?.plan;

  // Step order: 1 duration, 2 odds, 3 risk.
  const [step, setStep] = useState(() => typeof window !== "undefined" && new URLSearchParams(window.location.search).get("starter") === "1" ? 3 : 1);
  // Which step body is showing. Follows `step` unless the punter opens another
  // one by hand with its chevron.
  const starter = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("starter") === "1";
  const [openStep, setOpenStep] = useState<number | null>(starter ? 3 : null);
  const [windowKey, setWindowKey] = useState<GameWindow | null>(starter ? "today" : null);
  const [band, setBand] = useState<OddsChoice | null>(starter ? "2-5" : null);
  // Typed target, only reachable on Lite/Pro. Held as a string so the field can
  // be empty while typing rather than snapping back to a number.
  const [customOdds, setCustomOdds] = useState("");
  const [risk, setRisk] = useState<PuntingType | null>(starter ? "safe" : null);

  // Until a risk level is chosen, check against Analysed Risk so no band is
  // locked early; once a risk level is picked, recompute for it.
  const reachPunting: PuntingType = risk ?? "risk";
  const checkingAvailability = false; // v3: no pre-booking refetch any more
  // Spinner on Book game from the click until the progress panel (or an error) shows.
  const [bookPending, setBookPending] = useState(false);
  const [availabilityNote, setAvailabilityNote] = useState("");
  // v3: only a real lock uses lock wording (and the "Open now" list).
  const [noteIsLock, setNoteIsLock] = useState(false);
  // v3 (QA): one availability snapshot per open of this page. Badges, the lock note and the
  // pre-booking check all read it; it is refreshed only after a booking finishes (or fails on a
  // lock), never on focus or mid-booking, so the screen cannot contradict itself.
  const [openId] = useState(() => Date.now());
  const { data: reachability, isFetching: fetchingAvailability, refetch: loadAvailability } = useQuery({
    queryKey: ["reachability", user?.id, windowKey, reachPunting, openId],
    queryFn: () => api.reachability({ window: windowKey!, puntingType: reachPunting }),
    enabled: !!user && !!windowKey,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const maxReachable = reachability?.maxOdds ?? null;
  const matchCount = reachability?.matchCount ?? 0;

  /**
   * The run itself lives on the server, so this survives a refresh, a closed tab
   * or a phone locking mid-analysis. The hook rejoins whatever is in flight and
   * still collects a result that landed while nobody was watching.
   */
 // v3: MSport / Bet9ja conversions start as soon as the SportyBet code exists (free, never blocking).
 const convert = useAutoConvert();
 const job = useJobRun<PredictionResult>({
 kind: "predict",
 onReady: (next) => convert.start(next.bookingCode),
    onResult: (next) => {
      if (user) setUser({ ...user, credits: next.credits });
      setAvailabilityNote("");
      queryClient.invalidateQueries({ queryKey: ["reachability"] });
      // The new code belongs in history straight away.
      queryClient.invalidateQueries({ queryKey: ["predictions"] });
      track("book_completed", {
        oddsBand: band ?? "",
        totalOdds: next.totalOdds,
        legs: next.picks.length,
      });
      toast.success(`Code ${next.bookingCode} ready`);
    },
    onError: (message, extra) => {
      if (/no reviewed|no combination|range is unavailable|range is now locked|fresh picks for this range|cannot reach this range|cannot reach this odds/i.test(message)) {
        setBand(null); setNoteIsLock(true); setAvailabilityNote(message);
        queryClient.invalidateQueries({queryKey:["reachability"]}); advance(3); return;
      }
      track("book_failed", { oddsBand: band ?? "", reason: message.slice(0, 80) });
      if (extra?.upgrade) lockedToast(message);
      else if (
        extra?.cancelled ||
        /not charged|timed out|cancelled/i.test(message)
      ) {
        // Voluntary cancel / confirm timeout. Not a failure, no charge.
        toast.message(message);
      } else toast.error(message);
    },
  });
  const { busy, progress, result } = job;
  // Results restored on reload/reattach also get their conversions (start() is idempotent).
  const startConvert = convert.start;
  useEffect(() => { if (result?.bookingCode) startConvert(result.bookingCode); }, [result?.bookingCode, startConvert]);

  const unlimited = !!plan?.unlimited;
  const credits = user?.credits ?? 0;
  const cost = windowKey ? (plan?.costs?.[windowKey] ?? 150) : (plan?.costs?.today ?? 150);
  const canAfford = unlimited || credits >= cost;
  // v3: after a booking the header shows what that slip actually cost (e.g. 300 for Longshot), not the default window price.
  const shownCost = (result as { cost?: number } | null)?.cost ?? cost;
  const bands = plan?.allOddsBands ?? [];
  const allowed = plan?.oddsBands ?? [];
  const customRange = plan?.customOddsRange ?? { min: 2, max: 1000 };
  const canCustom = unlimited || !!plan?.customOdds;
  const customValue = Number(customOdds);
  const customValid =
    customOdds.trim() !== "" &&
    Number.isFinite(customValue) &&
    customValue >= customRange.min &&
    customValue <= customRange.max;
  // Step 2 is answered either by a band or by a valid typed number.
  const oddsChosen = band === "custom" ? customValid : !!band;

  // Lock a band when even its floor sits above what the window can support.
  // Custom targets still compare the typed number directly.
  const oddsUnreachable = (odds: number) =>
    maxReachable != null && Number.isFinite(maxReachable) && odds > maxReachable;
  const bandUnreachable = (item: { key: string; min: number; target: number }) =>
    reachability?.bands ? reachability.bands[item.key]?.available !== true : oddsUnreachable(item.min);

  // Custom only opens when no odds range is locked by what today's games can reach.
  const customReachLocked = bands.some(
    (item) => (unlimited || allowed.includes(item.key)) && bandUnreachable(item),
  );

  const stateOf = (n: number): StepState =>
    step === n ? "current" : step > n ? "done" : "waiting";
  const isOpen = (n: number) => (openStep === null ? step === n : openStep === n);
  /** Chevron toggle: collapse if it is showing, otherwise reveal just this one. */
  const toggle = (n: number) => setOpenStep(isOpen(n) ? -1 : n);
  /** Advancing clears any manual override so the next step opens itself. */
  const advance = (n: number) => {
    setStep(n);
    setOpenStep(null);
  };

  // Changing window or risk can invalidate a previously picked band/custom target.
  useEffect(() => {
    if (!windowKey || maxReachable == null) return;
    if (band && band !== "custom") {
      const meta = bands.find((item) => item.key === band);
      if (meta && bandUnreachable(meta)) {
        setBand(null);
        reachabilityToast(matchCount, windowKey, meta.max >= 1000 ? meta.min : meta.max, risk);
        advance(3);
      }
    }
    if (band === "custom" && customValid && oddsUnreachable(customValue)) {
      // Keep the typed value visible but clear selection so Next stays blocked
      // until they lower it; toast once when risk/window made it invalid.
      setBand(null);
      reachabilityToast(matchCount, windowKey, customValue, risk);
      advance(3);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [windowKey, reachability, reachPunting]);

  const run = async () => {
    if (!band || !windowKey || !risk) return;
    if (band === "custom" && !customValid) return;
    if (bookPending) return;
    setBookPending(true);
    try {
    // Use the page's snapshot; the server re-checks and answers with a clear lock message.
    // QA: choosing a risk level switches the snapshot key, so it can still be loading here.
    // "Not loaded yet" is not "locked": load it once, then decide.
    let fresh = reachability;
    if (!fresh) fresh = (await loadAvailability()).data;
    if (!fresh) { setNoteIsLock(false); setAvailabilityNote("We could not check which ranges are open just now. Please try again in a moment. No credits charged."); return; }
    if ( (band !== "custom" && fresh.bands?.[band]?.available !== true) || (band === "custom" && customValue > fresh.maxOdds)) {
      setBand(null); setNoteIsLock(true); setAvailabilityNote("The games left today cannot reach this odds"); advance(3); return;
    }
    setAvailabilityNote("");
    if (band === "custom" && oddsUnreachable(customValue)) {
      reachabilityToast(matchCount, windowKey, customValue, risk);
      return;
    }
    if (band !== "custom") {
      const meta = bands.find((item) => item.key === band);
      if (meta && bandUnreachable(meta)) {
        reachabilityToast(matchCount, windowKey, meta.max >= 1000 ? meta.min : meta.max, risk);
        return;
      }
    }
    track("book_started", {
      oddsBand: band === "custom" ? `custom:${customValue}` : band,
      window: windowKey,
      risk,
    });
    await job.start((handlers) =>
      api.predictStream(
        {
          puntingType: risk,
          window: windowKey,
          oddsBand: band,
          ...(band === "custom" ? { targetOdds: customValue } : {}),
        },
        handlers,
      ),
    );
    } finally {
      setBookPending(false);
    }
  };

  const reset = () => {
    job.reset();
    setBand(null);
    queryClient.invalidateQueries({queryKey:["reachability"]});
    setStep(1);
    setOpenStep(null);
  };

  const bandLabel =
    band === "custom"
      ? customValid
        ? `around ${customValue}`
        : undefined
      : bands.find((item) => item.key === band)?.label;
  const windowLabel = WINDOWS.find((item) => item.key === windowKey)?.label;
  const riskLabel = RISK.find((item) => item.key === risk)?.label;

  return (
    <AppPage
      title="Book a Game with SportyPunter"
      description="Choose your match window, risk level and odds. We build a stats-backed SportyBet code."
      backTo="/dashboard"
      redFade
    >
      <div className="space-y-4">
        {starter && <p className="rounded-xl border border-border bg-surface px-4 py-3 text-sm">Your 150 welcome credits cover your first Today code.</p>}
        {!result && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
          <span className="inline-flex items-center gap-2 font-display text-sm font-extrabold">
            <Ticket className="h-4 w-4 text-primary" /> Your slip
          </span>
          <span
            title={unlimited ? "Unlimited" : `Cost ${shownCost} credits`}
            className="inline-flex items-center gap-1.5 rounded-full border border-border px-2.5 py-1 text-[11px] font-bold tabular-nums"
          >
            <Coin className="h-3.5 w-3.5 text-[#f0b429]" />
            {unlimited ? "∞" : shownCost}
          </span>
        </div>
        )}

        {/* The three questions collapse away once answered, and disappear
            entirely while the pipeline runs so the progress readout leads. */}
        {!busy && !result && (
          <div className="space-y-2.5">
            <Step
              index={1}
              title="Select match duration"
              state={stateOf(1)}
              summary={windowLabel}
              open={isOpen(1)}
              onToggle={() => toggle(1)}
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {WINDOWS.map((item) => {
                  const locked = !unlimited && !(plan?.windows ?? []).includes(item.key);
                  return (
                    <Choice
                      key={item.key}
                      label={item.label}
                      hint={item.hint}
                      active={windowKey === item.key}
                      locked={locked}
                      badge={!unlimited && <CreditAmount value={plan?.costs?.[item.key] ?? "N/A"} />}
                      onClick={() => {
                        if (locked) {
                          track("locked_feature_hit", { feature: `window:${item.key}` });
                          lockedToast(`Upgrade to Lite or Pro to use ${item.label}`);
                          return;
                        }
                        setWindowKey(item.key);
                      }}
                    />
                  );
                })}
              </div>
              <StepActions>
                <button
                  type="button"
                  disabled={!windowKey}
                  onClick={() => advance(2)}
                  className="flex-1 rounded-xl bg-primary py-3 font-display text-sm font-extrabold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  {windowKey ? "Next" : "Pick a duration"}
                </button>
              </StepActions>
            </Step>

            <Step
              index={2}
              title="Pick a risk level"
              state={stateOf(2)}
              summary={riskLabel}
              open={isOpen(2)}
              onToggle={() => toggle(2)}
            >
              <div className="grid gap-2 sm:grid-cols-2">
                {RISK.map((item) => {
                  const locked = !unlimited && !(plan?.puntingTypes ?? []).includes(item.key);
                  return (
                    <Choice
                      key={item.key}
                      label={item.label}
                      hint={item.hint}
                      active={risk === item.key}
                      locked={locked}
                      onClick={() => {
                        if (locked) {
                          track("locked_feature_hit", { feature: `risk:${item.key}` });
                          lockedToast(`Upgrade to Lite or Pro to use ${item.label}`);
                          return;
                        }
                        setRisk(item.key);
                      }}
                    />
                  );
                })}
              </div>
              <StepActions onBack={() => advance(1)}>
                <button
                  type="button"
                  disabled={!risk}
                  onClick={() => advance(3)}
                  className="flex-1 rounded-xl bg-primary py-3 font-display text-sm font-extrabold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  {risk ? "Next" : "Pick a risk level"}
                </button>
              </StepActions>
            </Step>

            <Step
              index={3}
              title="Select odds"
              state={stateOf(3)}
              summary={bandLabel && `${bandLabel} odds`}
              open={isOpen(3)}
              onToggle={() => toggle(3)}
            >
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {bands.map((item) => {
                  const planLocked = !unlimited && !allowed.includes(item.key);
                  const reachLocked = !planLocked && bandUnreachable(item);
                  const locked = planLocked || reachLocked;
                  return (
                    <Choice
                      key={item.key}
                      label={item.label}
                      hint={reachLocked ? "The games left today cannot reach this odds" : `aims for about ${item.target} odds`}
                      hintDanger={reachLocked}
                      active={band === item.key}
                      locked={locked}
                      lockKind={reachLocked ? "reachability" : "plan"}
                      onClick={() => {
                        if (planLocked) {
                          track("locked_feature_hit", { feature: `odds:${item.key}` });
                          lockedToast(`Upgrade to Lite or Pro to select ${item.label} odds`);
                          return;
                        }
                        if (reachLocked) {
                          if (windowKey) {
                            reachabilityToast(matchCount, windowKey, item.max >= 1000 ? item.min : item.max, risk);
                          }
                          return;
                        }
                        setBand(item.key);
                      }}
                    />
                  );
                })}

                <Choice
                  label="Custom"
                  hint={`${customRange.min}-${customRange.max}`}
                  active={band === "custom"}
                  locked={!canCustom || customReachLocked}
                  lockKind={canCustom && customReachLocked ? "reachability" : "plan"}
                  onClick={() => {
                    if (canCustom && customReachLocked) {
                      if (windowKey) {
                        reachabilityToast(matchCount, windowKey, customRange.max, risk);
                      }
                      return;
                    }
                    if (!canCustom) {
                      track("locked_feature_hit", { feature: "odds:custom" });
                      lockedToast("Upgrade to Lite or Pro to enter your own odds");
                      return;
                    }
                    setBand("custom");
                  }}
                />
              </div>
              {/* v3: shown below the ranges so it never shifts the buttons under a click. */}
              {availabilityNote && !noteIsLock && <p role="status" className={`mt-3 rounded-xl bg-muted p-3 text-sm ${noteIsLock ? "text-destructive" : "text-muted-foreground"}`}>{availabilityNote}</p>}

              {band === "custom" && (
                <div className="mt-3 rounded-xl border border-primary/30 bg-primary/5 p-3.5">
                  <label
                    htmlFor="custom-odds"
                    className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground"
                  >
                    Your target odds
                  </label>
                  <input
                    id="custom-odds"
                    value={customOdds}
                    onChange={(event) =>
                      setCustomOdds(event.target.value.replace(/[^0-9.]/g, "").slice(0, 6))
                    }
                    placeholder="10"
                    inputMode="decimal"
                    autoComplete="off"
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3.5 text-center font-display text-2xl font-extrabold tabular-nums outline-none placeholder:text-muted-foreground/35 focus:border-primary"
                  />
                  <p className="mt-2 text-center text-[11px] leading-relaxed text-muted-foreground">
                    {customValid ? (
                      oddsUnreachable(customValue) ? (
                        <>
                          That target sits above what this window can support
                          {maxReachable != null ? (
                            <>
                              {" "}
                              (about <b className="text-foreground">{maxReachable}</b> odds right now)
                            </>
                          ) : null}
                          .{" "}
                          {windowKey === "today"
                            ? "Try a lower odd or book Longshot"
                            : "Try a lower odd"}
                          .
                        </>
                      ) : (
                        <>
                          We aim for roughly{" "}
                          <b className="text-foreground">
                            {(customValue * 0.88).toFixed(1)}-{(customValue * 1.12).toFixed(1)}
                          </b>
                          . Exact odds are rarely reachable, so we get as close as the real games
                          allow.
                        </>
                      )
                    ) : (
                      `Enter any number from ${customRange.min} to ${customRange.max}.`
                    )}
                  </p>
                </div>
              )}

              <StepActions onBack={() => advance(2)}>
                <button
                  type="button"
                  disabled={
                    checkingAvailability ||
                    bookPending ||
                    (band !== "custom" && !!band && !!reachability && reachability.bands?.[band]?.available !== true) ||
                    !oddsChosen ||
                    !risk ||
                    !canAfford ||
                    (band === "custom" && customValid && oddsUnreachable(customValue))
                  }
                  onClick={() => {
                    if (band === "custom" && customValid && oddsUnreachable(customValue) && windowKey) {
                      reachabilityToast(matchCount, windowKey, customValue, risk);
                      return;
                    }
                    run();
                  }}
                  className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary py-3 font-display text-sm font-extrabold text-primary-foreground transition hover:opacity-90 disabled:opacity-50"
                >
                  {bookPending && !busy ? (
                    <span className="flex h-5 items-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                    </span>
                  ) : checkingAvailability || (busy && !result && !job.confirm) ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Booking…
                    </>
                  ) : !oddsChosen ? (
                    band === "custom" ? "Enter your odds" : "Pick an odds range"
                  ) : band === "custom" && customValid && oddsUnreachable(customValue) ? (
                    "Target too high"
                  ) : !canAfford ? (
                    <>
                      Need <CreditAmount value={cost} tone="plain" />
                    </>
                  ) : (
                    <>
                      Book game
                      {!unlimited && (
                        <>
                          <span className="opacity-50">·</span>
                          <CreditAmount value={cost} tone="plain" />
                        </>
                      )}
                    </>
                  )}
                </button>
              </StepActions>
              {!canAfford && (
                <Link
                  to="/credits"
                  search={{ reference: undefined }}
                  className="mt-2 block py-1 text-center text-xs font-bold text-primary hover:underline"
                >
                  Add credits
                </Link>
              )}
            </Step>
          </div>
        )}

        {/* The prompt replaces the progress panel: the pipeline is parked, so a
            spinner underneath it would be a lie. */}
        {job.confirm ? (
          <ShortfallPrompt confirm={job.confirm} onAnswer={job.answer} />
        ) : (
          busy && <ProgressPanel events={progress} />
        )}

        {result && (
          <>
            <button
              type="button"
              onClick={reset}
              className="w-full rounded-2xl bg-primary py-3 font-display text-sm font-extrabold text-primary-foreground transition hover:opacity-90"
            >
              Book another game
            </button>
            <PredictionPanel result={result} belowCode={<ConvertRow convert={convert} />} />
          </>
        )}

        {!busy && !result && <LeagueStrip />}
      </div>
    </AppPage>
  );
}

/**
 * Live pipeline readout. Every stage the server reports is kept on screen, so
 * a punter waiting two minutes can see it is moving rather than stuck.
 */
function ProgressPanel({ events }: { events: PipelineProgress[] }) {
  const latest = events[events.length - 1];
  return (
    <div className="overflow-hidden rounded-2xl border border-primary/40 bg-surface">
      <div className="flex items-center gap-3 border-b border-border/70 px-4 py-3.5">
        <Loader2 className="h-4 w-4 animate-spin text-primary" />
        <span className="font-display text-sm font-extrabold">
          {latest?.message ?? "Starting…"}
        </span>
      </div>
      <ol className="space-y-2 p-4">
        {events.slice(0, -1).map((event, index) => (
          <li
            key={`${event.stage}-${index}`}
            className="flex items-start gap-2.5 text-xs text-muted-foreground"
          >
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-success" />
            {event.message}
          </li>
        ))}
      </ol>
      <p className="border-t border-border/70 px-4 py-3 text-[11px] leading-relaxed text-muted-foreground">
        This can take a couple of minutes. We read live odds, pull team form, then have the analyst
        check every leg before booking.
      </p>
    </div>
  );
}
