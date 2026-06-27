import { getByPath, setManyByPathImmutable } from "../utils/path";
import { hasFieldError } from "../utils/state";
import type { FormValues, MultiStepFormAdapter } from "../types";

export function createFormikAdapter<TValues extends FormValues>(bridge: {
  values: TValues;
  validateForm: () => Promise<Record<string, unknown>>;
  setTouched: (
    touched: Record<string, unknown>,
    shouldValidate?: boolean,
  ) => void | Promise<unknown>;
  setFieldTouched?: (
    field: string,
    isTouched?: boolean,
    shouldValidate?: boolean,
  ) => void | Promise<unknown>;
  errors?: Record<string, unknown>;
  touched?: Record<string, unknown>;
  resetForm?: () => void | Promise<unknown>;
}): MultiStepFormAdapter<TValues> {
  const getErrorForField = (errors: Record<string, unknown>, field: string) =>
    getByPath(errors, field);
  const validateErrors = async () => bridge.validateForm();

  return {
    getValues: () => bridge.values,
    getErrors: () => bridge.errors,

    validateFields: async (fields) => {
      const errors = await validateErrors();

      return {
        valid:
          fields.length === 0
            ? !hasFieldError(errors)
            : fields.every(
                (field) => !hasFieldError(getErrorForField(errors, field)),
              ),
        errors,
      };
    },

    validateForm: async () => {
      const errors = await validateErrors();
      return {
        valid: !hasFieldError(errors),
        errors,
      };
    },

    touchFields: async (fields) => {
      if (fields.length === 0) {
        return;
      }

      if (bridge.setFieldTouched) {
        await Promise.all(
          fields.map((field) => bridge.setFieldTouched?.(field, true, false)),
        );
        return;
      }

      const nextTouched = setManyByPathImmutable(
        (bridge.touched as Record<string, unknown> | undefined) ?? {},
        fields.map((field) => ({
          path: field,
          value: true,
        })),
      );

      await bridge.setTouched(nextTouched, false);
    },

    getFieldError: (field) =>
      bridge.errors ? getErrorForField(bridge.errors, field) : undefined,
    reset: bridge.resetForm
      ? async () => {
          await bridge.resetForm?.();
        }
      : undefined,
  };
}
