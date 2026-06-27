import { createFileRoute } from "@tanstack/react-router";

import { VanillaOnboardingPage } from "@/features/onboarding-flows";

export const Route = createFileRoute("/views/onboarding/vanilla")({
  component: VanillaOnboardingPage,
});
