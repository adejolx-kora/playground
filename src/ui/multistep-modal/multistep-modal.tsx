import { useRender } from "@base-ui/react/use-render";
import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@korapay/react";
import {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ComponentPropsWithoutRef,
  type ReactElement,
  type ReactNode,
  type RefAttributes,
} from "react";

import type { MultiStepId } from "@/hooks/use-multi-step";

import { cn } from "@/lib/utils";
import {
  MultiStepRoot,
  type MultiStepNavigationButtonProps,
  type MultiStepRootProps,
} from "@/ui/multistep/multistep";
import { useMultiStepContext } from "@/ui/multistep/use-multistep-context";

interface MultiStepModalStepProps<
  TStepId extends MultiStepId = MultiStepId,
> extends Omit<useRender.ComponentProps<"div">, "ref"> {
  /** Stable id matching an entry in MultiStepModal's steps prop. */
  stepId: TStepId;
}

interface MultiStepModalFeedbackProps extends Omit<
  useRender.ComponentProps<"div">,
  "ref" | "title"
> {
  children?: ReactNode;
  title?: ReactNode;
  description?: ReactNode;
  actionLabel?: ReactNode;
}

interface MultiStepModalNavigationProps extends ComponentPropsWithoutRef<
  typeof Button
> {
  onNavigationResult?: MultiStepNavigationButtonProps["onNavigationResult"];
}

type MultiStepModalCloseProps = ComponentPropsWithoutRef<typeof Button>;
type MultiStepModalNextProps = MultiStepModalNavigationProps;
type MultiStepModalPreviousProps = MultiStepModalNavigationProps;
type MultiStepModalResetProps = MultiStepModalNavigationProps;
type MultiStepModalSubmitProps = ComponentPropsWithoutRef<typeof Button>;
type MultiStepModalHeaderProps = Omit<useRender.ComponentProps<"div">, "ref">;
type MultiStepModalBodyProps = MultiStepModalHeaderProps;
type MultiStepModalFooterAlign = "start" | "end" | "none";
type MultiStepModalFooterProps = Omit<
  useRender.ComponentProps<"div">,
  "align" | "ref"
> & {
  align?: MultiStepModalFooterAlign;
};

const footerAlignClassName: Record<MultiStepModalFooterAlign, string> = {
  start: "kora:justify-start",
  end: "kora:justify-end",
  none: "",
};

interface MultiStepModalProps<
  TStepId extends MultiStepId = MultiStepId,
  TValues = unknown,
  TMeta = unknown,
> extends Omit<
  MultiStepRootProps<TStepId, TValues, TMeta>,
  "children" | "render"
> {
  children: ReactNode;
  /** Props forwarded to the Kora Dialog root. */
  dialogProps?: Omit<ComponentPropsWithoutRef<typeof Dialog>, "children">;
  /** Whether the dialog content renders its built-in close button. */
  showCloseButton?: boolean;
}

type MultiStepModalSubmissionContextValue = {
  submitted: boolean;
  submit: () => void;
};

const MultiStepModalSubmissionContext =
  createContext<MultiStepModalSubmissionContextValue | null>(null);

function useMultiStepModalSubmissionContext() {
  const context = useContext(MultiStepModalSubmissionContext);

  if (!context) {
    throw new Error(
      "MultiStepModal submission controls must be used inside MultiStepModal.",
    );
  }

  return context;
}

type MultiStepModalComponent = <
  TStepId extends MultiStepId = MultiStepId,
  TValues = unknown,
  TMeta = unknown,
>(
  props: MultiStepModalProps<TStepId, TValues, TMeta> &
    RefAttributes<HTMLDivElement>,
) => ReactElement | null;

