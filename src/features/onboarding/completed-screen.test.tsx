import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { OnboardingCompletedScreen } from "./completed-screen";

afterEach(cleanup);

describe("OnboardingCompletedScreen", () => {
  it("announces completion and exposes the dashboard action", () => {
    const onGoToDashboard = vi.fn();

    render(<OnboardingCompletedScreen onGoToDashboard={onGoToDashboard} />);

    expect(screen.getByRole("heading", { name: "All done!" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "Go to Dashboard" }));

    expect(onGoToDashboard).toHaveBeenCalledOnce();
  });
});
