import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MutableRefObject,
} from "react";

import type { MultiStepFlowStep, StepId } from "../types";

type NavigationAction = "next" | "goto" | "submit";

type NavigationCoreOptions<
  TStepId extends StepId,
  TStep extends MultiStepFlowStep<TStepId>,
> = {
  hookName: string;
  steps: readonly TStep[];
  initialStepId?: TStepId;
  onError?: (error: unknown) => void;
  onStepChange?: (payload: { from: TStep; to: TStep; toIndex: number }) => void;
};

type NavigationCoreApi<
  TStepId extends StepId,
  TStep extends MultiStepFlowStep<TStepId>,
> = {
  stepIndexById: ReadonlyMap<TStepId, number>;
  currentStepIndex: number;
  currentStep: TStep;
  visitedStepIds: readonly TStepId[];
  visitedStepIdsSetRef: MutableRefObject<Set<TStepId>>;
  currentStepIndexRef: MutableRefObject<number>;
  isBusy: boolean;
  subscribe: (listener: () => void) => () => void;
  resolveStepIndex: (step: TStepId | number) => number;
  runExclusiveAction: (
    action: NavigationAction,
    task: () => Promise<boolean>,
  ) => Promise<boolean>;
  moveToIndex: (nextIndex: number) => boolean;
  previous: () => boolean;
  resetNavigation: () => void;
};

function areSetsEqual<TValue>(left: Set<TValue>, right: Set<TValue>) {
  if (left.size !== right.size) {
    return false;
  }

  for (const value of left) {
    if (!right.has(value)) {
      return false;
    }
  }

  return true;
}

function createStepIndexById<
  TStepId extends StepId,
  TStep extends MultiStepFlowStep<TStepId>,
>(steps: readonly TStep[]): Map<TStepId, number> {
  const map = new Map<TStepId, number>();

  steps.forEach((step, index) => {
    if (map.has(step.id)) {
      throw new Error(`Duplicate step id: ${String(step.id)}.`);
    }

    map.set(step.id, index);
  });

  return map;
}

function getInitialStepIndex<TStepId extends StepId>(
  hookName: string,
  stepIndexById: ReadonlyMap<TStepId, number>,
  initialStepId?: TStepId,
): number {
  if (initialStepId === undefined) {
    return 0;
  }

  const index = stepIndexById.get(initialStepId);

  if (index === undefined) {
    throw new Error(
      `${hookName} received an unknown initialStepId: ${String(initialStepId)}.`,
    );
  }

  return index;
}

function getVisitedStepIds<
  TStepId extends StepId,
  TStep extends MultiStepFlowStep<TStepId>,
>(
  steps: readonly TStep[],
  stepIndexById: ReadonlyMap<TStepId, number>,
  stepIndex: number,
  seed?: Iterable<TStepId>,
): Set<TStepId> {
  const next = new Set<TStepId>();

  if (seed) {
    for (const stepId of seed) {
      if (stepIndexById.has(stepId)) {
        next.add(stepId);
      }
    }
  }

  const step = steps[stepIndex];

  if (step) {
    next.add(step.id);
  }

  return next;
}

export function useNavigationCore<
  TStepId extends StepId,
  TStep extends MultiStepFlowStep<TStepId>,
