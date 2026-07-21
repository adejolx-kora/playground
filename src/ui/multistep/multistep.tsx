import { useRender } from "@base-ui/react/use-render";
import { Button } from "@korapay/react";
import { Progress } from "@korapay/react/atoms";
import {
  forwardRef,
  useCallback,
  useId,
  useMemo,
  type ComponentPropsWithoutRef,
  type HTMLAttributes,
  type LiHTMLAttributes,
  type OlHTMLAttributes,
  type ReactElement,
  type ReactNode,
  type RefAttributes,
} from "react";

import {
  useMultiStep,
  type MultiStepId,
  type MultiStepNavigationResult,
  type UseMultiStepOptions,
} from "@/hooks/use-multi-step";

import {
  MultiStepContext,
  type MultiStepContextValue,
  type MultiStepStepState,
  type InternalMultiStepContextValue,
  useMultiStepContext,
} from "./use-multistep-context";

interface MultiStepRootProps<
  TStepId extends MultiStepId,
  TValues = unknown,
  TMeta = unknown,
>
  extends
    UseMultiStepOptions<TStepId, TValues, TMeta>,
    Omit<HTMLAttributes<HTMLDivElement>, "children"> {
  /** Replaces the default root element while preserving its behavior and props. */
  render?: useRender.RenderProp;
  children?:
    | ReactNode
    | ((context: MultiStepContextValue<TStepId, TMeta>) => ReactNode);
}

type MultiStepRootComponent = <
  TStepId extends MultiStepId,
  TValues = unknown,
  TMeta = unknown,
>(
  props: MultiStepRootProps<TStepId, TValues, TMeta> &
    RefAttributes<HTMLDivElement>,
) => ReactElement | null;

function MultiStepRootImplementation<
  TStepId extends MultiStepId,
  TValues,
  TMeta,
>(
  props: MultiStepRootProps<TStepId, TValues, TMeta>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
): ReactElement {
  const {
    steps,
    initialStepId,
    adapter,
    validateOn,
    render,
    children,
    "aria-busy": ariaBusy,
    ...rootProps
  } = props;
  const flow = useMultiStep({ steps, initialStepId, adapter, validateOn });
  const reactId = useId();
  const baseId = useMemo(
    () => `multi-step-${reactId.replace(/:/g, "")}`,
    [reactId],
  );

  const getStepIndex = useCallback(
    (stepId: TStepId): number => {
      const index = steps.findIndex((step) => step.id === stepId);

      if (index === -1) {
        throw new Error(
          `Multi-step primitive received an unknown step id: ${String(stepId)}`,
        );
      }

      return index;
    },
    [steps],
  );

  const getStepState = useCallback(
    (stepId: TStepId): MultiStepStepState => {
      const index = getStepIndex(stepId);

      if (index === flow.currentIndex) {
        return "current";
      }

      return index < flow.currentIndex ? "complete" : "upcoming";
    },
    [flow.currentIndex, getStepIndex],
  );

  const getTriggerId = useCallback(
    (stepId: TStepId) => `${baseId}-trigger-${getStepIndex(stepId)}`,
    [baseId, getStepIndex],
  );

  const getPanelId = useCallback(
    (stepId: TStepId) => `${baseId}-panel-${getStepIndex(stepId)}`,
    [baseId, getStepIndex],
  );

  const context = useMemo<MultiStepContextValue<TStepId, TMeta>>(
    () => ({
      ...flow,
      steps,
      getStepIndex,
      getStepState,
      getTriggerId,
      getPanelId,
    }),
    [flow, getPanelId, getStepIndex, getStepState, getTriggerId, steps],
  );
  const root = useRender({
    defaultTagName: "div",
    render,
    ref: forwardedRef,
    props: {
      ...rootProps,
      children: typeof children === "function" ? children(context) : children,
      "aria-busy": ariaBusy ?? flow.isTransitioning,
      "data-current-step": String(flow.currentStepId),
      "data-direction": flow.direction,
      "data-state": flow.isTransitioning ? "transitioning" : "idle",
      "data-multi-step-root": "",
    },
  });

  return (
    <MultiStepContext.Provider
      value={context as unknown as InternalMultiStepContextValue}
    >
      {root}
    </MultiStepContext.Provider>
  );
}

