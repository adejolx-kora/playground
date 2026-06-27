import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogOverlay,
  DialogPortal,
  DialogTitle,
  DialogTrigger,
} from "@korapay/react";
import {
  cloneElement,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type MouseEventHandler,
  type ReactElement,
  type ReactNode,
  type SyntheticEvent,
} from "react";

import { useMultiStepFlow } from "@/hooks/use-multi-step-flow";
import { useMultiStepForm } from "@/hooks/use-multi-step-form";
import {
  type FormValues,
  type MultiStepFlowStep,
  type MultiStepFormAdapter,
  type MultiStepFormStep,
  type MultiStepValidationContext,
  type StepId,
} from "@/lib/multistep-form";
import { cn } from "@/lib/utils";

type MultiStepModalState = "filling" | "submitting" | "feedback";

type MultiStepModalStepDefinition<
  TValues extends FormValues,
  TStepId extends StepId,
> = {
  id: TStepId;
  title?: string;
  fields?: readonly string[];
  validate?: (
    context: MultiStepValidationContext<TValues, TStepId>,
  ) => boolean | Promise<boolean>;
};

type MultiStepModalStepProps<TStepId extends StepId> = {
  value: TStepId;
  children: ReactNode;
};

type MultiStepModalFeedbackRenderArgs<TStepId extends StepId> = {
  state: MultiStepModalState;
  currentStep: MultiStepFlowStep<TStepId>;
  currentStepIndex: number;
  totalSteps: number;
  reset: () => void;
  close: () => void;
};

type MultiStepModalFeedbackProps<TStepId extends StepId = StepId> = {
  children?:
    | ReactNode
    | ((args: MultiStepModalFeedbackRenderArgs<TStepId>) => ReactNode);
  title?: ReactNode;
  description?: ReactNode;
  icon?: string;
  className?: string;
  action?: ReactNode;
  onActionClick?: () => void;
};

type MultiStepModalBaseProps<
  TValues extends FormValues,
  TStepId extends StepId,
> = {
  children: ReactNode;
  steps: readonly MultiStepModalStepDefinition<TValues, TStepId>[];
  initialStepId?: TStepId;
  open?: boolean;
  defaultOpen?: boolean;
  closeOnSubmit?: boolean;
  resetOnClose?: boolean;
  resetOnSubmit?: boolean;
  onOpenChange?: (open: boolean) => void;
  onError?: (error: unknown) => void;
  onStepChange?: (payload: {
    from: MultiStepFlowStep<TStepId>;
    to: MultiStepFlowStep<TStepId>;
    toIndex: number;
  }) => void;
};

type MultiStepModalFormProps<
  TValues extends FormValues,
  TStepId extends StepId,
> = MultiStepModalBaseProps<TValues, TStepId> & {
  adapter: MultiStepFormAdapter<TValues>;
  onComplete?: (payload: {
    values: TValues;
    steps: readonly MultiStepFormStep<TValues, TStepId>[];
  }) => void | Promise<void>;
};

type MultiStepModalNavigationProps<
  TValues extends FormValues,
  TStepId extends StepId,
> = MultiStepModalBaseProps<TValues, TStepId> & {
  adapter?: undefined;
  onComplete?: (payload: {
    steps: readonly MultiStepFlowStep<TStepId>[];
  }) => void | Promise<void>;
};

type MultiStepModalProps<TValues extends FormValues, TStepId extends StepId> =
  | MultiStepModalFormProps<TValues, TStepId>
  | MultiStepModalNavigationProps<TValues, TStepId>;

type MultiStepModalContextValue<TStepId extends StepId> = {
  status: MultiStepModalState;
  currentStep: MultiStepFlowStep<TStepId>;
  currentStepIndex: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  isBusy: boolean;
  error: unknown;
  nextStep: () => Promise<boolean>;
  prevStep: () => boolean;
  submit: () => Promise<boolean>;
  close: () => void;
  reset: () => void;
};

