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
} from "@korapay/react";
import { BannerAnchor } from "@korapay/react/molecules";
import * as React from "react";

import { useMultiStepForm } from "@/hooks/use-multi-step-form";
import {
  type FormValues,
  type MultiStepFormAdapter,
  type MultiStepFormStep,
  type MultiStepValidationContext,
  type StepId,
} from "@/lib/multistep-form";
import { cn } from "@/lib/utils";

type WizardModalState = "filling" | "submitting" | "feedback";

const WIZARD_MODAL_STEP_MARKER = "wizard-modal.step";
const WIZARD_MODAL_FEEDBACK_MARKER = "wizard-modal.feedback";

type WizardModalStepProps<
  TValues extends FormValues,
  TStepId extends StepId,
> = {
  id: TStepId;
  title?: string;
  fields?: readonly string[];
  validate?: (
    context: MultiStepValidationContext<TValues, TStepId>,
  ) => boolean | Promise<boolean>;
  children: React.ReactNode;
};

type WizardModalFeedbackRenderArgs<
  TValues extends FormValues,
  TStepId extends StepId,
> = {
  state: WizardModalState;
  currentStep: MultiStepFormStep<TValues, TStepId>;
  currentStepIndex: number;
  totalSteps: number;
  reset: () => void;
  close: () => void;
};

type WizardModalFeedbackProps = {
  children?: React.ReactNode;
  title?: React.ReactNode;
  description?: React.ReactNode;
  icon?: string;
  className?: string;
  action?: React.ReactNode;
  onActionClick?: () => void;
};

type WizardModalProps<TValues extends FormValues, TStepId extends StepId> = {
  children: React.ReactNode;
  adapter: MultiStepFormAdapter<TValues>;
  initialStepId?: TStepId;
  open?: boolean;
  defaultOpen?: boolean;
  closeOnSubmit?: boolean;
  onOpenChange?: (open: boolean) => void;
  onStepChange?: (payload: {
    from: MultiStepFormStep<TValues, TStepId>;
    to: MultiStepFormStep<TValues, TStepId>;
    toIndex: number;
  }) => void;
  onComplete?: (payload: {
    values: TValues;
    steps: readonly MultiStepFormStep<TValues, TStepId>[];
  }) => void | Promise<void>;
  className?: string;
};

type WizardModalContextValue<
  TValues extends FormValues,
  TStepId extends StepId,
> = {
  status: WizardModalState;
  currentStep: MultiStepFormStep<TValues, TStepId>;
  currentStepIndex: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  nextStep: () => Promise<boolean>;
  prevStep: () => boolean;
  submit: () => Promise<boolean>;
  close: () => void;
  reset: () => void;
};

const WizardModalContext = React.createContext<
  WizardModalContextValue<FormValues, StepId> | undefined
>(undefined);

function useWizardModalContext<
  TValues extends FormValues,
  TStepId extends StepId,
>() {
  const context = React.useContext(WizardModalContext);

  if (!context) {
    throw new Error("WizardModal components must be used within WizardModal.");
  }

  return context as WizardModalContextValue<TValues, TStepId>;
}

function WizardModalStep<TValues extends FormValues, TStepId extends StepId>(
  props: WizardModalStepProps<TValues, TStepId>,
) {
  return <>{props.children}</>;
}

(
  WizardModalStep as ((
    props: WizardModalStepProps<FormValues, StepId>,
  ) => React.ReactElement | null) & {
    __wizardModalType?: string;
  }
).__wizardModalType = WIZARD_MODAL_STEP_MARKER;

function WizardModalFeedback<
  TValues extends FormValues,
  TStepId extends StepId,
>({
  children,
  title = "Success",
  description,
  icon = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Ccircle cx='32' cy='32' r='32' fill='%2316a34a'/%3E%3Cpath d='M20 33.5 28 41l16-16' fill='none' stroke='%23fff' stroke-width='5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E",
  className,
  action = "Dismiss",
  onActionClick,
}: WizardModalFeedbackProps) {
  const context = useWizardModalContext<TValues, TStepId>();

  if (context.status !== "feedback") {
    return null;
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
        <Button
          type="button"
          size="lg"
          variant="primary-ghost"
          onClick={() => {
            context.close();
            if (onActionClick) onActionClick();
          }}
          className="mt-2 font-semibold"
        >
          {action}
        </Button>
      ) : null}
    </div>
  );
}

