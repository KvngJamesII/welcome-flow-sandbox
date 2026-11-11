import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Check, Gift, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import { captureReferralCode } from "@/lib/referral";
import {
 AuthShell,
 Field,
 PasswordInput,
 inputClass,
 useRedirectAfterAuth,
} from "@/components/auth-shell";
import { GoogleButton } from "@/components/google-button";
import { privatePage } from "@/lib/seo";

export const Route = createFileRoute("/signup")({
 // All optional, so the many `<Link to="/signup" search={{ redirect: undefined }}>`
 // call sites elsewhere do not all have to name every key.
 validateSearch: (
 search: Record<string, unknown>,
 ): { redirect?: string; ref?: string; auth_error?: string } => ({
 redirect:
 typeof search.redirect === "string" && search.redirect.startsWith("/")
 ? search.redirect
 : undefined,
 ref: typeof search.ref === "string" ? search.ref : undefined,
 // Set by the Google callback when the round trip fails.
 auth_error: typeof search.auth_error === "string" ? search.auth_error : undefined,
 }),
 head: () => privatePage("Create account", "/signup"),
 component: SignupPage,
});

/**
 * Signup takes a username, an email and a password.
 *
 * The email is not verified here. mail delivery never blocks account creation . 
 * but it is required, because it is the only way a locked-out punter can reset
 * their own password.
 *
 * A referral code is optional and pre-filled from the link the punter arrived on,
 * including one they followed several pages ago; see src/lib/referral.ts.
 */
function SignupPage() {
 const { signup } = useAuth();
 const { redirect, auth_error: authError } = Route.useSearch();
 const goOn = useRedirectAfterAuth();

 const [username, setUsername] = useState("");
 const [email, setEmail] = useState("");
 const [password, setPassword] = useState("");
 const [referralCode, setReferralCode] = useState("");
 const [fromLink, setFromLink] = useState(false);
 const [errors, setErrors] = useState<Record<string, string>>({});
 const [busy, setBusy] = useState(false);
 const [availability, setAvailability] = useState<"idle" | "checking" | "free" | "taken" | "bad">(
 "idle",
 );

 // Pre-fill from ?ref= or a code stashed when they first landed on the site.
 useEffect(() => {
 const code = captureReferralCode();
 if (code) {
 setReferralCode(code);
 setFromLink(true);
 }
 }, []);

 // Show a failed Google round trip once, then clean the URL so a refresh does
 // not replay it.
 useEffect(() => {
 if (!authError) return;
 toast.error(authError);
 window.history.replaceState({}, "", window.location.pathname);
 }, [authError]);

 const clean = username.trim().toLowerCase();

 // Check the username as they type so a clash is not a surprise on submit.
 useEffect(() => {
 if (clean.length === 0) {
 setAvailability("idle");
 return;
 }
 if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
 setAvailability("bad");
 return;
 }
 setAvailability("checking");
 const timer = setTimeout(() => {
 api
 .checkUsername(clean)
 .then((result) => setAvailability(result.available ? "free" : "taken"))
 .catch(() => setAvailability("idle"));
 }, 400);
 return () => clearTimeout(timer);
 }, [clean]);

 const submit = async (event: React.FormEvent) => {
 event.preventDefault();
 const next: Record<string, string> = {};
 if (!/^[a-z0-9_]{3,20}$/.test(clean)) {
 next.username = "3-20 letters, numbers or underscores";
 }
 if (availability === "taken") next.username = "That username is taken";
 if (!email.trim()) {
 next.email = "Enter your email address";
 } else if (!/^\S+@\S+\.\S+$/.test(email.trim())) {
 next.email = "Enter a valid email";
 }
 if (password.length < 8) next.password = "Use at least 8 characters";
 setErrors(next);
 if (Object.keys(next).length) return;

 setBusy(true);
 try {
 await signup({
 username: clean,
 email: email.trim(),
 password,
 referralCode: referralCode.trim().toUpperCase() || undefined,
 });
 toast.success("Account created");
 goOn(redirect ?? "/generate?starter=1");
 } catch (error) {
 toast.error(error instanceof Error ? error.message : "Could not create your account");
 } finally {
 setBusy(false);
 }
 };

 return (
 <AuthShell
 title={
 <>
 Start punting
 <br />
 <span className="text-primary">smarter.</span>
 </>
 }
 subtitle="Pick a username, add your email, and you're in."
 footer={
 <>
 Already have an account?{" "}
 <Link
 to="/login"
 search={{ redirect: undefined }}
 className="font-bold text-primary hover:underline"
 >
 Log in
 </Link>
 </>
 }
 >
 <GoogleButton
 label="Sign up with Google"
 intent="signup"
 returnTo={redirect ?? "/generate?starter=1"}
 />

 <form onSubmit={submit} className="space-y-4" noValidate>
 <Field
 id="username"
 label="Username"
 error={errors.username}
 hint={
 availability === "checking" ? (
 <span className="inline-flex items-center gap-1">
 <Loader2 className="h-3 w-3 animate-spin" /> checking
 </span>
 ) : availability === "free" ? (
 <span className="inline-flex items-center gap-1 font-bold text-success">
 <Check className="h-3 w-3" /> available
 </span>
 ) : availability === "taken" ? (
 <span className="inline-flex items-center gap-1 font-bold text-destructive">
 <X className="h-3 w-3" /> taken
 </span>
 ) : undefined
 }
 >
 <input
 id="username"
 value={username}
 onChange={(event) => setUsername(event.target.value)}
 placeholder="yourname"
 autoComplete="username"
 autoCapitalize="none"
 className={inputClass}
 />
 </Field>

 <Field id="email" label="Email" error={errors.email}>
 <input
 id="email"
 type="email"
 value={email}
 onChange={(event) => setEmail(event.target.value)}
 placeholder="you@example.com"
 autoComplete="email"
 className={inputClass}
 />
 </Field>

 <Field id="password" label="Password" error={errors.password}>
 <PasswordInput
 id="password"
 value={password}
 onChange={setPassword}
 placeholder="At least 8 characters"
 autoComplete="new-password"
 />
 </Field>

 <Field
 id="referral"
 label="Referral code"
 hint={
 fromLink ? (
 <span className="inline-flex items-center gap-1 font-bold text-success">
 <Gift className="h-3 w-3" /> applied from your invite link
 </span>
 ) : (
 <span className="text-muted-foreground">optional</span>
 )
 }
 >
 <input
 id="referral"
 value={referralCode}
 onChange={(event) => {
 setReferralCode(event.target.value.toUpperCase());
 setFromLink(false);
 }}
 placeholder="Enter a code if you have one"
 autoCapitalize="characters"
 autoComplete="off"
 spellCheck={false}
 className={inputClass}
 />
 </Field>

 <button
 type="submit"
 disabled={busy || availability === "taken"}
 className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
 >
 {busy ? (
 <>
 <Loader2 className="h-4 w-4 animate-spin" /> Creating account…
 </>
 ) : (
 <>
 Create account <ArrowRight className="h-4 w-4" />
 </>
 )}
 </button>

 <p className="text-center text-[11px] leading-relaxed text-muted-foreground">
 18+ only. SportyPunter is an analysis tool, not a guarantee of winning. By continuing you
 accept our{" "}
 <Link to="/terms" className="font-semibold underline">
 terms
 </Link>{" "}
 and{" "}
 <Link to="/privacy" className="font-semibold underline">
 privacy policy
 </Link>
 .
 </p>
 </form>
 </AuthShell>
 );
}
