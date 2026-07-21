import {
  Card,
  CardContent,
  CardHeader,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TypographyBody,
  TypographyTitle,
} from "@korapay/react";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
} from "@korapay/react/molecules";
import { GlobeIcon, InfoIcon } from "@phosphor-icons/react";
import { Controller, type UseFormReturn, useWatch } from "react-hook-form";

import { DateInput } from "@/ui/date-input";
import { MultiStepNext, MultiStepPanel } from "@/ui/multistep/multistep";

import type { SignupValues } from "./onboarding-config";

const industryItems = [
  { label: "Agriculture", value: "agriculture" },
  { label: "E-commerce", value: "ecommerce" },
  { label: "Financial services", value: "financial-services" },
  { label: "Healthcare", value: "healthcare" },
  { label: "Technology", value: "technology" },
];

const stateItems = [
  { label: "Abuja (FCT)", value: "abuja" },
  { label: "Lagos", value: "lagos" },
  { label: "Ogun", value: "ogun" },
  { label: "Oyo", value: "oyo" },
  { label: "Rivers", value: "rivers" },
];

const lgaItems = [
  { label: "Eti-Osa", value: "eti-osa" },
  { label: "Ikeja", value: "ikeja" },
  { label: "Lagos Island", value: "lagos-island" },
  { label: "Lagos Mainland", value: "lagos-mainland" },
  { label: "Surulere", value: "surulere" },
];

const businessDescriptionMaxLength = 500;

type BusinessInformationStepProps = {
  form: UseFormReturn<SignupValues>;
};

