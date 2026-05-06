import { Input, Label } from "@kora/react";
import { createFileRoute } from "@tanstack/react-router";
import React from "react";

import { useCurrencyMask } from "@/hooks/use-currency-mask";
import { usePhoneMask } from "@/hooks/use-phone-mask";

export const Route = createFileRoute("/interactions/input")({
  component: RouteComponent,
});

// eslint-disable-next-line react-refresh/only-export-components
function RouteComponent() {
  const [value, setValue] = React.useState("");
  const [value2, setValue2] = React.useState("");
  const currencyMaskProps = useCurrencyMask({
    value,
    onChange: setValue,
  });
  const phoneMaskProps = usePhoneMask({
    value: value2,
    onChange: setValue2,
    pattern: "+33 ### ####",
  });

  const examples = [
    {
      id: "currency-mask-input",
      title: "Currency Mask",
      description: "Formats numeric input as currency as you type.",
      props: currencyMaskProps,
    },
    {
      id: "phone-mask-input",
      title: "Phone Mask",
      description: "Applies the +33 #### #### phone pattern.",
      props: phoneMaskProps,
    },
  ] as const;

  return (
    <div className="px-6 py-4">
      <section className="mx-auto max-w-5xl space-y-4">
        <header className="space-y-1">
          <p className="text-subheading-xs text-content-default-tertiary uppercase">
            Inputs
          </p>
          <h1 className="text-label-lg text-content-default-primary">
            Masked Input Examples
          </h1>
        </header>

        <div className="grid gap-4 md:grid-cols-2">
          {examples.map((example) => (
            <article
              key={example.id}
              className="rounded-sm border border-stroke-default-secondary bg-surface-primary p-4"
            >
              <div className="space-y-3">
                <div className="space-y-1">
                  <Label
                    htmlFor={example.id}
                    className="text-label-md text-content-default-primary"
                  >
                    {example.title}
                  </Label>
                  <p className="text-body-sm text-content-default-secondary">
                    {example.description}
                  </p>
                </div>

                <Input id={example.id} {...example.props} />
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
