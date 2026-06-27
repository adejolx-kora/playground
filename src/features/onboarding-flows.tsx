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
  Textarea,
} from "@korapay/react";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@korapay/react/molecules";
import { useFormik } from "formik";
import * as React from "react";
import { Controller, useForm } from "react-hook-form";

import {
  useMultiStepForm,
  useMultiStepFormSelector,
} from "@/hooks/use-multi-step-form";
import {
  createFormikAdapter,
  createReactHookFormAdapter,
  createVanillaAdapter,
  createVanillaFormStore,
  type MultiStepFormStep,
  useVanillaFormField,
  useVanillaFormStore,
} from "@/lib/multistep-form";

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

function validateOnboardingField(
  field: keyof BaseOnboardingValues,
  fieldValue: BaseOnboardingValues[keyof BaseOnboardingValues],
) {
  if (field === "fullName" && !String(fieldValue).trim()) {
    return "Full name is required.";
  }

  if (field === "email") {
    if (!String(fieldValue).trim()) return "Email is required.";
    if (!String(fieldValue).includes("@")) {
      return "Enter a valid email address.";
    }
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
}

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
  flow,
  onStepClick,
}: {
  stepOrder: readonly OnboardingStepId[];
  flow: ReturnType<
    typeof useMultiStepForm<BaseOnboardingValues, OnboardingStepId>
  >;
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
          {stepOrder.map((stepId, index) => (
            <StepRailItem
              key={stepId}
              flow={flow}
              index={index}
              stepId={stepId}
              onStepClick={onStepClick}
            />
          ))}
        </FieldGroup>
      </CardContent>
    </Card>
  );
}

