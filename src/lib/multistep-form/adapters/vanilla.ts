import * as React from "react";

import { getByPath, setByPathImmutable, setManyByPathImmutable } from "../utils/path";
import { hasFieldError } from "../utils/state";
import type {
  FormValues,
  MultiStepFormAdapter,
  MultiStepValidationResult,
  ValidationErrors,
} from "../types";

export type VanillaValidationErrors = ValidationErrors;

export type VanillaValidationResult =
  | boolean
  | VanillaValidationErrors
  | {
      valid: boolean;
      errors?: VanillaValidationErrors;
    }
  | Promise<
      | MultiStepValidationResult<VanillaValidationErrors>
      | VanillaValidationErrors
    >;

export type VanillaFormStoreState<TValues extends FormValues> = {
  values: TValues;
  errors: VanillaValidationErrors;
  touched: Record<string, unknown>;
};

export type VanillaFormStore<TValues extends FormValues> = {
  getState: () => VanillaFormStoreState<TValues>;
  subscribe: (listener: () => void) => () => void;
  setValues: (next: TValues | ((current: TValues) => TValues)) => void;
  setErrors: (
    next:
      | VanillaValidationErrors
      | ((current: VanillaValidationErrors) => VanillaValidationErrors),
  ) => void;
  setTouched: (
    next:
      | Record<string, unknown>
      | ((current: Record<string, unknown>) => Record<string, unknown>),
  ) => void;
  setValue: (path: string, value: unknown) => void;
  setFieldError: (path: string, error: unknown) => void;
  setFieldTouched: (path: string, touched: boolean) => void;
  touchFields: (fields: readonly string[]) => void;
  reset: (nextValues?: TValues) => void;
};

type Updater<TValue> = TValue | ((current: TValue) => TValue);

const EMPTY_ERRORS: VanillaValidationErrors = {};
const EMPTY_TOUCHED: Record<string, unknown> = {};

const resolveNextValue = <TValue,>(
  next: Updater<TValue>,
  current: TValue,
): TValue =>
  typeof next === "function"
    ? (next as (current: TValue) => TValue)(current)
    : next;

const updateObjectPath = (
  current: Record<string, unknown>,
  path: string,
  value: unknown,
) => {
  if (Object.is(getByPath(current, path), value)) {
    return current;
  }

  return setByPathImmutable(current, path, value);
};

const isValidationResultObject = (
  value: MultiStepValidationResult<VanillaValidationErrors> | VanillaValidationErrors,
): value is {
  valid: boolean;
  errors?: VanillaValidationErrors;
} =>
  typeof value === "object" &&
  value !== null &&
  "valid" in value &&
  typeof value.valid === "boolean";

const normalizeVanillaValidationResult = (
  result:
    | MultiStepValidationResult<VanillaValidationErrors>
    | VanillaValidationErrors,
  currentErrors: VanillaValidationErrors | undefined,
): {
  valid: boolean;
  errors?: VanillaValidationErrors;
} => {
  if (typeof result === "boolean") {
    return {
      valid: result,
      errors: result ? EMPTY_ERRORS : currentErrors,
    };
  }

  if (isValidationResultObject(result)) {
    return {
      valid: result.valid,
      errors: result.errors ?? currentErrors,
    };
  }

  return {
    valid: !hasFieldError(result),
    errors: result,
  };
};

