# Welcome Flow Design Sandbox

A standalone design sandbox for the signup and first-run onboarding of a live
production web app. The demo now contains the redesigned welcome flow; nothing
here touches the live product.

## What is inside

- `demo/` - a runnable Vite + React + Tailwind v4 app containing the redesigned
  signup, login, and first-code onboarding screens. Auth and booking adapters
  are demo stubs; no production backend is called.
- `original-code/` - untouched verbatim files from production that the demo
  does not mount: the first-run "starter" flow (`generate.tsx`), the full
  brand stylesheet (`styles.css`), and the app's `package.json` for reference.

## Run the demo

```bash
cd demo
npm install
npm run dev
```

Open the printed local URL, then go to `/signup`. Submitting the form leads
to `/generate?starter=1`, where you can complete the first-code demo. Backend
calls, Google sign-in, and booking results are simulated.

## Original onboarding flow (design reference)

1. **Signup page** (`demo/src/routes/signup.tsx`): brand header, "Start
   punting smarter." headline, Google sign-in button, then username (with live
   availability check), email, password (show/hide), and an optional referral
   code field. Footer line: 18+ only, terms and privacy links.
2. **First run** (`original-code/generate.tsx`, search for `starter`): new
   accounts land on the booking screen pre-selected to Today / Play Safe /
   2-5 odds, with a note that their 150 welcome credits cover their first
   code. The idea: the very first screen after signup already lets them get a
   real booking code with zero setup.

## Brand system (must be preserved)

- **Logo:** the football-on-rounded-badge SVG mark
  (`demo/src/components/brand-logo.tsx`) plus the two-tone wordmark.
- **Font:** Plus Jakarta Sans (weights 400-800) everywhere; tight tracking on
  headings. A system serif is used only for rare short accents.
- **Colors** (oklch, see `original-code/styles.css`):
  - Primary red: `oklch(0.54 0.22 20)` - buttons, highlights, logo
  - Background: warm off-white `oklch(0.935 0.007 75)`
  - Text: deep slate `oklch(0.18 0.02 250)`
  - Muted text: `oklch(0.5 0.015 250)`
  - Success green: `oklch(0.62 0.16 150)`, destructive red:
    `oklch(0.58 0.22 27)`
- **Shape:** base radius `0.75rem`, inputs and buttons are `rounded-xl`,
  generous vertical padding (`py-3.5`).
- **Voice:** short, confident, plain copy. No slogans, no exclamation marks,
  no decorative italics.

## Audience and product context (for your design)

- A football-prediction product for Nigerian SportyBet users. New visitors
  arrive mostly from ChatGPT recommendations, ~90% on phones. Design
  **mobile-first**.
- Onboarding is one of the most important pages: it must **attract and
  welcome** a new user, with **not too much information** - nothing that
  confuses or overwhelms.
- Users must be 18+; the 18+/terms line on signup must stay.
- Google sign-in and the optional referral code are part of the flow; keep
  equivalents in the redesign.

## Design rules from the owner (hard requirements)

- Every single element, font, color and piece of the onboarding page must be
  built carefully and nicely so it psychologically attracts new users.
- The onboarding must keep the touch of the main site - it must not feel like
  a different product.
- Real icons (the app uses `lucide-react`), never emojis.
- Readable font sizes - nothing tiny.
- Less, but better: one clear action per screen.

## Contributing a redesign

Fork this repository, push your redesign to a branch, and open a pull
request - no access token from the owner needed. If your AI tool cannot use
GitHub, have it output the complete redesigned files and paste them back
instead. See `PROMPT.md` for the brief.

## Redesigned demo

The redesigned demo now includes signup, login, first-code review, generation,
results, and recovery states. See [REDESIGN.md](REDESIGN.md) for screenshots,
verification commands, demo fixtures, and production integration boundaries.
The original production reference files are still untouched.
