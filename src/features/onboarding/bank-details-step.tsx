import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  TypographyBody,
  TypographyTitle,
} from "@korapay/react";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@korapay/react/molecules";
import {
  Controller,
  type SubmitHandler,
  type UseFormReturn,
} from "react-hook-form";

import { MultiStepPanel } from "@/ui/multistep/multistep";

import type { SignupValues } from "./onboarding-config";

const currencyItems = [
  { label: "Nigerian Naira (NGN)", value: "NGN" },
  { label: "US Dollar (USD)", value: "USD" },
  { label: "British Pound (GBP)", value: "GBP" },
  { label: "Euro (EUR)", value: "EUR" },
];

const bankItems = [
  { label: "Access Bank", value: "access-bank" },
  { label: "First Bank of Nigeria", value: "first-bank" },
  { label: "Guaranty Trust Bank", value: "gtbank" },
  { label: "United Bank for Africa", value: "uba" },
  { label: "Zenith Bank", value: "zenith-bank" },
];

type BankDetailsStepProps = {
  form: UseFormReturn<SignupValues>;
  onSubmit: SubmitHandler<SignupValues>;
};

export function BankDetailsStep({ form, onSubmit }: BankDetailsStepProps) {
  const { errors } = form.formState;
  const currency = form.watch("settlementCurrency");
  const accountNumber = form.watch("accountNumber");
  const bank = form.watch("bank");
  const bvn = form.watch("bvn");
  const canSubmit =
    Boolean(currency && bank) &&
    /^\d{10}$/.test(accountNumber) &&
    /^\d{11}$/.test(bvn);

  return (
    <MultiStepPanel stepId="bank-details">
      <Card className="kora:gap-0 kora:overflow-visible kora:py-0 kora:ring-0">
        <CardHeader className="kora:p-0">
          <TypographyTitle level={5} className="kora:font-semibold">
            Add your bank to receive settlements
          </TypographyTitle>
          <TypographyBody
            size="md"
            className="kora:mt-2 kora:max-w-md kora:leading-relaxed kora:text-content-default-secondary"
          >
            This will be used to collect payments. Once verified, you will be
            able to make payouts and direct withdrawals to the account provided.
          </TypographyBody>
        </CardHeader>

        <CardContent className="kora:mt-6 kora:p-0">
          <FieldGroup className="kora:gap-4">
            <Field data-invalid={Boolean(errors.settlementCurrency)}>
              <FieldLabel htmlFor="signup-settlement-currency">
                Currency
              </FieldLabel>
              <Controller
                control={form.control}
                name="settlementCurrency"
                rules={{ required: "Select a settlement currency." }}
                render={({ field }) => (
                  <Select
                    items={currencyItems}
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? "")}
                  >
                    <SelectTrigger
                      id="signup-settlement-currency"
                      className="kora:h-14 kora:w-full"
                      aria-invalid={Boolean(errors.settlementCurrency)}
                    >
                      <SelectValue placeholder="Select Currency" />
                    </SelectTrigger>
                    <SelectContent>
                      {currencyItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{errors.settlementCurrency?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.accountNumber)}>
              <FieldLabel htmlFor="signup-account-number">
                Account Number
              </FieldLabel>
              <Input
                id="signup-account-number"
                className="kora:h-14"
                inputMode="numeric"
                maxLength={10}
                placeholder="Enter account number"
                aria-invalid={Boolean(errors.accountNumber)}
                {...form.register("accountNumber", {
                  required: "Enter your account number.",
                  pattern: {
                    value: /^\d{10}$/,
                    message: "Enter a valid 10-digit account number.",
                  },
                })}
              />
              <FieldError>{errors.accountNumber?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.bank)}>
              <FieldLabel htmlFor="signup-bank">Select a Bank</FieldLabel>
              <Controller
                control={form.control}
                name="bank"
                rules={{ required: "Select your bank." }}
                render={({ field }) => (
                  <Select
                    items={bankItems}
                    value={field.value}
                    onValueChange={(value) => field.onChange(value ?? "")}
                  >
                    <SelectTrigger
                      id="signup-bank"
                      className="kora:h-14 kora:w-full"
                      aria-invalid={Boolean(errors.bank)}
                    >
                      <SelectValue placeholder="Select Bank" />
                    </SelectTrigger>
                    <SelectContent>
                      {bankItems.map((item) => (
                        <SelectItem key={item.value} value={item.value}>
                          {item.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <FieldError>{errors.bank?.message}</FieldError>
            </Field>

            <Field data-invalid={Boolean(errors.bvn)}>
              <FieldLabel htmlFor="signup-bvn">BVN</FieldLabel>
              <Input
                id="signup-bvn"
                className="kora:h-14"
                inputMode="numeric"
                maxLength={11}
                placeholder="Enter your bank verification number"
                aria-invalid={Boolean(errors.bvn)}
                {...form.register("bvn", {
                  required: "Enter your bank verification number.",
                  pattern: {
                    value: /^\d{11}$/,
                    message: "Enter a valid 11-digit BVN.",
                  },
                })}
              />
              <FieldError>{errors.bvn?.message}</FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor="signup-account-name">
                Name on Account
              </FieldLabel>
              <Input
                id="signup-account-name"
                className="kora:h-14 kora:bg-surface-neutral-subtle"
                readOnly
                aria-readonly="true"
                {...form.register("accountName")}
              />
            </Field>
          </FieldGroup>

          <Button
            type="button"
            size="xl"
            className="kora:mt-20 kora:w-full"
            disabled={!canSubmit}
            onClick={() => {
              void form.handleSubmit(onSubmit)();
            }}
          >
            Submit
          </Button>
        </CardContent>
      </Card>
    </MultiStepPanel>
  );
}