const MultiStepRoot = forwardRef(
  MultiStepRootImplementation,
) as MultiStepRootComponent;

const MultiStepList = forwardRef<
  HTMLOListElement,
  OlHTMLAttributes<HTMLOListElement>
>(function MultiStepList({ "aria-label": ariaLabel, ...props }, forwardedRef) {
  return (
    <ol
      {...props}
      ref={forwardedRef}
      aria-label={ariaLabel ?? "Steps"}
      data-multi-step-list=""
    />
  );
});

interface MultiStepItemProps<
  TStepId extends MultiStepId = MultiStepId,
> extends LiHTMLAttributes<HTMLLIElement> {
  stepId: TStepId;
}

type MultiStepItemComponent = <TStepId extends MultiStepId = MultiStepId>(
  props: MultiStepItemProps<TStepId> & RefAttributes<HTMLLIElement>,
) => ReactElement;

function MultiStepItemImplementation<TStepId extends MultiStepId>(
  { stepId, ...props }: MultiStepItemProps<TStepId>,
  forwardedRef: React.ForwardedRef<HTMLLIElement>,
): ReactElement {
  const context = useMultiStepContext<TStepId>();
  const index = context.getStepIndex(stepId);
  const state = context.getStepState(stepId);

  return (
    <li
      {...props}
      ref={forwardedRef}
      data-index={index}
      data-state={state}
      data-multi-step-item=""
    />
  );
}

const MultiStepItem = forwardRef(
  MultiStepItemImplementation,
) as MultiStepItemComponent;

interface MultiStepTriggerProps<
  TStepId extends MultiStepId = MultiStepId,
> extends ComponentPropsWithoutRef<typeof Button> {
  stepId: TStepId;
  onNavigationResult?: (result: MultiStepNavigationResult<TStepId>) => void;
}

type MultiStepTriggerComponent = <TStepId extends MultiStepId = MultiStepId>(
  props: MultiStepTriggerProps<TStepId> & RefAttributes<HTMLButtonElement>,
) => ReactElement;

function MultiStepTriggerImplementation<TStepId extends MultiStepId>(
  {
    stepId,
    children,
    disabled,
    onClick,
    onNavigationResult,
    type = "button",
    ...props
  }: MultiStepTriggerProps<TStepId>,
  forwardedRef: React.ForwardedRef<HTMLButtonElement>,
): ReactElement {
  const context = useMultiStepContext<TStepId>();
  const state = context.getStepState(stepId);
  const isCurrent = state === "current";

  return (
    <Button
      {...props}
      ref={forwardedRef}
      id={context.getTriggerId(stepId)}
      type={type}
      aria-controls={isCurrent ? context.getPanelId(stepId) : undefined}
      aria-current={isCurrent ? "step" : undefined}
      disabled={disabled || context.isTransitioning}
      data-state={state}
      data-multi-step-trigger=""
      onClick={(event) => {
        onClick?.(event);

        if (event.defaultPrevented) {
          return;
        }

        void context.goTo(stepId).then(onNavigationResult);
      }}
    >
      {children ?? String(stepId)}
    </Button>
  );
}

const MultiStepTrigger = forwardRef(
  MultiStepTriggerImplementation,
) as MultiStepTriggerComponent;

interface MultiStepPanelProps<
  TStepId extends MultiStepId = MultiStepId,
> extends HTMLAttributes<HTMLDivElement> {
  stepId: TStepId;
  /** Keeps an inactive panel mounted and applies the native hidden attribute. */
  forceMount?: boolean;
}

type MultiStepPanelComponent = <TStepId extends MultiStepId = MultiStepId>(
  props: MultiStepPanelProps<TStepId> & RefAttributes<HTMLDivElement>,
) => ReactElement | null;

