import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import {
 AuthShell,
 Field,
 PasswordInput,
 inputClass,
 useRedirectAfterAuth,
} from "@/components/auth-shell";
import { GoogleButton } from "@/components/google-button";
import { privatePage } from "@/lib/seo";

export const Route = createFileRoute("/login")({
 validateSearch: (
 search: Record<string, unknown>,
 ): { redirect?: string; auth_error?: string } => ({
 redirect:
 typeof search.redirect === "string" && search.redirect.startsWith("/")
 ? search.redirect
 : undefined,
 // Set by the Google callback when the round trip fails: the browser is doing a
 // top-level navigation there, so the reason has to travel in the URL.
 auth_error: typeof search.auth_error === "string" ? search.auth_error : undefined,
 }),
 head: () => privatePage("Log in", "/login"),
 component: LoginPage,
});

function LoginPage() {
 const { user, loading, login } = useAuth();
 const navigate = useNavigate();
 const { redirect, auth_error: authError } = Route.useSearch();
 const goOn = useRedirectAfterAuth();
 const [identifier, setIdentifier] = useState("");
 const [password, setPassword] = useState("");
 const [errors, setErrors] = useState<Record<string, string>>({});
 const [busy, setBusy] = useState(false);

 // Show a failed Google round trip once, then clean the URL so a refresh or a
 // shared link does not replay the error.
 useEffect(() => {
 if (loading || !user) return;
 navigate({ to: "/dashboard", replace: true });
 }, [loading, user, navigate]);

 useEffect(() => {
 if (!authError) return;
 toast.error(authError);
 window.history.replaceState({}, "", window.location.pathname);
 }, [authError]);

 const submit = async (event: React.FormEvent) => {
 event.preventDefault();
 const next: Record<string, string> = {};
 if (identifier.trim().length < 3) next.identifier = "Enter your username or email";
 if (password.length < 8) next.password = "Password must be at least 8 characters";
 setErrors(next);
 if (Object.keys(next).length) return;

 setBusy(true);
 try {
 await login(identifier.trim(), password);
 toast.success("Welcome back");
 goOn(redirect);
 } catch (error) {
 toast.error(error instanceof Error ? error.message : "Login failed");
 } finally {
 setBusy(false);
 }
 };

 if (user) return null;

 return (
 <AuthShell
 title={
 <>
 Welcome back,
 <br />
 <span className="text-primary">punter.</span>
 </>
 }
 subtitle="Sign in with your username or email to pick up where you left off."
 footer={
 <>
 New here?{" "}
 <Link
 to="/signup"
 search={{ redirect: undefined }}
 className="font-bold text-primary hover:underline"
 >
 Create an account
 </Link>
 </>
 }
 >
 <GoogleButton label="Sign in with Google" returnTo={redirect ?? "/dashboard"} />

 <form onSubmit={submit} className="space-y-4" noValidate>
 <Field id="identifier" label="Username or email" error={errors.identifier}>
 <input
 id="identifier"
 value={identifier}
 onChange={(event) => setIdentifier(event.target.value)}
 placeholder="yourname"
 autoComplete="username"
 autoCapitalize="none"
 className={inputClass}
 />
 </Field>

 <Field
 id="password"
 label="Password"
 error={errors.password}
 hint={
 <Link
 to="/forgot-password"
 search={{ email: "" }}
 className="font-bold text-primary hover:underline"
 >
 Forgot?
 </Link>
 }
 >
 <PasswordInput
 id="password"
 value={password}
 onChange={setPassword}
 placeholder="Your password"
 autoComplete="current-password"
 />
 </Field>

 <button
 type="submit"
 disabled={busy}
 className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-extrabold text-primary-foreground transition hover:opacity-90 disabled:opacity-60"
 >
 {busy ? (
 <>
 <Loader2 className="h-4 w-4 animate-spin" /> Signing in…
 </>
 ) : (
 <>
 Log in <ArrowRight className="h-4 w-4" />
 </>
 )}
 </button>
 </form>
 </AuthShell>
 );
}
