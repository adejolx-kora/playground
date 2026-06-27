import { act, renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useMultiStepFlow } from "./use-multi-step-flow";

type TestStepId = "details" | "review" | "done";

const steps = [
  { id: "details" },
  { id: "review" },
  { id: "done" },
] as const;

describe("useMultiStepFlow", () => {
  it("throws on duplicate step ids", () => {
    expect(() =>
      renderHook(() =>
        useMultiStepFlow({
          steps: [{ id: "details" }, { id: "details" }] as const,
        }),
      ),
    ).toThrow("Duplicate step id: details.");
  });

  it("throws on an invalid initialStepId", () => {
    expect(() =>
      renderHook(() =>
        useMultiStepFlow<TestStepId>({
          steps,
          initialStepId: "missing" as TestStepId,
        }),
      ),
    ).toThrow("useMultiStepFlow received an unknown initialStepId: missing.");
  });

  it("resets visited state when initialStepId changes", async () => {
    const { result, rerender } = renderHook(
      ({ initialStepId }: { initialStepId: TestStepId }) =>
        useMultiStepFlow<TestStepId>({
          steps,
          initialStepId,
        }),
      {
        initialProps: { initialStepId: "details" as TestStepId },
      },
    );

    await act(async () => {
      await result.current.goToStep("review");
    });

    rerender({ initialStepId: "done" });

    await waitFor(() => {
      expect(result.current.currentStep.id).toBe("done");
      expect(result.current.visitedStepIds).toEqual(["done"]);
    });
  });

  it("clears visited state on reset", async () => {
    const { result } = renderHook(() =>
      useMultiStepFlow<TestStepId>({
        steps,
      }),
    );

    await act(async () => {
      await result.current.goToStep("review");
      await result.current.reset();
    });

    expect(result.current.currentStep.id).toBe("details");
    expect(result.current.visitedStepIds).toEqual(["details"]);
  });

  it("blocks duplicate async submit actions", async () => {
    let resolveSubmit: (() => void) | undefined;
    const onComplete = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve;
        }),
    );

    const { result } = renderHook(() =>
      useMultiStepFlow<TestStepId>({
        steps,
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
});
