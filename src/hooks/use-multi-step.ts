import { useCallback, useEffect, useMemo, useRef, useState } from "react";

export type MultiStepId = string | number;
export type MultiStepDirection = "forward" | "backward" | "none";
export type MultiStepValidationMode = "forward" | "all" | "none";

type Awaitable<T> = T | Promise<T>;

export interface MultiStepDefinition<TStepId extends MultiStepId = string, TMeta = unknown> {
  id: TStepId;
  meta?: TMeta;
}

export interface MultiStepValidationContext<TStepId extends MultiStepId, TValues, TMeta> {
  currentStep: MultiStepDefinition<TStepId, TMeta>;
  targetStep: MultiStepDefinition<TStepId, TMeta>;
  currentIndex: number;
  targetIndex: number;
  direction: Exclude<MultiStepDirection, "none">;
  values: TValues | undefined;
  signal: AbortSignal;
}

export type MultiStepValidationResult =
  | boolean
  | {
      valid: boolean;
      reason?: string;
    };

/**
 * A deliberately small bridge between useMultiStep and any form-state library.
 * The adapter owns form-specific behavior; the hook owns only navigation.
 */
export interface MultiStepAdapter<TStepId extends MultiStepId, TValues = unknown, TMeta = unknown> {
  getValues?: () => TValues;
  validate?: (
    context: MultiStepValidationContext<TStepId, TValues, TMeta>,
  ) => Awaitable<MultiStepValidationResult>;
  reset?: () => Awaitable<void>;
}

export interface UseMultiStepOptions<
  TStepId extends MultiStepId,
  TValues = unknown,
  TMeta = unknown,
> {
  steps: readonly MultiStepDefinition<TStepId, TMeta>[];
  initialStepId?: TStepId;
  adapter?: MultiStepAdapter<TStepId, TValues, TMeta>;
  /** Defaults to "forward" so Back never forces form validation. */
  validateOn?: MultiStepValidationMode;
}

export type MultiStepFailureReason =
  | "adapter-error"
  | "blocked"
  | "boundary"
  | "busy"
  | "cancelled"
  | "invalid-target";

export type MultiStepNavigationResult<TStepId extends MultiStepId> =
  | {
      ok: true;
      changed: boolean;
      from: TStepId;
      to: TStepId;
    }
  | {
      ok: false;
      reason: MultiStepFailureReason;
      from: TStepId;
      to?: TStepId;
      message?: string;
      error?: unknown;
    };

export interface UseMultiStepReturn<TStepId extends MultiStepId, TMeta = unknown> {
  currentStep: MultiStepDefinition<TStepId, TMeta>;
  currentStepId: TStepId;
  currentIndex: number;
  totalSteps: number;
  direction: MultiStepDirection;
  progress: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  canGoBack: boolean;
  canGoForward: boolean;
  isTransitioning: boolean;
  blockedReason: string | null;
  error: unknown;
  next: () => Promise<MultiStepNavigationResult<TStepId>>;
  previous: () => Promise<MultiStepNavigationResult<TStepId>>;
  goTo: (stepId: TStepId) => Promise<MultiStepNavigationResult<TStepId>>;
  reset: () => Promise<MultiStepNavigationResult<TStepId>>;
  clearError: () => void;
}

function normalizeValidationResult(result: MultiStepValidationResult): {
  valid: boolean;
  reason?: string;
} {
  return typeof result === "boolean" ? { valid: result } : result;
}

function assertValidSteps<TStepId extends MultiStepId, TMeta>(
  steps: readonly MultiStepDefinition<TStepId, TMeta>[],
  initialStepId: TStepId | undefined,
): void {
  if (steps.length === 0) {
    throw new Error("useMultiStep requires at least one step.");
  }

  const ids = new Set<TStepId>();
  for (const step of steps) {
    if (ids.has(step.id)) {
      throw new Error(`useMultiStep received a duplicate step id: ${String(step.id)}`);
    }
    ids.add(step.id);
  }

  if (initialStepId !== undefined && !ids.has(initialStepId)) {
    throw new Error(`useMultiStep could not find initialStepId: ${String(initialStepId)}`);
  }
}

/**
 * Headless multi-step navigation for React.
 *
 * The hook has no dependency on a form library. Consumers can pass an adapter
 * for validation, values, and reset behavior from React Hook Form, Formik,
 * Final Form, Zustand, custom reducers, or any other state manager.
 */
