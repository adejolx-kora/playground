import * as React from "react";

import {
  getByPath,
  hasValue,
  type FormValues,
  type MultiStepFormApi,
  type MultiStepFormOptions,
  type MultiStepFormStep,
  type MultiStepValidationDirection,
  type StepId,
} from "@/lib/multistep-form";

export function useMultiStepForm<
  TValues extends FormValues,
  TStepId extends StepId = StepId,
>(
  options: MultiStepFormOptions<TValues, TStepId>,
): MultiStepFormApi<TValues, TStepId> {
  const { steps, adapter, onStepChange, onComplete, initialStepId } = options;

  if (steps.length === 0) {
    throw new Error("useMultiStepForm requires at least one step.");
  }

  const stepIndexById = React.useMemo(() => {
    const map = new Map<TStepId, number>();
    steps.forEach((step, index) => {
      map.set(step.id, index);
    });
    return map;
  }, [steps]);

  const computedInitialIndex = React.useMemo(() => {
    if (!initialStepId) return 0;
    const index = stepIndexById.get(initialStepId);
    return index ?? 0;
  }, [initialStepId, stepIndexById]);

  const [currentStepIndex, setCurrentStepIndex] =
    React.useState(computedInitialIndex);
  const [visitedStepIds, setVisitedStepIds] = React.useState<Set<TStepId>>(
    () => new Set([steps[computedInitialIndex].id]),
  );

  const currentStep = steps[currentStepIndex];

  const runStepValidation = React.useCallback(
    async (
      step: MultiStepFormStep<TValues, TStepId>,
      stepIndex: number,
      direction: MultiStepValidationDirection,
    ) => {
      const fields = step.fields ?? [];

      await adapter.touchFields?.(fields);

      if (step.validate) {
        return step.validate({
          values: adapter.getValues(),
          step,
          stepIndex,
          direction,
        });
      }

      if (fields.length > 0 && adapter.validateFields) {
        return adapter.validateFields(fields);
      }

      if (adapter.validateForm) {
        return adapter.validateForm();
      }

      return true;
    },
    [adapter],
  );

  const moveToIndex = React.useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= steps.length) {
        return false;
      }

      const from = steps[currentStepIndex];
      const to = steps[nextIndex];
      if (!to || from.id === to.id) {
        return false;
      }

      setCurrentStepIndex(nextIndex);
      setVisitedStepIds((previous) => {
        const next = new Set(previous);
        next.add(to.id);
        return next;
      });

      onStepChange?.({ from, to, toIndex: nextIndex });
      return true;
    },
    [currentStepIndex, onStepChange, steps],
  );

  const nextStep = React.useCallback(async () => {
    if (currentStepIndex >= steps.length - 1) {
      return false;
    }

    const isValid = await runStepValidation(
      currentStep,
      currentStepIndex,
      "next",
    );
    if (!isValid) {
      return false;
    }

    return moveToIndex(currentStepIndex + 1);
  }, [
    currentStep,
    currentStepIndex,
    moveToIndex,
    runStepValidation,
    steps.length,
  ]);

  const prevStep = React.useCallback(() => {
    if (currentStepIndex <= 0) {
      return false;
    }

    return moveToIndex(currentStepIndex - 1);
  }, [currentStepIndex, moveToIndex]);

  const goToStep = React.useCallback(
    async (step: TStepId | number) => {
      const nextIndex =
        typeof step === "number" ? step : (stepIndexById.get(step) ?? -1);

      if (nextIndex < 0 || nextIndex >= steps.length) {
        return false;
      }

      if (nextIndex > currentStepIndex) {
        const isValid = await runStepValidation(
          currentStep,
          currentStepIndex,
          "goto",
        );
        if (!isValid) {
          return false;
        }
      }

      return moveToIndex(nextIndex);
    },
    [
      currentStep,
      currentStepIndex,
      moveToIndex,
      runStepValidation,
      stepIndexById,
      steps.length,
    ],
  );

  const submit = React.useCallback(async () => {
    for (let index = 0; index < steps.length; index++) {
      const step = steps[index];
      const isValid = await runStepValidation(step, index, "submit");

      if (!isValid) {
        moveToIndex(index);
        return false;
      }
    }

    await onComplete?.({ values: adapter.getValues(), steps });
    return true;
  }, [adapter, moveToIndex, onComplete, runStepValidation, steps]);

  const isStepVisited = React.useCallback(
    (step: TStepId) => visitedStepIds.has(step),
    [visitedStepIds],
  );

  const isStepComplete = React.useCallback(
    (stepId: TStepId) => {
      const index = stepIndexById.get(stepId);

      if (index === undefined) {
        return false;
      }

      const step = steps[index];
      const fields = step.fields ?? [];

      if (fields.length === 0) {
        return visitedStepIds.has(stepId) && index < currentStepIndex;
      }

      return fields.every((field) => {
        const touched = adapter.isFieldTouched?.(field) ?? true;
        const hasError = Boolean(adapter.getFieldError?.(field));
        const fieldValue = getByPath(adapter.getValues(), field);

        return touched && !hasError && hasValue(fieldValue);
      });
    },
    [adapter, currentStepIndex, stepIndexById, steps, visitedStepIds],
  );

  const getStepStatus = React.useCallback(
    (stepId: TStepId) => {
      const index = stepIndexById.get(stepId);

      if (index === undefined) {
        return "pending" as const;
      }

      if (index === currentStepIndex) {
        return "current" as const;
      }

      return isStepComplete(stepId)
        ? ("complete" as const)
        : ("pending" as const);
    },
    [currentStepIndex, isStepComplete, stepIndexById],
  );

  return {
    steps,
    currentStep,
    currentStepIndex,
    totalSteps: steps.length,
    isFirstStep: currentStepIndex === 0,
    isLastStep: currentStepIndex === steps.length - 1,
    visitedStepIds: Array.from(visitedStepIds),
    nextStep,
    prevStep,
    goToStep,
    submit,
    isStepVisited,
    isStepComplete,
    getStepStatus,
  };
}
