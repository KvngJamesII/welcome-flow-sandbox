/** Demo-only booking adapter. The request fields/values match original-code/generate.tsx.
 * Production integration must use its existing plan, reachability and useJobRun /
 * api.predictStream hooks; this fixture must never replace that backend logic.
 */
import { delay, demoFailure, readDemo, writeDemo } from "./demo-state";
export type StarterRequest = {
  puntingType: "safe";
  window: "today";
  oddsBand: "2-5";
};
export type StarterResult = {
  bookingCode: string;
  credits: number;
  cost: number;
  totalOdds: number;
  picks: { match: string; selection: string; odds: number }[];
};
export const starterRequest: StarterRequest = {
  puntingType: "safe",
  window: "today",
  oddsBand: "2-5",
};
export function savedBooking() {
  return readDemo<StarterResult | null>("booking", null);
}
export function bookingPending() {
  return readDemo("booking_pending", false);
}
const listeners = new Set<(stage: number) => void>();
let currentStage = 0;
function reportStage(stage: number) {
  currentStage = stage;
  listeners.forEach((listener) => listener(stage));
}
let inFlight: Promise<StarterResult> | null = null;
export function generateStarter(
  request: StarterRequest,
  onProgress: (stage: number) => void,
) {
  listeners.add(onProgress);
  if (inFlight) {
    onProgress(currentStage);
    return inFlight.finally(() => listeners.delete(onProgress));
  }
  writeDemo("booking_pending", true);
  inFlight = (async () => {
    const existing = savedBooking();
    if (existing) return existing;
    if (
      request.window !== "today" ||
      request.puntingType !== "safe" ||
      request.oddsBand !== "2-5"
    )
      throw new Error("Choose the starter settings to continue.");
    reportStage(0);
    await delay(800);
    if (demoFailure("booking"))
      throw new Error(
        "We couldn’t finish your code. Your 150 credits haven’t been used. Please try again.",
      );
    if (demoFailure("empty"))
      throw new Error(
        "There aren’t enough suitable games for 2–5 odds right now. Your 150 credits are still available. Try again later.",
      );
    reportStage(1);
    await delay(900);
    reportStage(2);
    await delay(850);
    const result: StarterResult = {
      bookingCode: "DEMO150",
      cost: 150,
      credits: 0,
      totalOdds: 3.24,
      picks: [
        {
          match: "Home team A vs Away team A",
          selection: "Over 1.5 goals",
          odds: 1.8,
        },
        {
          match: "Home team B vs Away team B",
          selection: "Home or draw",
          odds: 1.8,
        },
      ],
    };
    writeDemo("booking", result);
    return result;
  })().finally(() => {
    inFlight = null;
    writeDemo("booking_pending", false);
  });
  return inFlight.finally(() => listeners.delete(onProgress));
}
