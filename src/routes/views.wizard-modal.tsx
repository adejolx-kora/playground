import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Textarea,
} from "@korapay/react";
import {
  banner,
  BannerAnchor,
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  Note,
  NoteContent,
  NoteIcon,
} from "@korapay/react/molecules";
import { createFileRoute } from "@tanstack/react-router";
import * as React from "react";
import { useForm, useWatch } from "react-hook-form";

import {
  WizardModal,
  WizardModalBody,
  WizardModalClose,
  WizardModalContent,
  WizardModalDescription,
  WizardModalFeedback,
  WizardModalFooter,
  WizardModalHeader,
  WizardModalNext,
  WizardModalPrevious,
  WizardModalStep,
  WizardModalSubmit,
  WizardModalTitle,
  WizardModalTrigger,
  type WizardModalStepDefinition,
} from "@/features/wizard-modal";
import { createReactHookFormAdapter } from "@/lib/multistep-form";

export const Route = createFileRoute("/views/wizard-modal")({
  component: RouteComponent,
});

type WizardValues = {
  businessName: string;
  website: string;
  useCase: string;
};

type WizardStepId = "details" | "confirm";

type WizardField = keyof WizardValues;

const initialValues: WizardValues = {
  businessName: "",
  website: "",
  useCase: "",
};

const wizardSteps = [
  {
    id: "details",
    title: "Business details",
    fields: ["businessName", "website", "useCase"],
  },
  {
    id: "confirm",
    title: "Confirm changes",
  },
] as const satisfies readonly WizardModalStepDefinition<
  WizardValues,
  WizardStepId
>[];

const wizardModalBannerAnchorId = "wizard-modal-demo-banner-anchor";

