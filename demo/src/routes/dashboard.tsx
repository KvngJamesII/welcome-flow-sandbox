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
            ? "You can return to your booking code and review its selections at any time in this demo."
            : "Your 150 welcome credits are here when you’re ready. They cover your first Today booking code."}
        </p>
        <Link to="/generate" className="button primary mt-6">
          {booking ? "View my booking code" : "Get my first code"}
          <ArrowRight size={19} />
        </Link>
        <p className="demo-note">
          This is the sandbox dashboard. No live account or betting activity is
          created.
        </p>
        <Link to="/" className="text-action">
          Back to demo home
        </Link>
      </main>
    </div>
  );
}
