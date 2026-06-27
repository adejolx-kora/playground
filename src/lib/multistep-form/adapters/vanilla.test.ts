import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { useMultiStepForm } from "@/hooks/use-multi-step-form";

import { createFormikAdapter } from "./formik";
import { createReactHookFormAdapter } from "./react-hook-form";
import {
  createVanillaAdapter,
  createVanillaFormStore,
  createVanillaManualAdapter,
} from "./vanilla";

describe("createVanillaAdapter", () => {
  it("supports validation result objects and store-backed state", async () => {
    const store = createVanillaFormStore({
      initialValues: {
        email: "",
      },
    });
    const listener = vi.fn();
    const unsubscribe = store.subscribe(listener);

    const adapter = createVanillaAdapter({
      store,
      validate: ({ values: currentValues }) => ({
        valid: currentValues.email.includes("@"),
        errors: currentValues.email.includes("@")
          ? {}
          : { email: "Invalid email" },
      }),
    });

    store.setValue("email", "hello");
    expect(listener).toHaveBeenCalledTimes(1);
    expect(adapter.getValues()).toEqual({ email: "hello" });

    await expect(adapter.validateFields?.(["email"])).resolves.toEqual({
      valid: false,
      errors: { email: "Invalid email" },
    });
    expect(adapter.getFieldError?.("email")).toBe("Invalid email");

    await adapter.touchFields?.(["email"]);
    expect(store.getState().touched).toEqual({ email: true });

    unsubscribe();
  });
});

describe("createVanillaManualAdapter", () => {
  it("works with externally managed errors and touched state", async () => {
    const values = {
      profile: {
        name: "",
      },
    };
    let errors: Record<string, unknown> = {};
    let touched: Record<string, unknown> = {};
    const setErrors = vi.fn((nextErrors: Record<string, unknown>) => {
      errors = nextErrors;
    });
    const setTouched = vi.fn((nextTouched: Record<string, unknown>) => {
      touched = nextTouched;
    });

    const adapter = createVanillaManualAdapter({
      getValues: () => values,
      getErrors: () => errors,
      setErrors,
      getTouched: () => touched,
      setTouched,
      validate: ({ values: currentValues, fields }) => {
        const nextErrors: Record<string, unknown> = {};

        if (
          (!fields || fields.includes("profile.name")) &&
          !currentValues.profile.name.trim()
        ) {
          nextErrors.profile = {
            name: "Name is required",
          };
        }

        return nextErrors;
      },
    });

    await expect(adapter.validateFields?.(["profile.name"])).resolves.toEqual({
      valid: false,
      errors: {
        profile: {
          name: "Name is required",
        },
      },
    });
    expect(adapter.getFieldError?.("profile.name")).toBe("Name is required");

    await adapter.touchFields?.(["profile.name"]);
    expect(setTouched).toHaveBeenCalledWith({
      profile: {
        name: true,
      },
    });

    values.profile.name = "Acme";

    await expect(adapter.validateForm?.()).resolves.toEqual({
      valid: true,
      errors: {},
    });
    expect(setErrors).toHaveBeenLastCalledWith({});
  });

  it("can validate against externally managed errors without a validate function", async () => {
    const adapter = createVanillaManualAdapter({
      getValues: () => ({
        email: "",
      }),
      getErrors: () => ({
        email: "Invalid email",
      }),
    });

    await expect(adapter.validateFields?.(["email"])).resolves.toEqual({
      valid: false,
      errors: { email: "Invalid email" },
    });
  });
});

describe("createReactHookFormAdapter", () => {
  it("preserves boolean trigger results and exposes field errors", async () => {
    const trigger = vi.fn(async () => false);
    const adapter = createReactHookFormAdapter({
      getValues: () => ({ email: "" }),
      trigger,
      getFieldState: () => ({ error: "Invalid email", isTouched: true }),
    });

    await expect(adapter.validateFields?.(["email"])).resolves.toEqual({
      valid: false,
      errors: undefined,
    });
    expect(adapter.getFieldError?.("email")).toBe("Invalid email");
  });
});

describe("createFormikAdapter", () => {
  it("preserves existing nested touched state in the touch fallback", async () => {
    const setTouched = vi.fn(async () => undefined);
    const adapter = createFormikAdapter({
      values: {
        profile: { name: "" },
        settings: { marketing: false },
      },
      validateForm: async () => ({ profile: { name: "Name is required" } }),
      setTouched,
      touched: {
        settings: { marketing: true },
      },
      errors: {
        profile: { name: "Name is required" },
      },
    });

    await adapter.touchFields?.(["profile.name"]);
    expect(setTouched).toHaveBeenCalledWith(
      {
        settings: { marketing: true },
        profile: { name: true },
      },
      false,
    );
  });

  it("avoids repeated full-form validation during submit", async () => {
    const validateForm = vi.fn(async () => ({
      email: "Email is required",
    }));
    const adapter = createFormikAdapter({
      values: { name: "", email: "" },
      validateForm,
      setTouched: async () => undefined,
      errors: { email: "Email is required" },
      touched: {},
    });

    const { result } = renderHook(() =>
      useMultiStepForm<
        { name: string; email: string },
        "details" | "review"
      >({
        steps: [
          { id: "details", fields: ["name"] },
          { id: "review", fields: ["email"] },
        ],
        adapter,
      }),
    );

    await expect(result.current.submit()).resolves.toBe(false);
    expect(validateForm).toHaveBeenCalledTimes(1);
    await waitFor(() => {
      expect(result.current.currentStep.id).toBe("review");
    });
  });
});
