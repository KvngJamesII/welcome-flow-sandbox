import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { BrandHeader } from "@/components/auth-shell";
export const Route = createFileRoute("/")({
  component: () => (
    <div className="site-shell">
      <BrandHeader />
      <main id="main" className="simple-page">
        <p className="eyebrow">Design sandbox</p>
        <h1>The welcome flow.</h1>
        <p>
          Explore signup, login and your first booking code. This demo uses
          sample data and makes no calls to the production backend.
        </p>
        <Link to="/signup" className="button primary mt-6">
          Open signup <ArrowRight size={18} />
        </Link>
        <Link to="/login" className="text-action">
          Open login
        </Link>
      </main>
    </div>
  ),
});
