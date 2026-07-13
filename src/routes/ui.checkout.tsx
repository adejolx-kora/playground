import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Input,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@korapay/react";
import {
  Copy,
  CopyFeedback,
  CopyIcon,
  CopyTrigger,
  Field,
  FieldGroup,
  FieldLabel,
  InputGroup,
  InputGroupAddon,
} from "@korapay/react/molecules";
import {
  BankIcon,
  CheckCircleIcon,
  CreditCardIcon,
  InfoIcon,
  LockIcon,
  MagnifyingGlassIcon,
  XIcon,
} from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { useCardMask } from "@/hooks/use-card-mask";
import { useCvvMask } from "@/hooks/use-cvv-mask";
import { useExpiryMask } from "@/hooks/use-expiry-mask";
import { formatNumber } from "@/lib/utils";
import {
  CommandDropdownContent,
  CommandDropdownEmpty,
  CommandDropdownInput,
  CommandDropdownItem,
  CommandDropdownList,
  CommandDropdownRoot,
  CommandDropdownTrigger,
  CommandDropdownValue,
} from "@/ui/command-dropdown";

export const Route = createFileRoute("/ui/checkout")({
  component: RouteComponent,
});

type ViewType =
  | "initial"
  | "paymentMethodList"
  | "payWithDebitCard"
  | "payWithBankTransfer"
  | "payWithBank";

function PayWithDebitCardView({ onChangeView }: { onChangeView: () => void }) {
  const [cardMask, setCardMask] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvvValue, setCvvValue] = useState("");

  const expiryMask = useExpiryMask({
    value: expiry,
    onChange: setExpiry,
    yearFormat: "YY",
  });

  const maskProps = useCardMask({
    value: cardMask,
    onChange: setCardMask,
  });

  const cvvMaskProps = useCvvMask({
    value: cvvValue,
    onChange: setCvvValue,
    length: 3,
    masked: false,
  });

  return (
    <>
      <CardHeader className="space-y-6">
        <CardTitle className="flex flex-col items-center gap-2">
          <CreditCardIcon
            size={34}
            weight="fill"
            className="text-neutral-500"
          />
          <span className="text-body-lg font-semibold">
            Pay{" "}
            {formatNumber(5000, {
              style: "currency",
              currency: "NGN",
              currencyDisplay: "code",
            })}
          </span>
        </CardTitle>
        <CardDescription className="mx-auto max-w-[35ch] text-center text-label-xs">
          Enter your card information to complete this payment
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-col gap-6 rounded-xs bg-neutral-200 p-6">
          <Field>
            <FieldLabel htmlFor="card-number" className="text-label-xs">
              Card number
            </FieldLabel>
            <Input
              id="card-number"
              placeholder="0000 0000 0000 0000"
              {...maskProps}
            />
          </Field>
          <FieldGroup className="flex-row gap-0">
            <Field>
              <FieldLabel htmlFor="expiry-date" className="text-label-xs">
                Expiry Date
              </FieldLabel>
              <Input
                id="expiry-date"
                {...expiryMask}
                className="rounded-e-none border-e-1"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cvv" className="text-label-xs">
                CVV
              </FieldLabel>
              <Input
                id="cvv"
                placeholder="000"
                {...cvvMaskProps}
                className="rounded-s-none border-s-1"
              />
            </Field>
          </FieldGroup>
        </div>
        <Button className="w-full bg-checkout-green-500 hover:bg-checkout-green-500/90">
          <LockIcon />
          Pay 5000
        </Button>
      </CardContent>
      <CardFooter className="border-t-0 bg-transparent pb-8">
        <Button
          variant="primary-ghost"
          className="w-full"
          onClick={onChangeView}
        >
          Change Payment Method
        </Button>
      </CardFooter>
    </>
  );
}

