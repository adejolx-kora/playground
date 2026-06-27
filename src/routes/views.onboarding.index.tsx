import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/views/onboarding/")({
  beforeLoad: () => {
    throw redirect({ to: "/views/onboarding/vanilla" });
  },
});