export function useMultiStep<TStepId extends MultiStepId, TValues = unknown, TMeta = unknown>(
  options: UseMultiStepOptions<TStepId, TValues, TMeta>,
): UseMultiStepReturn<TStepId, TMeta> {
  const { steps: inputSteps, initialStepId, adapter, validateOn = "forward" } = options;

  const steps = useMemo(() => {
    assertValidSteps(inputSteps, initialStepId);
    return inputSteps;
  }, [inputSteps, initialStepId]);

  const originalInitialStepIdRef = useRef<TStepId>(initialStepId ?? steps[0].id);

  const [currentStepId, setCurrentStepId] = useState<TStepId>(originalInitialStepIdRef.current);
  const [direction, setDirection] = useState<MultiStepDirection>("none");
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [error, setError] = useState<unknown>(null);

  const stepsRef = useRef(steps);
  const adapterRef = useRef(adapter);
  const validateOnRef = useRef(validateOn);
  const currentStepIdRef = useRef(currentStepId);
  const transitionLockRef = useRef(false);
  const activeControllerRef = useRef<AbortController | null>(null);
  const mountedRef = useRef(true);

  stepsRef.current = steps;
  adapterRef.current = adapter;
  validateOnRef.current = validateOn;
  currentStepIdRef.current = currentStepId;

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      activeControllerRef.current?.abort();
    };
  }, []);

  // Keep navigation usable when a dynamic step list removes the active step.
  useEffect(() => {
    if (!steps.some((step) => step.id === currentStepIdRef.current)) {
      const fallbackId = steps[0].id;
      currentStepIdRef.current = fallbackId;
      setCurrentStepId(fallbackId);
      setDirection("none");
      setBlockedReason(null);
    }
  }, [steps]);

  const currentIndex = steps.findIndex((step) => step.id === currentStepId);
  const safeCurrentIndex = currentIndex === -1 ? 0 : currentIndex;
  const currentStep = steps[safeCurrentIndex];

  const navigate = useCallback(
    async (targetStepId: TStepId): Promise<MultiStepNavigationResult<TStepId>> => {
      const liveSteps = stepsRef.current;
      const fromId = currentStepIdRef.current;
      const fromIndex = liveSteps.findIndex((step) => step.id === fromId);
      const targetIndex = liveSteps.findIndex((step) => step.id === targetStepId);

      if (targetIndex === -1) {
        return {
          ok: false,
          reason: "invalid-target",
          from: fromId,
          to: targetStepId,
          message: `Unknown step id: ${String(targetStepId)}`,
        };
      }

      if (fromIndex === -1) {
        return {
          ok: false,
          reason: "invalid-target",
          from: fromId,
          to: targetStepId,
          message: `Current step no longer exists: ${String(fromId)}`,
        };
      }

      if (fromId === targetStepId) {
        return { ok: true, changed: false, from: fromId, to: targetStepId };
      }

      if (transitionLockRef.current) {
        return {
          ok: false,
          reason: "busy",
          from: fromId,
          to: targetStepId,
          message: "A step transition is already in progress.",
        };
      }

      const nextDirection: Exclude<MultiStepDirection, "none"> =
        targetIndex > fromIndex ? "forward" : "backward";
      const controller = new AbortController();

      transitionLockRef.current = true;
      activeControllerRef.current = controller;
      if (mountedRef.current) {
        setIsTransitioning(true);
        setBlockedReason(null);
        setError(null);
      }

      try {
        const liveAdapter = adapterRef.current;
        const mode = validateOnRef.current;
        const shouldValidate =
          mode === "all" || (mode === "forward" && nextDirection === "forward");

        if (shouldValidate && liveAdapter?.validate) {
          const validation = normalizeValidationResult(
            await liveAdapter.validate({
              currentStep: liveSteps[fromIndex],
              targetStep: liveSteps[targetIndex],
              currentIndex: fromIndex,
              targetIndex,
              direction: nextDirection,
              values: liveAdapter.getValues?.(),
              signal: controller.signal,
            }),
          );

          if (controller.signal.aborted) {
            return {
              ok: false,
              reason: "cancelled",
              from: fromId,
              to: targetStepId,
            };
          }

          if (!validation.valid) {
            if (mountedRef.current) {
              setBlockedReason(validation.reason ?? null);
            }
            return {
              ok: false,
              reason: "blocked",
              from: fromId,
              to: targetStepId,
              message: validation.reason,
            };
          }
        }

        if (controller.signal.aborted || !mountedRef.current) {
          return {
            ok: false,
            reason: "cancelled",
            from: fromId,
            to: targetStepId,
          };
        }

        currentStepIdRef.current = targetStepId;
        setCurrentStepId(targetStepId);
        setDirection(nextDirection);

        return {
          ok: true,
          changed: true,
          from: fromId,
          to: targetStepId,
        };
      } catch (caughtError) {
        if (mountedRef.current) {
          setError(caughtError);
        }
        return {
          ok: false,
          reason: "adapter-error",
          from: fromId,
          to: targetStepId,
          error: caughtError,
          message:
            caughtError instanceof Error
              ? caughtError.message
              : "The form adapter failed during navigation.",
        };
      } finally {
        transitionLockRef.current = false;
        if (activeControllerRef.current === controller) {
          activeControllerRef.current = null;
        }
        if (mountedRef.current) {
          setIsTransitioning(false);
        }
      }
    },
    [],
  );

  const next = useCallback(async () => {
    const liveSteps = stepsRef.current;
    const fromId = currentStepIdRef.current;
    const index = liveSteps.findIndex((step) => step.id === fromId);

    if (index === -1 || index >= liveSteps.length - 1) {
      return {
        ok: false,
        reason: "boundary",
        from: fromId,
        message: "Already at the final step.",
      } satisfies MultiStepNavigationResult<TStepId>;
    }

    return navigate(liveSteps[index + 1].id);
  }, [navigate]);

  const previous = useCallback(async () => {
    const liveSteps = stepsRef.current;
    const fromId = currentStepIdRef.current;
    const index = liveSteps.findIndex((step) => step.id === fromId);

    if (index <= 0) {
      return {
        ok: false,
        reason: "boundary",
        from: fromId,
        message: "Already at the first step.",
      } satisfies MultiStepNavigationResult<TStepId>;
    }

    return navigate(liveSteps[index - 1].id);
  }, [navigate]);

  const goTo = useCallback((stepId: TStepId) => navigate(stepId), [navigate]);

  const reset = useCallback(async (): Promise<MultiStepNavigationResult<TStepId>> => {
    const liveSteps = stepsRef.current;
    const fromId = currentStepIdRef.current;
    const requestedInitialId = originalInitialStepIdRef.current;
    const resetTarget = liveSteps.some((step) => step.id === requestedInitialId)
      ? requestedInitialId
      : liveSteps[0].id;

    if (transitionLockRef.current) {
      return {
        ok: false,
        reason: "busy",
        from: fromId,
        to: resetTarget,
        message: "A step transition is already in progress.",
      };
    }

    transitionLockRef.current = true;
    if (mountedRef.current) {
      setIsTransitioning(true);
      setBlockedReason(null);
      setError(null);
    }

    try {
      await adapterRef.current?.reset?.();

      if (!mountedRef.current) {
        return {
          ok: false,
          reason: "cancelled",
          from: fromId,
          to: resetTarget,
        };
      }

      currentStepIdRef.current = resetTarget;
      setCurrentStepId(resetTarget);
      setDirection("none");

      return {
        ok: true,
        changed: fromId !== resetTarget,
        from: fromId,
        to: resetTarget,
      };
    } catch (caughtError) {
      if (mountedRef.current) {
        setError(caughtError);
      }
      return {
        ok: false,
        reason: "adapter-error",
        from: fromId,
        to: resetTarget,
        error: caughtError,
        message:
          caughtError instanceof Error
            ? caughtError.message
            : "The form adapter failed during reset.",
      };
    } finally {
      transitionLockRef.current = false;
      if (mountedRef.current) {
        setIsTransitioning(false);
      }
    }
  }, []);

  const clearError = useCallback(() => setError(null), []);
  const totalSteps = steps.length;
  const isFirstStep = safeCurrentIndex === 0;
  const isLastStep = safeCurrentIndex === totalSteps - 1;

  return {
    currentStep,
    currentStepId: currentStep.id,
    currentIndex: safeCurrentIndex,
    totalSteps,
    direction,
    progress: (safeCurrentIndex + 1) / totalSteps,
    isFirstStep,
    isLastStep,
    canGoBack: !isFirstStep && !isTransitioning,
    canGoForward: !isLastStep && !isTransitioning,
    isTransitioning,
    blockedReason,
    error,
    next,
    previous,
    goTo,
    reset,
    clearError,
  };
}

/** Identity helper that improves generic inference for separately declared adapters. */
export function defineMultiStepAdapter<
  TStepId extends MultiStepId,
  TValues = unknown,
  TMeta = unknown,
>(adapter: MultiStepAdapter<TStepId, TValues, TMeta>): MultiStepAdapter<TStepId, TValues, TMeta> {
  return adapter;
}
