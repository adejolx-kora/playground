export type StepId = string;

export type FormValues = Record<string, unknown>;
export type ValidationErrors = Record<string, unknown>;

export type MultiStepValidationResult<TErrors = ValidationErrors> =
  | boolean
  | {
      valid: boolean;
      errors?: TErrors;
    };

export type MultiStepFlowStep<TStepId extends StepId = StepId> = {
  id: TStepId;
  title?: string;
};

export type MultiStepFormStep<
  TValues extends FormValues,
  TStepId extends StepId = StepId,
> = MultiStepFlowStep<TStepId> & {
  fields?: readonly string[];
  validate?: (
    context: MultiStepValidationContext<TValues, TStepId>,
  ) => boolean | Promise<boolean>;
};

export type MultiStepFlowOptions<TStepId extends StepId> = {
  steps: readonly MultiStepFlowStep<TStepId>[];
  initialStepId?: TStepId;
  onError?: (error: unknown) => void;
  onStepChange?: (payload: {
    from: MultiStepFlowStep<TStepId>;
    to: MultiStepFlowStep<TStepId>;
    toIndex: number;
  }) => void;
  onComplete?: (payload: {
    steps: readonly MultiStepFlowStep<TStepId>[];
  }) => void | Promise<void>;
};

export type MultiStepFlowApi<TStepId extends StepId> = {
  subscribe: (listener: () => void) => () => void;
  steps: readonly MultiStepFlowStep<TStepId>[];
  currentStep: MultiStepFlowStep<TStepId>;
  currentStepIndex: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  isBusy: boolean;
  visitedStepIds: readonly TStepId[];

  nextStep: () => Promise<boolean>;
  prevStep: () => boolean;
  goToStep: (step: TStepId | number) => Promise<boolean>;
  submit: () => Promise<boolean>;
  reset: () => Promise<void>;

  isStepVisited: (step: TStepId) => boolean;
  isStepComplete: (step: TStepId) => boolean;
  getStepStatus: (step: TStepId) => "pending" | "current" | "complete";
};

export type MultiStepValidationDirection = "next" | "submit" | "goto";

export type MultiStepValidationContext<
  TValues extends FormValues,
  TStepId extends StepId = StepId,
> = {
  values: TValues;
  step: MultiStepFormStep<TValues, TStepId>;
  stepIndex: number;
  direction: MultiStepValidationDirection;
};

export type MultiStepFormAdapter<TValues extends FormValues> = {
  getValues: () => TValues;
  subscribe?: (listener: () => void) => () => void;
  getErrors?: () => ValidationErrors | undefined;
  getFieldError?: (field: string) => unknown;

  validateFields?: (
    fields: readonly string[],
  ) => MultiStepValidationResult | Promise<MultiStepValidationResult>;
  validateForm?: () =>
    | MultiStepValidationResult
    | Promise<MultiStepValidationResult>;

  touchFields?: (fields: readonly string[]) => void | Promise<void>;
  focusField?: (field: string) => void | Promise<void>;

  reset?: () => void | Promise<void>;
};

export type MultiStepFormOptions<
  TValues extends FormValues,
  TStepId extends StepId,
> = {
  steps: readonly MultiStepFormStep<TValues, TStepId>[];
  adapter: MultiStepFormAdapter<TValues>;
  initialStepId?: TStepId;
  validateIntermediateStepsOnGoto?: boolean;
  /**
   * By default, a step is complete only after it has been visited, is before
   * the active step, and any declared fields have values with no current
   * validation errors.
   */
  isStepComplete?: (context: {
    values: TValues;
    step: MultiStepFormStep<TValues, TStepId>;
    stepIndex: number;
    currentStepIndex: number;
    isVisited: boolean;
    getFieldError: (field: string) => unknown;
  }) => boolean;
  onError?: (error: unknown) => void;

  onStepChange?: (payload: {
    from: MultiStepFormStep<TValues, TStepId>;
    to: MultiStepFormStep<TValues, TStepId>;
    toIndex: number;
  }) => void;

  onComplete?: (payload: {
    values: TValues;
    steps: readonly MultiStepFormStep<TValues, TStepId>[];
  }) => void | Promise<void>;
};

export type MultiStepFormApi<
  TValues extends FormValues,
  TStepId extends StepId,
> = {
  subscribe: (listener: () => void) => () => void;
  steps: readonly MultiStepFormStep<TValues, TStepId>[];
  currentStep: MultiStepFormStep<TValues, TStepId>;
  currentStepIndex: number;
  totalSteps: number;
  isFirstStep: boolean;
  isLastStep: boolean;
  isBusy: boolean;
  visitedStepIds: readonly TStepId[];

  nextStep: () => Promise<boolean>;
  prevStep: () => boolean;
  goToStep: (step: TStepId | number) => Promise<boolean>;
  submit: () => Promise<boolean>;
  reset: (options?: { resetAdapter?: boolean }) => Promise<void>;

  isStepVisited: (step: TStepId) => boolean;
  isStepComplete: (step: TStepId) => boolean;
  getStepStatus: (step: TStepId) => "pending" | "current" | "complete";
};
