import { Link } from "@tanstack/react-router";
import { ArrowLeft } from "lucide-react";
import { BrandHeader } from "./auth-shell";
export function LegalPage({ title }: { title: string }) {
  return (
    <div className="site-shell">
      <BrandHeader />
      <main id="main" className="simple-page">
        <p className="eyebrow">SportyPunter sandbox</p>
        <h1>{title}</h1>
        <p>
          The product’s {title.toLowerCase()} were not included in this
          repository. This demo does not create a live account, accept bets, or
          take payments.
        </p>
        <p className="demo-note">
          The production flow must link to the existing, approved{" "}
          {title.toLowerCase()}. No substitute legal policy is implied here.
        </p>
        <Link to="/signup" className="text-action">
          <ArrowLeft size={16} /> Back to signup
        </Link>
      </main>
    </div>
  );
}