const MultiStepModalStep = forwardRef<HTMLDivElement, MultiStepModalStepProps>(
  function MultiStepModalStep({ stepId, render, ...props }, forwardedRef) {
    const flow = useMultiStepContext();
    const { submitted } = useMultiStepModalSubmissionContext();
    const step = useRender({
      defaultTagName: "div",
      render,
      ref: forwardedRef,
      props: {
        ...props,
        className: cn(
          "kora:flex kora:min-h-0 kora:min-w-0 kora:flex-1 kora:flex-col kora:overflow-hidden",
          props.className,
        ),
        "data-step-id": stepId,
        "data-multi-step-modal-step": "",
      },
    });

    if (submitted || flow.currentStepId !== stepId) {
      return null;
    }

    return step;
  },
);

const MultiStepModalHeader = forwardRef<
  HTMLDivElement,
  MultiStepModalHeaderProps
>(function MultiStepModalHeader({ render, ...props }, forwardedRef) {
  return useRender({
    defaultTagName: "div",
    render,
    ref: forwardedRef,
    props: {
      "data-multi-step-modal-header": "",
      ...props,
      className: cn(
        "kora:min-w-0 kora:shrink-0 kora:px-8 kora:py-7",
        props.className,
      ),
    },
  });
});

const MultiStepModalBody = forwardRef<HTMLDivElement, MultiStepModalBodyProps>(
  function MultiStepModalBody({ render, ...props }, forwardedRef) {
    return useRender({
      defaultTagName: "div",
      render,
      ref: forwardedRef,
      props: {
        "data-multi-step-modal-body": "",
        ...props,
        className: cn(
          "kora:min-h-0 kora:flex-1 kora:overflow-y-auto",
          "kora:min-w-0 kora:px-8 kora:py-7",
          props.className,
        ),
      },
    });
  },
);

const MultiStepModalFooter = forwardRef<
  HTMLDivElement,
  MultiStepModalFooterProps
>(function MultiStepModalFooter(
  { align = "end", render, ...props },
  forwardedRef,
) {
  return useRender({
    defaultTagName: "div",
    render,
    ref: forwardedRef,
    props: {
      "data-multi-step-modal-footer": "",
      ...props,
      className: cn(
        "kora:flex kora:min-w-0 kora:shrink-0 kora:items-center kora:px-8 kora:py-5",
        footerAlignClassName[align],
        props.className,
      ),
    },
  });
});

const MultiStepModalClose = forwardRef<
  HTMLButtonElement,
  MultiStepModalCloseProps
>(function MultiStepModalClose(props, forwardedRef) {
  return (
    <DialogClose
      render={
        <Button
          {...props}
          ref={forwardedRef}
          type={props.type ?? "button"}
          data-multi-step-modal-close=""
        />
      }
    />
  );
});

const MultiStepModalPrevious = forwardRef<
  HTMLButtonElement,
  MultiStepModalPreviousProps
>(function MultiStepModalPrevious(
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
      data-multi-step-modal-previous=""
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          void context.previous().then(onNavigationResult);
        }
      }}
    >
      {children}
    </Button>
  );
});

const MultiStepModalNext = forwardRef<
  HTMLButtonElement,
  MultiStepModalNextProps
>(function MultiStepModalNext(
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
      data-multi-step-modal-next=""
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          void context.next().then(onNavigationResult);
        }
      }}
    >
      {children}
    </Button>
  );
});

const MultiStepModalReset = forwardRef<
  HTMLButtonElement,
  MultiStepModalResetProps
>(function MultiStepModalReset(
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
      data-multi-step-modal-reset=""
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented) {
          void context.reset().then(onNavigationResult);
        }
      }}
    >
      {children}
    </Button>
  );
});

const MultiStepModalSubmit = forwardRef<
  HTMLButtonElement,
  MultiStepModalSubmitProps
>(function MultiStepModalSubmit(
  { onClick, type = "submit", ...props },
  forwardedRef,
) {
  const submission = useMultiStepModalSubmissionContext();

  return (
    <Button
      {...props}
      ref={forwardedRef}
      type={type}
      data-multi-step-modal-submit=""
      onClick={(event) => {
        onClick?.(event);

        if (!event.defaultPrevented && !event.currentTarget.form) {
          submission.submit();
        }
      }}
    />
  );
});

const MultiStepModalFeedback = forwardRef<
  HTMLDivElement,
  MultiStepModalFeedbackProps
