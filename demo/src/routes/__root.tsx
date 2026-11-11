// Demo scaffold (not production code): minimal root route so the real pages run.
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
  component: () => <Outlet />,
});
