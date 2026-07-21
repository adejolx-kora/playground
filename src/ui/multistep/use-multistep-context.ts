import { createContext, useContext } from "react";

import type {
  MultiStepId,
  UseMultiStepReturn,
  MultiStepDefinition,
} from "@/hooks/use-multi-step";

export type MultiStepStepState = "complete" | "current" | "upcoming";

export interface MultiStepContextValue<
  TStepId extends MultiStepId,
  TMeta = unknown,
> extends UseMultiStepReturn<TStepId, TMeta> {
  steps: readonly MultiStepDefinition<TStepId, TMeta>[];
  getStepIndex: (stepId: TStepId) => number;
  getStepState: (stepId: TStepId) => MultiStepStepState;
  getTriggerId: (stepId: TStepId) => string;
  getPanelId: (stepId: TStepId) => string;
}

export type InternalMultiStepContextValue = MultiStepContextValue<
  MultiStepId,
  unknown
>;

export const MultiStepContext =
  createContext<InternalMultiStepContextValue | null>(null);

/**
 * Reads the nearest MultiStep.Root state.
 *
 * Supply generics when a custom child needs the same precise types as the root:
 * `useMultiStepContext<StepId, Values, StepMeta>()`.
 */
export function useMultiStepContext<
  TStepId extends MultiStepId = MultiStepId,
  TMeta = unknown,
>(): MultiStepContextValue<TStepId, TMeta> {
  const context = useContext(MultiStepContext);

  if (!context) {
    throw new Error(
      "Multi-step primitives must be rendered inside MultiStep.Root.",
    );
  }

  return context as unknown as MultiStepContextValue<TStepId, TMeta>;
}
