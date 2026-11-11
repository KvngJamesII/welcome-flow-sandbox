// Demo destination, not a replacement for the production dashboard.
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Ticket } from "lucide-react";
import { BrandHeader } from "@/components/auth-shell";
import { savedBooking } from "@/lib/starter-demo";
export const Route = createFileRoute("/dashboard")({ component: Dashboard });
function Dashboard() {
  const booking = savedBooking();
  return (
    <div className="site-shell">
      <BrandHeader />
      <main id="main" className="simple-page">
        <span className="state-icon">
          <Ticket size={25} />
        </span>
        <p className="eyebrow">Your account</p>
        <h1>{booking ? "Your code is saved." : "Make yourself at home."}</h1>
        <p>
          {booking
            ? "Your sample code is here when you need it."
            : "Your welcome credits are here when you’re ready."}
        </p>
        <Link to="/generate" className="button primary mt-6">
          {booking ? "View my booking code" : "Get my first code"}
          <ArrowRight size={19} />
        </Link>
        <details className="guide-details">
          <summary>About this demo</summary>
          <div className="guide-detail-body">
            <p>
              No live account or betting activity is created in this sandbox.
            </p>
          </div>
        </details>
        <Link to="/" className="text-action">
          Back to demo home
        </Link>
      </main>
    </div>
  );
}
