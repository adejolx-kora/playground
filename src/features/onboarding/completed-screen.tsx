import {
  Button,
  Card,
  CardContent,
  TypographyBody,
  TypographyTitle,
} from "@korapay/react";
import { CheckIcon } from "@phosphor-icons/react";

type OnboardingCompletedScreenProps = {
  onGoToDashboard: () => void;
};

export function OnboardingCompletedScreen({
  onGoToDashboard,
}: OnboardingCompletedScreenProps) {
  return (
    <Card className="kora:flex kora:min-h-svh kora:w-full kora:items-center kora:justify-center kora:rounded-none kora:bg-surface-primary kora:px-5 kora:py-16 kora:ring-0">
      <CardContent
        className="kora:flex kora:max-w-115 kora:flex-col kora:items-center kora:p-0 kora:text-center"
        aria-labelledby="onboarding-completed-title"
      >
        <div className="kora:flex kora:size-16 kora:items-center kora:justify-center kora:rounded-full kora:bg-surface-success-subtle kora:text-content-success-primary">
          <CheckIcon weight="bold" className="kora:size-7" aria-hidden />
        </div>

        <div className="kora:mt-8" role="status" aria-live="polite">
          <TypographyTitle
            id="onboarding-completed-title"
            level={4}
            className="kora:font-semibold"
          >
            All done!
          </TypographyTitle>
          <TypographyBody
            size="md"
            className="kora:mt-5 kora:leading-relaxed kora:text-content-default-secondary"
          >
            Your business&apos; details have been submitted successfully, and
            are under review. You can continue to use your dashboard in{" "}
            <strong>Test Mode.</strong>
          </TypographyBody>
        </div>

        <Button
          type="button"
          size="xl"
          className="kora:mt-10 kora:min-w-59"
          onClick={onGoToDashboard}
        >
          Go to Dashboard
        </Button>
      </CardContent>
    </Card>
  );
}
