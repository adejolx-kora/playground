import {
  Avatar,
  AvatarFallback,
  AvatarIcon,
  Button,
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  TypographyBody,
  TypographyTitle,
} from "@korapay/react";
import {
  Stepper,
  StepperConnector,
  StepperContent,
  StepperIndicator,
  StepperItem,
  StepperRail,
  StepperTitle,
} from "@korapay/react/molecules";
import { CheckIcon, SignOutIcon } from "@phosphor-icons/react";

import { cn } from "@/lib/utils";
import { MultiStepTrigger } from "@/ui/multistep/multistep";
import { useMultiStepContext } from "@/ui/multistep/use-multistep-context";

import type { SignupStepId, SignupStepMeta } from "./onboarding-config";

const interactiveSteps = [
  { label: "Business Type", stepId: "business-profile" },
  { label: "Business Profile", stepId: "business-information" },
  { label: "Documents", stepId: "documents" },
  { label: "Bank Details", stepId: "bank-details" },
] satisfies readonly { label: string; stepId: SignupStepId }[];

function OnboardingStep({
  completed,
  label,
  stepId,
}: {
  completed: boolean;
  label: string;
  stepId: SignupStepId;
}) {
  const flow = useMultiStepContext<SignupStepId, SignupStepMeta>();
  const state = flow.getStepState(stepId);
  const isComplete =
    state === "complete" || (completed && stepId === "bank-details");
  const isCurrent = state === "current" && !isComplete;

  return (
    <StepperItem
      status={isComplete ? "completed" : isCurrent ? "current" : undefined}
    >
      <StepperRail>
        <StepperIndicator
          className={cn(
            isComplete &&
              "kora:border-checkout-green-500 kora:bg-checkout-green-500 kora:text-content-inverse-primary",
            isCurrent && "kora:border-2 kora:border-blue-500",
          )}
        >
          {isComplete && <CheckIcon weight="bold" className="kora:size-3" />}
        </StepperIndicator>
        <StepperConnector
          className={cn(isComplete && "kora:bg-checkout-green-500")}
        />
      </StepperRail>
      <StepperContent>
        <StepperTitle
          className={cn(
            "kora:text-content-default-tertiary",
            isCurrent && "kora:text-content-brand-primary",
          )}
        >
          <MultiStepTrigger
            stepId={stepId}
            variant="neutral-ghost"
            className="kora:h-auto kora:w-full kora:justify-start kora:bg-transparent kora:p-0 kora:text-label-md kora:text-inherit kora:hover:bg-transparent"
          >
            {label}
          </MultiStepTrigger>
        </StepperTitle>
      </StepperContent>
    </StepperItem>
  );
}

type OnboardingSidebarProps = {
  completed?: boolean;
};

export function OnboardingSidebar({
  completed = false,
}: OnboardingSidebarProps) {
  return (
    <Card className="kora:hidden kora:h-svh kora:gap-0 kora:overflow-hidden kora:rounded-none kora:bg-surface-neutral-subtle kora:py-0 kora:ring-0 kora:lg:flex">
      <div className="kora:min-h-0 kora:flex-1 kora:overflow-y-auto">
        <div className="kora:flex kora:min-h-full kora:flex-col kora:justify-between kora:gap-12 kora:px-11 kora:py-12">
          <CardHeader className="kora:flex kora:flex-row kora:items-center kora:gap-2 kora:p-0">
            <Avatar size="xl" className="kora:size-auto!">
              <AvatarFallback className="kora:rounded-none kora:bg-transparent! kora:p-0">
                <AvatarIcon name="brand" />
              </AvatarFallback>
            </Avatar>
            <TypographyTitle
              as="span"
              level={4}
              className="kora:font-semibold kora:tracking-tight kora:text-content-default-primary"
            >
              kora
            </TypographyTitle>
          </CardHeader>

          <CardContent className="kora:flex kora:flex-col kora:gap-3 kora:p-0">
            <TypographyTitle
              level={4}
              className="kora:max-w-72 kora:leading-tight kora:font-semibold kora:text-content-default-primary"
            >
              Set up your business account
            </TypographyTitle>
            <TypographyBody
              size="md"
              className="kora:text-content-default-tertiary"
            >
              Activate your business payments in quick and simple steps.
            </TypographyBody>

            <Stepper orientation="vertical" className="kora:pt-16">
              {interactiveSteps.map((step) => (
                <OnboardingStep
                  key={step.stepId}
                  completed={completed}
                  {...step}
                />
              ))}
            </Stepper>
          </CardContent>

          <CardFooter className="kora:border-t-0 kora:bg-transparent kora:p-0">
            <Button
              variant="neutral-ghost"
              className="kora:gap-8 kora:pl-0"
              size="lg"
            >
              <SignOutIcon className="kora:size-5!" />
              <span>I&apos;ll do this later</span>
            </Button>
          </CardFooter>
        </div>
      </div>
    </Card>
  );
}
