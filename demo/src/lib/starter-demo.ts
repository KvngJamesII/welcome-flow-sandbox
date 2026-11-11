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
  picks: { match: string; selection: string }[];
};
export const starterRequest: StarterRequest = {
  puntingType: "safe",
  window: "today",
  oddsBand: "2-5",
};
export function savedBooking() {
  const saved = readDemo<StarterResult | null>("booking", null);
  // Older demo sessions may contain fabricated odds. Never restore those fields.
  if (!saved) return null;
  return {
    bookingCode: "SAMPLE",
    cost: saved.cost,
    credits: saved.credits,
    picks: [
      {
        match: "Sample home team vs sample away team",
        selection: "Example selection: home or draw",
      },
    ],
  };
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
      throw new Error("Your credits are still here. Please try again.");
    if (demoFailure("empty"))
      throw new Error("No suitable games right now. Please try later.");
    reportStage(1);
    await delay(900);
    reportStage(2);
    await delay(850);
    const result: StarterResult = {
      bookingCode: "SAMPLE",
      cost: 150,
      credits: 0,
      picks: [
        {
          match: "Sample home team vs sample away team",
          selection: "Example selection: home or draw",
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
