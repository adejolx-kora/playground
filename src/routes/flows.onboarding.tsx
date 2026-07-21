import { createFileRoute } from "@tanstack/react-router";

import { OnboardingFlow } from "@/features/onboarding/onboarding-flow";

export const Route = createFileRoute("/flows/onboarding")({
  component: OnboardingFlow,
});
