export type StepId = string;
export type FormValues = Record<string, unknown>;

export type MultiStepFormStep<
  TValues extends FormValues,
  TStepId extends StepId = StepId,
> = {
  id: TStepId;
  title?: string;
  fields?: readonly string[];
  validate?: (
    context: MultiStepValidationContext<TValues, TStepId>,
  ) => boolean | Promise<boolean>;
};

export type MultiStepValidationDirection = "next" | "submit" | "goto";

export type MultiStepValidationContext<
  TValues extends FormValues,
  TStepId extends StepId = StepId,
> = {
  values: TValues;
  step: MultiStepFormStep<TValues, TStepId>;
  stepIndex: number;
  direction: MultiStepValidationDirection;
};

export type MultiStepFormAdapter<TValues extends FormValues> = {
  getValues: () => TValues;
  validateFields?: (fields: readonly string[]) => boolean | Promise<boolean>;
  validateForm?: () => boolean | Promise<boolean>;
  touchFields?: (fields: readonly string[]) => void | Promise<void>;
  getFieldError?: (field: string) => unknown;
  isFieldTouched?: (field: string) => boolean;
};

export type MultiStepFormOptions<
  TValues extends FormValues,
  TStepId extends StepId,
> = {
  steps: readonly MultiStepFormStep<TValues, TStepId>[];
  adapter: MultiStepFormAdapter<TValues>;
  initialStepId?: TStepId;
  onStepChange?: (payload: {
    from: MultiStepFormStep<TValues, TStepId>;
    to: MultiStepFormStep<TValues, TStepId>;
    toIndex: number;
  }) => void;
  onComplete?: (payload: {
    values: TValues;
    steps: readonly MultiStepFormStep<TValues, TStepId>[];
  }) => void | Promise<void>;
};

export type MultiStepFormApi<
  TValues extends FormValues,
  TStepId extends StepId,
> = {
  steps: readonly MultiStepFormStep<TValues, TStepId>[];
  currentStep: MultiStepFormStep<TValues, TStepId>;
  currentStepIndex: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  visitedStepIds: readonly TStepId[];
  nextStep: () => Promise<boolean>;
  prevStep: () => boolean;
  goToStep: (step: TStepId | number) => Promise<boolean>;
  submit: () => Promise<boolean>;
  isStepVisited: (step: TStepId) => boolean;
  isStepComplete: (step: TStepId) => boolean;
  getStepStatus: (step: TStepId) => "pending" | "current" | "complete";
};

export const getByPath = (value: unknown, path: string) => {
  const parts = path.split(".").filter(Boolean);
  let current = value;

  for (const part of parts) {
    if (!current || typeof current !== "object") {
      return undefined;
    }

    current = (current as Record<string, unknown>)[part];
  }

  return current;
};

export const hasValue = (value: unknown) => {
  if (value === null || value === undefined) return false;
  if (typeof value === "string") return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
};

export function createReactHookFormAdapter<TValues extends FormValues>(bridge: {
  getValues: () => TValues;
  trigger: (fields?: readonly string[]) => Promise<boolean>;
  getFieldState?: (field: string) => {
    error?: unknown;
    isTouched?: boolean;
    invalid?: boolean;
  };
  setFocus?: (field: string) => void;
}): MultiStepFormAdapter<TValues> {
  return {
    getValues: bridge.getValues,
    validateFields: async (fields) => {
      if (fields.length === 0) {
        return bridge.trigger();
      }

      return bridge.trigger(fields);
    },
    touchFields: async (fields) => {
      if (fields.length > 0) {
        bridge.setFocus?.(fields[0]);
      }
    },
    getFieldError: (field) => bridge.getFieldState?.(field).error,
    isFieldTouched: (field) => Boolean(bridge.getFieldState?.(field).isTouched),
  };
}

export function createFormikAdapter<TValues extends FormValues>(bridge: {
  values: TValues;
  validateForm: () => Promise<Record<string, unknown>>;
  setTouched: (
    touched: Record<string, boolean>,
    shouldValidate?: boolean,
  ) => void | Promise<unknown>;
  errors?: Record<string, unknown>;
  touched?: Record<string, unknown>;
}): MultiStepFormAdapter<TValues> {
  const getErrorForField = (errors: Record<string, unknown>, field: string) =>
    getByPath(errors, field);

  return {
    getValues: () => bridge.values,
    validateFields: async (fields) => {
      const errors = await bridge.validateForm();

      if (fields.length === 0) {
        return Object.keys(errors).length === 0;
      }

      return fields.every((field) => !getErrorForField(errors, field));
    },
    validateForm: async () => {
      const errors = await bridge.validateForm();
      return Object.keys(errors).length === 0;
    },
    touchFields: async (fields) => {
      const touchedPatch = fields.reduce<Record<string, boolean>>(
        (acc, field) => {
          acc[field] = true;
          return acc;
        },
        {},
      );

      await bridge.setTouched(touchedPatch, false);
    },
    getFieldError: (field) =>
      bridge.errors ? getErrorForField(bridge.errors, field) : undefined,
    isFieldTouched: (field) => Boolean(getByPath(bridge.touched, field)),
  };
}