const MultiStepModalContext = createContext<
  MultiStepModalContextValue<StepId> | undefined
>(undefined);

function useMultiStepModalContext<TStepId extends StepId>() {
  const context = useContext(MultiStepModalContext);

  if (!context) {
    throw new Error(
      "MultiStepModal components must be used within MultiStepModal.",
    );
  }

  return context as MultiStepModalContextValue<TStepId>;
}

function useControllableOpen(options: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { open, defaultOpen = false, onOpenChange } = options;
  const isControlled = open !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const currentOpen = isControlled ? open : uncontrolledOpen;

  const setOpen = useCallback(
    (nextOpen: boolean) => {
      if (!isControlled) {
        setUncontrolledOpen(nextOpen);
      }

      onOpenChange?.(nextOpen);
    },
    [isControlled, onOpenChange],
  );

  return [currentOpen, setOpen] as const;
}

function hasFormAdapter<TValues extends FormValues, TStepId extends StepId>(
  props: MultiStepModalProps<TValues, TStepId>,
): props is MultiStepModalFormProps<TValues, TStepId> {
  return props.adapter !== undefined;
}

function MultiStepModalStep<TStepId extends StepId>(
  props: MultiStepModalStepProps<TStepId>,
) {
  const context = useMultiStepModalContext<TStepId>();

  if (context.status === "feedback") {
    return null;
  }

  if (context.currentStep.id !== props.value) {
    return null;
  }

  return <>{props.children}</>;
}

function MultiStepModalFeedback<TStepId extends StepId>({
  children,
  title = "Success",
  description,
  icon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='32' fill='%2316a34a'/%3E%3Cpath d='M20 33.5 28 41l16-16' fill='none' stroke='%23fff' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
  className,
  action = "Dismiss",
  onActionClick,
}: MultiStepModalFeedbackProps<TStepId>) {
  const context = useMultiStepModalContext<TStepId>();

  if (context.status !== "feedback") {
    return null;
  }

  const renderArgs: MultiStepModalFeedbackRenderArgs<TStepId> = {
    state: context.status,
    currentStep: context.currentStep,
    currentStepIndex: context.currentStepIndex,
    totalSteps: context.totalSteps,
    reset: context.reset,
    close: context.close,
  };

  if (typeof children === "function") {
    return <>{children(renderArgs)}</>;
  }

  if (children) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      data-slot="wiz-mod-feedback"
      className={cn(
        "flex flex-col items-center justify-center p-8 text-center",
        className,
      )}
    >
      <img src={icon} alt="Completed" className="h-16 w-16 rounded-full" />
      <div className="mt-2 text-title-5 font-semibold">{title}</div>
      {description ? (
        <div className="mt-2 max-w-[40ch] text-body-lg text-content-default-secondary">
          {description}
        </div>
      ) : null}
      {action ? (
        <MultiStepModalClose
          type="button"
          size="lg"
          variant="primary-ghost"
          onClick={onActionClick}
          className="mt-2 font-semibold"
        >
          {action}
        </MultiStepModalClose>
      ) : null}
    </div>
  );
}

function MultiStepModalRoot<TValues extends FormValues, TStepId extends StepId>(
  props: MultiStepModalProps<TValues, TStepId>,
) {
  return hasFormAdapter(props) ? (
    <MultiStepModalFormRoot {...props} />
  ) : (
    <MultiStepModalNavigationRoot {...props} />
  );
}

type MultiStepModalFlowValue<TStepId extends StepId> = {
  currentStep: MultiStepFlowStep<TStepId>;
  currentStepIndex: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  isBusy: boolean;
  nextStep: () => Promise<boolean>;
  prevStep: () => boolean;
  submit: () => Promise<boolean>;
};

