import { useCallback, useSyncExternalStore } from "react";

import { useNavigationCore } from "@/lib/multistep-form/internal/use-navigation-core";
import {
  normalizeValidationResult,
  type NormalizedValidationResult,
} from "@/lib/multistep-form/internal/validation";
import {
  type FormValues,
  type MultiStepFormApi,
  type MultiStepFormOptions,
  type MultiStepFormStep,
  type MultiStepValidationDirection,
  type StepId,
  type ValidationErrors,
} from "@/lib/multistep-form/types";
import { getByPath } from "@/lib/multistep-form/utils/path";
import { hasFieldError, hasValue } from "@/lib/multistep-form/utils/state";

const EMPTY_FIELDS: readonly string[] = [];

function getUniqueFields<TValues extends FormValues, TStepId extends StepId>(
  steps: readonly MultiStepFormStep<TValues, TStepId>[],
  stepIndexes: readonly number[],
) {
  const fields = new Set<string>();

  for (const stepIndex of stepIndexes) {
    const step = steps[stepIndex];

    if (!step) {
      continue;
    }

    for (const field of step.fields ?? EMPTY_FIELDS) {
      fields.add(field);
    }
  }

  return Array.from(fields);
}

export function useMultiStepForm<
  TValues extends FormValues,
  TStepId extends StepId = StepId,