function MultiStepPanelImplementation<TStepId extends MultiStepId>(
  { stepId, forceMount = false, ...props }: MultiStepPanelProps<TStepId>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
): ReactElement | null {
  const context = useMultiStepContext<TStepId>();
  const state = context.getStepState(stepId);
  const isCurrent = state === "current";

  if (!forceMount && !isCurrent) {
    return null;
  }

  return (
    <div
      {...props}
      ref={forwardedRef}
      id={context.getPanelId(stepId)}
      role="region"
      aria-labelledby={context.getTriggerId(stepId)}
      hidden={forceMount ? !isCurrent : undefined}
      data-state={state}
      data-multi-step-panel=""
    />
  );
}

const MultiStepPanel = forwardRef(
  MultiStepPanelImplementation,
) as MultiStepPanelComponent;

interface MultiStepProgressProps extends Omit<
  ComponentPropsWithoutRef<typeof Progress>,
  "value"
> {
  max?: number;
}

const MultiStepProgress = forwardRef<HTMLDivElement, MultiStepProgressProps>(
  function MultiStepProgress(
    { max = 100, "aria-label": ariaLabel, ...props },
    forwardedRef,
  ) {
    const context = useMultiStepContext();
    const numericMax = typeof max === "number" && max > 0 ? max : 100;

    return (
      <Progress
        {...props}
        ref={forwardedRef}
        max={numericMax}
        value={context.progress * numericMax}
        aria-label={ariaLabel ?? "Progress"}
        aria-valuetext={`Step ${context.currentIndex + 1} of ${context.totalSteps}`}
        data-multi-step-progress=""
      />
    );
  },
);

interface MultiStepNavigationButtonProps extends ComponentPropsWithoutRef<
  typeof Button
> {
  onNavigationResult?: (result: MultiStepNavigationResult<MultiStepId>) => void;
}

const MultiStepPrevious = forwardRef<
  HTMLButtonElement,
  MultiStepNavigationButtonProps
>(function MultiStepPrevious(
  {
    children = "Previous",
    disabled,
    onClick,
    onNavigationResult,
    type = "button",
    ...props
  },
  forwardedRef,
) {
  const context = useMultiStepContext();

  return (
    <Button
      {...props}
      ref={forwardedRef}
      type={type}
      disabled={disabled || !context.canGoBack}
      data-multi-step-previous=""
      onClick={(event) => {
        onClick?.(event);

        if (event.defaultPrevented) {
          return;
        }

        void context.previous().then(onNavigationResult);
      }}
    >
      {children}
    </Button>
  );
});

const MultiStepNext = forwardRef<
  HTMLButtonElement,
  MultiStepNavigationButtonProps
>(function MultiStepNext(
  {
    children = "Next",
    disabled,
    onClick,
    onNavigationResult,
    type = "button",
    ...props
  },
  forwardedRef,
) {
  const context = useMultiStepContext();

  return (
    <Button
      {...props}
      ref={forwardedRef}
      type={type}
      disabled={disabled || !context.canGoForward}
      data-multi-step-next=""
      onClick={(event) => {
        onClick?.(event);

        if (event.defaultPrevented) {
          return;
        }

        void context.next().then(onNavigationResult);
      }}
    >
      {children}
    </Button>
  );
});

const MultiStepReset = forwardRef<
  HTMLButtonElement,
  MultiStepNavigationButtonProps
>(function MultiStepReset(
  {
    children = "Reset",
    disabled,
    onClick,
    onNavigationResult,
    type = "button",
    ...props
  },
  forwardedRef,
) {
  const context = useMultiStepContext();

  return (
    <Button
      {...props}
      ref={forwardedRef}
      type={type}
      disabled={disabled || context.isTransitioning}
      data-multi-step-reset=""
      onClick={(event) => {
        onClick?.(event);

        if (event.defaultPrevented) {
          return;
        }

        void context.reset().then(onNavigationResult);
      }}
    >
      {children}
    </Button>
  );
});

export {
  MultiStepRoot,
  MultiStepList,
  MultiStepItem,
  MultiStepTrigger,
  MultiStepPanel,
  MultiStepProgress,
  MultiStepPrevious,
  MultiStepNext,
  MultiStepReset,
};

export type {
  MultiStepRootProps,
  MultiStepItemProps,
  MultiStepTriggerProps,
  MultiStepPanelProps,
  MultiStepProgressProps,
  MultiStepNavigationButtonProps,
};
