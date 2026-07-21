import type {
  MultiStepAdapter,
  MultiStepDefinition,
  MultiStepId,
} from "@/hooks/use-multi-step";

const DEFAULT_INVALID_REASON =
  "Resolve the errors in this step before continuing.";

/**
 * Minimal structural type for a React Hook Form-like object.
 * No dependency on react-hook-form is required for this recipe.
 */
export interface TriggerFormLike<TValues, TFieldName extends string = string> {
  getValues: () => TValues;
  trigger: (
    fields?: readonly TFieldName[],
    options?: { shouldFocus?: boolean },
  ) => boolean | Promise<boolean>;
  reset: () => void;
}

export function createTriggerAdapter<
  TStepId extends MultiStepId,
  TValues,
  TFieldName extends string = string,
  TMeta extends { fields?: readonly TFieldName[] } = {
    fields?: readonly TFieldName[];
  },
>(
  form: TriggerFormLike<TValues, TFieldName> & {
    invalidReason?: string;
    shouldFocusInvalidField?: boolean;
  },
): MultiStepAdapter<TStepId, TValues, TMeta> {
  return {
    getValues: form.getValues,
    validate: async ({ currentStep }) => {
      const valid = await form.trigger(currentStep.meta?.fields, {
        shouldFocus: form.shouldFocusInvalidField ?? true,
      });

      return (
        valid || {
          valid: false,
          reason: form.invalidReason ?? DEFAULT_INVALID_REASON,
        }
      );
    },
    reset: form.reset,
  };
}

/**
 * Minimal structural type for a Formik-like object.
 * The caller decides how field errors map to step validity.
 */
export interface FormikLike<TValues, TErrors> {
  values: TValues;
  validateForm: () => Promise<TErrors>;
  resetForm: () => void;
}

export function createFormikLikeAdapter<
  TStepId extends MultiStepId,
  TValues,
  TErrors extends Record<string, unknown>,
  TMeta extends { fields?: readonly (keyof TErrors & string)[] },
>(
  form: FormikLike<TValues, TErrors>,
): MultiStepAdapter<TStepId, TValues, TMeta> {
  return {
    getValues: () => form.values,
    validate: async ({ currentStep }) => {
      const errors = await form.validateForm();
      const fields = currentStep.meta?.fields ?? [];
      const valid = fields.every((field) => errors[field] == null);
      return (
        valid || {
          valid: false,
          reason: DEFAULT_INVALID_REASON,
        }
      );
    },
    reset: form.resetForm,
  };
}

export type ExampleStep<
  TStepId extends MultiStepId,
  TMeta,
> = MultiStepDefinition<TStepId, TMeta>;
