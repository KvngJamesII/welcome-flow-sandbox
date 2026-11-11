import {
  createFileRoute,
  Link,
  useNavigate,
  useLocation,
} from "@tanstack/react-router";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ChevronDown,
  Copy,
  Gift,
  Loader2,
  Shield,
  SlidersHorizontal,
  Undo2,
} from "lucide-react";
import { BrandHeader } from "@/components/auth-shell";
import {
  generateStarter,
  bookingPending,
  savedBooking,
  starterRequest,
  type StarterResult,
} from "@/lib/starter-demo";
import { readDemo, writeDemo } from "@/lib/demo-state";
import { privatePage } from "@/lib/seo";

const steps = ["welcome", "today", "approach", "odds"] as const;
type Step = (typeof steps)[number];
declare module "@tanstack/react-router" {
  interface HistoryState {
    welcomeFrom?: Step;
  }
}
function validStep(value: unknown): Step | undefined {
  return steps.includes(value as Step) ? (value as Step) : undefined;
}
export const Route = createFileRoute("/generate")({
  validateSearch: (
    search: Record<string, unknown>,
  ): { starter?: 1; step?: Step } => ({
    starter: search.starter === "1" || search.starter === 1 ? 1 : undefined,
    step: validStep(search.step),
  }),
  head: () => privatePage("Your first code", "/generate"),
  component: StarterPage,
});

/** Details are closed on entry and unmounted between steps, never carried forward. */
function Details({ label, children }: { label: string; children: ReactNode }) {
  return (
    <details className="guide-details">
      <summary>
        {label}
        <ChevronDown size={17} aria-hidden="true" />
      </summary>
      <div className="guide-detail-body">{children}</div>
    </details>
  );
}

const prompts = {
  welcome: {
    icon: Gift,
    title: "Welcome. You’re in.",
    body: "Let’s make your first booking code.",
    action: "Let’s start",
    detail: "About your welcome credits",
  },
  today: {
    icon: CalendarDays,
    title: "Start with today’s games?",
    body: "We’ll use games coming up today.",
    action: "Use today’s games",
    detail: "Which games does this include?",
  },
  approach: {
    icon: Shield,
    title: "Start with Play Safe?",
    body: "The starter approach for your first code.",
    action: "Use Play Safe",
    detail: "What does Play Safe mean?",
  },
  odds: {
    icon: SlidersHorizontal,
    title: "Aim for 2–5 odds?",
    body: "Your welcome credits cover this code.",
    action: "Create my code",
    detail: "See odds and credit details",
  },
};

