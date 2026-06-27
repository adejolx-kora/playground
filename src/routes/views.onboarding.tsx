import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/views/onboarding")({
  component: Outlet,
});