function PayWithBankTransferView({
  onChangeView,
}: {
  onChangeView: () => void;
}) {
  const amount = 5000;

  const formattedAmount = formatNumber(amount, {
    style: "currency",
    currency: "NGN",
    currencyDisplay: "code",
  });

  return (
    <>
      <CardHeader className="space-y-6">
        <CardTitle className="flex flex-col items-center gap-2">
          <CreditCardIcon
            size={34}
            weight="fill"
            className="text-neutral-500"
          />
          <span className="text-body-lg font-semibold">
            Pay {formattedAmount}
          </span>
        </CardTitle>
        <CardDescription className="mx-auto max-w-[35ch] text-center text-label-xs">
          <Copy value={amount.toString()}>
            <CopyTrigger
              aria-label="Copy documentation URL"
              className="w-fit p-1 text-body-xs"
            >
              <span className="group-data-copied/copy:hidden">Copy Amount</span>
              <span className="hidden group-data-copied/copy:inline">
                Copied
              </span>
              <CopyIcon />
              <CopyFeedback />
            </CopyTrigger>
          </Copy>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-center text-body-lg font-bold">
          Before you make this transfer
        </p>
        <div className="flex flex-col gap-6 rounded-xs bg-yellow-100 p-6">
          <ul className="flex flex-col gap-6">
            <li className="flex items-start gap-2">
              <CheckCircleIcon
                weight="fill"
                size={20}
                className="shrink-0 text-neutral-600"
              />
              <div className="text-yellow-700">
                <span className="text-body-sm font-semibold">
                  Transfer only the exact amount;
                </span>
                &nbsp;
                <span className="text-body-sm">
                  Do not transfer an incorrect amount
                </span>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircleIcon
                weight="fill"
                size={20}
                className="shrink-0 text-neutral-600"
              />
              <div className="text-yellow-700">
                <span className="text-body-sm font-semibold">
                  Do not save or reuse the account;
                </span>
                &nbsp;
                <span className="text-body-sm">
                  It can only accept a single transfer.
                </span>
              </div>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircleIcon
                weight="fill"
                size={20}
                className="shrink-0 text-neutral-600"
              />
              <div className="text-yellow-700">
                <span className="text-body-sm font-semibold">
                  The account expires after
                </span>
                &nbsp;
                <span className="text-body-sm">60 minutes</span>
              </div>
            </li>
          </ul>

          <Field className="flex-row-reverse" orientation="horizontal">
            <FieldLabel
              htmlFor="consent"
              className="text-label-xs text-neutral-700"
            >
              I understand these instructions
            </FieldLabel>
            <Checkbox id="consent" />
          </Field>

          <Button className="w-full" disabled>
            Continue
          </Button>
        </div>
      </CardContent>
      <CardFooter className="justify-center border-t-0 bg-transparent pb-6">
        <Button variant="neutral-ghost" onClick={onChangeView}>
          Change Payment Method
        </Button>
        <Separator orientation="vertical" className="my-6 h-4" />
        <Button variant="neutral-ghost" onClick={onChangeView}>
          Help?
        </Button>
      </CardFooter>
    </>
  );
}

const banksList = {
  "first-bank": "First Bank",
  "access-bank": "Access Bank",
  gtb: "GTB",
};

const banksItems = [
  {
    label: "First Bank",
    value: "first-bank",
  },
  {
    label: "Access Bank",
    value: "access-bank",
  },
  {
    label: "Guaranty Trust Bank",
    value: "gtb",
  },
];

function PayWithBankView({ onChangeView }: { onChangeView: () => void }) {
  const [value, setValue] = useState<string | null>(null);

  return (
    <>
      <CardHeader className="space-y-6">
        <CardTitle className="flex flex-col items-center gap-2">
          <BankIcon size={34} weight="fill" className="text-neutral-500" />
          <span className="text-body-lg font-semibold">
            Pay{" "}
            {formatNumber(5000, {
              style: "currency",
              currency: "NGN",
              currencyDisplay: "code",
            })}
          </span>
        </CardTitle>
        <CardDescription className="mx-auto max-w-[35ch] text-center text-label-xs">
          Which bank would you like to pay with?
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        <div className="flex flex-col gap-6 rounded-xs bg-neutral-200 p-6">
          <Field>
            <FieldLabel htmlFor="sendingBank" className="text-label-xs">
              Bank
            </FieldLabel>
            <CommandDropdownRoot
              items={banksItems}
              value={banksItems.find((bank) => bank.value === value) ?? null}
              onValueChange={(bank) => setValue(bank?.value ?? null)}
            >
              <CommandDropdownTrigger id="sendingBank" className="w-full">
                <MagnifyingGlassIcon
                  weight="bold"
                  size={16}
                  className="text-dark-grey-500!"
                />
                <span className="flex flex-1 text-left">
                  <CommandDropdownValue placeholder="Find a bank" />
                </span>
              </CommandDropdownTrigger>
              <CommandDropdownContent className="min-w-(--anchor-width) p-2">
                <InputGroup className="m-0!">
                  <InputGroupAddon>
                    <MagnifyingGlassIcon
                      weight="bold"
                      size={12}
                      className="text-dark-grey-500!"
                    />
                  </InputGroupAddon>
                  <CommandDropdownInput
                    placeholder="Select a bank"
                    aria-label="Select a bank"
                    className="text-body-xs md:text-body-xs!"
                  />
                </InputGroup>
                <CommandDropdownEmpty className="text-body-xs">
                  No banks found.
                </CommandDropdownEmpty>
                <CommandDropdownList>
                  {(bank: (typeof banksItems)[number]) => (
                    <CommandDropdownItem
                      key={bank.value}
                      value={bank}
                      className="p-2 text-body-xs"
                    >
                      <BankIcon className="mr-2" />
                      <span>{bank.label}</span>
                    </CommandDropdownItem>
                  )}
                </CommandDropdownList>
                <Button
                  variant="link"
                  className="w-full justify-start p-2 text-body-xs"
                >
                  Can't find your bank here?
                </Button>
              </CommandDropdownContent>
            </CommandDropdownRoot>
          </Field>
        </div>
        <Button className="w-full bg-checkout-green-500 hover:bg-checkout-green-500/90">
          <LockIcon />
          Pay with{" "}
          {banksList[value as unknown as keyof typeof banksList] || "Bank"}
        </Button>
      </CardContent>
      <CardFooter className="justify-center border-t-0 bg-transparent pb-6">
        <Button variant="neutral-ghost" onClick={onChangeView}>
          Change Payment Method
        </Button>
        <Separator orientation="vertical" className="my-6 h-4" />
        <Button variant="neutral-ghost" onClick={onChangeView}>
          Help?
        </Button>
      </CardFooter>
    </>
  );
}

