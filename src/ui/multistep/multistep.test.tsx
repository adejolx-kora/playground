import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { createRef, StrictMode, type MouseEvent } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  MultiStepItem,
  MultiStepList,
  MultiStepNext,
  MultiStepPanel,
  MultiStepPrevious,
  MultiStepProgress,
  MultiStepReset,
  MultiStepRoot,
  MultiStepTrigger,
} from "./multistep";
import { useMultiStepContext } from "./use-multistep-context";

const steps = [
  { id: "account" },
  { id: "profile" },
  { id: "confirm" },
] as const;

afterEach(cleanup);

function CurrentStep() {
  const flow = useMultiStepContext<(typeof steps)[number]["id"]>();
  return <output data-testid="current-step">{flow.currentStepId}</output>;
}

function Example({ forceMount = false }: { forceMount?: boolean }) {
  return (
    <MultiStepRoot steps={steps}>
      <MultiStepProgress />
      <MultiStepList aria-label="Checkout steps">
        {steps.map((step) => (
          <MultiStepItem key={step.id} stepId={step.id}>
            <MultiStepTrigger stepId={step.id}>{step.id}</MultiStepTrigger>
          </MultiStepItem>
        ))}
      </MultiStepList>

      {steps.map((step) => (
        <MultiStepPanel key={step.id} stepId={step.id} forceMount={forceMount}>
          {step.id} panel
        </MultiStepPanel>
      ))}

      <CurrentStep />
      <MultiStepPrevious />
      <MultiStepNext />
      <MultiStepReset />
    </MultiStepRoot>
  );
}

describe("MultiStep compound components", () => {
  it("exposes every primitive through named flat and compound exports", () => {
    expect(MultiStepRoot).toBe(MultiStepRoot);
    expect(MultiStepItem).toBe(MultiStepItem);
    expect(MultiStepTrigger).toBe(MultiStepTrigger);
    expect(MultiStepPanel).toBe(MultiStepPanel);
    expect(MultiStepProgress).toBe(MultiStepProgress);
    expect(MultiStepPrevious).toBe(MultiStepPrevious);
    expect(MultiStepNext).toBe(MultiStepNext);
    expect(MultiStepReset).toBe(MultiStepReset);
  });

  it("renders current state, accessible relationships, and progress", () => {
    render(<Example />);

    const accountTrigger = screen.getByRole("button", { name: "account" });
    const accountPanel = screen.getByRole("region", { name: "account" });
    const progress = screen.getByRole("progressbar", {
      name: "Progress",
    });
    const previous = screen.getByRole("button", {
      name: "Previous",
    }) as HTMLButtonElement;
    const next = screen.getByRole("button", {
      name: "Next",
    }) as HTMLButtonElement;

    expect(accountTrigger.getAttribute("aria-current")).toBe("step");
    expect(accountTrigger.getAttribute("aria-controls")).toBe(accountPanel.id);
    expect(accountPanel.getAttribute("aria-labelledby")).toBe(
      accountTrigger.id,
    );
    expect(
      screen
        .getByRole("button", { name: "profile" })
        .hasAttribute("aria-controls"),
    ).toBe(false);
    expect(screen.queryByText("profile panel")).toBeNull();
    expect(Number(progress.getAttribute("aria-valuenow"))).toBeCloseTo(100 / 3);
    expect(progress.getAttribute("aria-valuetext")).toBe("Step 1 of 3");
    expect(previous.disabled).toBe(true);
    expect(next.disabled).toBe(false);
  });

  it("navigates with controls and direct step triggers", async () => {
    render(<Example />);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.getByTestId("current-step").textContent).toBe("profile");
    });
    expect(screen.getByRole("region", { name: "profile" })).toBeTruthy();

    fireEvent.click(screen.getByRole("button", { name: "confirm" }));

    await waitFor(() => {
      expect(screen.getByTestId("current-step").textContent).toBe("confirm");
    });
    expect(
      (screen.getByRole("button", { name: "Next" }) as HTMLButtonElement)
        .disabled,
    ).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Reset" }));

    await waitFor(() => {
      expect(screen.getByTestId("current-step").textContent).toBe("account");
    });
  });

  it("navigates after StrictMode replays effect setup and cleanup", async () => {
    render(
      <StrictMode>
        <Example />
      </StrictMode>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(screen.getByTestId("current-step").textContent).toBe("profile");
    });
  });

  it("keeps inactive panels mounted when forceMount is enabled", async () => {
    render(<Example forceMount />);

    const profilePanel = screen.getByText("profile panel");
    expect(profilePanel.hasAttribute("hidden")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(profilePanel.hasAttribute("hidden")).toBe(false);
    });
    expect(screen.getByText("account panel").hasAttribute("hidden")).toBe(true);
  });

  it("honors prevented click events and reports blocked navigation", async () => {
    const onNavigationResult = vi.fn();
    const preventNavigation = vi.fn((event: MouseEvent) => {
      event.preventDefault();
    });

    const { rerender } = render(
      <MultiStepRoot steps={steps}>
        <MultiStepNext onClick={preventNavigation} />
        <CurrentStep />
      </MultiStepRoot>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(preventNavigation).toHaveBeenCalledOnce();
    expect(screen.getByTestId("current-step").textContent).toBe("account");

    rerender(
      <MultiStepRoot
        steps={steps}
        adapter={{
          validate: () => ({ valid: false, reason: "Complete account" }),
        }}
      >
        <MultiStepNext onNavigationResult={onNavigationResult} />
        <CurrentStep />
      </MultiStepRoot>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Next" }));

    await waitFor(() => {
      expect(onNavigationResult).toHaveBeenCalledWith(
        expect.objectContaining({ ok: false, reason: "blocked" }),
      );
    });
    expect(screen.getByTestId("current-step").textContent).toBe("account");
  });

  it("forwards refs and native DOM props", () => {
    const rootRef = createRef<HTMLDivElement>();
    const triggerRef = createRef<HTMLButtonElement>();
    const panelRef = createRef<HTMLDivElement>();

    render(
      <MultiStepRoot ref={rootRef} steps={steps} className="wizard">
        <MultiStepTrigger
          ref={triggerRef}
          stepId="account"
          className="step-trigger"
        />
        <MultiStepPanel
          ref={panelRef}
          stepId="account"
          className="step-panel"
        />
      </MultiStepRoot>,
    );

    expect(rootRef.current?.className).toBe("wizard");
    expect(triggerRef.current?.classList.contains("step-trigger")).toBe(true);
    expect(panelRef.current?.className).toBe("step-panel");
  });

  it("rejects step ids that are not declared by the root", () => {
    expect(() =>
      render(
        <MultiStepRoot steps={steps}>
          <MultiStepTrigger stepId="missing" />
        </MultiStepRoot>,
      ),
    ).toThrow("Multi-step primitive received an unknown step id: missing");
  });

  it("throws a useful error when a primitive is outside the root", () => {
    expect(() => render(<MultiStepNext />)).toThrow(
      "Multi-step primitives must be rendered inside MultiStep.Root.",
    );
  });
});