function StepRailItem({
  flow,
  index,
  stepId,
  onStepClick,
}: {
  flow: ReturnType<
    typeof useMultiStepForm<BaseOnboardingValues, OnboardingStepId>
  >;
  index: number;
  stepId: OnboardingStepId;
  onStepClick: (step: OnboardingStepId) => void;
}) {
  const status = useMultiStepFormSelector(flow, (currentFlow) =>
    currentFlow.getStepStatus(stepId),
  );
  const isCurrent = useMultiStepFormSelector(
    flow,
    (currentFlow) => currentFlow.currentStep.id === stepId,
  );

  return (
    <Field>
      <Button
        type="button"
        variant={isCurrent ? "primary" : "neutral-outline"}
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

function OnboardingPageShell({
  title,
  description,
  children,
}: React.PropsWithChildren<{
  title: string;
  description: string;
}>) {
  return (
    <div className="h-full overflow-auto px-6 py-6">
      <Card className="mx-auto w-full max-w-7xl">
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  );
}

function VanillaAccountStep({
  store,
  onInteraction,
}: {
  store: ReturnType<typeof createVanillaFormStore<BaseOnboardingValues>>;
  onInteraction: () => void;
}) {
  const fullName = useVanillaFormField<BaseOnboardingValues, string>(
    store,
    "fullName",
  );
  const email = useVanillaFormField<BaseOnboardingValues, string>(
    store,
    "email",
  );

  return (
    <>
      <Field data-invalid={!!(fullName.touched && fullName.error)}>
        <FieldLabel htmlFor="vanilla-full-name">Full name</FieldLabel>
        <Input
          id="vanilla-full-name"
          value={fullName.value ?? ""}
          onInput={(event) => {
            onInteraction();
            fullName.setValue(event.currentTarget.value);
            fullName.setError(undefined);
          }}
          placeholder="Ada Lovelace"
        />
        {fullName.touched && fullName.error ? (
          <FieldError>{String(fullName.error)}</FieldError>
        ) : null}
      </Field>
      <Field data-invalid={!!(email.touched && email.error)}>
        <FieldLabel htmlFor="vanilla-email">Work email</FieldLabel>
        <Input
          id="vanilla-email"
          type="email"
          value={email.value ?? ""}
          onInput={(event) => {
            onInteraction();
            email.setValue(event.currentTarget.value);
            email.setError(undefined);
          }}
          placeholder="team@company.com"
        />
        {email.touched && email.error ? (
          <FieldError>{String(email.error)}</FieldError>
        ) : null}
      </Field>
    </>
  );
}

function VanillaProfileStep({
  store,
  onInteraction,
}: {
  store: ReturnType<typeof createVanillaFormStore<BaseOnboardingValues>>;
  onInteraction: () => void;
}) {
  const company = useVanillaFormField<BaseOnboardingValues, string>(
    store,
    "company",
  );
  const role = useVanillaFormField<BaseOnboardingValues, string>(store, "role");

  return (
    <>
      <Field data-invalid={!!(company.touched && company.error)}>
        <FieldLabel htmlFor="vanilla-company">Company</FieldLabel>
        <Input
          id="vanilla-company"
          value={company.value ?? ""}
          onInput={(event) => {
            onInteraction();
            company.setValue(event.currentTarget.value);
            company.setError(undefined);
          }}
          placeholder="Kora Labs"
        />
        {company.touched && company.error ? (
          <FieldError>{String(company.error)}</FieldError>
        ) : null}
      </Field>
      <Field data-invalid={!!(role.touched && role.error)}>
        <FieldLabel htmlFor="vanilla-role">Role</FieldLabel>
        <Select
          value={role.value ?? ""}
          onValueChange={(next) => {
            onInteraction();
            role.setValue(next ?? "");
            role.setError(undefined);
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
        {role.touched && role.error ? (
          <FieldError>{String(role.error)}</FieldError>
        ) : null}
      </Field>
    </>
  );
}

function VanillaPreferencesStep({
  store,
  onInteraction,
}: {
  store: ReturnType<typeof createVanillaFormStore<BaseOnboardingValues>>;
  onInteraction: () => void;
}) {
  const useCase = useVanillaFormField<BaseOnboardingValues, string>(
    store,
    "useCase",
  );
  const updates = useVanillaFormField<BaseOnboardingValues, boolean>(
    store,
    "updates",
  );

  return (
    <>
      <Field data-invalid={!!(useCase.touched && useCase.error)}>
        <FieldLabel htmlFor="vanilla-use-case">
          What are you onboarding for?
        </FieldLabel>
        <Textarea
          id="vanilla-use-case"
          value={useCase.value ?? ""}
          onInput={(event) => {
            onInteraction();
            useCase.setValue(event.currentTarget.value);
            useCase.setError(undefined);
          }}
          placeholder="Describe your main onboarding goal"
        />
        {useCase.touched && useCase.error ? (
          <FieldError>{String(useCase.error)}</FieldError>
        ) : null}
      </Field>
      <Field>
        <FieldLabel htmlFor="vanilla-updates">Product updates</FieldLabel>
        <div className="flex items-center gap-3">
          <Switch
            id="vanilla-updates"
            checked={Boolean(updates.value)}
            onCheckedChange={(checked) => {
              onInteraction();
              updates.setValue(Boolean(checked));
            }}
          />
          <FieldDescription>
            Enable updates to complete this flow.
          </FieldDescription>
        </div>
      </Field>
    </>
  );
}

function VanillaReviewStep({
  store,
}: {
  store: ReturnType<typeof createVanillaFormStore<BaseOnboardingValues>>;
}) {
  const values = useVanillaFormStore(store, (state) => state.values);

  return (
    <>
      <SummaryCard title="Vanilla Review" values={values} />
      {!values.updates ? (
        <FieldError>
          Enable product updates in the previous step to submit.
        </FieldError>
      ) : null}
    </>
  );
}

function VanillaOnboardingFlow() {
  const [submittedValues, setSubmittedValues] =
    React.useState<BaseOnboardingValues | null>(null);
  const store = React.useMemo(
    () =>
      createVanillaFormStore<BaseOnboardingValues>({
        initialValues,
      }),
    [],
  );

  const adapter = React.useMemo(
    () =>
      createVanillaAdapter<BaseOnboardingValues>({
        store,
        validate: ({ values, fields }) => {
          const nextErrors: Partial<
            Record<keyof BaseOnboardingValues, string>
          > = {};
          const fieldsToValidate = fields ?? [
            "fullName",
            "email",
            "company",
            "role",
            "useCase",
          ];

          fieldsToValidate.forEach((fieldName) => {
            const key = fieldName as keyof BaseOnboardingValues;
            const message = validateOnboardingField(key, values[key]);

            if (message) {
              nextErrors[key] = message;
            }
          });

          return nextErrors;
        },
        reset: () => {
          store.reset();
          setSubmittedValues(null);
        },
      }),
    [store],
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
  const clearSubmittedValues = () => {
    setSubmittedValues(null);
  };

  const stepOrder = steps.map((step) => step.id);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
      <StepRail
        stepOrder={stepOrder}
        flow={flow}
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
              <VanillaAccountStep
                store={store}
                onInteraction={clearSubmittedValues}
              />
            )}

            {flow.currentStep.id === "profile" && (
              <VanillaProfileStep
                store={store}
                onInteraction={clearSubmittedValues}
              />
            )}

            {flow.currentStep.id === "preferences" && (
              <VanillaPreferencesStep
                store={store}
                onInteraction={clearSubmittedValues}
              />
            )}

            {flow.currentStep.id === "review" && (
              <VanillaReviewStep store={store} />
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

  const stepOrder = steps.map((step) => step.id);

  return (
    <div className="grid grid-cols-1 gap-4 xl:grid-cols-[260px_minmax(0,1fr)]">
      <StepRail
        stepOrder={stepOrder}
        flow={flow}
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
                <Field data-invalid={!!form.formState.errors.fullName}>
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
                <Field data-invalid={!!form.formState.errors.email}>
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
                <Field data-invalid={!!form.formState.errors.company}>
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
                <Field data-invalid={!!form.formState.errors.role}>
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
                <Field data-invalid={!!form.formState.errors.useCase}>
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
              <SummaryCard title="RHF Review" values={form.getValues()} />
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
      else if (!values.email.includes("@")) {
        errors.email = "Enter a valid email address.";
      }
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
        flow={flow}
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
                <Field
                  data-invalid={
                    !!(formik.touched.fullName && formik.errors.fullName)
                  }
                >
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
                <Field
                  data-invalid={!!(formik.touched.email && formik.errors.email)}
                >
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
                <Field
                  data-invalid={
                    !!(formik.touched.company && formik.errors.company)
                  }
                >
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
                <Field
                  data-invalid={!!(formik.touched.role && formik.errors.role)}
                >
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
                <Field
                  data-invalid={
                    !!(formik.touched.useCase && formik.errors.useCase)
                  }
                >
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

export function VanillaOnboardingPage() {
  return (
    <OnboardingPageShell
      title="Vanilla Utility Onboarding"
      description="A focused onboarding flow powered by the vanilla utility adapter."
    >
      <VanillaOnboardingFlow />
    </OnboardingPageShell>
  );
}

export function ReactHookFormOnboardingPage() {
  return (
    <OnboardingPageShell
      title="React Hook Form Onboarding"
      description="A focused onboarding flow powered by React Hook Form and the shared multistep utility."
    >
      <ReactHookFormOnboardingFlow />
    </OnboardingPageShell>
  );
}

export function FormikOnboardingPage() {
  return (
    <OnboardingPageShell
      title="Formik Onboarding"
      description="A focused onboarding flow powered by Formik and the shared multistep utility."
    >
      <FormikOnboardingFlow />
    </OnboardingPageShell>
  );
}
