import {
  Avatar,
  AvatarImage,
  Card,
  CardContent,
  CardHeader,
  TypographyLabel,
  TypographyTitle,
} from "@korapay/react";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useForm, type FieldPath, type SubmitHandler } from "react-hook-form";

import koraLogo from "@/assets/logo.svg";
import { createTriggerAdapter } from "@/lib/multistep-adapters";
import { MultiStepPrevious, MultiStepRoot } from "@/ui/multistep/multistep";
import { useMultiStepContext } from "@/ui/multistep/use-multistep-context";

import { BankDetailsStep } from "./bank-details-step";
import { BusinessInformationStep } from "./business-information-step";
import { BusinessTypeStep } from "./business-type-step";
import { OnboardingCompletedScreen } from "./completed-screen";
import { DocumentsStep } from "./documents-step";
import {
  initialSignupValues,
  signupSteps,
  type SignupStepId,
  type SignupStepMeta,
  type SignupValues,
} from "./onboarding-config";
import { OnboardingSidebar } from "./onboarding-sidebar";

function OnboardingHeader() {
  const flow = useMultiStepContext<SignupStepId, SignupStepMeta>();

  return (
    <CardHeader className="kora:absolute kora:inset-x-6 kora:top-6 kora:z-10 kora:flex-row kora:items-center kora:justify-between kora:p-0 kora:sm:inset-x-10 kora:sm:top-10">
      {flow.canGoBack ? (
        <MultiStepPrevious
          variant="neutral-ghost"
          className="kora:-ml-3 kora:gap-2 kora:px-3 kora:text-content-default-secondary"
        >
          <ArrowLeftIcon className="kora:size-5" aria-hidden />
          Back
        </MultiStepPrevious>
      ) : (
        <CardHeader className="kora:flex-row kora:items-center kora:gap-2 kora:p-0 kora:lg:hidden">
          <Avatar className="kora:size-9 kora:rounded-none kora:bg-transparent">
            <AvatarImage
              src={koraLogo}
              alt=""
              className="kora:object-contain"
            />
          </Avatar>
          <TypographyTitle as="span" level={5} className="kora:font-semibold">
            kora
          </TypographyTitle>
        </CardHeader>
      )}
    </CardHeader>
  );
}

export function OnboardingFlow() {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const form = useForm<SignupValues>({
    defaultValues: initialSignupValues,
    mode: "onTouched",
  });

  const adapter = useMemo(
    () =>
      createTriggerAdapter<
        SignupStepId,
        SignupValues,
        FieldPath<SignupValues>,
        SignupStepMeta
      >({
        getValues: form.getValues,
        trigger: form.trigger,
        reset: () => form.reset(initialSignupValues),
        invalidReason: "Complete the highlighted fields before continuing.",
      }),
    [form],
  );

  const handleSubmit: SubmitHandler<SignupValues> = () => {
    setSubmitted(true);
  };

  return (
    <MultiStepRoot<SignupStepId, SignupValues, SignupStepMeta>
      steps={signupSteps}
      validateOn="forward"
      adapter={adapter}
      className="kora:min-h-svh kora:w-full"
    >
      {(flow) => (
        <Card className="kora:grid kora:min-h-svh kora:w-full kora:grid-cols-1 kora:gap-0 kora:overflow-auto kora:rounded-none kora:bg-surface-primary kora:py-0 kora:ring-0 kora:lg:grid-cols-[28%_72%]">
          <OnboardingSidebar completed={submitted} />

          {submitted ? (
            <OnboardingCompletedScreen
              onGoToDashboard={() => void navigate({ to: "/" })}
            />
          ) : (
            <Card className="kora:relative kora:h-svh kora:gap-0 kora:overflow-hidden kora:rounded-none kora:bg-surface-primary kora:py-0 kora:ring-0">
              <OnboardingHeader />

              <CardContent className="kora:flex kora:min-h-0 kora:flex-1 kora:items-start kora:justify-center kora:overflow-y-auto kora:px-5 kora:pt-28 kora:pb-16 kora:sm:px-10">
                <Card className="kora:my-auto kora:w-full kora:max-w-135 kora:gap-0 kora:overflow-visible kora:py-0 kora:ring-0">
                  <BusinessTypeStep form={form} />
                  <BusinessInformationStep form={form} />
                  <DocumentsStep form={form} />
                  <BankDetailsStep form={form} onSubmit={handleSubmit} />

                  <TypographyLabel className="kora:sr-only" aria-live="polite">
                    {flow.blockedReason}
                  </TypographyLabel>
                </Card>
              </CardContent>
            </Card>
          )}
        </Card>
      )}
    </MultiStepRoot>
  );
}