>(
  options: MultiStepFormOptions<TValues, TStepId>,
): MultiStepFormApi<TValues, TStepId> {
  const {
    steps,
    adapter,
    onStepChange,
    onComplete,
    onError,
    initialStepId,
    isStepComplete,
    validateIntermediateStepsOnGoto = true,
  } = options;
  const navigation = useNavigationCore({
    hookName: "useMultiStepForm",
    steps,
    initialStepId,
    onError,
    onStepChange,
  });

  const readFieldError = useCallback(
    (field: string, errors?: ValidationErrors) =>
      errors
        ? getByPath(errors, field)
        : (adapter.getFieldError?.(field) ?? getByPath(adapter.getErrors?.(), field)),
    [adapter],
  );

  const focusStepField = useCallback(
    async (
      step: MultiStepFormStep<TValues, TStepId>,
      errors?: ValidationErrors,
    ) => {
      const fields = step.fields ?? EMPTY_FIELDS;

      if (fields.length === 0 || !adapter.focusField) {
        return;
      }

      const firstInvalidField =
        fields.find((field) => hasFieldError(readFieldError(field, errors))) ??
        fields[0];

      await adapter.focusField(firstInvalidField);
    },
    [adapter, readFieldError],
  );

  const touchStepFields = useCallback(
    async (stepIndexes: readonly number[]) => {
      const fields = getUniqueFields(steps, stepIndexes);

      if (fields.length === 0) {
        return;
      }

      await adapter.touchFields?.(fields);
    },
    [adapter, steps],
  );

  const runCustomStepValidation = useCallback(
    async (
      step: MultiStepFormStep<TValues, TStepId>,
      stepIndex: number,
      direction: MultiStepValidationDirection,
    ) => {
      if (!step.validate) {
        return true;
      }

      const isValid = await step.validate({
        values: adapter.getValues(),
        step,
        stepIndex,
        direction,
      });

      if (!isValid) {
        await focusStepField(step);
      }

      return isValid;
    },
    [adapter, focusStepField],
  );

  const validateFieldsOnce = useCallback(
    async (fields: readonly string[]) => {
      if (fields.length === 0) {
        return {
          valid: true,
          errors: adapter.getErrors?.(),
        } satisfies NormalizedValidationResult;
      }

      if (adapter.validateFields) {
        return normalizeValidationResult(
          adapter,
          await adapter.validateFields(fields),
        );
      }

      if (adapter.validateForm) {
        return normalizeValidationResult(adapter, await adapter.validateForm());
      }

      return {
        valid: true,
        errors: adapter.getErrors?.(),
      } satisfies NormalizedValidationResult;
    },
    [adapter],
  );

  const validateFormOnce = useCallback(async () => {
    if (adapter.validateForm) {
      return normalizeValidationResult(adapter, await adapter.validateForm());
    }

    return validateFieldsOnce(getUniqueFields(steps, steps.map((_, index) => index)));
  }, [adapter, steps, validateFieldsOnce]);

  const stepHasAdapterErrors = useCallback(
    (
      step: MultiStepFormStep<TValues, TStepId>,
      errors?: ValidationErrors,
    ) =>
      (step.fields ?? EMPTY_FIELDS).some((field) =>
        hasFieldError(readFieldError(field, errors)),
      ),
    [readFieldError],
  );

  const handleInvalidStep = useCallback(
    async (
      stepIndex: number,
      errors?: ValidationErrors,
    ) => {
      if (stepIndex !== navigation.currentStepIndexRef.current) {
        navigation.moveToIndex(stepIndex);
      }

      await focusStepField(steps[stepIndex], errors);
      return false;
    },
    [focusStepField, navigation, steps],
  );

  const validateSingleStep = useCallback(
    async (
      stepIndex: number,
      direction: MultiStepValidationDirection,
    ) => {
      const step = steps[stepIndex];

      await touchStepFields([stepIndex]);

      const adapterResult = await validateFieldsOnce(step.fields ?? EMPTY_FIELDS);

      if (!adapterResult.valid || stepHasAdapterErrors(step, adapterResult.errors)) {
        await focusStepField(step, adapterResult.errors);
        return false;
      }

      return runCustomStepValidation(step, stepIndex, direction);
    },
    [
      focusStepField,
      runCustomStepValidation,
      stepHasAdapterErrors,
      steps,
      touchStepFields,
      validateFieldsOnce,
    ],
  );

  const findInvalidStepFromSharedValidation = useCallback(
    async (
      stepIndexes: readonly number[],
      validationResult: NormalizedValidationResult,
      direction: MultiStepValidationDirection,
    ) => {
      for (const stepIndex of stepIndexes) {
        const step = steps[stepIndex];

        if (stepHasAdapterErrors(step, validationResult.errors)) {
          return handleInvalidStep(stepIndex, validationResult.errors);
        }

        const customValid = await runCustomStepValidation(step, stepIndex, direction);

        if (!customValid) {
          return handleInvalidStep(stepIndex, validationResult.errors);
        }
      }

      if (!validationResult.valid) {
        for (const stepIndex of stepIndexes) {
          const step = steps[stepIndex];

          if ((step.fields ?? EMPTY_FIELDS).length === 0) {
            continue;
          }

          const stepResult = await validateFieldsOnce(step.fields ?? EMPTY_FIELDS);

          if (!stepResult.valid || stepHasAdapterErrors(step, stepResult.errors)) {
            return handleInvalidStep(stepIndex, stepResult.errors);
          }
        }

        return false;
      }

      return true;
    },
    [
      handleInvalidStep,
      runCustomStepValidation,
      stepHasAdapterErrors,
      steps,
      validateFieldsOnce,
    ],
  );

  const nextStep = useCallback(async () => {
    return navigation.runExclusiveAction("next", async () => {
      if (navigation.currentStepIndex >= steps.length - 1) {
        return false;
      }

      const isValid = await validateSingleStep(
        navigation.currentStepIndex,
        "next",
      );

      if (!isValid) {
        return false;
      }

      return navigation.moveToIndex(navigation.currentStepIndex + 1);
    });
  }, [navigation, steps.length, validateSingleStep]);

  const goToStep = useCallback(
    async (step: TStepId | number) => {
      return navigation.runExclusiveAction("goto", async () => {
        const nextIndex = navigation.resolveStepIndex(step);

        if (nextIndex < 0 || nextIndex >= steps.length) {
          return false;
        }

        if (nextIndex <= navigation.currentStepIndex) {
          return navigation.moveToIndex(nextIndex);
        }

        if (!validateIntermediateStepsOnGoto) {
          const isValid = await validateSingleStep(
            navigation.currentStepIndex,
            "goto",
          );

          if (!isValid) {
            return false;
          }

          return navigation.moveToIndex(nextIndex);
        }

        const stepIndexes = Array.from(
          { length: nextIndex - navigation.currentStepIndex },
          (_, offset) => navigation.currentStepIndex + offset,
        );

        await touchStepFields(stepIndexes);

        const sharedValidation =
          stepIndexes.length > 1
            ? await validateFormOnce()
            : await validateFieldsOnce(
                steps[navigation.currentStepIndex].fields ?? EMPTY_FIELDS,
              );
        const isValid = await findInvalidStepFromSharedValidation(
          stepIndexes,
          sharedValidation,
          "goto",
        );

        if (!isValid) {
          return false;
        }

        return navigation.moveToIndex(nextIndex);
      });
    },
    [
      findInvalidStepFromSharedValidation,
      navigation,
      steps,
      touchStepFields,
      validateFieldsOnce,
      validateFormOnce,
      validateIntermediateStepsOnGoto,
      validateSingleStep,
    ],
  );

  const submit = useCallback(async () => {
    return navigation.runExclusiveAction("submit", async () => {
      const stepIndexes = steps.map((_, index) => index);

      await touchStepFields(stepIndexes);

      const validationResult = await validateFormOnce();
      const isValid = await findInvalidStepFromSharedValidation(
        stepIndexes,
        validationResult,
        "submit",
      );

      if (!isValid) {
        return false;
      }

      await onComplete?.({ values: adapter.getValues(), steps });
      return true;
    });
  }, [
    adapter,
    findInvalidStepFromSharedValidation,
    navigation,
    onComplete,
    steps,
    touchStepFields,
    validateFormOnce,
  ]);

  const getStepCompletionState = useCallback(
    (stepId: TStepId) => {
      const stepIndex = navigation.stepIndexById.get(stepId);

      if (stepIndex === undefined) {
        return {
          isComplete: false,
          status: "pending" as const,
        };
      }

      const step = steps[stepIndex];
      const values = adapter.getValues();
      const activeStepIndex = navigation.currentStepIndexRef.current;
      const isVisited = navigation.visitedStepIdsSetRef.current.has(step.id);
      const fields = step.fields ?? EMPTY_FIELDS;
      const computedComplete =
        isVisited &&
        stepIndex < activeStepIndex &&
        (fields.length === 0 ||
          fields.every((field) => {
            const fieldValue = getByPath(values, field);
            return hasValue(fieldValue) && !hasFieldError(readFieldError(field));
          }));
      const complete = isStepComplete
        ? isStepComplete({
            values,
            step,
            stepIndex,
            currentStepIndex: activeStepIndex,
            isVisited,
            getFieldError: (field) => readFieldError(field),
          })
        : computedComplete;

      return {
        isComplete: complete,
        status:
          stepIndex === activeStepIndex
            ? ("current" as const)
            : complete
              ? ("complete" as const)
              : ("pending" as const),
      };
    },
    [adapter, isStepComplete, navigation, readFieldError, steps],
  );

  const subscribe = useCallback(
    (listener: () => void) => {
      const unsubscribeNavigation = navigation.subscribe(listener);
      const unsubscribeAdapter = adapter.subscribe?.(listener);

      return () => {
        unsubscribeNavigation();
        unsubscribeAdapter?.();
      };
    },
    [adapter, navigation],
  );

  const isStepVisited = useCallback(
    (stepId: TStepId) => navigation.visitedStepIdsSetRef.current.has(stepId),
    [navigation.visitedStepIdsSetRef],
  );

  return {
    subscribe,
    steps,
    currentStep: navigation.currentStep,
    currentStepIndex: navigation.currentStepIndex,
    totalSteps: steps.length,
    isFirstStep: navigation.currentStepIndex === 0,
    isLastStep: navigation.currentStepIndex === steps.length - 1,
    isBusy: navigation.isBusy,
    visitedStepIds: navigation.visitedStepIds,
    nextStep,
    prevStep: navigation.previous,
    goToStep,
    submit,
    reset: async (resetOptions?: { resetAdapter?: boolean }) => {
      navigation.resetNavigation();

      if (resetOptions?.resetAdapter !== false) {
        await adapter.reset?.();
      }
    },
    isStepVisited,
    isStepComplete: (stepId) => getStepCompletionState(stepId).isComplete,
    getStepStatus: (stepId) => getStepCompletionState(stepId).status,
  };
}

export function useMultiStepFormSelector<
  TValues extends FormValues,
  TStepId extends StepId,
  TSelected,
>(
  flow: MultiStepFormApi<TValues, TStepId>,
  selector: (flow: MultiStepFormApi<TValues, TStepId>) => TSelected,
) {
  return useSyncExternalStore(
    flow.subscribe,
    () => selector(flow),
    () => selector(flow),
  );
}