export function BusinessInformationStep({
  form,
}: BusinessInformationStepProps) {
  const { errors } = form.formState;
  const businessDescription = useWatch({
    control: form.control,
    name: "businessDescription",
  });

  return (
    <MultiStepPanel stepId="business-information">
      <Card className="kora:gap-0 kora:overflow-visible kora:py-0 kora:ring-0">
        <CardHeader className="kora:p-0">
          <TypographyTitle level={5} className="kora:font-semibold">
            Add your business profile
          </TypographyTitle>
          <TypographyBody
            size="md"
            className="kora:mt-2 kora:max-w-md kora:leading-relaxed kora:text-content-default-secondary"
          >
            Tell us more about your business.
          </TypographyBody>
        </CardHeader>

        <CardContent className="kora:mt-7 kora:p-0">
          <FieldGroup className="kora:gap-4">
            <Field data-invalid={Boolean(errors.dateOfBirth)}>
              <FieldLabel htmlFor="signup-date-of-birth">
                Date of Birth
              </FieldLabel>
              <Controller
                control={form.control}
                name="dateOfBirth"
                rules={{ required: "Select your date of birth." }}
                render={({ field }) => (
                  <DateInput
                    ref={field.ref}
                    id="signup-date-of-birth"
                    name={field.name}
                    value={field.value}
                    onValueChange={field.onChange}
                    onBlur={field.onBlur}
                    placeholder="DD/MM/YYYY"
                    triggerAriaLabel="Select date of birth"
                    aria-invalid={Boolean(errors.dateOfBirth)}
                  />
                )}
              />
              <FieldError>{errors.dateOfBirth?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.businessDescription)}>
              <FieldLabel htmlFor="signup-business-description">
                Describe Your Business
              </FieldLabel>
              <InputGroup>
                <InputGroupTextarea
                  id="signup-business-description"
                  className="kora:min-h-28"
                  maxLength={businessDescriptionMaxLength}
                  aria-describedby="signup-business-description-count"
                  aria-invalid={Boolean(errors.businessDescription)}
                  {...form.register("businessDescription", {
                    required: "Describe your business.",
                    minLength: {
                      value: 10,
                      message: "Use at least 10 characters.",
                    },
                    maxLength: {
                      value: businessDescriptionMaxLength,
                      message: `Use no more than ${businessDescriptionMaxLength} characters.`,
                    },
                  })}
                />
                <InputGroupAddon align="block-end" className="kora:justify-end">
                  <InputGroupText
                    id="signup-business-description-count"
                    aria-live="polite"
                    aria-atomic="true"
                  >
                    {businessDescription.length}/{businessDescriptionMaxLength}
                  </InputGroupText>
                </InputGroupAddon>
              </InputGroup>
              <FieldError>{errors.businessDescription?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.industry)}>
              <FieldLabel htmlFor="signup-industry">Industry</FieldLabel>
              <Controller
                control={form.control}
                name="industry"
                rules={{ required: "Select your industry." }}
                render={({ field }) => (
                  <Select
                    items={industryItems}
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? "")}
                  >
                    <SelectTrigger
                      id="signup-industry"
                      className="kora:h-14 kora:w-full"
                      aria-invalid={Boolean(errors.industry)}
                    >
                      <SelectValue placeholder="Select Industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {industryItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{errors.industry?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.website)}>
              <div className="kora:flex kora:items-center kora:gap-1.5">
                <FieldLabel htmlFor="signup-website">
                  Website / Social media URL
                </FieldLabel>
                <Tooltip>
                  <TooltipTrigger
                    type="button"
                    aria-label="Website URL information"
                    className="kora:rounded-full"
                  >
                    <InfoIcon
                      weight="fill"
                      color="#aabdce"
                      size={18}
                      aria-hidden
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    Add a public website or social media page for your business.
                  </TooltipContent>
                </Tooltip>
              </div>
              <InputGroup className="kora:h-14">
                <InputGroupAddon
                  align="inline-start"
                  className="kora:h-full kora:border-r-sm kora:border-input-border kora:pr-3"
                >
                  <GlobeIcon className="kora:size-5" aria-hidden />
                  <InputGroupText>https://</InputGroupText>
                </InputGroupAddon>
                <InputGroupInput
                  id="signup-website"
                  placeholder="Paste web URL link here"
                  aria-invalid={Boolean(errors.website)}
                  {...form.register("website", {
                    required: "Enter your website or social media URL.",
                  })}
                />
              </InputGroup>
              <FieldError>{errors.website?.message}</FieldError>
            </Field>
          </FieldGroup>

          <Separator className="kora:my-8" />

          <section aria-labelledby="business-address-heading">
            <TypographyTitle
              as="h2"
              id="business-address-heading"
              level={5}
              className="kora:font-semibold"
            >
              Business Address
            </TypographyTitle>
            <TypographyBody
              size="md"
              className="kora:mt-2 kora:leading-relaxed kora:text-content-default-secondary"
            >
              Select your state, and provide your full business address. The
              region is pre-filled based on your country of business operation.
            </TypographyBody>

            <FieldGroup className="kora:mt-5 kora:gap-4">
              <Field>
                <FieldLabel htmlFor="signup-country">
                  Country or Region
                </FieldLabel>
                <InputGroup className="kora:h-14 kora:bg-surface-neutral-subtle">
                  <InputGroupAddon align="inline-start">
                    <span aria-hidden>🇳🇬</span>
                  </InputGroupAddon>
                  <InputGroupInput
                    id="signup-country"
                    readOnly
                    aria-readonly="true"
                    {...form.register("country")}
                  />
                  <InputGroupAddon align="inline-end">
                    <Tooltip>
                      <TooltipTrigger
                        type="button"
                        aria-label="Country information"
                        className="kora:rounded-full"
                      >
                        <InfoIcon
                          weight="fill"
                          color="#aabdce"
                          size={18}
                          aria-hidden
                        />
                      </TooltipTrigger>
                      <TooltipContent>
                        Your country is based on your country of business
                        operation.
                      </TooltipContent>
                    </Tooltip>
                  </InputGroupAddon>
                </InputGroup>
              </Field>

              <FieldGroup className="kora:grid kora:grid-cols-1 kora:gap-4 kora:sm:grid-cols-2">
                <Field data-invalid={Boolean(errors.state)}>
                  <FieldLabel htmlFor="signup-state">State</FieldLabel>
                  <Controller
                    control={form.control}
                    name="state"
                    rules={{ required: "Select your state." }}
                    render={({ field }) => (
                      <Select
                        items={stateItems}
                        value={field.value}
                        onValueChange={(value) => field.onChange(value ?? "")}
                      >
                        <SelectTrigger
                          id="signup-state"
                          className="kora:h-14 kora:w-full"
                          aria-invalid={Boolean(errors.state)}
                        >
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent>
                          {stateItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError>{errors.state?.message}</FieldError>
                </Field>

                <Field data-invalid={Boolean(errors.lga)}>
                  <FieldLabel htmlFor="signup-lga">L.G.A</FieldLabel>
                  <Controller
                    control={form.control}
                    name="lga"
                    rules={{ required: "Select your L.G.A." }}
                    render={({ field }) => (
                      <Select
                        items={lgaItems}
                        value={field.value}
                        onValueChange={(value) => field.onChange(value ?? "")}
                      >
                        <SelectTrigger
                          id="signup-lga"
                          className="kora:h-14 kora:w-full"
                          aria-invalid={Boolean(errors.lga)}
                        >
                          <SelectValue placeholder="Select L.G.A" />
                        </SelectTrigger>
                        <SelectContent>
                          {lgaItems.map((item) => (
                            <SelectItem key={item.value} value={item.value}>
                              {item.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                  <FieldError>{errors.lga?.message}</FieldError>
                </Field>
              </FieldGroup>

              <Field data-invalid={Boolean(errors.address)}>
                <FieldLabel htmlFor="signup-address">Address</FieldLabel>
                <Input
                  id="signup-address"
                  className="kora:h-14"
                  placeholder="Enter house number, street name"
                  aria-invalid={Boolean(errors.address)}
                  {...form.register("address", {
                    required: "Enter your business address.",
                  })}
                />
                <FieldError>{errors.address?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.landmark)}>
                <FieldLabel htmlFor="signup-landmark">Landmark</FieldLabel>
                <Input
                  id="signup-landmark"
                  className="kora:h-14"
                  placeholder="Enter nearest landmark"
                  aria-invalid={Boolean(errors.landmark)}
                  {...form.register("landmark")}
                />
                <FieldError>{errors.landmark?.message}</FieldError>
              </Field>
            </FieldGroup>
          </section>

          <MultiStepNext size="xl" className="kora:mt-6 kora:w-full">
            Continue
          </MultiStepNext>
        </CardContent>
      </Card>
    </MultiStepPanel>
  );
}
