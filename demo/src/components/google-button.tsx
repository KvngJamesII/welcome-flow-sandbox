/**
 * Google sign-in button.
 *
 * A plain link to `/api/auth/google`, not a JavaScript call. The server does the
 * whole OAuth dance and sets the session cookie on the way back, so this
 * component holds no auth logic at all. nothing to fail, nothing to configure in
 * the browser.
 *
 * This replaced a Firebase SDK popup, then a Firebase SDK redirect. Both needed
 * the SDK to reach helper endpoints on an `authDomain` we control, and every one
 * of those was a way to fail that surfaced as one unhelpful message. A redirect
 * needs one registered URI and no JavaScript origins.
 */

import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { storedReferralCode } from "@/lib/referral";

/** Google's own mark, inline so it needs no network request. */
function GoogleMark({ className = "h-4 w-4" }: { className?: string }) {
 return (
 <svg viewBox="0 0 18 18" className={className} aria-hidden="true">
 <path
 fill="#4285F4"
 d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.71-1.57 2.68-3.89 2.68-6.62Z"
 />
 <path
 fill="#34A853"
 d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.34A8.99 8.99 0 0 0 9 18Z"
 />
 <path
 fill="#FBBC05"
 d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.94H.96a8.99 8.99 0 0 0 0 8.12l3.01-2.34Z"
 />
 <path
 fill="#EA4335"
 d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59C13.46.89 11.43 0 9 0A8.99 8.99 0 0 0 .96 4.94l3.01 2.34C4.68 5.16 6.66 3.58 9 3.58Z"
 />
 </svg>
 );
}

export function GoogleButton({
 label = "Continue with Google",
 /** "signup" only changes which page an error is shown on. */
 intent = "login",
 /** Where to land after Google sends the browser back. */
 returnTo = "/dashboard",
}: {
 label?: string;
 intent?: "login" | "signup";
 returnTo?: string;
}) {
 const [leaving, setLeaving] = useState(false);

 const start = () => {
 setLeaving(true);
 const key = "sp_device_id";
 let device = window.localStorage.getItem(key);
 if (!device) {
 device = crypto.randomUUID();
 window.localStorage.setItem(key, device);
 }
 document.cookie = `${key}=${encodeURIComponent(device)}; Path=/; Max-Age=31536000; SameSite=Lax`;
 // The referral code is carried by the server inside a signed state, since the
 // browser is about to leave and localStorage is not readable from the
 // callback. See src/lib/referral.ts.
 const params = new URLSearchParams({ intent, next: returnTo });
 const ref = storedReferralCode();
 if (ref) params.set("ref", ref);
 window.location.href = `/api/auth/google?${params}`;
 };

 return (
 <div className="space-y-4">
 <button
 type="button"
 onClick={start}
 disabled={leaving}
 className="flex w-full items-center justify-center gap-2.5 rounded-xl border border-border bg-surface py-3.5 text-sm font-bold transition hover:bg-muted disabled:opacity-60"
 >
 {leaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <GoogleMark />}
 {leaving ? "Taking you to Google…" : label}
 {!leaving && <ArrowRight className="h-4 w-4 opacity-40" />}
 </button>

 <div className="flex items-center gap-3">
 <span className="h-px flex-1 bg-border" />
 <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
 or
 </span>
 <span className="h-px flex-1 bg-border" />
 </div>
 </div>
 );
}