export function createVanillaFormStore<TValues extends FormValues>(options: {
  initialValues: TValues;
  initialErrors?: VanillaValidationErrors;
  initialTouched?: Record<string, unknown>;
}): VanillaFormStore<TValues> {
  const initialErrors =
    options.initialErrors === undefined ? EMPTY_ERRORS : options.initialErrors;
  const initialTouched =
    options.initialTouched === undefined
      ? EMPTY_TOUCHED
      : options.initialTouched;
  const listeners = new Set<() => void>();
  let state: VanillaFormStoreState<TValues> = {
    values: options.initialValues,
    errors: initialErrors,
    touched: initialTouched,
  };

  const notify = () => {
    listeners.forEach((listener) => {
      listener();
    });
  };

  const commit = (nextState: VanillaFormStoreState<TValues>) => {
    if (
      nextState.values === state.values &&
      nextState.errors === state.errors &&
      nextState.touched === state.touched
    ) {
      return;
    }

    state = nextState;
    notify();
  };

  return {
    getState: () => state,
    subscribe: (listener) => {
      listeners.add(listener);

      return () => {
        listeners.delete(listener);
      };
    },
    setValues: (next) => {
      const resolved = resolveNextValue(next, state.values);

      if (resolved === state.values) {
        return;
      }

      commit({
        ...state,
        values: resolved,
      });
    },
    setErrors: (next) => {
      const resolved = resolveNextValue(next, state.errors);

      if (resolved === state.errors) {
        return;
      }

      commit({
        ...state,
        errors: resolved,
      });
    },
    setTouched: (next) => {
      const resolved = resolveNextValue(next, state.touched);

      if (resolved === state.touched) {
        return;
      }

      commit({
        ...state,
        touched: resolved,
      });
    },
    setValue: (path, value) => {
      const nextValues = updateObjectPath(state.values, path, value) as TValues;

      if (nextValues === state.values) {
        return;
      }

      commit({
        ...state,
        values: nextValues,
      });
    },
    setFieldError: (path, error) => {
      const nextErrors = updateObjectPath(state.errors, path, error);

      if (nextErrors === state.errors) {
        return;
      }

      commit({
        ...state,
        errors: nextErrors,
      });
    },
    setFieldTouched: (path, touched) => {
      const nextTouched = updateObjectPath(state.touched, path, touched);

      if (nextTouched === state.touched) {
        return;
      }

      commit({
        ...state,
        touched: nextTouched,
      });
    },
    touchFields: (fields) => {
      const nextTouched = setManyByPathImmutable(
        state.touched,
        fields.map((field) => ({
          path: field,
          value: true,
        })),
      );

      if (nextTouched === state.touched) {
        return;
      }

      commit({
        ...state,
        touched: nextTouched,
      });
    },
    reset: (nextValues) => {
      const values = nextValues === undefined ? options.initialValues : nextValues;

      commit({
        values,
        errors: initialErrors,
        touched: initialTouched,
      });
    },
  };
}

export function useVanillaFormStore<TValues extends FormValues, TSelected>(
  store: VanillaFormStore<TValues>,
  selector: (state: VanillaFormStoreState<TValues>) => TSelected,
) {
  return React.useSyncExternalStore(
    store.subscribe,
    () => selector(store.getState()),
    () => selector(store.getState()),
  );
}

export function useVanillaFormField<
  TValues extends FormValues,
  TValue = unknown,
>(store: VanillaFormStore<TValues>, path: string) {
  const value = useVanillaFormStore(
    store,
    (state) => getByPath(state.values, path) as TValue,
  );
  const error = useVanillaFormStore(
    store,
    (state) => getByPath(state.errors, path),
  );
  const touched = useVanillaFormStore(
    store,
    (state) => Boolean(getByPath(state.touched, path)),
  );

  const setValue = React.useCallback(
    (nextValue: TValue) => {
      store.setValue(path, nextValue);
    },
    [path, store],
  );
  const setError = React.useCallback(
    (nextError: unknown) => {
      store.setFieldError(path, nextError);
    },
    [path, store],
  );
  const setTouched = React.useCallback(
    (nextTouched: boolean) => {
      store.setFieldTouched(path, nextTouched);
    },
    [path, store],
  );

  return {
    value,
    error,
    touched,
    setValue,
    setError,
    setTouched,
  };
}

type VanillaStoreBridge<TValues extends FormValues> = {
  store: VanillaFormStore<TValues>;
  validate?: (context: {
    values: TValues;
    fields?: readonly string[];
  }) => VanillaValidationResult;
  focusField?: (field: string) => void | Promise<void>;
  reset?: () => void | Promise<void>;
};

type VanillaManualBridge<TValues extends FormValues> = {
  getValues: () => TValues;
  subscribe?: (listener: () => void) => () => void;
  validate?: (context: {
    values: TValues;
    fields?: readonly string[];
  }) => VanillaValidationResult;
  getErrors?: () => VanillaValidationErrors | undefined;
  setErrors?: (
    errors: VanillaValidationErrors,
  ) => void | Promise<VanillaValidationErrors | void>;
  getTouched?: () => Record<string, unknown> | undefined;
  setTouched?: (
    touched: Record<string, unknown>,
  ) => void | Promise<Record<string, unknown> | void>;
  focusField?: (field: string) => void | Promise<void>;
  reset?: () => void | Promise<void>;
};