(
  WizardModalFeedback as ((
    props: WizardModalFeedbackProps,
  ) => React.ReactElement | null) & {
    __wizardModalType?: string;
  }
).__wizardModalType = WIZARD_MODAL_FEEDBACK_MARKER;

function isWizardStepElement<
  TValues extends FormValues,
  TStepId extends StepId,
>(
  node: React.ReactNode,
): node is React.ReactElement<WizardModalStepProps<TValues, TStepId>> {
  if (!React.isValidElement(node)) {
    return false;
  }

  return (
    (node.type as { __wizardModalType?: string }).__wizardModalType ===
    WIZARD_MODAL_STEP_MARKER
  );
}

function isWizardFeedbackElement(
  node: React.ReactNode,
): node is React.ReactElement<WizardModalFeedbackProps> {
  if (!React.isValidElement(node)) {
    return false;
  }

  return (
    (node.type as { __wizardModalType?: string }).__wizardModalType ===
    WIZARD_MODAL_FEEDBACK_MARKER
  );
}

function useControllableOpen(options: {
  open?: boolean;
  defaultOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const { open, defaultOpen = false, onOpenChange } = options;
  const isControlled = open !== undefined;
  const [uncontrolledOpen, setUncontrolledOpen] = React.useState(defaultOpen);
  const currentOpen = isControlled ? open : uncontrolledOpen;

  const setOpen = React.useCallback(
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

function WizardModalRoot<TValues extends FormValues, TStepId extends StepId>(
  props: WizardModalProps<TValues, TStepId>,
) {
  const {
    children,
    adapter,
    initialStepId,
    open,
    defaultOpen,
    closeOnSubmit = false,
    onOpenChange,
    onStepChange,
    onComplete,
    className,
  } = props;

  const [isOpen, setOpen] = useControllableOpen({
    open,
    defaultOpen,
    onOpenChange,
  });

  const [status, setStatus] = React.useState<WizardModalState>("filling");

  const nodes = React.Children.toArray(children);
  const stepNodes = nodes.filter((node) =>
    isWizardStepElement<TValues, TStepId>(node),
  );
  const feedbackNode = nodes.find((node) => isWizardFeedbackElement(node));

  const steps = React.useMemo<readonly MultiStepFormStep<TValues, TStepId>[]>(
    () =>
      stepNodes.map((step) => ({
        id: step.props.id,
        title: step.props.title,
        fields: step.props.fields,
        validate: step.props.validate,
      })),
    [stepNodes],
  );

  if (steps.length === 0) {
    throw new Error("WizardModal requires at least one WizardModalStep.");
  }

  const flow = useMultiStepForm<TValues, TStepId>({
    steps,
    adapter,
    initialStepId,
    onStepChange,
    onComplete,
  });

  const handleSubmit = React.useCallback(async () => {
    setStatus("submitting");

    const didSubmit = await flow.submit();

    if (!didSubmit) {
      setStatus("filling");
      return false;
    }

    setStatus("feedback");

    if (closeOnSubmit) {
      setOpen(false);
    }

    return true;
  }, [closeOnSubmit, flow, setOpen]);

  const reset = React.useCallback(() => {
    setStatus("filling");
    void flow.goToStep(0);
  }, [flow]);

  const wasOpenRef = React.useRef(isOpen);

  React.useLayoutEffect(() => {
    const wasOpen = wasOpenRef.current;

    if (isOpen && !wasOpen) {
      setStatus("filling");
      void flow.goToStep(0);
    }

    wasOpenRef.current = isOpen;
  }, [flow, isOpen]);

  const activeStepNode = stepNodes[flow.currentStepIndex];

  const contextValue = React.useMemo<WizardModalContextValue<TValues, TStepId>>(
    () => ({
      status,
      currentStep: flow.currentStep,
      currentStepIndex: flow.currentStepIndex,
      totalSteps: flow.totalSteps,
      isFirstStep: flow.isFirstStep,
      isLastStep: flow.isLastStep,
      nextStep: flow.nextStep,
      prevStep: flow.prevStep,
      submit: handleSubmit,
      close: () => setOpen(false),
      reset,
    }),
    [flow, handleSubmit, reset, setOpen, status],
  );

  return (
    <WizardModalContext.Provider
      value={contextValue as WizardModalContextValue<FormValues, StepId>}
    >
      <Dialog open={isOpen} onOpenChange={setOpen}>
        <DialogPortal>
          <DialogOverlay />
          <DialogContent className={cn("gap-0 p-0", className)}>
            {status === "feedback" && feedbackNode
              ? feedbackNode
              : activeStepNode}
          </DialogContent>
        </DialogPortal>
      </Dialog>
    </WizardModalContext.Provider>
  );
}

type WizardModalSectionProps = React.ComponentPropsWithoutRef<"div">;

function WizardModalHeader({ className, ...props }: WizardModalSectionProps) {
  return (
    <>
      <DialogHeader className={cn("mx-0 mt-0 p-xs", className)} {...props} />
      <BannerAnchor id="wizard-modal-banner-anchor" layout="flow" />
    </>
  );
}

function WizardModalTitle({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogTitle>) {
  return <DialogTitle className={cn("text-title-5", className)} {...props} />;
}

function WizardModalDescription({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof DialogDescription>) {
  return (
    <DialogDescription className={cn("text-body-md", className)} {...props} />
  );
}

function WizardModalBody({ className, ...props }: WizardModalSectionProps) {
  return (
    <div
      className={cn("max-h-175 overflow-y-auto px-xs py-md", className)}
      {...props}
    />
  );
}

function WizardModalFooter({ className, ...props }: WizardModalSectionProps) {
  return (
    <DialogFooter
      className={cn("mx-0 mb-0 px-sm py-xs", className)}
      {...props}
    />
  );
}

type WizardActionProps = Omit<
  React.ComponentPropsWithoutRef<typeof Button>,
  "onClick"
>;

function WizardModalCancel({
  children = "Cancel",
  className,
  ...props
}: WizardActionProps) {
  const context = useWizardModalContext<FormValues, StepId>();

  return (
    <Button
      variant="neutral-lighter"
      size="lg"
      type="button"
      className={cn("w-32", className)}
      onClick={() => {
        context.close();
      }}
      {...props}
    >
      {children}
    </Button>
  );
}

function WizardModalBack({
  children = "Back",
  className,
  disabled,
  ...props
}: WizardActionProps) {
  const context = useWizardModalContext<FormValues, StepId>();

  return (
    <Button
      variant="neutral-lighter"
      size="lg"
      type="button"
      className={cn("w-32", className)}
      disabled={disabled ?? context.isFirstStep}
      onClick={() => {
        context.prevStep();
      }}
      {...props}
    >
      {children}
    </Button>
  );
}

function WizardModalNext({
  children = "Next",
  className,
  disabled,
  ...props
}: WizardActionProps) {
  const context = useWizardModalContext<FormValues, StepId>();

  return (
    <Button
      type="button"
      size="lg"
      className={cn("w-32", className)}
      disabled={
        disabled ?? (context.isLastStep || context.status === "submitting")
      }
      onClick={() => {
        void context.nextStep();
      }}
      {...props}
    >
      {children}
    </Button>
  );
}

function WizardModalSubmit({
  children = "Submit",
  className,
  disabled,
  ...props
}: WizardActionProps) {
  const context = useWizardModalContext<FormValues, StepId>();

  return (
    <Button
      type="button"
      size="lg"
      className={cn("w-32", className)}
      disabled={disabled ?? context.status === "submitting"}
      onClick={() => {
        void context.submit();
      }}
      {...props}
    >
      {context.status === "submitting" ? "Submitting..." : children}
    </Button>
  );
}

export {
  WizardModalRoot as WizardModal,
  WizardModalBack,
  WizardModalBody,
  WizardModalCancel,
  WizardModalDescription,
  WizardModalFeedback,
  WizardModalFooter,
  WizardModalHeader,
  WizardModalNext,
  WizardModalStep,
  WizardModalSubmit,
  WizardModalTitle,
};

export type {
  WizardActionProps,
  WizardModalFeedbackProps,
  WizardModalFeedbackRenderArgs,
  WizardModalProps,
  WizardModalStepProps,
};