type MultiStepModalSessionOptions<TStepId extends StepId> = {
  children: ReactNode;
  closeOnSubmit: boolean;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
  defaultOpen?: boolean;
  onError?: (error: unknown) => void;
  resetOnClose: boolean;
  resetOnSubmit: boolean;
  flow: MultiStepModalFlowValue<TStepId>;
  resetFlow: (options?: { resetAdapter?: boolean }) => Promise<void>;
  resetAdapter?: () => Promise<void> | void;
};

function MultiStepModalSession<TStepId extends StepId>({
  children,
  closeOnSubmit,
  defaultOpen,
  flow,
  onError,
  onOpenChange,
  open,
  resetAdapter,
  resetFlow,
  resetOnClose,
  resetOnSubmit,
}: MultiStepModalSessionOptions<TStepId>) {
  const [isOpen, setOpen] = useControllableOpen({
    open,
    defaultOpen,
    onOpenChange,
  });
  const [status, setStatus] = useState<MultiStepModalState>("filling");
  const [error, setError] = useState<unknown>(null);
  const didResetOnSubmitRef = useRef(false);
  const shouldResetOnNextOpenRef = useRef(false);
  const wasOpenRef = useRef(isOpen);

  const handleSessionError = useCallback(
    (sessionError: unknown) => {
      setError(sessionError);
      setStatus("filling");
      onError?.(sessionError);
    },
    [onError],
  );

  const runFlowReset = useCallback(
    async (options?: { resetAdapter?: boolean }) => {
      try {
        await resetFlow(options);
      } catch (resetError) {
        handleSessionError(resetError);
      }
    },
    [handleSessionError, resetFlow],
  );

  const reset = useCallback(() => {
    shouldResetOnNextOpenRef.current = false;
    didResetOnSubmitRef.current = false;
    setError(null);
    setStatus("filling");
    void runFlowReset();
  }, [runFlowReset]);

  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      setOpen(nextOpen);
    },
    [setOpen],
  );

  const handleSubmit = useCallback(async () => {
    if (flow.isBusy) {
      return false;
    }

    setError(null);
    setStatus("submitting");

    try {
      const didSubmit = await flow.submit();

      if (!didSubmit) {
        setStatus("filling");
        return false;
      }

      if (resetAdapter && resetOnSubmit) {
        await resetAdapter();
        didResetOnSubmitRef.current = true;
      }

      setStatus("feedback");

      if (closeOnSubmit) {
        handleOpenChange(false);
      }

      return true;
    } catch (submissionError) {
      handleSessionError(submissionError);
      return false;
    }
  }, [
    closeOnSubmit,
    flow,
    handleOpenChange,
    handleSessionError,
    resetAdapter,
    resetOnSubmit,
  ]);

  useEffect(() => {
    let isActive = true;
    const wasOpen = wasOpenRef.current;

    if (!isOpen && wasOpen) {
      if (resetOnClose) {
        shouldResetOnNextOpenRef.current = true;
      } else {
        shouldResetOnNextOpenRef.current = false;
        didResetOnSubmitRef.current = false;
      }
    }

    if (isOpen && !wasOpen && shouldResetOnNextOpenRef.current) {
      queueMicrotask(() => {
        if (!isActive) {
          return;
        }

        setError(null);
        setStatus("filling");
      });
      void runFlowReset({
        resetAdapter: !didResetOnSubmitRef.current,
      });

      shouldResetOnNextOpenRef.current = false;
      didResetOnSubmitRef.current = false;
    }

    wasOpenRef.current = isOpen;

    return () => {
      isActive = false;
    };
  }, [isOpen, resetOnClose, runFlowReset]);

  const close = useCallback(() => {
    handleOpenChange(false);
  }, [handleOpenChange]);

  const contextValue = useMemo<MultiStepModalContextValue<TStepId>>(
    () => ({
      status,
      error,
      currentStep: flow.currentStep,
      currentStepIndex: flow.currentStepIndex,
      totalSteps: flow.totalSteps,
      isFirstStep: flow.isFirstStep,
      isLastStep: flow.isLastStep,
      isBusy: flow.isBusy,
      nextStep: flow.nextStep,
      prevStep: flow.prevStep,
      submit: handleSubmit,
      close,
      reset,
    }),
    [close, error, flow, handleSubmit, reset, status],
  );

  return (
    <MultiStepModalContext.Provider
      value={contextValue as MultiStepModalContextValue<StepId>}
    >
      <Dialog open={isOpen} onOpenChange={handleOpenChange}>
        {children}
      </Dialog>
    </MultiStepModalContext.Provider>
  );
}

