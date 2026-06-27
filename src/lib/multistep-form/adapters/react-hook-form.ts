import type { FormValues, MultiStepFormAdapter } from "../types";

export function createReactHookFormAdapter<TValues extends FormValues>(bridge: {
  getValues: () => TValues;
  trigger: (fields?: readonly string[]) => Promise<boolean>;
  getErrors?: () => Record<string, unknown> | undefined;
  getFieldState?: (field: string) => {
    error?: unknown;
    isTouched?: boolean;
    invalid?: boolean;
  };
  setFocus?: (field: string) => void;
  touchFields?: (fields: readonly string[]) => void | Promise<void>;
  reset?: () => void | Promise<void>;
}): MultiStepFormAdapter<TValues> {
  const validate = (fields?: readonly string[]) =>
    fields && fields.length > 0 ? bridge.trigger(fields) : bridge.trigger();

  return {
    getValues: bridge.getValues,
    getErrors: bridge.getErrors,
    validateFields: async (fields) => ({
      valid: await validate(fields),
      errors: bridge.getErrors?.(),
    }),
    validateForm: async () => ({
      valid: await validate(),
      errors: bridge.getErrors?.(),
    }),
    touchFields: bridge.touchFields,
    focusField: bridge.setFocus,

    getFieldError: (field) => bridge.getFieldState?.(field)?.error,
    reset: bridge.reset,
  };
}
