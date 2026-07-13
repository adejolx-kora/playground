import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { NumericInput } from "./index";

describe("NumericInput", () => {
  it("exposes spinbutton semantics and control affordances", () => {
    render(
      <NumericInput.Root value="42" min={0} max={100}>
        <NumericInput.Field aria-label="Quantity" />
        <NumericInput.Controls>
          <NumericInput.Increment />
          <NumericInput.Decrement />
        </NumericInput.Controls>
      </NumericInput.Root>,
    );

    expect(
      screen
        .getByRole("spinbutton", { name: "Quantity" })
        .getAttribute("aria-valuenow"),
    ).toBe("42");
    expect(
      screen
        .getByRole("button", { name: "Increase value" })
        .hasAttribute("disabled"),
    ).toBe(false);
    expect(
      screen
        .getByRole("button", { name: "Decrease value" })
        .hasAttribute("disabled"),
    ).toBe(false);
  });

  it("normalizes locale-native input instead of dropping non-Latin digits", async () => {
    const onValueChange = vi.fn();

    render(
      <NumericInput.Root
        defaultValue=""
        onValueChange={onValueChange}
        locale="ar-EG"
        dir="rtl"
      >
        <NumericInput.Field aria-label="Amount" />
      </NumericInput.Root>,
    );

    const input = screen.getByRole("spinbutton", { name: "Amount" });
    fireEvent.input(input, { target: { value: "؜-١٬٢٣٤٫٥٦" } });
    fireEvent.blur(input);

    expect(onValueChange).toHaveBeenLastCalledWith("-1234.56");
  });

  it("ignores controlled defaultValue precision when stepping", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();

    render(
      <NumericInput.Root
        value="1"
        defaultValue="0.0001"
        onValueChange={onValueChange}
        step={1}
      >
        <NumericInput.Field aria-label="Count" />
        <NumericInput.Controls>
          <NumericInput.Increment />
        </NumericInput.Controls>
      </NumericInput.Root>,
    );

    await user.click(screen.getByRole("button", { name: "Increase value" }));

    expect(onValueChange).toHaveBeenCalledWith("2");
  });

  it("supports exponent-based numeric step props without corrupting the step size", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();

    render(
      <NumericInput.Root
        value="0"
        onValueChange={onValueChange}
        min={0}
        max={1}
        step={1e-7}
      >
        <NumericInput.Field aria-label="Rate" />
        <NumericInput.Controls>
          <NumericInput.Increment />
        </NumericInput.Controls>
      </NumericInput.Root>,
    );

    await user.click(screen.getByRole("button", { name: "Increase value" }));

    expect(onValueChange).toHaveBeenCalledWith("0.0000001");
  });

  it("applies caller-owned validation messages while preserving internal validity flags", () => {
    render(
      <NumericInput.Root value="103" min={0} max={100} step={5}>
        <NumericInput.Field
          aria-label="Budget"
          getValidationMessage={(validity) =>
            validity.rangeOverflow ? "Too large for this budget" : ""
          }
        />
      </NumericInput.Root>,
    );

    const input = screen.getByRole("spinbutton", {
      name: "Budget",
    }) as HTMLInputElement;

    expect(input.getAttribute("aria-invalid")).toBe("true");
    expect(input.validationMessage).toBe("Too large for this budget");
  });

  it("blocks field-owned keyboard stepping when the field is disabled but keeps sibling controls usable", async () => {
    const onValueChange = vi.fn();
    const user = userEvent.setup();

    render(
      <NumericInput.Root
        defaultValue="10"
        onValueChange={onValueChange}
        step={1}
      >
        <NumericInput.Field aria-label="Seats" disabled />
        <NumericInput.Controls>
          <NumericInput.Increment />
        </NumericInput.Controls>
      </NumericInput.Root>,
    );

    const input = screen.getByRole("spinbutton", { name: "Seats" });
    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(onValueChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "Increase value" }));
    expect(onValueChange).toHaveBeenCalledWith("11");
  });

  it("disables every interaction path when the root is disabled", () => {
    const onValueChange = vi.fn();

    render(
      <NumericInput.Root value="10" onValueChange={onValueChange} disabled>
        <NumericInput.Field aria-label="Limit" />
        <NumericInput.Controls>
          <NumericInput.Increment />
          <NumericInput.Decrement />
        </NumericInput.Controls>
      </NumericInput.Root>,
    );

    const input = screen.getByRole("spinbutton", { name: "Limit" });
    fireEvent.keyDown(input, { key: "ArrowUp" });

    expect((input as HTMLInputElement).disabled).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: "Increase value",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(
      (
        screen.getByRole("button", {
          name: "Decrease value",
        }) as HTMLButtonElement
      ).disabled,
    ).toBe(true);
    expect(onValueChange).not.toHaveBeenCalled();
  });
});
