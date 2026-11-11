import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowRight,
  CalendarDays,
  Check,
  CheckCheck,
  Copy,
  Loader2,
  Shield,
  SlidersHorizontal,
  Ticket,
} from "lucide-react";
import { BrandHeader, FlowSteps, InlineError } from "@/components/auth-shell";
import {
  generateStarter,
  bookingPending,
  savedBooking,
  starterRequest,
  type StarterResult,
} from "@/lib/starter-demo";
import { privatePage } from "@/lib/seo";
export const Route = createFileRoute("/generate")({
  head: () => privatePage("Your first code", "/generate"),
  component: StarterPage,
});
function StarterPage() {
  const [result, setResult] = useState<StarterResult | null>(savedBooking);
  const [busy, setBusy] = useState(bookingPending);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [picksOpen, setPicksOpen] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const active = useRef(true);
  const submitting = useRef(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(() => {
    if (busy || result || error) heading.current?.focus();
  }, [busy, result, error]);
  const generate = useCallback(async () => {
    if (submitting.current) return;
    submitting.current = true;
    setBusy(true);
    setError("");
    try {
      const next = await generateStarter(starterRequest, (value) => {
        if (active.current) setStage(value);
      });
      if (active.current) setResult(next);
    } catch (err) {
      if (active.current)
        setError(
          err instanceof Error
            ? err.message
            : "We couldn’t finish your code. Please try again.",
        );
    } finally {
      submitting.current = false;
      if (active.current) setBusy(false);
    }
  }, []);
  useEffect(() => {
    if (bookingPending() && !result) void generate();
  }, [generate, result]);
  const copy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.bookingCode);
      setCopied(true);
      setCopyError("");
    } catch {
      setCopyError(
        "Copy isn’t available in this browser. Select and copy the code above.",
      );
    }
  };
  const progressLabels = [
    "Checking today’s games",
    "Reviewing the selections",
    "Preparing your booking code",
  ];
  return (
    <div className="site-shell">
      <BrandHeader />
      <main id="main" className="onboarding">
        <FlowSteps current={result ? 3 : 2} />
        <p className="eyebrow">
          {result
            ? "Ready to review"
            : busy
              ? "Putting your code together"
              : "Your account is ready"}
        </p>
        <h1 ref={heading} tabIndex={-1}>
          {result
            ? "Your first code is ready."
            : busy
              ? "Creating your code."
              : "Let’s get your first code."}
        </h1>
        <p className="subtitle">
          {result
            ? "Copy your code, then review the selections in SportyBet before deciding whether to bet."
            : busy
              ? "We’re checking the games for your Today code. This can take a couple of minutes."
              : "We’ve selected a starting point for you. Review it below, then create your SportyBet code."}
        </p>
        <div className="booking-content">
          {result ? (
            <>
              <div className="result-code">
                <p className="eyebrow">SportyBet booking code</p>
                <span
                  className="code-value"
                  aria-label={`Booking code ${result.bookingCode}`}
                >
                  {result.bookingCode}
                </span>
                <button className="button primary" onClick={copy}>
                  {copied ? <CheckCheck size={19} /> : <Copy size={19} />}
                  {copied ? "Code copied" : "Copy booking code"}
                </button>
                <span className="sr-only" role="status">
                  {copied ? "Booking code copied to clipboard." : ""}
                </span>
                {copyError && (
                  <p className="quiet-note" role="status">
                    {copyError}
                  </p>
                )}
                <p className="demo-note">
                  Demo code only. It can’t be used to place a bet.
                </p>
              </div>
              <section className="next-instructions">
                <h2>What to do with your code</h2>
                <ol>
                  <li>
                    Open SportyBet and find the option to load a booking code.
                  </li>
                  <li>Paste the code to see the selections.</li>
                  <li>
                    Review the games and current odds. Placing a bet is your
                    choice.
                  </li>
                </ol>
              </section>
              <div className="booking-sheet">
                <button
                  className="disclosure"
                  onClick={() => setPicksOpen(!picksOpen)}
                  aria-expanded={picksOpen}
                  aria-controls="sample-picks"
                >
                  View sample selections{" "}
                  <span>
                    {result.picks.length} games · {result.totalOdds.toFixed(2)}{" "}
                    odds
                  </span>
                </button>
                {picksOpen && (
                  <ul className="pick-list" id="sample-picks">
                    {result.picks.map((pick) => (
                      <li key={pick.match}>
                        <strong>{pick.match}</strong>
                        <span>
                          {pick.selection} · {pick.odds.toFixed(2)}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <p className="quiet-note">
                {result.cost} welcome credits used · {result.credits} credits
                remaining
              </p>
              <Link className="button secondary mt-6" to="/dashboard">
                Go to dashboard <ArrowRight size={18} />
              </Link>
            </>
          ) : busy ? (
            <section aria-label="Booking progress" aria-busy="true">
              <ol className="progress-list">
                {progressLabels.map((label, index) => (
                  <li key={label} className={stage === index ? "current" : ""}>
                    {stage > index ? (
                      <Check size={20} className="done" />
                    ) : stage === index ? (
                      <Loader2 size={20} className="spin" />
                    ) : (
                      <span className="progress-dot" />
                    )}
                    <span>{label}</span>
                  </li>
                ))}
              </ol>
              <p role="status" className="sr-only">
                {progressLabels[stage]}
              </p>
              <p className="quiet-note">
                Your code will appear here when it’s ready.
              </p>
            </section>
          ) : (
            <>
              {error && <InlineError>{error}</InlineError>}
              <section
                className="booking-sheet"
                aria-label="Your first booking settings"
              >
                <div className="sheet-heading">
                  <h2>Your first booking</h2>
                  <span>Ready to go</span>
                </div>
                <div className="booking-row">
                  <CalendarDays size={21} />
                  <div>
                    <strong>Today’s games</strong>
                    <p>Kicking off in the next 24 hours.</p>
                  </div>
                </div>
                <div className="booking-row">
                  <Shield size={21} />
                  <div>
                    <strong>Play Safe</strong>
                    <p>
                      The lower-risk approach. Every bet still carries risk.
                    </p>
                  </div>
                </div>
                <div className="booking-row">
                  <SlidersHorizontal size={21} />
                  <div>
                    <strong>2–5 total odds</strong>
                    <p>The target combined odds for your code.</p>
                  </div>
                </div>
              </section>
              <div className="credit-summary">
                <div>
                  <span>Your welcome credits</span>
                  <strong>150 credits</strong>
                </div>
                <div>
                  <span>This Today code</span>
                  <strong>150 credits</strong>
                </div>
                <div className="credit-total">
                  <span>Amount to pay</span>
                  <span>₦0</span>
                </div>
              </div>
              <button className="button primary" onClick={generate}>
                <Ticket size={19} />
                {error ? "Try again" : "Create my first code"}
                <ArrowRight size={19} />
              </button>
              <p className="quiet-note">
                Uses your 150 welcome credits. Credits pay for analysis, not a
                betting stake. No guaranteed wins.
              </p>
              <div className="center-action">
                <Link to="/dashboard" className="text-action">
                  I’ll do this later <ArrowRight size={16} />
                </Link>
              </div>
            </>
          )}
        </div>
      </main>
      <footer className="site-footer">
        Only bet what you can afford to lose.
      </footer>
    </div>
  );
}
