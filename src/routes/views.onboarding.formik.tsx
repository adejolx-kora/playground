import { createFileRoute } from "@tanstack/react-router";

import { FormikOnboardingPage } from "@/features/onboarding-flows";

export const Route = createFileRoute("/views/onboarding/formik")({
  component: FormikOnboardingPage,
});
