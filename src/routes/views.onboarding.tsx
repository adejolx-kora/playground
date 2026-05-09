import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
} from "@korapay/react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@korapay/react/molecules";
import { createFileRoute } from "@tanstack/react-router";
import { useFormik } from "formik";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";

import { useMultiStepForm } from "@/hooks/use-multi-step-form";
import {
  createFormikAdapter,
  createReactHookFormAdapter,
  type MultiStepFormAdapter,
  type MultiStepFormStep,
} from "@/lib/multistep-form";

export const Route = createFileRoute("/views/onboarding")({
  component: RouteComponent,
});

type OnboardingStepId = "account" | "profile" | "preferences" | "review";

type BaseOnboardingValues = {
  fullName: string;
  email: string;
  company: string;
  role: string;
  useCase: string;
  updates: boolean;
};

const initialValues: BaseOnboardingValues = {
  fullName: "",
  email: "",
  company: "",
  role: "",
  useCase: "",
  updates: false,
};

const stepLabels: Record<OnboardingStepId, string> = {
  account: "Account",
  profile: "Profile",
  preferences: "Preferences",
  review: "Review",
};

function StepStatusBadge({
  status,
}: {
  status: "pending" | "current" | "complete";
}) {
  if (status === "complete") {
    return <Badge variant="success">Complete</Badge>;
  }

  if (status === "current") {
    return <Badge variant="neutral">Current</Badge>;
  }

  return <Badge variant="neutral">Pending</Badge>;
}