function MultiStepModalFormRoot<
  TValues extends FormValues,
  TStepId extends StepId,
>(props: MultiStepModalFormProps<TValues, TStepId>) {
  const {
    children,
    steps,
    initialStepId,
    open,
    defaultOpen,
    closeOnSubmit = false,
    resetOnClose = true,
    resetOnSubmit = true,
    onOpenChange,
    onError,
    onStepChange,
    onComplete,
    adapter,
  } = props;

  if (steps.length === 0) {
    throw new Error("MultiStepModal requires at least one step.");
  }

  const flow = useMultiStepForm<TValues, TStepId>({
    steps,
    adapter,
    initialStepId,
    onError,
    onStepChange,
    onComplete,
  });

  return (
    <MultiStepModalSession
      children={children}
      closeOnSubmit={closeOnSubmit}
      defaultOpen={defaultOpen}
      flow={flow}
      onError={onError}
      onOpenChange={onOpenChange}
      open={open}
      resetAdapter={adapter.reset}
      resetFlow={flow.reset}
      resetOnClose={resetOnClose}
      resetOnSubmit={resetOnSubmit}
    />
  );
}

function MultiStepModalNavigationRoot<
  TValues extends FormValues,
  TStepId extends StepId,
>(props: MultiStepModalNavigationProps<TValues, TStepId>) {
  const {
    children,
    steps,
    initialStepId,
    open,
    defaultOpen,
    closeOnSubmit = false,
    resetOnClose = true,
    resetOnSubmit = true,
    onOpenChange,
    onError,
    onStepChange,
    onComplete,
  } = props;

  if (steps.length === 0) {
    throw new Error("MultiStepModal requires at least one step.");
  }

  const flow = useMultiStepFlow<TStepId>({
    steps,
    initialStepId,
    onError,
    onStepChange,
    onComplete,
  });

  return (
    <MultiStepModalSession
      children={children}
      closeOnSubmit={closeOnSubmit}
      defaultOpen={defaultOpen}
      flow={flow}
      onError={onError}
      onOpenChange={onOpenChange}
      open={open}
      resetFlow={async () => {
        await flow.reset();
      }}
      resetOnClose={resetOnClose}
      resetOnSubmit={resetOnSubmit}
    />
  );
}

function MultiStepModalTrigger(
  props: ComponentPropsWithoutRef<typeof DialogTrigger>,
) {
  return <DialogTrigger {...props} />;
}

type MultiStepModalContentProps = ComponentPropsWithoutRef<
  typeof DialogContent
>;

function MultiStepModalContent({
  children,
  className,
  ...props
}: MultiStepModalContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogContent className={cn("gap-0 p-0", className)} {...props}>
        {children}
      </DialogContent>
    </DialogPortal>
  );
}

type MultiStepModalSectionProps = ComponentPropsWithoutRef<"div">;

function MultiStepModalHeader({
  className,
  ...props
}: MultiStepModalSectionProps) {
  return (
    <DialogHeader className={cn("mx-0 mt-0 p-xs", className)} {...props} />
  );
}

