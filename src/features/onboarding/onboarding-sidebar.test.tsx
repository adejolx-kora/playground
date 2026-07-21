import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { MultiStepRoot } from "@/ui/multistep/multistep";
import { useMultiStepContext } from "@/ui/multistep/use-multistep-context";

import {
  signupSteps,
  type SignupStepId,
  type SignupStepMeta,
} from "./onboarding-config";
import { OnboardingSidebar } from "./onboarding-sidebar";

afterEach(cleanup);

function CurrentStep() {
  const flow = useMultiStepContext<SignupStepId, SignupStepMeta>();

  return <output data-testid="current-step">{flow.currentStepId}</output>;
}

describe("OnboardingSidebar", () => {
  it("uses multistep triggers for implemented steps and reflects navigation state", async () => {
    render(
      <MultiStepRoot<SignupStepId, unknown, SignupStepMeta> steps={signupSteps}>
        <OnboardingSidebar />
        <CurrentStep />
      </MultiStepRoot>,
    );

    const businessType = screen.getByRole("button", {
      name: "Business Type",
    });
    const businessProfile = screen.getByRole("button", {
      name: "Business Profile",
    });
    const documents = screen.getByRole("button", { name: "Documents" });
    const bankDetails = screen.getByRole("button", { name: "Bank Details" });

    expect(businessType.getAttribute("aria-current")).toBe("step");

    fireEvent.click(businessProfile);

    await waitFor(() => {
      expect(screen.getByTestId("current-step").textContent).toBe(
        "business-information",
      );
    });

    expect(businessProfile.getAttribute("aria-current")).toBe("step");
    expect(
      businessType
        .closest('[data-slot="stepper-item"]')
        ?.getAttribute("data-state"),
    ).toBe("completed");

    fireEvent.click(documents);

    await waitFor(() => {
      expect(screen.getByTestId("current-step").textContent).toBe("documents");
    });

    expect(documents.getAttribute("aria-current")).toBe("step");

    fireEvent.click(bankDetails);

    await waitFor(() => {
      expect(screen.getByTestId("current-step").textContent).toBe(
        "bank-details",
      );
    });

    expect(bankDetails.getAttribute("aria-current")).toBe("step");
  });

  it("marks bank details as completed when the onboarding flow is submitted", async () => {
    render(
      <MultiStepRoot<SignupStepId, unknown, SignupStepMeta>
        steps={signupSteps}
        initialStepId="bank-details"
      >
        <OnboardingSidebar completed />
      </MultiStepRoot>,
    );

    const bankDetails = screen.getByRole("button", { name: "Bank Details" });

    expect(
      bankDetails
        .closest('[data-slot="stepper-item"]')
        ?.getAttribute("data-state"),
    ).toBe("completed");
  });
});
