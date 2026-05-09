import { Input, Label } from "@korapay/react";
import { createFileRoute } from "@tanstack/react-router";
import React from "react";

import {
  OTPInputGroup,
  OTPInputRoot,
  OTPInputSlot,
} from "@/features/otp-input";
import { useCardMask } from "@/hooks/use-card-mask";
import { useCurrencyMask } from "@/hooks/use-currency-mask";
import { useCvvMask } from "@/hooks/use-cvv-mask";
import { useExpiryMask } from "@/hooks/use-expiry-mask";
import { usePhoneMask } from "@/hooks/use-phone-mask";
import { useQueryState } from "@/hooks/use-query-state";
import { parseAsString } from "@/lib/query-state";

export const Route = createFileRoute("/interactions/input")({
  component: RouteComponent,
});

// ============================================================================
// InputCard: Generic container for input examples
// ============================================================================

interface InputCardProps {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

function InputCard({
  id,
  title,
  description,
  children,
  footer,
}: InputCardProps) {
  return (
    <article className="row-span-3 grid grid-rows-subgrid gap-2 border-r border-b border-stroke-default-secondary bg-surface-primary p-4">
      <div className="space-y-1">
        <Label
          htmlFor={id}
          className="text-label-md text-content-default-primary"
        >
          {title}
        </Label>
        <p className="text-body-sm text-content-default-secondary">
          {description}
        </p>
      </div>

      {children}

      {footer && (
        <p className="text-body-xs text-content-default-tertiary">{footer}</p>
      )}
    </article>
  );
}

// ============================================================================
// CurrencyMaskInput: Currency formatting demo
// ============================================================================

function CurrencyMaskInput() {
  const [value, setValue] = React.useState("");
  const maskProps = useCurrencyMask({
    value,
    onChange: setValue,
  });

  return (
    <InputCard
      id="currency-mask-input"
      title="Currency Mask"
      description="Formats numeric input as currency as you type."
      footer={`Current value: ${value || "-"}`}
    >
      <Input id="currency-mask-input" {...maskProps} />
    </InputCard>
  );
}

// ============================================================================
// PhoneMaskInput: Phone number formatting demo
// ============================================================================

function PhoneMaskInput() {
  const [value, setValue] = React.useState("");
  const maskProps = usePhoneMask({
    value,
    onChange: setValue,
    pattern: "+33 ### ####",
  });

  return (
    <InputCard
      id="phone-mask-input"
      title="Phone Mask"
      description="Applies the +33 #### #### phone pattern."
      footer={`Current value: ${value || "-"}`}
    >
      <Input id="phone-mask-input" {...maskProps} />
    </InputCard>
  );
}

// ============================================================================
// CardMaskInput: Card number detection and formatting demo
// ============================================================================

function CardMaskInput() {
  const [value, setValue] = React.useState("");
  const maskProps = useCardMask({
    value,
    onChange: setValue,
  });

  return (
    <InputCard
      id="card-mask-input"
      title="Card Number Mask + Luhn"
      description="Detects card type, applies length-aware formatting, and validates with Luhn."
      footer={`Type: ${maskProps.cardType} | Valid: ${maskProps.isValid ? "yes" : "no"} | Complete: ${maskProps.isComplete ? "yes" : "no"}`}
    >
      <Input
        id="card-mask-input"
        placeholder="#### #### #### ####"
        {...maskProps}
      />
    </InputCard>
  );
}

// ============================================================================
// ExpiryMaskInput: Card expiry date formatting demo
// ============================================================================

function ExpiryMaskInput() {
  const [value, setValue] = React.useState("");
  const maskProps = useExpiryMask({
    value,
    onChange: setValue,
    yearFormat: "YY",
  });

  return (
    <InputCard
      id="expiry-mask-input"
      title="Expiry Date Mask"
      description="Formats as MM / YY (or MM / YYYY via hook option)."
      footer={`Raw value: ${value || "-"} | Valid: ${maskProps.isValid ? "yes" : "no"}`}
    >
      <Input id="expiry-mask-input" {...maskProps} />
    </InputCard>
  );
}

// ============================================================================
// CvvMaskInput: CVV/CVC formatting demo (standard and Amex variants)
// ============================================================================

function CvvMaskInput() {
  const [cvvValue, setCvvValue] = React.useState("");
  const [cvvAmexValue, setCvvAmexValue] = React.useState("");

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

  return (
    <InputCard
      id="cvv-mask-input"
      title="CVV / CVC Mask"
      description="3-digit CVV masked as password (4-digit variant for Amex below)."
      footer={`3-digit complete: ${cvvMaskProps.isComplete ? "yes" : "no"} | 4-digit complete: ${amexCvvMaskProps.isComplete ? "yes" : "no"}`}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="space-y-1">
          <Label
            htmlFor="cvv-mask-input"
            className="text-label-sm text-content-default-secondary"
          >
            Standard CVV (3)
          </Label>
          <Input id="cvv-mask-input" placeholder="***" {...cvvMaskProps} />
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
    </InputCard>
  );
}

// ============================================================================
// OtpInput: Multi-digit OTP compound input demo
// ============================================================================

function OtpInput() {
  const [value, setValue] = React.useState("");

  return (
    <InputCard
      id="otp-input-0"
      title="OTP Compound Input"
      description="Built with a compound API on top of the Input component."
      footer={`Current value: ${value || "-"}`}
    >
      <OTPInputRoot
        value={value}
        onValueChange={setValue}
        length={6}
        name="otp"
      >
        <OTPInputGroup>
          {Array.from({ length: 6 }, (_, index) => (
            <OTPInputSlot
              key={index}
              index={index}
              id={`otp-input-${index}`}
              aria-label={`OTP digit ${index + 1}`}
            />
          ))}
        </OTPInputGroup>
      </OTPInputRoot>
    </InputCard>
  );
}

// ============================================================================
// QueryStateInput: URL query parameter syncing demo
// ============================================================================

function QueryStateInput() {
  const [queryValue, setQueryValue] = useQueryState(
    "q",
    parseAsString.withDefault(""),
  );

  return (
    <InputCard
      id="search-query-input"
      title="Query State (nuqs-style)"
      description="This value stays in sync with the q search parameter."
      footer={`Current URL query value: ${queryValue || "-"}`}
    >
      <Input
        id="search-query-input"
        placeholder="Type to update ?q=..."
        value={queryValue ?? ""}
        onInput={(event) => {
          setQueryValue(event.currentTarget.value);
        }}
      />
    </InputCard>
  );
}

// ============================================================================
// RouteComponent: Main layout composing all input examples
// ============================================================================

function RouteComponent() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-6 py-6">
        <section className="mx-auto w-full max-w-7xl space-y-4">
          <header className="space-y-1">
            <p className="text-subheading-xs text-content-default-tertiary uppercase">
              Inputs
            </p>
            <h1 className="text-label-lg text-content-default-primary">
              Masked Input Examples
            </h1>
          </header>

          <div className="grid auto-rows-[auto_minmax(0,1fr)_auto] grid-cols-1 items-stretch border-t border-l border-stroke-default-secondary sm:grid-cols-2 lg:grid-cols-3">
            <CurrencyMaskInput />
            <PhoneMaskInput />
            <OtpInput />
            <CardMaskInput />
            <ExpiryMaskInput />
            <CvvMaskInput />
            <QueryStateInput />
          </div>
        </section>
      </div>
    </div>
  );
}