>(function MultiStepModalFeedback(
  { children, title, description, actionLabel, render, ...props },
  forwardedRef,
) {
  const { submitted } = useMultiStepModalSubmissionContext();
  const feedback = useRender({
    defaultTagName: "div",
    render,
    ref: forwardedRef,
    props: {
      ...props,
      className: cn(
        "kora:flex kora:min-h-0 kora:min-w-0 kora:flex-1 kora:flex-col kora:overflow-hidden",
        props.className,
      ),
      "data-multi-step-modal-feedback": "",
      children: children ?? (
        <>
          <MultiStepModalHeader>
            {title ? <DialogTitle>{title}</DialogTitle> : null}
            {description ? (
              <DialogDescription>{description}</DialogDescription>
            ) : null}
          </MultiStepModalHeader>
          {actionLabel ? (
            <MultiStepModalFooter>
              <MultiStepModalClose>{actionLabel}</MultiStepModalClose>
            </MultiStepModalFooter>
          ) : null}
        </>
      ),
    },
  });

  if (!submitted) {
    return null;
  }

  return feedback;
});

function MultiStepModalImplementation<
  TStepId extends MultiStepId,
  TValues,
  TMeta,
>(
  {
    dialogProps,
    children,
    showCloseButton = true,
    ...multiStepProps
  }: MultiStepModalProps<TStepId, TValues, TMeta>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
): ReactElement {
  const [submitted, setSubmitted] = useState(false);
  const submit = useCallback(() => {
    setSubmitted(true);
  }, [setSubmitted]);
  const submissionContext = useMemo(
    () => ({ submitted, submit }),
    [submitted, submit],
  );
  const { onOpenChange, ...dialogRootProps } = dialogProps ?? {};

  return (
    <Dialog
      {...dialogRootProps}
      onOpenChange={(nextOpen, event) => {
        if (!nextOpen) {
          setSubmitted(false);
        }

        onOpenChange?.(nextOpen, event);
      }}
    >
      <MultiStepModalSubmissionContext.Provider value={submissionContext}>
        <MultiStepRoot
          {...(multiStepProps as MultiStepRootProps<
            MultiStepId,
            TValues,
            TMeta
          >)}
          ref={forwardedRef}
          render={<DialogContent showCloseButton={showCloseButton} />}
          className={cn(
            "kora:flex kora:max-h-[calc(100svh-8rem)] kora:w-full kora:min-w-0 kora:flex-col kora:gap-0 kora:overflow-hidden kora:p-0",
            "kora:ring-0",
            multiStepProps.className,
          )}
          data-submitted={submitted ? "" : undefined}
          data-multi-step-modal=""
          onSubmit={(event) => {
            multiStepProps.onSubmit?.(event);
            setSubmitted(true);
          }}
        >
          {children}
        </MultiStepRoot>
      </MultiStepModalSubmissionContext.Provider>
    </Dialog>
  );
}

const MultiStepModalRoot = forwardRef(
  MultiStepModalImplementation,
) as MultiStepModalComponent;

const MultiStepModal = MultiStepModalRoot;
const MultiStepModalTitle = DialogTitle;
const MultiStepModalDescription = DialogDescription;

export {
  MultiStepModal,
  MultiStepModalStep,
  MultiStepModalHeader,
  MultiStepModalTitle,
  MultiStepModalDescription,
  MultiStepModalBody,
  MultiStepModalFooter,
  MultiStepModalClose,
  MultiStepModalPrevious,
  MultiStepModalNext,
  MultiStepModalReset,
  MultiStepModalSubmit,
  MultiStepModalFeedback,
};
export type {
  MultiStepModalProps,
  MultiStepModalStepProps,
  MultiStepModalFeedbackProps,
  MultiStepModalCloseProps,
  MultiStepModalPreviousProps,
  MultiStepModalNextProps,
  MultiStepModalResetProps,
  MultiStepModalSubmitProps,
  MultiStepModalHeaderProps,
  MultiStepModalBodyProps,
  MultiStepModalFooterProps,
};
