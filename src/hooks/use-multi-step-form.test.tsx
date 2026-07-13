import {
  act,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import {
  createVanillaAdapter,
  createVanillaFormStore,
  type MultiStepFormAdapter,
} from "@/lib/multistep-form";

import {
  useMultiStepForm,
  useMultiStepFormSelector,
} from "./use-multi-step-form";

type TestValues = {
  name: string;
  email?: string;
};

type TestStepId = "details" | "review" | "done";

const steps = [
  {
    id: "details",
    fields: ["name"],
  },
  {
    id: "review",
    fields: ["email"],
  },
  {
    id: "done",
  },
] as const;

function createAdapter(
  overrides: Partial<MultiStepFormAdapter<TestValues>> = {},
): MultiStepFormAdapter<TestValues> {
  return {
    getValues:
      overrides.getValues ?? (() => ({ name: "Acme", email: "ada@acme.com" })),
    getErrors: overrides.getErrors,
    getFieldError: overrides.getFieldError,
    subscribe: overrides.subscribe,
    validateFields: overrides.validateFields,
    validateForm: overrides.validateForm,
    touchFields: overrides.touchFields,
    focusField: overrides.focusField,
    reset: overrides.reset,
  };
}

describe("useMultiStepForm", () => {
  it("prevents duplicate submissions while a submit is already in flight", async () => {
    let resolveSubmit: (() => void) | undefined;
    const onComplete = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    const { result } = renderHook(() =>
      useMultiStepForm<TestValues, TestStepId>({
        steps,
        adapter: createAdapter(),
        onComplete,
      }),
    );

    let firstSubmit: Promise<boolean> | undefined;
    let secondSubmit: Promise<boolean> | undefined;

    await act(async () => {
      firstSubmit = result.current.submit();
      secondSubmit = result.current.submit();
      await Promise.resolve();
    });

    expect(result.current.isBusy).toBe(true);
    expect(onComplete).toHaveBeenCalledTimes(1);
    await expect(secondSubmit).resolves.toBe(false);

    resolveSubmit?.();

    await expect(firstSubmit).resolves.toBe(true);
    await waitFor(() => {
      expect(result.current.isBusy).toBe(false);
    });
  });

  it("resets to a new initial step when initialStepId changes", async () => {
    const { result, rerender } = renderHook(
      ({ initialStepId }: { initialStepId: TestStepId }) =>
        useMultiStepForm<TestValues, TestStepId>({
          steps,
          adapter: createAdapter(),
          initialStepId,
        }),
      {
        initialProps: {
          initialStepId: "details" as TestStepId,
        },
      },
    );

    await act(async () => {
      await result.current.goToStep("review");
    });

    expect(result.current.currentStep.id).toBe("review");
    expect(result.current.visitedStepIds).toEqual(["details", "review"]);

    rerender({
      initialStepId: "done",
    });

    await waitFor(() => {
      expect(result.current.currentStep.id).toBe("done");
      expect(result.current.visitedStepIds).toEqual(["done"]);
    });
  });

  it("reports hook-level errors without throwing them to the caller", async () => {
    const onError = vi.fn();
    const expectedError = new Error("submit failed");

    const { result } = renderHook(() =>
      useMultiStepForm<TestValues, TestStepId>({
        steps,
        adapter: createAdapter(),
        onError,
        onComplete: async () => {
          throw expectedError;
        },
      }),
    );

    await expect(result.current.submit()).resolves.toBe(false);
    expect(onError).toHaveBeenCalledWith(expectedError);
  });

  it("can reset wizard state without resetting the adapter", async () => {
    const reset = vi.fn();

    const { result } = renderHook(() =>
      useMultiStepForm<TestValues, TestStepId>({
        steps,
        adapter: createAdapter({ reset }),
      }),
    );

    await act(async () => {
      await result.current.goToStep("review");
    });

    await act(async () => {
      await result.current.reset({
        resetAdapter: false,
      });
    });

    expect(reset).not.toHaveBeenCalled();
    expect(result.current.currentStep.id).toBe("details");
    expect(result.current.visitedStepIds).toEqual(["details"]);
  });

  it("validates the current step before moving to the next step", async () => {
    const validateFields = vi.fn(async () => ({
      valid: false,
      errors: { name: "Name is required" },
    }));

    const { result } = renderHook(() =>
      useMultiStepForm<TestValues, TestStepId>({
        steps,
        adapter: createAdapter({ validateFields }),
      }),
    );

    await expect(result.current.nextStep()).resolves.toBe(false);
    expect(validateFields).toHaveBeenCalledWith(["name"]);
    expect(result.current.currentStep.id).toBe("details");
  });

  it("validates intermediate steps on forward goto and stops at the first invalid step", async () => {
    const validateForm = vi.fn(async () => ({
      valid: false,
      errors: { email: "Email is required" },
    }));

    const { result } = renderHook(() =>
      useMultiStepForm<TestValues, TestStepId>({
        steps,
        adapter: createAdapter({
          validateForm,
          getErrors: () => ({ email: "Email is required" }),
        }),
      }),
    );

    await expect(result.current.goToStep("done")).resolves.toBe(false);
    expect(validateForm).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(result.current.currentStep.id).toBe("review");
    });
  });

  it("does not validate when moving backward", async () => {
    const validateFields = vi.fn(async () => ({ valid: true, errors: {} }));

    const { result } = renderHook(() =>
      useMultiStepForm<TestValues, TestStepId>({
        steps,
        adapter: createAdapter({ validateFields }),
        initialStepId: "review",
      }),
    );

    await expect(result.current.goToStep("details")).resolves.toBe(true);
    expect(validateFields).not.toHaveBeenCalled();
    await waitFor(() => {
      expect(result.current.currentStep.id).toBe("details");
    });
  });

  it("submits only when all steps are valid and passes final values", async () => {
    const onComplete = vi.fn();
    const validateForm = vi.fn(async () => ({
      valid: true,
      errors: {},
    }));

    const { result } = renderHook(() =>
      useMultiStepForm<TestValues, TestStepId>({
        steps,
        adapter: createAdapter({ validateForm }),
        onComplete,
      }),
    );

    await expect(result.current.submit()).resolves.toBe(true);
    expect(validateForm).toHaveBeenCalledTimes(1);
    expect(onComplete).toHaveBeenCalledWith({
      values: { name: "Acme", email: "ada@acme.com" },
      steps,
    });
  });

  it("navigates to the first invalid step on submit and does not call onComplete", async () => {
    const onComplete = vi.fn();
    const validateForm = vi.fn(async () => ({
      valid: false,
      errors: { email: "Email is required" },
    }));

    const { result } = renderHook(() =>
      useMultiStepForm<TestValues, TestStepId>({
        steps,
        adapter: createAdapter({
          validateForm,
          getErrors: () => ({ email: "Email is required" }),
        }),
        onComplete,
      }),
    );

    await expect(result.current.submit()).resolves.toBe(false);
    await waitFor(() => {
      expect(result.current.currentStep.id).toBe("review");
    });
    expect(onComplete).not.toHaveBeenCalled();
  });

  it("touches and focuses the first invalid field when validation fails", async () => {
    const touchFields = vi.fn(async () => undefined);
    const focusField = vi.fn(async () => undefined);

    const { result } = renderHook(() =>
      useMultiStepForm<TestValues, TestStepId>({
        steps,
        adapter: createAdapter({
          validateFields: async () => ({
            valid: false,
            errors: { name: "Name is required" },
          }),
          touchFields,
          focusField,
        }),
      }),
    );

    await expect(result.current.nextStep()).resolves.toBe(false);
    expect(touchFields).toHaveBeenCalledWith(["name"]);
    expect(focusField).toHaveBeenCalledWith("name");
  });

  it("allows custom step completion logic", async () => {
    const { result } = renderHook(() =>
      useMultiStepForm<TestValues, TestStepId>({
        steps,
        adapter: createAdapter({
          getValues: () => ({ name: "", email: "" }),
        }),
        isStepComplete: ({ step }) => step.id === "details",
      }),
    );

    expect(result.current.isStepComplete("details")).toBe(true);
    expect(result.current.getStepStatus("details")).toBe("current");

    await act(async () => {
      await result.current.goToStep("review");
    });

    expect(result.current.getStepStatus("details")).toBe("complete");
  });

  it("requires visited state for default completion", async () => {
    const { result } = renderHook(() =>
      useMultiStepForm<TestValues, TestStepId>({
        steps,
        adapter: createAdapter(),
        initialStepId: "review",
      }),
    );

    expect(result.current.isStepComplete("details")).toBe(false);
  });

  it("requires field values and no field errors for default completion", async () => {
    const values = { name: "", email: "ada@acme.com" };
    const errors = { name: "Name is required" };
    const { result } = renderHook(() =>
      useMultiStepForm<TestValues, TestStepId>({
        steps,
        adapter: createAdapter({
          getValues: () => values,
          getErrors: () => errors,
        }),
      }),
    );

    await act(async () => {
      await result.current.goToStep("review");
    });

    expect(result.current.isStepComplete("details")).toBe(false);
  });

  it("does not rerender the main hook when adapter state changes", () => {
    const store = createVanillaFormStore<TestValues>({
      initialValues: { name: "", email: "" },
    });
    const adapter = createVanillaAdapter<TestValues>({
      store,
      validate: ({ values }) =>
        values.name.trim() ? {} : { name: "Name is required" },
    });
    let renderCount = 0;

    renderHook(() => {
      renderCount += 1;

      return useMultiStepForm<TestValues, TestStepId>({
        steps,
        adapter,
      });
    });

    expect(renderCount).toBe(1);

    act(() => {
      store.setValue("name", "Acme");
    });

    expect(renderCount).toBe(1);
  });

  it("updates selector subscribers when adapter state changes", async () => {
    const store = createVanillaFormStore<TestValues>({
      initialValues: { name: "Acme", email: "ada@acme.com" },
    });
    const adapter = createVanillaAdapter<TestValues>({
      store,
      validate: ({ values }) =>
        values.name.trim() ? {} : { name: "Name is required" },
    });

    function TestComponent() {
      const flow = useMultiStepForm<TestValues, TestStepId>({
        steps,
        adapter,
      });
      const isComplete = useMultiStepFormSelector(flow, (currentFlow) =>
        currentFlow.isStepComplete("details"),
      );

      return (
        <>
          <span>{String(isComplete)}</span>
          <button
            type="button"
            onClick={() => {
              void flow.goToStep("review");
            }}
          >
            Go
          </button>
          <button
            type="button"
            onClick={() => {
              store.setValue("name", "");
            }}
          >
            Clear
          </button>
        </>
      );
    }

    render(<TestComponent />);
    expect(screen.getByText("false")).toBeTruthy();

    await act(async () => {
      screen.getByText("Go").click();
    });

    await waitFor(() => {
      expect(screen.getByText("true")).toBeTruthy();
    });

    act(() => {
      screen.getByText("Clear").click();
    });

    await waitFor(() => {
      expect(screen.getByText("false")).toBeTruthy();
    });
  });

  it("updates selector subscribers when navigation state changes", async () => {
    function TestComponent() {
      const flow = useMultiStepForm<TestValues, TestStepId>({
        steps,
        adapter: createAdapter(),
      });
      const currentStepId = useMultiStepFormSelector(
        flow,
        (currentFlow) => currentFlow.currentStep.id,
      );

      return (
        <>
          <span>{currentStepId}</span>
          <button
            type="button"
            onClick={() => {
              void flow.goToStep("review");
            }}
          >
            Go
          </button>
        </>
      );
    }

    render(<TestComponent />);
    expect(screen.getByText("details")).toBeTruthy();

    await act(async () => {
      screen.getByText("Go").click();
    });

    await waitFor(() => {
      expect(screen.getByText("review")).toBeTruthy();
    });
  });
});
