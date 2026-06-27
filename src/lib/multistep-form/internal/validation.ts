import type {
  MultiStepFormAdapter,
  MultiStepValidationResult,
  ValidationErrors,
} from "../types";

export type NormalizedValidationResult = {
  valid: boolean;
  errors?: ValidationErrors;
};

export function normalizeValidationResult<TValues extends Record<string, unknown>>(
  adapter: MultiStepFormAdapter<TValues>,
  result: MultiStepValidationResult,
): NormalizedValidationResult {
  if (typeof result === "boolean") {
    return {
      valid: result,
      errors: adapter.getErrors?.(),
    };
  }

  return {
    valid: result.valid,
    errors: result.errors ?? adapter.getErrors?.(),
  };
}