// eslint-disable-next-line react-refresh/only-export-components
function RouteComponent() {
  const [submittedValues, setSubmittedValues] =
    React.useState<WizardValues | null>(null);
  const form = useForm<WizardValues>({
    defaultValues: initialValues,
    mode: "onTouched",
  });

  const values = useWatch({
    control: form.control,
    defaultValue: initialValues,
  }) as WizardValues;

  const adapter = React.useMemo(
    () =>
      createReactHookFormAdapter<WizardValues>({
        getValues: form.getValues,
        trigger: (fields) => form.trigger(fields as WizardField[] | undefined),
        getFieldState: (field) => form.getFieldState(field as WizardField),
        setFocus: (field) => form.setFocus(field as WizardField),
        reset: () => {
          form.reset(initialValues);
        },
      }),
    [form],
  );

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 p-6">
      <Card>
        <CardHeader>
          <CardTitle>Wizard Modal Demo</CardTitle>
          <CardDescription>
            Live usage of the Base UI-style compound `WizardModal` API using
            explicit steps, trigger, content, and typed step values.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            <WizardModal<WizardValues, WizardStepId>
              adapter={adapter}
              steps={wizardSteps}
              resetOnClose
              onComplete={async () => {
                setSubmittedValues(form.getValues());
              }}
            >
              <Field>
                <FieldLabel htmlFor="wizard-open">Open wizard</FieldLabel>
                <FieldDescription>
                  Opens the modal so you can test step validation, navigation,
                  submit, and feedback states.
                </FieldDescription>
                <WizardModalTrigger
                  render={<Button id="wizard-open" type="button" />}
                >
                  Launch Wizard
                </WizardModalTrigger>
              </Field>

              <WizardModalContent className="sm:max-w-xl">
                <WizardModalStep value="details">
                  <WizardModalHeader>
                    <WizardModalTitle>
                      Issue virtual cards to your customers
                    </WizardModalTitle>
                    <WizardModalDescription>
                      Tell us more about your business to help us understand how
                      you would like to use the Card Issuance Service.
                    </WizardModalDescription>
                  </WizardModalHeader>
                  <BannerAnchor id={wizardModalBannerAnchorId} layout="flow" />

                  <WizardModalBody>
                    <FieldGroup>
                      <Field
                        data-invalid={!!form.formState.errors.businessName}
                      >
                        <FieldLabel htmlFor="wizard-business-name">
                          Business name
                        </FieldLabel>
                        <Input
                          id="wizard-business-name"
                          placeholder="Acme Ventures"
                          {...form.register("businessName", {
                            required: "Business name is required.",
                            minLength: {
                              value: 2,
                              message:
                                "Business name must be at least 2 characters.",
                            },
                          })}
                        />
                        {form.formState.errors.businessName ? (
                          <FieldError>
                            {form.formState.errors.businessName.message}
                          </FieldError>
                        ) : null}
                      </Field>

                      <Field data-invalid={!!form.formState.errors.website}>
                        <FieldLabel htmlFor="wizard-website">
                          Website
                        </FieldLabel>
                        <Input
                          id="wizard-website"
                          placeholder="https://acme.example"
                          {...form.register("website", {
                            required: "Website is required.",
                            validate: (value) =>
                              /^https?:\/\//.test(value.trim()) ||
                              "Website must start with http:// or https://.",
                          })}
                        />
                        {form.formState.errors.website ? (
                          <FieldError>
                            {form.formState.errors.website.message}
                          </FieldError>
                        ) : null}
                      </Field>

                      <Field data-invalid={!!form.formState.errors.useCase}>
                        <FieldLabel htmlFor="wizard-use-case">
                          Use case
                        </FieldLabel>
                        <Textarea
                          id="wizard-use-case"
                          placeholder="Describe how card issuance fits your product workflow."
                          {...form.register("useCase", {
                            required: "Use case is required.",
                            minLength: {
                              value: 20,
                              message:
                                "Tell us more in at least 20 characters.",
                            },
                          })}
                        />
                        {form.formState.errors.useCase ? (
                          <FieldError>
                            {form.formState.errors.useCase.message}
                          </FieldError>
                        ) : null}
                      </Field>
                    </FieldGroup>
                    <Note variant="warning" className="mt-6">
                      <NoteIcon />
                      <NoteContent>
                        Modifications you make here will be applied immediately
                        after you save them.
                      </NoteContent>
                    </Note>
                  </WizardModalBody>

                  <WizardModalFooter>
                    <Button
                      type="button"
                      variant="neutral-outline"
                      className="mr-auto"
                      size="lg"
                      onClick={() => {
                        banner.error(
                          "This is a demo. Form values submitted here are not saved anywhere.",
                          {
                            anchorId: wizardModalBannerAnchorId,
                            closeButton: true,
                          },
                        );
                      }}
                    >
                      Show notice
                    </Button>
                    <WizardModalClose>Cancel</WizardModalClose>
                    <WizardModalNext />
                  </WizardModalFooter>
                </WizardModalStep>

                <WizardModalStep value="confirm">
                  <WizardModalHeader>
                    <WizardModalTitle>Confirm changes</WizardModalTitle>
                    <WizardModalDescription>
                      Please confirm that you want to save the changes you have
                      made to this configuration. Saved changes will be applied
                      immediately.
                    </WizardModalDescription>
                  </WizardModalHeader>

                  <WizardModalBody>
                    <FieldGroup>
                      <Field>
                        <FieldLabel>Business name</FieldLabel>
                        <FieldDescription>
                          {values.businessName || "-"}
                        </FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel>Website</FieldLabel>
                        <FieldDescription>
                          {values.website || "-"}
                        </FieldDescription>
                      </Field>
                      <Field>
                        <FieldLabel>Use case</FieldLabel>
                        <FieldDescription>
                          {values.useCase || "-"}
                        </FieldDescription>
                      </Field>
                    </FieldGroup>
                  </WizardModalBody>

                  <WizardModalFooter>
                    <WizardModalPrevious />
                    <WizardModalSubmit>Yes, Confirm</WizardModalSubmit>
                  </WizardModalFooter>
                </WizardModalStep>

                <WizardModalFeedback
                  title="Configuration saved"
                  description="Your card issuance setup has been captured successfully."
                />
              </WizardModalContent>
            </WizardModal>

            {submittedValues ? (
              <Field>
                <FieldLabel>Last submitted payload</FieldLabel>
                <pre className="overflow-x-auto rounded-xs border border-stroke-default-secondary bg-surface-primary p-3 text-body-sm">
                  {JSON.stringify(submittedValues, null, 2)}
                </pre>
              </Field>
            ) : null}
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}
