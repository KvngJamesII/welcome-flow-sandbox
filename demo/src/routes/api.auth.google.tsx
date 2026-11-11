// Demo-only stand-in for server OAuth. The button keeps the original URL contract.
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";
import { BrandHeader, safeRedirect } from "@/components/auth-shell";
import { demoFailure, writeDemo } from "@/lib/demo-state";
export const Route = createFileRoute("/api/auth/google")({
  component: GoogleDemo,
});
function GoogleDemo() {
  useEffect(() => {
    const query = new URLSearchParams(window.location.search);
    const signup = query.get("intent") === "signup";
    const next =
      safeRedirect(query.get("next")) ??
      (signup ? "/generate?starter=1" : "/dashboard");
    const timer = setTimeout(() => {
      if (demoFailure("google")) {
        const params = new URLSearchParams({
          auth_error:
            "Google sign-in didn’t finish. Please try again or use your email.",
          redirect: next,
        });
        if (query.get("ref")) params.set("ref", query.get("ref")!);
        window.location.replace(`${signup ? "/signup" : "/login"}?${params}`);
      } else {
        writeDemo("user", { username: "google_demo" });
        if (signup) {
          writeDemo("booking", null);
          writeDemo("starter_step", "welcome");
        }
        window.location.replace(next);
      }
    }, 900);
    return () => clearTimeout(timer);
  }, []);
  return (
    <div className="site-shell">
      <BrandHeader />
      <main id="main" className="simple-page">
        <Loader2 className="spin mb-6" size={28} />
        <h1>Continuing with Google…</h1>
        <p role="status">
          Simulating sign-in for the demo. No Google account is accessed.
        </p>
      </main>
    </div>
  );
}