>(
  options: NavigationCoreOptions<TStepId, TStep>,
): NavigationCoreApi<TStepId, TStep> {
  const { hookName, steps, initialStepId, onError, onStepChange } = options;

  if (steps.length === 0) {
    throw new Error(`${hookName} requires at least one step.`);
  }

  const stepIndexById = useMemo(
    () => createStepIndexById<TStepId, TStep>(steps),
    [steps],
  );
  const computedInitialIndex = useMemo(
    () => getInitialStepIndex(hookName, stepIndexById, initialStepId),
    [hookName, initialStepId, stepIndexById],
  );

  const [storedStepIndex, setStoredStepIndex] = useState(computedInitialIndex);
  const [visitedStepIdsSet, setVisitedStepIdsSet] = useState<Set<TStepId>>(() =>
    getVisitedStepIds<TStepId, TStep>(
      steps,
      stepIndexById,
      computedInitialIndex,
    ),
  );
  const [isBusy, setIsBusy] = useState(false);
  const currentStepIndex = Math.max(
    0,
    Math.min(storedStepIndex, steps.length - 1),
  );
  const currentStep = steps[currentStepIndex];
  const pendingActionRef = useRef<NavigationAction | null>(null);
  const previousInitialStepIdRef = useRef<TStepId | undefined>(initialStepId);
  const listenersRef = useRef(new Set<() => void>());
  const currentStepIndexRef = useRef(currentStepIndex);
  const visitedStepIdsSetRef = useRef(visitedStepIdsSet);

  currentStepIndexRef.current = currentStepIndex;
  visitedStepIdsSetRef.current = visitedStepIdsSet;

  useEffect(() => {
    if (storedStepIndex < steps.length) {
      return;
    }

    const nextIndex = Math.max(0, steps.length - 1);
    setStoredStepIndex(nextIndex);
    setVisitedStepIdsSet((previous) =>
      getVisitedStepIds<TStepId, TStep>(
        steps,
        stepIndexById,
        nextIndex,
        previous,
      ),
    );
  }, [stepIndexById, steps, storedStepIndex]);

  useEffect(() => {
    listenersRef.current.forEach((listener) => {
      listener();
    });
  }, [currentStepIndex, isBusy, visitedStepIdsSet]);

  useEffect(() => {
    if (previousInitialStepIdRef.current === initialStepId) {
      return;
    }

    previousInitialStepIdRef.current = initialStepId;
    setStoredStepIndex(computedInitialIndex);
    setVisitedStepIdsSet(
      getVisitedStepIds<TStepId, TStep>(
        steps,
        stepIndexById,
        computedInitialIndex,
      ),
    );
  }, [computedInitialIndex, initialStepId, stepIndexById, steps]);

  const runExclusiveAction = useCallback(
    async (action: NavigationAction, task: () => Promise<boolean>) => {
      if (pendingActionRef.current) {
        return false;
      }

      pendingActionRef.current = action;
      setIsBusy(true);

      try {
        return await task();
      } catch (error) {
        onError?.(error);
        return false;
      } finally {
        pendingActionRef.current = null;
        setIsBusy(false);
      }
    },
    [onError],
  );

  const moveToIndex = useCallback(
    (nextIndex: number) => {
      if (nextIndex < 0 || nextIndex >= steps.length) {
        return false;
      }

      const from = steps[currentStepIndex];
      const to = steps[nextIndex];

      if (!from || !to || from.id === to.id) {
        return false;
      }

      setStoredStepIndex(nextIndex);
      setVisitedStepIdsSet((previous) => {
        const next = getVisitedStepIds<TStepId, TStep>(
          steps,
          stepIndexById,
          nextIndex,
          previous,
        );

        if (areSetsEqual(next, previous)) {
          return previous;
        }

        return next;
      });
      onStepChange?.({ from, to, toIndex: nextIndex });

      return true;
    },
    [currentStepIndex, onStepChange, stepIndexById, steps],
  );

  const previous = useCallback(() => {
    if (pendingActionRef.current || currentStepIndex <= 0) {
      return false;
    }

    return moveToIndex(currentStepIndex - 1);
  }, [currentStepIndex, moveToIndex]);

  const resetNavigation = useCallback(() => {
    pendingActionRef.current = null;
    setIsBusy(false);
    setStoredStepIndex(computedInitialIndex);
    setVisitedStepIdsSet(
      getVisitedStepIds<TStepId, TStep>(
        steps,
        stepIndexById,
        computedInitialIndex,
      ),
    );
  }, [computedInitialIndex, stepIndexById, steps]);

  const subscribe = useCallback((listener: () => void) => {
    listenersRef.current.add(listener);

    return () => {
      listenersRef.current.delete(listener);
    };
  }, []);

  const resolveStepIndex = useCallback(
    (step: TStepId | number) =>
      typeof step === "number" ? step : (stepIndexById.get(step) ?? -1),
    [stepIndexById],
  );

  const visitedStepIds = useMemo(
    () => Array.from(visitedStepIdsSet),
    [visitedStepIdsSet],
  );

  return {
    stepIndexById,
    currentStepIndex,
    currentStep,
    visitedStepIds,
    visitedStepIdsSetRef,
    currentStepIndexRef,
    isBusy,
    subscribe,
    resolveStepIndex,
    runExclusiveAction,
    moveToIndex,
    previous,
    resetNavigation,
  };
}
