import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { DateInput } from "./date-input";
import { formatDateInputValue, parseDateInputValue } from "./date-input.utils";

afterEach(cleanup);

describe("DateInput", () => {
  it("formats and parses valid day-first dates", () => {
    const date = new Date(2025, 5, 1);

    expect(formatDateInputValue(date)).toBe("01/06/2025");
    expect(parseDateInputValue("01/06/2025")?.getTime()).toBe(date.getTime());
    expect(parseDateInputValue("31/02/2025")).toBeUndefined();
  });

  it("emits the parsed date while preserving an editable draft", () => {
    const onValueChange = vi.fn();

    render(
      <DateInput
        aria-label="Date of birth"
        value={undefined}
        onValueChange={onValueChange}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Date of birth" });

    fireEvent.change(input, { target: { value: "01/06" } });
    expect(input.getAttribute("value")).toBe("01/06");
    expect(onValueChange).toHaveBeenLastCalledWith(undefined);

    fireEvent.change(input, { target: { value: "01/06/2025" } });
    expect(onValueChange.mock.lastCall?.[0]).toEqual(new Date(2025, 5, 1));
  });

  it("reflects an externally changed value", () => {
    const onValueChange = vi.fn();
    const { rerender } = render(
      <DateInput
        aria-label="Date of birth"
        value={new Date(2025, 5, 1)}
        onValueChange={onValueChange}
      />,
    );

    expect(screen.getByRole("textbox").getAttribute("value")).toBe(
      "01/06/2025",
    );

    rerender(
      <DateInput
        aria-label="Date of birth"
        value={undefined}
        onValueChange={onValueChange}
      />,
    );

    expect(screen.getByRole("textbox").getAttribute("value")).toBe("");
  });
});