function InitialView({ onChangeView }: { onChangeView: () => void }) {
  return (
    <>
      <CardHeader className="space-y-6">
        <CardTitle className="flex flex-col items-center gap-2 rounded-2xs bg-neutral-200 p-4 text-title-5 font-semibold text-[#4b83ed]">
          Pay{" "}
          {formatNumber(5000, {
            style: "currency",
            currency: "NGN",
            currencyDisplay: "code",
          })}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 pb-12">
        <Field>
          <FieldLabel htmlFor="fullName" className="text-label-xs">
            Full Name
          </FieldLabel>
          <Input id="fullName" placeholder="John Doe" />
        </Field>
        <FieldGroup className="flex-row gap-0">
          <Field>
            <FieldLabel htmlFor="email" className="text-label-xs">
              Email
            </FieldLabel>
            <Input id="email" placeholder="johndoe@email.com" />
          </Field>
        </FieldGroup>
        <Button
          className="w-full bg-checkout-green-500 hover:bg-checkout-green-500/90"
          onClick={onChangeView}
        >
          Proceed
        </Button>
      </CardContent>
    </>
  );
}

function PaymentMethodListView({
  onChangeView,
}: {
  onChangeView: (view: ViewType) => void;
}) {
  return (
    <>
      <CardHeader>
        <CardTitle className="flex flex-col items-center gap-2 text-body-md font-semibold">
          How would you like to pay?
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-12">
        <ul className="flex flex-col divide-y-1 divide-neutral-400 rounded-b-2xs bg-neutral-200">
          <li>
            <Button
              onClick={() => onChangeView("payWithDebitCard")}
              className="h-auto w-full justify-between py-4"
              variant="unset"
            >
              <span className="flex items-center gap-2">
                <CreditCardIcon weight="fill" color="#aabdce" />
                <span>Pay with Debit Card</span>
              </span>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon weight="fill" color="#aabdce" />
                </TooltipTrigger>
                <TooltipContent>Hello</TooltipContent>
              </Tooltip>
            </Button>
          </li>

          <li>
            <Button
              onClick={() => onChangeView("payWithBankTransfer")}
              className="h-auto w-full justify-between py-4"
              variant="unset"
            >
              <span className="flex items-center gap-2">
                <CreditCardIcon weight="fill" color="#aabdce" />
                <span>Pay with Bank Transfer</span>
              </span>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon weight="fill" color="#aabdce" />
                </TooltipTrigger>
                <TooltipContent>Hello</TooltipContent>
              </Tooltip>
            </Button>
          </li>

          <li>
            <Button
              onClick={() => onChangeView("payWithBank")}
              className="h-auto w-full justify-between py-4"
              variant="unset"
            >
              <span className="flex items-center gap-2">
                <CreditCardIcon weight="fill" color="#aabdce" />
                <span>Pay with Bank</span>
              </span>
              <Tooltip>
                <TooltipTrigger>
                  <InfoIcon weight="fill" color="#aabdce" />
                </TooltipTrigger>
                <TooltipContent>Hello</TooltipContent>
              </Tooltip>
            </Button>
          </li>
        </ul>
      </CardContent>
    </>
  );
}

function RouteComponent() {
  const [view, setView] = useState<ViewType>("initial");

  const handleChangeView = (newView: ViewType) => setView(newView);

  return (
    <div className="grid min-h-0 grow [place-content:safe_center] gap-4 overflow-y-auto bg-neutral-200 p-4">
      {view === "initial" && (
        <>
          <div className="flex flex-col items-center gap-1">
            <h1 className="text-title-5 font-semibold">Magnolia</h1>
            <p className="text-body-sm font-medium text-neutral-700">
              Kora HQ Developer
            </p>
          </div>
          <p className="text-center text-body-sm text-neutral-600">
            This is a test link
          </p>
        </>
      )}
      <div className="flex gap-2">
        <Card className="w-xs gap-12 bg-white">
          {view === "initial" && (
            <InitialView
              onChangeView={() => handleChangeView("paymentMethodList")}
            />
          )}
          {view === "paymentMethodList" && (
            <PaymentMethodListView onChangeView={handleChangeView} />
          )}
          {view === "payWithDebitCard" && (
            <PayWithDebitCardView
              onChangeView={() => handleChangeView("paymentMethodList")}
            />
          )}
          {view === "payWithBankTransfer" && (
            <PayWithBankTransferView
              onChangeView={() => handleChangeView("paymentMethodList")}
            />
          )}
          {view === "payWithBank" && (
            <PayWithBankView
              onChangeView={() => handleChangeView("paymentMethodList")}
            />
          )}
        </Card>
        {view !== "initial" && (
          <Button size="icon-sm" variant="neutral-lighter" className="p-1">
            <XIcon />
          </Button>
        )}
      </div>
    </div>
  );
}
