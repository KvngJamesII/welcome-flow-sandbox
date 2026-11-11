import { createRootRoute, HeadContent, Outlet } from "@tanstack/react-router";
export const Route = createRootRoute({
  head: () => ({ meta: [{ title: "SportyPunter · Welcome flow demo" }] }),
  component: () => (
    <>
      <HeadContent />
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <Outlet />
    </>
  ),
});