function StepRail({
  stepOrder,
  currentStep,
  getStepStatus,
  onStepClick,
}: {
  stepOrder: readonly OnboardingStepId[];
  currentStep: OnboardingStepId;
  getStepStatus: (step: OnboardingStepId) => "pending" | "current" | "complete";
  onStepClick: (step: OnboardingStepId) => void;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Steps</CardTitle>
        <CardDescription>
          Jump between completed steps or continue in order.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          {stepOrder.map((stepId, index) => {
            const status = getStepStatus(stepId);

            return (
              <Field key={stepId}>
                <Button
                  type="button"
                  variant={
                    currentStep === stepId ? "primary" : "neutral-outline"
                  }
                  onClick={() => {
                    onStepClick(stepId);
                  }}
                  className="w-full justify-between"
                >
                  <span>
                    {index + 1}. {stepLabels[stepId]}
                  </span>
                  <StepStatusBadge status={status} />
                </Button>
              </Field>
            );
          })}
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

function SummaryCard({
  title,
  values,
}: {
  title: string;
  values: BaseOnboardingValues;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <FieldGroup>
          <Field>
            <FieldLabel>Full name</FieldLabel>
            <FieldDescription>{values.fullName || "-"}</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Email</FieldLabel>
            <FieldDescription>{values.email || "-"}</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Company</FieldLabel>
            <FieldDescription>{values.company || "-"}</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Role</FieldLabel>
            <FieldDescription>{values.role || "-"}</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Use case</FieldLabel>
            <FieldDescription>{values.useCase || "-"}</FieldDescription>
          </Field>
          <Field>
            <FieldLabel>Product updates</FieldLabel>
            <FieldDescription>
              {values.updates ? "Subscribed" : "Not subscribed"}
            </FieldDescription>
          </Field>
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

function VanillaOnboardingFlow() {
  const [values, setValues] =
    React.useState<BaseOnboardingValues>(initialValues);
  const [errors, setErrors] = React.useState<
    Partial<Record<keyof BaseOnboardingValues, string>>
  >({});
  const [touched, setTouched] = React.useState<
    Partial<Record<keyof BaseOnboardingValues, boolean>>
  >({});
  const [submittedValues, setSubmittedValues] =
    React.useState<BaseOnboardingValues | null>(null);

  const validateField = React.useCallback(
    (
      field: keyof BaseOnboardingValues,
      fieldValue: BaseOnboardingValues[keyof BaseOnboardingValues],
    ) => {
      if (field === "fullName") {
        if (!String(fieldValue).trim()) return "Full name is required.";
      }

      if (field === "email") {
        if (!String(fieldValue).trim()) return "Email is required.";
        if (!String(fieldValue).includes("@"))
          return "Enter a valid email address.";
      }

      if (field === "company" && !String(fieldValue).trim()) {
        return "Company is required.";
      }

      if (field === "role" && !String(fieldValue).trim()) {
        return "Please select a role.";
      }

      if (field === "useCase" && String(fieldValue).trim().length < 10) {
        return "Describe your use case in at least 10 characters.";
      }

      return undefined;
    },
    [],
  );

  const adapter = React.useMemo<MultiStepFormAdapter<BaseOnboardingValues>>(
    () => ({
      getValues: () => values,
      validateFields: async (fields) => {
        const nextErrors: Partial<Record<keyof BaseOnboardingValues, string>> =
          {};

        fields.forEach((fieldName) => {
          const key = fieldName as keyof BaseOnboardingValues;
          const message = validateField(key, values[key]);

          if (message) {
            nextErrors[key] = message;
          }
        });

        setErrors((previous) => ({ ...previous, ...nextErrors }));
        return Object.keys(nextErrors).length === 0;
      },
      touchFields: (fields) => {
        setTouched((previous) => {
          const next = { ...previous };
          fields.forEach((field) => {
            next[field as keyof BaseOnboardingValues] = true;
          });
          return next;
        });
      },
      getFieldError: (field) => errors[field as keyof BaseOnboardingValues],
      isFieldTouched: (field) =>
        Boolean(touched[field as keyof BaseOnboardingValues]),
    }),
    [errors, touched, validateField, values],
  );

  const steps = React.useMemo<
    readonly MultiStepFormStep<BaseOnboardingValues, OnboardingStepId>[]
  >(
    () => [
      { id: "account", title: "Create account", fields: ["fullName", "email"] },
      { id: "profile", title: "Team profile", fields: ["company", "role"] },
      { id: "preferences", title: "Preferences", fields: ["useCase"] },
      {
        id: "review",
        title: "Review & submit",
        validate: ({ values: currentValues }) => currentValues.updates,
      },
    ],
    [],
  );

  const flow = useMultiStepForm<BaseOnboardingValues, OnboardingStepId>({
    steps,
    adapter,
    onComplete: async ({ values: finalValues }) => {
      setSubmittedValues(finalValues);
    },
  });

  const onFieldChange = <TKey extends keyof BaseOnboardingValues>(
    key: TKey,
    nextValue: BaseOnboardingValues[TKey],
  ) => {
    setValues((previous) => ({ ...previous, [key]: nextValue }));
    setErrors((previous) => ({ ...previous, [key]: undefined }));
  };

  const stepOrder = steps.map((step) => step.id);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
      <StepRail
        stepOrder={stepOrder}
        currentStep={flow.currentStep.id}
        getStepStatus={flow.getStepStatus}
        onStepClick={(step) => {
          void flow.goToStep(step);
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Vanilla Utility</CardTitle>
          <CardDescription>
            Step {flow.currentStepIndex + 1} of {flow.totalSteps}:{" "}
            {flow.currentStep.title}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {flow.currentStep.id === "account" && (
              <>
                <Field>
                  <FieldLabel htmlFor="vanilla-full-name">Full name</FieldLabel>
                  <Input
                    id="vanilla-full-name"
                    value={values.fullName}
                    onInput={(event) => {
                      onFieldChange("fullName", event.currentTarget.value);
                    }}
                    placeholder="Ada Lovelace"
                  />
                  {touched.fullName && errors.fullName ? (
                    <FieldError>{errors.fullName}</FieldError>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="vanilla-email">Work email</FieldLabel>
                  <Input
                    id="vanilla-email"
                    type="email"
                    value={values.email}
                    onInput={(event) => {
                      onFieldChange("email", event.currentTarget.value);
                    }}
                    placeholder="team@company.com"
                  />
                  {touched.email && errors.email ? (
                    <FieldError>{errors.email}</FieldError>
                  ) : null}
                </Field>
              </>
            )}

            {flow.currentStep.id === "profile" && (
              <>
                <Field>
                  <FieldLabel htmlFor="vanilla-company">Company</FieldLabel>
                  <Input
                    id="vanilla-company"
                    value={values.company}
                    onInput={(event) => {
                      onFieldChange("company", event.currentTarget.value);
                    }}
                    placeholder="Kora Labs"
                  />
                  {touched.company && errors.company ? (
                    <FieldError>{errors.company}</FieldError>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="vanilla-role">Role</FieldLabel>
                  <Select
                    value={values.role}
                    onValueChange={(next) => {
                      onFieldChange("role", next ?? "");
                    }}
                  >
                    <SelectTrigger id="vanilla-role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="founder">Founder</SelectItem>
                      <SelectItem value="product">Product Manager</SelectItem>
                      <SelectItem value="engineering">Engineer</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                  {touched.role && errors.role ? (
                    <FieldError>{errors.role}</FieldError>
                  ) : null}
                </Field>
              </>
            )}

            {flow.currentStep.id === "preferences" && (
              <>
                <Field>
                  <FieldLabel htmlFor="vanilla-use-case">
                    What are you onboarding for?
                  </FieldLabel>
                  <Textarea
                    id="vanilla-use-case"
                    value={values.useCase}
                    onInput={(event) => {
                      onFieldChange("useCase", event.currentTarget.value);
                    }}
                    placeholder="Describe your main onboarding goal"
                  />
                  {touched.useCase && errors.useCase ? (
                    <FieldError>{errors.useCase}</FieldError>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="vanilla-updates">
                    Product updates
                  </FieldLabel>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="vanilla-updates"
                      checked={values.updates}
                      onCheckedChange={(checked) => {
                        onFieldChange("updates", Boolean(checked));
                      }}
                    />
                    <FieldDescription>
                      Enable updates to complete this flow.
                    </FieldDescription>
                  </div>
                </Field>
              </>
            )}

            {flow.currentStep.id === "review" && (
              <>
                <SummaryCard title="Vanilla Review" values={values} />
                {!values.updates ? (
                  <FieldError>
                    Enable product updates in the previous step to submit.
                  </FieldError>
                ) : null}
              </>
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="neutral-outline"
                onClick={() => {
                  flow.prevStep();
                }}
                disabled={flow.isFirstStep}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (flow.isLastStep) {
                    void flow.submit();
                    return;
                  }

                  void flow.nextStep();
                }}
              >
                {flow.isLastStep ? "Submit" : "Continue"}
              </Button>
            </div>

            {submittedValues ? (
              <FieldDescription>
                Vanilla submission complete for{" "}
                {submittedValues.fullName || "new user"}.
              </FieldDescription>
            ) : null}
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}

function ReactHookFormOnboardingFlow() {
  const [submittedValues, setSubmittedValues] =
    React.useState<BaseOnboardingValues | null>(null);
  const form = useForm<BaseOnboardingValues>({
    defaultValues: initialValues,
    mode: "onTouched",
  });

  const adapter = React.useMemo(
    () =>
      createReactHookFormAdapter<BaseOnboardingValues>({
        getValues: form.getValues,
        trigger: (fields) => form.trigger(fields as never),
        getFieldState: (field) =>
          form.getFieldState(field as never, form.formState),
        setFocus: (field) => form.setFocus(field as never),
      }),
    [form],
  );

  const steps = React.useMemo<
    readonly MultiStepFormStep<BaseOnboardingValues, OnboardingStepId>[]
  >(
    () => [
      { id: "account", title: "Create account", fields: ["fullName", "email"] },
      { id: "profile", title: "Team profile", fields: ["company", "role"] },
      {
        id: "preferences",
        title: "Preferences",
        fields: ["useCase", "updates"],
      },
      { id: "review", title: "Review & submit" },
    ],
    [],
  );

  const flow = useMultiStepForm<BaseOnboardingValues, OnboardingStepId>({
    steps,
    adapter,
    onComplete: async () => {
      setSubmittedValues(form.getValues());
    },
  });

  const values = form.watch();
  const stepOrder = steps.map((step) => step.id);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
      <StepRail
        stepOrder={stepOrder}
        currentStep={flow.currentStep.id}
        getStepStatus={flow.getStepStatus}
        onStepClick={(step) => {
          void flow.goToStep(step);
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>React Hook Form + Utility</CardTitle>
          <CardDescription>
            Step {flow.currentStepIndex + 1} of {flow.totalSteps}:{" "}
            {flow.currentStep.title}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {flow.currentStep.id === "account" && (
              <>
                <Field>
                  <FieldLabel htmlFor="rhf-full-name">Full name</FieldLabel>
                  <Input
                    id="rhf-full-name"
                    placeholder="Ada Lovelace"
                    {...form.register("fullName", {
                      required: "Full name is required.",
                    })}
                  />
                  {form.formState.errors.fullName ? (
                    <FieldError>
                      {form.formState.errors.fullName.message}
                    </FieldError>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="rhf-email">Work email</FieldLabel>
                  <Input
                    id="rhf-email"
                    type="email"
                    placeholder="team@company.com"
                    {...form.register("email", {
                      required: "Email is required.",
                      validate: (value) =>
                        value.includes("@") || "Enter a valid email address.",
                    })}
                  />
                  {form.formState.errors.email ? (
                    <FieldError>
                      {form.formState.errors.email.message}
                    </FieldError>
                  ) : null}
                </Field>
              </>
            )}

            {flow.currentStep.id === "profile" && (
              <>
                <Field>
                  <FieldLabel htmlFor="rhf-company">Company</FieldLabel>
                  <Input
                    id="rhf-company"
                    placeholder="Kora Labs"
                    {...form.register("company", {
                      required: "Company is required.",
                    })}
                  />
                  {form.formState.errors.company ? (
                    <FieldError>
                      {form.formState.errors.company.message}
                    </FieldError>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="rhf-role">Role</FieldLabel>
                  <Controller
                    control={form.control}
                    name="role"
                    rules={{ required: "Please select a role." }}
                    render={({ field }) => (
                      <Select
                        value={field.value}
                        onValueChange={(next) => {
                          field.onChange(next ?? "");
                        }}
                      >
                        <SelectTrigger id="rhf-role">
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="founder">Founder</SelectItem>
                          <SelectItem value="product">
                            Product Manager
                          </SelectItem>
                          <SelectItem value="engineering">Engineer</SelectItem>
                          <SelectItem value="operations">Operations</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                  {form.formState.errors.role ? (
                    <FieldError>
                      {form.formState.errors.role.message}
                    </FieldError>
                  ) : null}
                </Field>
              </>
            )}

            {flow.currentStep.id === "preferences" && (
              <>
                <Field>
                  <FieldLabel htmlFor="rhf-use-case">
                    What are you onboarding for?
                  </FieldLabel>
                  <Textarea
                    id="rhf-use-case"
                    placeholder="Describe your main onboarding goal"
                    {...form.register("useCase", {
                      required: "Use case is required.",
                      minLength: {
                        value: 10,
                        message: "Use at least 10 characters.",
                      },
                    })}
                  />
                  {form.formState.errors.useCase ? (
                    <FieldError>
                      {form.formState.errors.useCase.message}
                    </FieldError>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="rhf-updates">Product updates</FieldLabel>
                  <Controller
                    control={form.control}
                    name="updates"
                    render={({ field }) => (
                      <div className="flex items-center gap-3">
                        <Switch
                          id="rhf-updates"
                          checked={Boolean(field.value)}
                          onCheckedChange={(checked) => {
                            field.onChange(Boolean(checked));
                          }}
                        />
                        <FieldDescription>
                          Opt in for product updates.
                        </FieldDescription>
                      </div>
                    )}
                  />
                </Field>
              </>
            )}

            {flow.currentStep.id === "review" && (
              <SummaryCard title="RHF Review" values={values} />
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="neutral-outline"
                onClick={() => {
                  flow.prevStep();
                }}
                disabled={flow.isFirstStep}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (flow.isLastStep) {
                    void flow.submit();
                    return;
                  }

                  void flow.nextStep();
                }}
              >
                {flow.isLastStep ? "Submit" : "Continue"}
              </Button>
            </div>

            {submittedValues ? (
              <FieldDescription>
                RHF submission complete for{" "}
                {submittedValues.fullName || "new user"}.
              </FieldDescription>
            ) : null}
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}

function FormikOnboardingFlow() {
  const [submittedValues, setSubmittedValues] =
    React.useState<BaseOnboardingValues | null>(null);

  const formik = useFormik<BaseOnboardingValues>({
    initialValues,
    validate: (values) => {
      const errors: Partial<Record<keyof BaseOnboardingValues, string>> = {};

      if (!values.fullName.trim()) errors.fullName = "Full name is required.";
      if (!values.email.trim()) errors.email = "Email is required.";
      else if (!values.email.includes("@"))
        errors.email = "Enter a valid email address.";
      if (!values.company.trim()) errors.company = "Company is required.";
      if (!values.role.trim()) errors.role = "Please select a role.";
      if (values.useCase.trim().length < 10) {
        errors.useCase = "Describe your use case in at least 10 characters.";
      }

      return errors;
    },
    onSubmit: () => undefined,
  });

  const adapter = React.useMemo(
    () =>
      createFormikAdapter<BaseOnboardingValues>({
        values: formik.values,
        validateForm: async () =>
          (await formik.validateForm()) as Record<string, unknown>,
        setTouched: (nextTouched, shouldValidate) =>
          formik.setTouched(nextTouched as never, shouldValidate),
        errors: formik.errors as Record<string, unknown>,
        touched: formik.touched as Record<string, unknown>,
      }),
    [formik],
  );

  const steps = React.useMemo<
    readonly MultiStepFormStep<BaseOnboardingValues, OnboardingStepId>[]
  >(
    () => [
      { id: "account", title: "Create account", fields: ["fullName", "email"] },
      { id: "profile", title: "Team profile", fields: ["company", "role"] },
      {
        id: "preferences",
        title: "Preferences",
        fields: ["useCase", "updates"],
      },
      { id: "review", title: "Review & submit" },
    ],
    [],
  );

  const flow = useMultiStepForm<BaseOnboardingValues, OnboardingStepId>({
    steps,
    adapter,
    onComplete: async ({ values }) => {
      setSubmittedValues(values);
    },
  });

  const stepOrder = steps.map((step) => step.id);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
      <StepRail
        stepOrder={stepOrder}
        currentStep={flow.currentStep.id}
        getStepStatus={flow.getStepStatus}
        onStepClick={(step) => {
          void flow.goToStep(step);
        }}
      />

      <Card>
        <CardHeader>
          <CardTitle>Formik + Utility</CardTitle>
          <CardDescription>
            Step {flow.currentStepIndex + 1} of {flow.totalSteps}:{" "}
            {flow.currentStep.title}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup>
            {flow.currentStep.id === "account" && (
              <>
                <Field>
                  <FieldLabel htmlFor="formik-full-name">Full name</FieldLabel>
                  <Input
                    id="formik-full-name"
                    value={formik.values.fullName}
                    onInput={(event) => {
                      formik.setFieldValue(
                        "fullName",
                        event.currentTarget.value,
                      );
                    }}
                    onBlur={() => {
                      formik.setFieldTouched("fullName", true);
                    }}
                    placeholder="Ada Lovelace"
                  />
                  {formik.touched.fullName && formik.errors.fullName ? (
                    <FieldError>{formik.errors.fullName}</FieldError>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="formik-email">Work email</FieldLabel>
                  <Input
                    id="formik-email"
                    type="email"
                    value={formik.values.email}
                    onInput={(event) => {
                      formik.setFieldValue("email", event.currentTarget.value);
                    }}
                    onBlur={() => {
                      formik.setFieldTouched("email", true);
                    }}
                    placeholder="team@company.com"
                  />
                  {formik.touched.email && formik.errors.email ? (
                    <FieldError>{formik.errors.email}</FieldError>
                  ) : null}
                </Field>
              </>
            )}

            {flow.currentStep.id === "profile" && (
              <>
                <Field>
                  <FieldLabel htmlFor="formik-company">Company</FieldLabel>
                  <Input
                    id="formik-company"
                    value={formik.values.company}
                    onInput={(event) => {
                      formik.setFieldValue(
                        "company",
                        event.currentTarget.value,
                      );
                    }}
                    onBlur={() => {
                      formik.setFieldTouched("company", true);
                    }}
                    placeholder="Kora Labs"
                  />
                  {formik.touched.company && formik.errors.company ? (
                    <FieldError>{formik.errors.company}</FieldError>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="formik-role">Role</FieldLabel>
                  <Select
                    value={formik.values.role}
                    onValueChange={(next) => {
                      formik.setFieldValue("role", next ?? "");
                    }}
                  >
                    <SelectTrigger id="formik-role">
                      <SelectValue placeholder="Select a role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="founder">Founder</SelectItem>
                      <SelectItem value="product">Product Manager</SelectItem>
                      <SelectItem value="engineering">Engineer</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                  {formik.touched.role && formik.errors.role ? (
                    <FieldError>{formik.errors.role}</FieldError>
                  ) : null}
                </Field>
              </>
            )}

            {flow.currentStep.id === "preferences" && (
              <>
                <Field>
                  <FieldLabel htmlFor="formik-use-case">
                    What are you onboarding for?
                  </FieldLabel>
                  <Textarea
                    id="formik-use-case"
                    value={formik.values.useCase}
                    onInput={(event) => {
                      formik.setFieldValue(
                        "useCase",
                        event.currentTarget.value,
                      );
                    }}
                    onBlur={() => {
                      formik.setFieldTouched("useCase", true);
                    }}
                    placeholder="Describe your main onboarding goal"
                  />
                  {formik.touched.useCase && formik.errors.useCase ? (
                    <FieldError>{formik.errors.useCase}</FieldError>
                  ) : null}
                </Field>
                <Field>
                  <FieldLabel htmlFor="formik-updates">
                    Product updates
                  </FieldLabel>
                  <div className="flex items-center gap-3">
                    <Switch
                      id="formik-updates"
                      checked={formik.values.updates}
                      onCheckedChange={(checked) => {
                        formik.setFieldValue("updates", Boolean(checked));
                      }}
                    />
                    <FieldDescription>
                      Opt in for product updates.
                    </FieldDescription>
                  </div>
                </Field>
              </>
            )}

            {flow.currentStep.id === "review" && (
              <SummaryCard title="Formik Review" values={formik.values} />
            )}

            <div className="flex gap-2 pt-2">
              <Button
                type="button"
                variant="neutral-outline"
                onClick={() => {
                  flow.prevStep();
                }}
                disabled={flow.isFirstStep}
              >
                Back
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (flow.isLastStep) {
                    void flow.submit();
                    return;
                  }

                  void flow.nextStep();
                }}
              >
                {flow.isLastStep ? "Submit" : "Continue"}
              </Button>
            </div>

            {submittedValues ? (
              <FieldDescription>
                Formik submission complete for{" "}
                {submittedValues.fullName || "new user"}.
              </FieldDescription>
            ) : null}
          </FieldGroup>
        </CardContent>
      </Card>
    </div>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
function RouteComponent() {
  return (
    <div className="h-full overflow-auto px-6 py-6">
      <Card className="mx-auto w-full max-w-7xl">
        <CardHeader>
          <CardTitle>Multistep Onboarding Utility Lab</CardTitle>
          <CardDescription>
            One route, three onboarding iterations: vanilla utility, React Hook
            Form, and Formik.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="vanilla" className="w-full">
            <TabsList className="grid w-full grid-cols-1 gap-2 sm:grid-cols-3">
              <TabsTrigger value="vanilla">1. Vanilla Utility</TabsTrigger>
              <TabsTrigger value="rhf">2. React Hook Form</TabsTrigger>
              <TabsTrigger value="formik">3. Formik</TabsTrigger>
            </TabsList>

            <TabsContent value="vanilla" className="mt-4">
              <VanillaOnboardingFlow />
            </TabsContent>

            <TabsContent value="rhf" className="mt-4">
              <ReactHookFormOnboardingFlow />
            </TabsContent>

            <TabsContent value="formik" className="mt-4">
              <FormikOnboardingFlow />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