function createValidateFunction<TValues extends FormValues>(options: {
  getValues: () => TValues;
  getErrors: () => VanillaValidationErrors | undefined;
  writeErrors: (errors: VanillaValidationErrors) => Promise<void>;
  validate?: (context: {
    values: TValues;
    fields?: readonly string[];
  }) => VanillaValidationResult;
}): (
  fields?: readonly string[],
) => Promise<{
  valid: boolean;
  errors?: VanillaValidationErrors;
}> {
  const { getValues, getErrors, writeErrors, validate: validateBridge } = options;

  return async (fields?: readonly string[]) => {
    if (!validateBridge) {
      const errors = getErrors();

      return {
        valid:
          !fields || fields.length === 0
            ? !hasFieldError(errors)
            : fields.every((field) => !hasFieldError(getByPath(errors, field))),
        errors,
      };
    }

    const result = normalizeVanillaValidationResult(
      await validateBridge({
        values: getValues(),
        fields,
      }),
      getErrors(),
    );

    await writeErrors(result.errors ?? EMPTY_ERRORS);

    return {
      valid:
        !fields || fields.length === 0
          ? result.valid
          : fields.every(
              (field) => !hasFieldError(getByPath(result.errors, field)),
            ),
      errors: result.errors,
    };
  };
}

/**
 * Preferred vanilla adapter for local React apps.
 * Use a VanillaFormStore for values, errors, and touched state, and let the
 * multistep hook handle only step orchestration.
 */
export function createVanillaAdapter<TValues extends FormValues>(
  bridge: VanillaStoreBridge<TValues>,
): MultiStepFormAdapter<TValues> {
  const { store, validate: validateBridge, focusField, reset } = bridge;
  const readValues = () => store.getState().values;
  const readErrors = () => store.getState().errors;

  const validate = createValidateFunction({
    getValues: readValues,
    getErrors: readErrors,
    writeErrors: async (errors) => {
      store.setErrors(errors);
    },
    validate: validateBridge,
  });

  return {
    getValues: readValues,
    getErrors: readErrors,
    subscribe: store.subscribe,
    validateFields: validate,
    validateForm: () => validate(),
    touchFields: async (fields) => {
      if (fields.length === 0) {
        return;
      }

      store.touchFields(fields);
    },
    focusField,
    getFieldError: (field) => getByPath(readErrors(), field),
    reset: async () => {
      if (reset) {
        await reset();
        return;
      }

      store.reset();
    },
  };
}

/**
 * Advanced escape hatch for non-store integrations.
 * Prefer createVanillaAdapter + createVanillaFormStore for new code.
 */
export function createVanillaManualAdapter<TValues extends FormValues>(
  bridge: VanillaManualBridge<TValues>,
): MultiStepFormAdapter<TValues> {
  const {
    getValues,
    subscribe,
    validate: validateBridge,
    getErrors,
    setErrors,
    getTouched,
    setTouched,
    focusField,
    reset,
  } = bridge;
  let validationErrors: VanillaValidationErrors | undefined;

  const readErrors = () => getErrors?.() ?? validationErrors;
  const readTouched = () => getTouched?.();

  const validate = createValidateFunction({
    getValues,
    getErrors: readErrors,
    writeErrors: async (errors) => {
      validationErrors = errors;

      if (setErrors) {
        await setErrors(errors);
      }
    },
    validate: validateBridge,
  });

  return {
    getValues,
    getErrors: readErrors,
    subscribe,
    validateFields: validate,
    validateForm: () => validate(),
    touchFields: setTouched
      ? async (fields) => {
          if (fields.length === 0) {
            return;
          }

          const nextTouched = setManyByPathImmutable(
            readTouched() ?? EMPTY_TOUCHED,
            fields.map((field) => ({
              path: field,
              value: true,
            })),
          );

          await setTouched(nextTouched);
        }
      : undefined,
    focusField,
    getFieldError: (field) => getByPath(readErrors(), field),
    reset,
  };
}
