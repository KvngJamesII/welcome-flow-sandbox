// Demo scaffold (not production code): landing links for the demo only.
import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: () => (
    <div className="mx-auto flex min-h-screen max-w-md flex-col items-start justify-center gap-4 px-5">
      <h1 className="font-display text-2xl font-extrabold">Welcome flow demo</h1>
      <p className="text-sm text-muted-foreground">
        This demo mounts the real signup and login page code with a stubbed backend.
      </p>
      <Link to="/signup" className="rounded-xl bg-primary px-4 py-3 text-sm font-extrabold text-primary-foreground">
        Open signup
      </Link>
      <Link to="/login" className="text-sm font-bold text-primary hover:underline">
        Open login
      </Link>
    </div>
  ),
});