function MultiStepModalTitle({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DialogTitle>) {
  return <DialogTitle className={cn("text-title-5", className)} {...props} />;
}

function MultiStepModalDescription({
  className,
  ...props
}: ComponentPropsWithoutRef<typeof DialogDescription>) {
  return (
    <DialogDescription className={cn("text-body-md", className)} {...props} />
  );
}

function MultiStepModalBody({
  className,
  ...props
}: MultiStepModalSectionProps) {
  return (
    <div
      className={cn("max-h-175 overflow-y-auto px-xs py-md", className)}
      {...props}
    />
  );
}

function MultiStepModalFooter({
  className,
  ...props
}: MultiStepModalSectionProps) {
  return (
    <DialogFooter
      className={cn("mx-0 mb-0 px-sm py-xs", className)}
      {...props}
    />
  );
}

type MultiStepModalActionState = {
  status: MultiStepModalState;
  currentStepIndex: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  isBusy: boolean;
  error: unknown;
};

type MultiStepModalActionRenderProps = ComponentPropsWithoutRef<typeof Button>;

type MultiStepModalActionRender =
  | ReactElement
  | ((
      props: MultiStepModalActionRenderProps,
      state: MultiStepModalActionState,
    ) => ReactElement | null);

type MultiStepModalActionProps = Omit<
  ComponentPropsWithoutRef<typeof Button>,
  "render"
> & {
  render?: MultiStepModalActionRender;
};

type MultiStepModalActionButtonProps = MultiStepModalActionProps & {
  defaultChildren: ReactNode;
  internalOnClick: MouseEventHandler<HTMLElement>;
};

function composeEventHandlers<E extends SyntheticEvent>(
  userHandler: ((event: E) => void) | undefined,
  internalHandler: (event: E) => void,
) {
  return (event: E) => {
    userHandler?.(event);

    if (!event.defaultPrevented) {
      internalHandler(event);
    }
  };
}

function mergeRenderedElementProps(
  element: ReactElement,
  props: MultiStepModalActionRenderProps,
) {
  const elementProps = element.props as {
    className?: string;
    onClick?: MouseEventHandler<HTMLElement>;
  };

  return {
    ...props,
    className: cn(elementProps.className, props.className),
    onClick: composeEventHandlers(
      elementProps.onClick,
      props.onClick as MouseEventHandler<HTMLElement>,
    ),
  };
}

function MultiStepModalActionButton({
  children,
  className,
  onClick,
  internalOnClick,
  defaultChildren,
  render,
  ...props
}: MultiStepModalActionButtonProps) {
  const context = useMultiStepModalContext<StepId>();
  const resolvedChildren = children ?? defaultChildren;
  const state: MultiStepModalActionState = {
    status: context.status,
    currentStepIndex: context.currentStepIndex,
    totalSteps: context.totalSteps,
    isFirstStep: context.isFirstStep,
    isLastStep: context.isLastStep,
    isBusy: context.isBusy,
    error: context.error,
  };

  const buttonProps: MultiStepModalActionRenderProps = {
    ...props,
    className,
    onClick: composeEventHandlers(
      onClick as MouseEventHandler<HTMLButtonElement> | undefined,
      internalOnClick as MouseEventHandler<HTMLButtonElement>,
    ),
    children: resolvedChildren,
  };

  if (typeof render === "function") {
    return render(buttonProps, state);
  }

  if (render) {
    return cloneElement(
      render as ReactElement<Record<string, unknown>>,
      mergeRenderedElementProps(render, buttonProps),
    );
  }

  return <Button {...buttonProps} />;
}

function MultiStepModalClose({
  children = "Close",
  className,
  variant = "neutral-lighter",
  size = "lg",
  type = "button",
  ...props
}: MultiStepModalActionProps) {
  const context = useMultiStepModalContext<StepId>();

  return (
    <MultiStepModalActionButton
      variant={variant}
      size={size}
      type={type}
      className={className}
      disabled={props.disabled ?? context.isBusy}
      defaultChildren="Close"
      internalOnClick={() => {
        context.close();
      }}
      {...props}
    >
      {children}
    </MultiStepModalActionButton>
  );
}

function MultiStepModalPrevious({
  children = "Back",
  className,
  disabled,
  variant = "neutral-lighter",
  size = "lg",
  type = "button",
  ...props
}: MultiStepModalActionProps) {
  const context = useMultiStepModalContext<StepId>();

  return (
    <MultiStepModalActionButton
      variant={variant}
      size={size}
      type={type}
      className={cn("w-32", className)}
      disabled={disabled ?? (context.isFirstStep || context.isBusy)}
      defaultChildren="Back"
      internalOnClick={() => {
        context.prevStep();
      }}
      {...props}
    >
      {children}
    </MultiStepModalActionButton>
  );
}

function MultiStepModalNext({
  children = "Next",
  className,
  disabled,
  size = "lg",
  type = "button",
  ...props
}: MultiStepModalActionProps) {
  const context = useMultiStepModalContext<StepId>();

  return (
    <MultiStepModalActionButton
      type={type}
      size={size}
      className={cn("w-32", className)}
      disabled={disabled ?? (context.isLastStep || context.isBusy)}
      defaultChildren="Next"
      internalOnClick={() => {
        void context.nextStep();
      }}
      {...props}
    >
      {children}
    </MultiStepModalActionButton>
  );
}

function MultiStepModalSubmit({
  children = "Submit",
  className,
  disabled,
  size = "lg",
  type = "button",
  ...props
}: MultiStepModalActionProps) {
  const context = useMultiStepModalContext<StepId>();

  return (
    <MultiStepModalActionButton
      type={type}
      size={size}
      className={cn("w-32", className)}
      disabled={disabled ?? context.isBusy}
      defaultChildren="Submit"
      internalOnClick={() => {
        void context.submit();
      }}
      {...props}
    >
      {context.status === "submitting" ? "Submitting..." : children}
    </MultiStepModalActionButton>
  );
}

export {
  MultiStepModalBody,
  MultiStepModalClose,
  MultiStepModalContent,
  MultiStepModalDescription,
  MultiStepModalFeedback,
  MultiStepModalFooter,
  MultiStepModalHeader,
  MultiStepModalNext,
  MultiStepModalPrevious,
  MultiStepModalRoot as MultiStepModal,
  MultiStepModalStep,
  MultiStepModalSubmit,
  MultiStepModalTitle,
  MultiStepModalTrigger,
  MultiStepModalBody as WizardModalBody,
  MultiStepModalClose as WizardModalClose,
  MultiStepModalContent as WizardModalContent,
  MultiStepModalDescription as WizardModalDescription,
  MultiStepModalFeedback as WizardModalFeedback,
  MultiStepModalFooter as WizardModalFooter,
  MultiStepModalHeader as WizardModalHeader,
  MultiStepModalNext as WizardModalNext,
  MultiStepModalPrevious as WizardModalPrevious,
  MultiStepModalRoot as WizardModal,
  MultiStepModalStep as WizardModalStep,
  MultiStepModalSubmit as WizardModalSubmit,
  MultiStepModalTitle as WizardModalTitle,
  MultiStepModalTrigger as WizardModalTrigger,
};

export type {
  MultiStepModalActionProps,
  MultiStepModalFeedbackProps,
  MultiStepModalFeedbackRenderArgs,
  MultiStepModalFormProps,
  MultiStepModalNavigationProps,
  MultiStepModalProps,
  MultiStepModalStepDefinition,
  MultiStepModalStepProps,
  MultiStepModalActionProps as WizardActionProps,
  MultiStepModalFeedbackProps as WizardModalFeedbackProps,
  MultiStepModalFeedbackRenderArgs as WizardModalFeedbackRenderArgs,
  MultiStepModalProps as WizardModalProps,
  MultiStepModalStepDefinition as WizardModalStepDefinition,
  MultiStepModalStepProps as WizardModalStepProps,
};
