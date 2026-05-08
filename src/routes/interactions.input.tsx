import { Input, Label } from "@korapay/react";
import { createFileRoute } from "@tanstack/react-router";
import React from "react";

import { OTPInput } from "@/features/otp-input";
import { useCardMask } from "@/hooks/use-card-mask";
import { useCurrencyMask } from "@/hooks/use-currency-mask";
import { useCvvMask } from "@/hooks/use-cvv-mask";
import { useExpiryMask } from "@/hooks/use-expiry-mask";
import { usePhoneMask } from "@/hooks/use-phone-mask";

export const Route = createFileRoute("/interactions/input")({
  component: RouteComponent,
});

// eslint-disable-next-line react-refresh/only-export-components
function RouteComponent() {
  const [value, setValue] = React.useState("");
  const [value2, setValue2] = React.useState("");
  const [otpValue, setOtpValue] = React.useState("");
  const [cardValue, setCardValue] = React.useState("");
  const [expiryValue, setExpiryValue] = React.useState("");
  const [cvvValue, setCvvValue] = React.useState("");
  const [cvvAmexValue, setCvvAmexValue] = React.useState("");

  const currencyMaskProps = useCurrencyMask({
    value,
    onChange: setValue,
  });

  const phoneMaskProps = usePhoneMask({
    value: value2,
    onChange: setValue2,
    pattern: "+33 ### ####",
  });

  const cardMaskProps = useCardMask({
    value: cardValue,
    onChange: setCardValue,
  });

  const expiryMaskProps = useExpiryMask({
    value: expiryValue,
    onChange: setExpiryValue,
    yearFormat: "YY",
  });

  const cvvMaskProps = useCvvMask({
    value: cvvValue,
    onChange: setCvvValue,
    length: 3,
    masked: false,
  });

  const amexCvvMaskProps = useCvvMask({
    value: cvvAmexValue,
    onChange: setCvvAmexValue,
    length: 4,
    masked: false,
  });

  const examples = [
    {
      id: "currency-mask-input",
      title: "Currency Mask",
      description: "Formats numeric input as currency as you type.",
      props: currencyMaskProps,
      currentValue: value,
    },
    {
      id: "phone-mask-input",
      title: "Phone Mask",
      description: "Applies the +33 #### #### phone pattern.",
      props: phoneMaskProps,
      currentValue: value2,
    },
  ] as const;

  return (
    <div className="px-6 py-4">
      <section className="mx-auto max-w-6xl space-y-4">
        <header className="space-y-1">
          <p className="text-subheading-xs text-content-default-tertiary uppercase">
            Inputs
          </p>
          <h1 className="text-label-lg text-content-default-primary">
            Masked Input Examples
          </h1>
        </header>

        <div className="el-grid-3 auto-rows-[auto_minmax(0,1fr)_auto] items-stretch">
          {examples.map((example) => (
            <article
              key={example.id}
              className="row-span-3 grid grid-rows-subgrid rounded-sm border border-stroke-default-secondary bg-surface-primary p-4"
            >
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

              <p className="text-body-xs text-content-default-tertiary">
                Current value: {example.currentValue || "-"}
              </p>
            </article>
          ))}

          <article className="row-span-3 grid grid-rows-subgrid rounded-sm border border-stroke-default-secondary bg-surface-primary p-4">
            <div className="space-y-1">
              <Label
                htmlFor="otp-input-0"
                className="text-label-md text-content-default-primary"
              >
                OTP Compound Input
              </Label>
              <p className="text-body-sm text-content-default-secondary">
                Built with a compound API on top of the Input component.
              </p>
            </div>

            <OTPInput.Root
              value={otpValue}
              onValueChange={setOtpValue}
              length={6}
              name="otp"
            >
              <OTPInput.Group>
                {Array.from({ length: 6 }, (_, index) => (
                  <OTPInput.Slot
                    key={index}
                    index={index}
                    id={`otp-input-${index}`}
                    aria-label={`OTP digit ${index + 1}`}
                  />
                ))}
              </OTPInput.Group>
            </OTPInput.Root>

            <p className="text-body-xs text-content-default-tertiary">
              Current value: {otpValue || "-"}
            </p>
          </article>

          <article className="row-span-3 grid grid-rows-subgrid rounded-sm border border-stroke-default-secondary bg-surface-primary p-4">
            <div className="space-y-1">
              <Label
                htmlFor="card-mask-input"
                className="text-label-md text-content-default-primary"
              >
                Card Number Mask + Luhn
              </Label>
              <p className="text-body-sm text-content-default-secondary">
                Detects card type, applies length-aware formatting, and
                validates with Luhn.
              </p>
            </div>

            <Input
              id="card-mask-input"
              placeholder="#### #### #### ####"
              {...cardMaskProps}
            />

            <p className="text-body-xs text-content-default-tertiary">
              Type: {cardMaskProps.cardType} | Valid:{" "}
              {cardMaskProps.isValid ? "yes" : "no"} | Complete:{" "}
              {cardMaskProps.isComplete ? "yes" : "no"}
            </p>
          </article>

          <article className="row-span-3 grid grid-rows-subgrid rounded-sm border border-stroke-default-secondary bg-surface-primary p-4">
            <div className="space-y-1">
              <Label
                htmlFor="expiry-mask-input"
                className="text-label-md text-content-default-primary"
              >
                Expiry Date Mask
              </Label>
              <p className="text-body-sm text-content-default-secondary">
                Formats as MM / YY (or MM / YYYY via hook option).
              </p>
            </div>

            <Input id="expiry-mask-input" {...expiryMaskProps} />

            <p className="text-body-xs text-content-default-tertiary">
              Raw value: {expiryValue || "-"} | Valid:{" "}
              {expiryMaskProps.isValid ? "yes" : "no"}
            </p>
          </article>

          <article className="row-span-3 grid grid-rows-subgrid rounded-sm border border-stroke-default-secondary bg-surface-primary p-4">
            <div className="space-y-1">
              <Label
                htmlFor="cvv-mask-input"
                className="text-label-md text-content-default-primary"
              >
                CVV / CVC Mask
              </Label>
              <p className="text-body-sm text-content-default-secondary">
                3-digit CVV masked as password (4-digit variant for Amex below).
              </p>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1">
                <Label
                  htmlFor="cvv-mask-input"
                  className="text-label-sm text-content-default-secondary"
                >
                  Standard CVV (3)
                </Label>
                <Input
                  id="cvv-mask-input"
                  placeholder="***"
                  {...cvvMaskProps}
                />
              </div>

              <div className="space-y-1">
                <Label
                  htmlFor="cvv-mask-input-amex"
                  className="text-label-sm text-content-default-secondary"
                >
                  Amex CID (4)
                </Label>
                <Input
                  id="cvv-mask-input-amex"
                  placeholder="****"
                  {...amexCvvMaskProps}
                />
              </div>
            </div>

            <p className="text-body-xs text-content-default-tertiary">
              3-digit complete: {cvvMaskProps.isComplete ? "yes" : "no"} |
              4-digit complete: {amexCvvMaskProps.isComplete ? "yes" : "no"}
            </p>
          </article>
        </div>
      </section>
    </div>
  );
}
