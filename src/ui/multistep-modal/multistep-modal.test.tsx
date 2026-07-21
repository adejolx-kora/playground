import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";

import {
  MultiStepModal,
  MultiStepModalBody,
  MultiStepModalClose,
  MultiStepModalDescription,
  MultiStepModalFeedback,
  MultiStepModalFooter,
  MultiStepModalHeader,
  MultiStepModalNext,
  MultiStepModalPrevious,
  MultiStepModalReset,
  MultiStepModalStep,
  MultiStepModalSubmit,
  MultiStepModalTitle,
} from "./multistep-modal";

afterEach(cleanup);

describe("MultiStepModal", () => {
  const numericSteps = [{ id: 1 }, { id: 2 }] as const;

  it("renders the current step without inspecting its children", async () => {
    const user = userEvent.setup();

    render(
      <MultiStepModal
        steps={numericSteps}
        dialogProps={{ defaultOpen: true }}
        data-custom-root=""
      >
        <MultiStepModalStep stepId={1}>
          <MultiStepModalHeader>
            <MultiStepModalTitle>Step 1</MultiStepModalTitle>
            <MultiStepModalDescription>
              This is the first step.
            </MultiStepModalDescription>
          </MultiStepModalHeader>
          <MultiStepModalBody render={<section />}>
            First step content
          </MultiStepModalBody>
          <MultiStepModalFooter>
            <MultiStepModalClose>Cancel</MultiStepModalClose>
            <MultiStepModalNext render={<button data-custom-control="next" />}>
              Next
            </MultiStepModalNext>
          </MultiStepModalFooter>
        </MultiStepModalStep>

        <MultiStepModalStep stepId={2}>
          <MultiStepModalHeader>
            <MultiStepModalTitle>Step 2</MultiStepModalTitle>
          </MultiStepModalHeader>
          <MultiStepModalBody>Second step content</MultiStepModalBody>
          <MultiStepModalReset>Start over</MultiStepModalReset>
          <MultiStepModalFooter>
            <MultiStepModalPrevious>Back</MultiStepModalPrevious>
            <MultiStepModalSubmit>Finish</MultiStepModalSubmit>
          </MultiStepModalFooter>
        </MultiStepModalStep>

        <MultiStepModalFeedback
          title="All done"
          description="Your changes were saved."
          actionLabel="Dismiss"
        />
      </MultiStepModal>,
    );

    expect(screen.getByRole("dialog", { name: "Step 1" })).toBeDefined();
    expect(screen.getByRole("dialog").dataset.currentStep).toBe("1");
    expect(screen.queryByText("Second step content")).toBeNull();
    expect(screen.getByRole("dialog").dataset.customRoot).toBe("");
    expect(document.querySelectorAll("[role=dialog]")).toHaveLength(1);
    expect(
      document.querySelector("[data-multi-step-modal-step]")?.tagName,
    ).toBe("DIV");
    expect(screen.getByText("First step content").tagName).toBe("SECTION");
    expect(
      screen.getByRole("button", { name: "Next" }).dataset.customControl,
    ).toBe("next");

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "Step 2" })).toBeDefined();
    expect(screen.getByRole("dialog").dataset.currentStep).toBe("2");

    await user.click(screen.getByRole("button", { name: "Start over" }));
    expect(screen.getByRole("dialog", { name: "Step 1" })).toBeDefined();

    await user.click(screen.getByRole("button", { name: "Next" }));
    await user.click(screen.getByRole("button", { name: "Back" }));
    expect(screen.getByRole("dialog", { name: "Step 1" })).toBeDefined();

    await user.click(screen.getByRole("button", { name: "Next" }));
    expect(screen.getByRole("dialog", { name: "Step 2" })).toBeDefined();
    expect(screen.queryByText("Your changes were saved.")).toBeNull();
  });

  it("renders feedback when a form submission succeeds", async () => {
    const user = userEvent.setup();
    const step = (
      <MultiStepModalStep
        stepId={1}
        render={
          <form
            onSubmit={(event) => {
              event.preventDefault();
            }}
          />
        }
      >
        <MultiStepModalTitle>Submission step</MultiStepModalTitle>
        <MultiStepModalSubmit>Submit form</MultiStepModalSubmit>
      </MultiStepModalStep>
    );
    const feedback = (
      <MultiStepModalFeedback>
        <MultiStepModalTitle>Custom feedback</MultiStepModalTitle>
        <p>Custom feedback content</p>
      </MultiStepModalFeedback>
    );
    render(
      <MultiStepModal steps={[{ id: 1 }]} dialogProps={{ defaultOpen: true }}>
        {step}
        {feedback}
      </MultiStepModal>,
    );

    expect(
      screen.getByRole("dialog", { name: "Submission step" }),
    ).toBeDefined();
    expect(screen.queryByText("Custom feedback content")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Submit form" }));

    expect(
      screen.getByRole("dialog", { name: "Custom feedback" }),
    ).toBeDefined();
    expect(screen.getByText("Custom feedback content")).toBeDefined();
  });

  it("renders feedback from a standalone submit control", async () => {
    const user = userEvent.setup();

    render(
      <MultiStepModal steps={[{ id: 1 }]} dialogProps={{ defaultOpen: true }}>
        <MultiStepModalStep stepId={1}>
          <MultiStepModalTitle>Standalone submission</MultiStepModalTitle>
          <MultiStepModalSubmit>Finish</MultiStepModalSubmit>
        </MultiStepModalStep>
        <MultiStepModalFeedback title="All done" />
      </MultiStepModal>,
    );

    await user.click(screen.getByRole("button", { name: "Finish" }));

    expect(screen.getByRole("dialog", { name: "All done" })).toBeDefined();
  });

  it("renders the footer as flex with configurable alignment", () => {
    const { rerender } = render(
      <MultiStepModal steps={[{ id: 1 }]} dialogProps={{ defaultOpen: true }}>
        <MultiStepModalStep stepId={1}>
          <MultiStepModalTitle>Footer alignment</MultiStepModalTitle>
          <MultiStepModalFooter>Default footer</MultiStepModalFooter>
        </MultiStepModalStep>
      </MultiStepModal>,
    );
    const getFooter = () =>
      document.querySelector("[data-multi-step-modal-footer]");

    expect(getFooter()?.className).toContain("kora:flex");
    expect(getFooter()?.className).toContain("kora:justify-end");

    rerender(
      <MultiStepModal steps={[{ id: 1 }]} dialogProps={{ defaultOpen: true }}>
        <MultiStepModalStep stepId={1}>
          <MultiStepModalTitle>Footer alignment</MultiStepModalTitle>
          <MultiStepModalFooter align="start">
            Start footer
          </MultiStepModalFooter>
        </MultiStepModalStep>
      </MultiStepModal>,
    );

    expect(getFooter()?.className).toContain("kora:justify-start");

    rerender(
      <MultiStepModal steps={[{ id: 1 }]} dialogProps={{ defaultOpen: true }}>
        <MultiStepModalStep stepId={1}>
          <MultiStepModalTitle>Footer alignment</MultiStepModalTitle>
          <MultiStepModalFooter align="none">None footer</MultiStepModalFooter>
        </MultiStepModalStep>
      </MultiStepModal>,
    );

    expect(getFooter()?.className).toContain("kora:flex");
    expect(getFooter()?.className).not.toContain("kora:justify-start");
    expect(getFooter()?.className).not.toContain("kora:justify-end");
  });

  it("uses the first of two footer buttons to close", async () => {
    const user = userEvent.setup();

    render(
      <MultiStepModal steps={[{ id: 1 }]} dialogProps={{ defaultOpen: true }}>
        <MultiStepModalStep stepId={1}>
          <MultiStepModalTitle>Closable step</MultiStepModalTitle>
          <MultiStepModalFooter>
            <MultiStepModalClose>Cancel</MultiStepModalClose>
            <MultiStepModalNext>Next</MultiStepModalNext>
          </MultiStepModalFooter>
        </MultiStepModalStep>
      </MultiStepModal>,
    );

    await user.click(screen.getByRole("button", { name: "Cancel" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).toBeNull();
    });
  });
});
