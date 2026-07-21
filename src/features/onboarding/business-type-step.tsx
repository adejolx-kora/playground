import {
  Card,
  CardContent,
  RadioGroup,
  RadioGroupItem,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TypographyBody,
  TypographyTitle,
} from "@korapay/react";
import {
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@korapay/react/molecules";
import {
  BriefcaseIcon,
  HeartIcon,
  InfoIcon,
  UserIcon,
} from "@phosphor-icons/react";
import { Controller, useWatch, type UseFormReturn } from "react-hook-form";

import { MultiStepNext, MultiStepPanel } from "@/ui/multistep/multistep";

import type { SignupValues } from "./onboarding-config";

const businessTypeItems = [
  {
    label: "Individual",
    value: "individual",
    Icon: UserIcon,
    tooltip: (
      <span>
        <span>
          <strong>Note</strong>: Individuals can accept and manage online
          payments on Korapay. This type of business must provide valid
          identification and proof of address to verify their identity and
          location.
        </span>
        <ul className="kora:list-disc kora:pl-4">
          <li>Valid ID</li>
          <li>Proof of Address</li>
        </ul>
      </span>
    ),
  },
  {
    label: "Non-Governmental Organisation (NGO)",
    value: "ngo",
    Icon: HeartIcon,
    tooltip: (
      <span>
        <span>
          <strong>Note</strong>: Non-governmental organizations can accept and
          manage online payments on Korapay. This type of business must be duly
          registered with regulators of their country, and must be licensed to
          operate in their respective industries. As an NGO you will be required
          to provide;
        </span>
        <ul className="kora:list-disc kora:pl-4">
          <li>Certificate of Incorporation</li>
          <li>Proof of Address</li>
          <li>Due Diligence Questionnaire</li>
        </ul>
      </span>
    ),
  },
  {
    label: "Registered Business",
    value: "registered-business",
    Icon: BriefcaseIcon,
    tooltip: (
      <span>
        <span>
          <strong>Note</strong>: Registered businesses can accept and manage
          online payments on Korapay. This type of business must be duly
          registered with regulators of their country, and must be licensed to
          operate in their respective industries. As a registered business you
          will be required to provide;
        </span>
        <ul className="kora:list-disc kora:pl-4">
          <li>Certificate of Incorporation</li>
          <li>Proof of Address</li>
          <li>Due Diligence Questionnaire</li>
        </ul>
      </span>
    ),
  },
];

export function BusinessTypeStep({
  form,
}: {
  form: UseFormReturn<SignupValues>;
}) {
  const businessType = useWatch({
    control: form.control,
    name: "businessType",
  });
  const { errors } = form.formState;

  return (
    <MultiStepPanel stepId="business-profile">
      <Card className="kora:gap-0 kora:overflow-visible kora:py-0 kora:ring-0">
        <CardContent className="kora:mt-7 kora:p-0">
          <FieldSet data-invalid={Boolean(errors.businessType)}>
            <FieldLegend variant="label">
              <TypographyTitle level={5} className="kora:font-semibold">
                Which best describes your business?
              </TypographyTitle>
              <TypographyBody
                size="md"
                className="kora:mt-6 kora:leading-relaxed kora:text-content-default-secondary"
              >
                Depending on your business type, a few necessary documents will
                be required for verification and security reasons.
              </TypographyBody>
            </FieldLegend>
            <Controller
              control={form.control}
              name="businessType"
              rules={{ required: "Select a business type." }}
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="kora:mt-3 kora:gap-4"
                  aria-label="Business type"
                >
                  {businessTypeItems.map(({ label, value, Icon, tooltip }) => (
                    <FieldLabel
                      key={value}
                      className="kora:flex kora:h-16 kora:w-full kora:cursor-pointer kora:items-center kora:gap-4 kora:rounded-3xs kora:border-sm kora:border-stroke-default-tertiary kora:px-4 kora:text-base kora:font-medium kora:text-content-default-primary kora:transition-colors kora:hover:bg-surface-neutral-subtle kora:has-data-checked:border-stroke-brand-primary kora:has-data-checked:bg-transparent kora:has-data-checked:text-content-brand-primary"
                    >
                      <Icon className="kora:size-5" weight="fill" aria-hidden />
                      {label}
                      <RadioGroupItem value={value} className="kora:sr-only" />

                      <Tooltip>
                        <TooltipTrigger className="kora:ml-auto">
                          <InfoIcon weight="fill" color="#aabdce" size={20} />
                        </TooltipTrigger>
                        <TooltipContent className="kora:bg-surface-brand-primary kora:text-white">
                          {tooltip}
                        </TooltipContent>
                      </Tooltip>
                    </FieldLabel>
                  ))}
                </RadioGroup>
              )}
            />
            <FieldError>{errors.businessType?.message}</FieldError>
          </FieldSet>

          <MultiStepNext
            size="xl"
            className="kora:mt-6 kora:w-full"
            disabled={!businessType}
          >
            Continue
          </MultiStepNext>
        </CardContent>
      </Card>
    </MultiStepPanel>
  );
}
