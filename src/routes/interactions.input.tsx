import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Separator,
} from "@korapay/react";
import { InputGroup, InputGroupInput } from "@korapay/react/molecules";
import { ArrowRightIcon } from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import React from "react";

import { NumericStepper } from "@/features/numeric-stepper";
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
import { useQueryStates } from "@/hooks/use-query-states";
import { parseAsString } from "@/lib/query-state";

export const Route = createFileRoute("/interactions/input")({
  component: RouteComponent,
});

interface InputCardProps {
  id: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

type FilterGroupRootProps = {
  children: React.ReactNode;
};

type FilterGroupSearchClusterProps = {
  children: React.ReactNode;
};

type FilterGroupSelectProps = {
  value: string;
  onValueChange: (value: string | null) => void;
  placeholder: string;
  options: ReadonlyArray<{ label: string; value: string }>;
  className?: string;
};

type FilterGroupSearchInputProps = {
  value: string;
  onValueChange: (value: string) => void;
  placeholder: string;
  className?: string;
};

type FilterGroupActionProps = {
  onClick: () => void;
  label?: React.ReactNode;
  className?: string;
};

const filterQuerySchema = {
  result: parseAsString.withDefault("all-results"),
  period: parseAsString.withDefault("this-month"),
  searchBy: parseAsString.withDefault("reference"),
  keyword: parseAsString.withDefault(""),
};

const FilterGroup = {
  Root({ children }: FilterGroupRootProps) {
    return (
      <div className="flex w-full min-w-0 flex-col gap-2 sm:flex-row sm:items-stretch">
        {children}
      </div>
    );
  },

  SearchCluster({ children }: FilterGroupSearchClusterProps) {
    return (
      <InputGroup className="h-10 w-full min-w-0 sm:flex-1">
        {children}
      </InputGroup>
    );
  },

  Select({
    value,
    onValueChange,
    placeholder,
    options,
    className,
  }: FilterGroupSelectProps) {
    return (
      <Select
        value={value}
        onValueChange={(nextValue) => {
          onValueChange(nextValue);
        }}
      >
        <SelectTrigger
          className={
            className ?? "w-full min-w-0 sm:w-auto sm:min-w-[10rem] sm:flex-1"
          }
        >
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  },

  SearchInput({
    value,
    onValueChange,
    placeholder,
    className,
  }: FilterGroupSearchInputProps) {
    return (
      <InputGroupInput
        value={value}
        onInput={(event) => {
          onValueChange(event.currentTarget.value);
        }}
        placeholder={placeholder}
        className={className ?? "w-full min-w-[16rem] flex-1"}
      />
    );
  },

  Action({ onClick, label = "Apply", className }: FilterGroupActionProps) {
    return (
      <Button
        variant="neutral"
        type="button"
        onClick={onClick}
        className={className ?? "w-full sm:w-auto"}
      >
        {label}
      </Button>
    );
  },
};

function InputCard({
  id,
  title,
  description,
  children,
  footer,
}: InputCardProps) {
  return (
    <article className="row-span-3 grid grid-rows-subgrid gap-2 border border-stroke-default-secondary bg-surface-primary p-4 lg:[&:not(:nth-child(3n+1))]:border-l-0 sm:[&:nth-child(2n)]:border-l-0 lg:[&:nth-child(3n+1)]:border-l">
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

function NumericStepperInput() {
  const [plainValue, setPlainValue] = React.useState("12");
  const [currencyValue, setCurrencyValue] = React.useState("25.99");

  return (
    <InputCard
      id="numeric-stepper-input"
      title="Numeric Stepper Compound API"
      description="A reusable stepper with named subcomponents that supports integer or decimal values based on your configured input."
      footer={`Plain value: ${plainValue || "-"} | Decimal value: ${currencyValue || "-"}`}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label
            htmlFor="plain-stepper-input"
            className="text-label-sm text-content-default-secondary"
          >
            Plain numeric
          </Label>
          <NumericStepper.Root
            value={plainValue}
            onValueChange={setPlainValue}
            min={0}
            max={100}
          >
            <NumericStepper.Input id="plain-stepper-input" />
            <NumericStepper.Controls>
              <NumericStepper.Increase />
              <NumericStepper.Decrease />
            </NumericStepper.Controls>
          </NumericStepper.Root>
        </div>

        <div className="space-y-2">
          <Label
            htmlFor="currency-stepper-input"
            className="text-label-sm text-content-default-secondary"
          >
            Decimal value
          </Label>
          <NumericStepper.Root
            value={currencyValue}
            onValueChange={setCurrencyValue}
            min={0}
            max={1000000}
            step={0.01}
          >
            <NumericStepper.Input id="currency-stepper-input" />
            <NumericStepper.Controls>
              <NumericStepper.Increase aria-label="Increase currency amount" />
              <NumericStepper.Decrease aria-label="Decrease currency amount" />
            </NumericStepper.Controls>
          </NumericStepper.Root>
        </div>
      </div>
    </InputCard>
  );
}

function FilterGroupInput() {
  const [filterQueryValues, setFilterQueryValues] =
    useQueryStates(filterQuerySchema);

  const [resultFilter, setResultFilter] = React.useState(
    filterQueryValues.result ?? "all-results",
  );
  const [periodFilter, setPeriodFilter] = React.useState(
    filterQueryValues.period ?? "this-month",
  );
  const [searchBy, setSearchBy] = React.useState(
    filterQueryValues.searchBy ?? "reference",
  );
  const [keyword, setKeyword] = React.useState(filterQueryValues.keyword ?? "");
  const [appliedSummary, setAppliedSummary] = React.useState("Not applied yet");

  React.useEffect(() => {
    setResultFilter(filterQueryValues.result ?? "all-results");
    setPeriodFilter(filterQueryValues.period ?? "this-month");
    setSearchBy(filterQueryValues.searchBy ?? "reference");
    setKeyword(filterQueryValues.keyword ?? "");
  }, [
    filterQueryValues.keyword,
    filterQueryValues.period,
    filterQueryValues.result,
    filterQueryValues.searchBy,
  ]);

  const searchByLabels: Record<string, string> = {
    reference: "Reference",
    customer: "Customer",
    email: "Email",
  };

  return (
    <InputCard
      id="filter-group-keyword-input"
      title="Transaction Filter Toolbar"
      description="Compound composition for result, date, and search filters with a keyword input."
      footer={appliedSummary}
    >
      <FilterGroup.Root>
        <FilterGroup.Select
          value={resultFilter}
          onValueChange={(value) => {
            setResultFilter(value ?? "all-results");
          }}
          placeholder="All Results"
          className="w-full min-w-0 sm:w-auto sm:min-w-40 sm:flex-none"
          options={[
            { label: "All Results", value: "all-results" },
            { label: "Successful", value: "successful" },
            { label: "Pending", value: "pending" },
            { label: "Failed", value: "failed" },
          ]}
        />

        <FilterGroup.Select
          value={periodFilter}
          onValueChange={(value) => {
            setPeriodFilter(value ?? "this-month");
          }}
          placeholder="This month"
          className="w-full min-w-0 sm:w-auto sm:min-w-40 sm:flex-none"
          options={[
            { label: "Today", value: "today" },
            { label: "Last 7 days", value: "last-7-days" },
            { label: "This month", value: "this-month" },
            { label: "Last 3 months", value: "last-3-months" },
          ]}
        />

        <FilterGroup.SearchCluster>
          <Select
            value={searchBy}
            onValueChange={(value) => {
              setSearchBy(value ?? "reference");
            }}
          >
            <SelectTrigger
              data-slot="input-group-control"
              className="h-full w-auto min-w-52 flex-none rounded-none border-0 bg-transparent px-3 shadow-none focus-visible:ring-0"
            >
              <SelectValue placeholder="Search by">
                {(value) => (
                  <span className="flex items-center gap-1.5">
                    <span className="text-input-text-secondary">
                      Search by:
                    </span>
                    <span className="font-semibold text-input-text-filled">
                      {searchByLabels[String(value)] ?? "Reference"}
                    </span>
                  </span>
                )}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reference">Reference</SelectItem>
              <SelectItem value="customer">Customer</SelectItem>
              <SelectItem value="email">Email</SelectItem>
            </SelectContent>
          </Select>

          <Separator
            orientation="vertical"
            className="bg-input-border data-[orientation=vertical]:w-0.5"
          />

          <FilterGroup.SearchInput
            value={keyword}
            onValueChange={setKeyword}
            placeholder="Enter keyword(s)..."
            className="w-full min-w-[16rem] flex-1"
          />
        </FilterGroup.SearchCluster>

        <FilterGroup.Action
          label={<ArrowRightIcon weight="bold" />}
          className="w-full sm:w-auto sm:shrink-0"
          onClick={() => {
            setFilterQueryValues({
              result: resultFilter,
              period: periodFilter,
              searchBy,
              keyword,
            });
            setAppliedSummary(
              `Applied: ${resultFilter}, ${periodFilter}, ${searchBy}, keyword: ${keyword || "-"}`,
            );
          }}
        />
      </FilterGroup.Root>
    </InputCard>
  );
}

function RouteComponent() {
  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-auto px-6 py-6">
        <div className="mx-auto w-full max-w-7xl space-y-8">
          <header className="space-y-1">
            <p className="text-subheading-xs text-content-default-tertiary uppercase">
              Interactions
            </p>
            <h1 className="text-label-lg text-content-default-primary">
              Input Examples
            </h1>
          </header>

          <section className="space-y-3">
            <h2 className="text-label-sm text-content-default-secondary">
              General Masks
            </h2>
            <div className="grid auto-rows-[auto_minmax(0,1fr)_auto] grid-cols-1 items-stretch sm:grid-cols-2 lg:grid-cols-3">
              <CurrencyMaskInput />
              <PhoneMaskInput />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-label-sm text-content-default-secondary">
              Card Details Mask
            </h2>
            <div className="grid auto-rows-[auto_minmax(0,1fr)_auto] grid-cols-1 items-stretch sm:grid-cols-2 lg:grid-cols-3">
              <CardMaskInput />
              <ExpiryMaskInput />
              <CvvMaskInput />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-label-sm text-content-default-secondary">
              Filters & Search
            </h2>
            <div className="grid auto-rows-[auto_minmax(0,1fr)_auto] grid-cols-1 items-stretch">
              <FilterGroupInput />
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-label-sm text-content-default-secondary">
              Compound & State
            </h2>
            <div className="grid auto-rows-[auto_minmax(0,1fr)_auto] grid-cols-1 items-stretch sm:grid-cols-2 lg:grid-cols-3">
              <OtpInput />
              <QueryStateInput />
              <NumericStepperInput />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