function StarterPage() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const location = useLocation();
  const step =
    search.step ?? validStep(readDemo("starter_step", "welcome")) ?? "welcome";
  const position = steps.indexOf(step);
  const [result, setResult] = useState<StarterResult | null>(savedBooking);
  const [busy, setBusy] = useState(bookingPending);
  const [stage, setStage] = useState(0);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState("");
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
    // Give the initial screen an explicit URL so browser Back can restore it.
    if (!search.step)
      void navigate({
        to: "/generate",
        search: { ...search, step },
        replace: true,
      });
    else writeDemo("starter_step", search.step);
  }, [search.step, search.starter, step, navigate]);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [step, busy, result, error]);

  const changeStep = (next: Step) => {
    void navigate({
      to: "/generate",
      search: { ...search, step: next },
      state: { welcomeFrom: step },
    });
  };
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
            : "Your credits are still here. Please try again.",
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
      setCopyError("Select and copy the sample code above.");
    }
  };
  const prompt = prompts[step];
  const Icon = busy ? Loader2 : error ? Undo2 : prompt.icon;
  const screen = result ? "result" : busy ? "loading" : error ? "error" : step;
  const title = result
    ? copied
      ? "Copied. You’re all set."
      : "Here’s your sample code."
    : busy
      ? "Making your sample code…"
      : error
        ? "Let’s try that again."
        : prompt.title;
  const progressLabels = [
    "Starting the demo…",
    "Preparing sample selections…",
    "Finishing your sample code…",
  ];

  return (
    <div className="site-shell guide-shell">
      <BrandHeader />
      <main id="main" className="guide" data-screen={screen}>
        <nav className="guide-navigation" aria-label="Onboarding navigation">
          {!result && !busy && !error && position > 0 ? (
            <button
              type="button"
              className="guide-back"
              onClick={() => {
                const previous = steps[position - 1];
                if (location.state.welcomeFrom === previous)
                  window.history.back();
                else changeStep(previous);
              }}
            >
              <ArrowLeft size={18} aria-hidden="true" /> Back
            </button>
          ) : (
            <span />
          )}
          {!result && !busy && !error && (
            <ol className="guide-dots" aria-label="Your first code">
              {steps.map((item, index) => (
                <li
                  key={item}
                  aria-current={step === item ? "step" : undefined}
                  className={index <= position ? "reached" : ""}
                >
                  <span className="sr-only">{prompts[item].title}</span>
                </li>
              ))}
            </ol>
          )}
        </nav>
        <section
          className="guide-screen"
          key={screen}
          aria-labelledby="guide-title"
        >
          {!result && (
            <div className="guide-visual" aria-hidden="true">
              <Icon
                size={34}
                strokeWidth={1.5}
                className={busy ? "spin" : ""}
              />
            </div>
          )}
          <h1 id="guide-title" ref={heading} tabIndex={-1}>
            {title}
          </h1>
          {result ? (
            <>
              <p className="guide-copy">Sample only. Not valid for betting.</p>
              <div
                className="sample-code"
                aria-label={`Sample booking code ${result.bookingCode}`}
              >
                {result.bookingCode}
              </div>
              {copyError && (
                <p className="guide-copy-error" role="alert">
                  {copyError}
                </p>
              )}
              <div className="guide-actions">
                {copied ? (
                  <Link className="button primary" to="/dashboard">
                    Go to dashboard <ArrowRight size={18} />
                  </Link>
                ) : (
                  <button className="button primary" onClick={copy}>
                    <Copy size={18} />
                    {copyError ? "Try copying again" : "Copy sample code"}
                  </button>
                )}
              </div>
              <span role="status" className="sr-only">
                {copied ? "Sample code copied to clipboard." : ""}
              </span>
              <Details label="See code details">
                <h2>Sample picks</h2>
                <p>
                  Illustrations only, not predictions. No live odds or
                  confidence scores.
                </p>
                <ul className="sample-picks">
                  {result.picks.map((pick) => (
                    <li key={pick.match}>
                      <strong>{pick.match}</strong>
                      <span>{pick.selection}</span>
                    </li>
                  ))}
                </ul>
                <h2>Using a real code</h2>
                <p>
                  In SportyBet, load the booking code and review the selections
                  before deciding whether to bet.
                </p>
                <h2>Welcome credits</h2>
                <p>
                  In this demo, {result.cost} welcome credits were used and{" "}
                  {result.credits} remain. Credits pay for analysis, not a
                  betting stake.
                </p>
                {copied && (
                  <button className="text-action" onClick={copy}>
                    Copy sample code again
                  </button>
                )}
              </Details>
              {!copied && (
                <Link to="/dashboard" className="guide-later">
                  Done for now
                </Link>
              )}
            </>
          ) : busy ? (
            <p className="guide-copy" role="status">
              {progressLabels[stage]}
            </p>
          ) : error ? (
            <>
              <p className="guide-copy" role="alert">
                {error}
              </p>
              <div className="guide-actions">
                <button className="button primary" onClick={generate}>
                  Try again <ArrowRight size={18} />
                </button>
              </div>
              <Details label="See details">
                <p>
                  This demo did not use your welcome credits. Your starter
                  choices are still saved.
                </p>
              </Details>
              <Link to="/dashboard" className="guide-later">
                I’ll do this later
              </Link>
            </>
          ) : (
            <>
              <p className="guide-copy">{prompt.body}</p>
              <div className="guide-actions">
                <button
                  className="button primary"
                  onClick={() =>
                    position === steps.length - 1
                      ? void generate()
                      : changeStep(steps[position + 1])
                  }
                >
                  {prompt.action}
                  <ArrowRight size={18} aria-hidden="true" />
                </button>
              </div>
              <Details label={prompt.detail}>
                {step === "welcome" && (
                  <p>
                    Your 150 welcome credits cover your first Today code. They
                    pay for analysis, not a betting stake.
                  </p>
                )}
                {step === "today" && (
                  <p>
                    The Today window covers games kicking off in the next 24
                    hours. A code depends on suitable games being available.
                  </p>
                )}
                {step === "approach" && (
                  <p>
                    Play Safe is the name of the starter approach. It does not
                    make a bet safe or guarantee a win.
                  </p>
                )}
                {step === "odds" && (
                  <>
                    <h2>About the odds</h2>
                    <p>
                      2–5 is the target range for combined odds, not a chance of
                      winning. Actual odds depend on the available games.
                    </p>
                    <h2>Using your welcome credits</h2>
                    <p>
                      This Today code uses your 150 welcome credits. No payment
                      is needed for this code. Credits do not cover a betting
                      stake.
                    </p>
                  </>
                )}
              </Details>
              {step === "welcome" && (
                <Link to="/dashboard" className="guide-later">
                  I’ll do this later
                </Link>
              )}
            </>
          )}
        </section>
      </main>
    </div>
  );
}
