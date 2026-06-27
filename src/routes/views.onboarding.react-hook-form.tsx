import { createFileRoute } from "@tanstack/react-router";

import { ReactHookFormOnboardingPage } from "@/features/onboarding-flows";

export const Route = createFileRoute("/views/onboarding/react-hook-form")({
  component: ReactHookFormOnboardingPage,
});
