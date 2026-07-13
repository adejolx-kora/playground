import { useCallback } from "react";

import { useNavigationCore } from "@/lib/multistep-form/internal/use-navigation-core";
import {
  type MultiStepFlowApi,
  type MultiStepFlowOptions,
  type StepId,
} from "@/lib/multistep-form/types";

export function useMultiStepFlow<TStepId extends StepId = StepId>(
  options: MultiStepFlowOptions<TStepId>,
): MultiStepFlowApi<TStepId> {
  const { steps, initialStepId, onError, onStepChange, onComplete } = options;
  const navigation = useNavigationCore({
    hookName: "useMultiStepFlow",
    steps,
    initialStepId,
    onError,
    onStepChange,
  });

  const nextStep = useCallback(async () => {
    return navigation.runExclusiveAction("next", async () => {
      if (navigation.currentStepIndex >= steps.length - 1) {
        return false;
      }

      return navigation.moveToIndex(navigation.currentStepIndex + 1);
    });
  }, [navigation, steps.length]);

  const goToStep = useCallback(
    async (step: TStepId | number) => {
      return navigation.runExclusiveAction("goto", async () => {
        const nextIndex = navigation.resolveStepIndex(step);

        if (nextIndex < 0 || nextIndex >= steps.length) {
          return false;
        }

        return navigation.moveToIndex(nextIndex);
      });
    },
    [navigation, steps.length],
  );

  const submit = useCallback(async () => {
    return navigation.runExclusiveAction("submit", async () => {
      await onComplete?.({ steps });
      return true;
    });
  }, [navigation, onComplete, steps]);

  const isStepVisited = useCallback(
    (stepId: TStepId) => navigation.visitedStepIdsSetRef.current.has(stepId),
    [navigation.visitedStepIdsSetRef],
  );

  const isStepComplete = useCallback(
    (stepId: TStepId) => {
      const stepIndex = navigation.stepIndexById.get(stepId);

      return (
        stepIndex !== undefined &&
        navigation.visitedStepIdsSetRef.current.has(stepId) &&
        stepIndex < navigation.currentStepIndexRef.current
      );
    },
    [
      navigation.currentStepIndexRef,
      navigation.stepIndexById,
      navigation.visitedStepIdsSetRef,
    ],
  );

  const getStepStatus = useCallback(
    (stepId: TStepId) => {
      const stepIndex = navigation.stepIndexById.get(stepId);

      if (stepIndex === undefined) {
        return "pending" as const;
      }

      if (stepIndex === navigation.currentStepIndexRef.current) {
        return "current" as const;
      }

      return isStepComplete(stepId)
        ? ("complete" as const)
        : ("pending" as const);
    },
    [isStepComplete, navigation.currentStepIndexRef, navigation.stepIndexById],
  );

  return {
    subscribe: navigation.subscribe,
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
    reset: async () => {
      navigation.resetNavigation();
    },
    isStepVisited,
    isStepComplete,
    getStepStatus,
  };
}
