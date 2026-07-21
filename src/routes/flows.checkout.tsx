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

export const Route = createFileRoute("/flows/checkout")({
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
      <CardHeader className="kora:space-y-6">
        <CardTitle className="kora:flex kora:flex-col kora:items-center kora:gap-2">
          <CreditCardIcon
            size={34}
            weight="fill"
            className="kora:text-neutral-500"
          />
          <span className="kora:text-body-lg kora:font-semibold">
            Pay{" "}
            {formatNumber(5000, {
              style: "currency",
              currency: "NGN",
              currencyDisplay: "code",
            })}
          </span>
        </CardTitle>
        <CardDescription className="kora:mx-auto kora:max-w-[35ch] kora:text-center kora:text-label-xs">
          Enter your card information to complete this payment
        </CardDescription>
      </CardHeader>
      <CardContent className="kora:space-y-2">
        <div className="kora:flex kora:flex-col kora:gap-6 kora:rounded-xs kora:bg-neutral-200 kora:p-6">
          <Field>
            <FieldLabel htmlFor="card-number" className="kora:text-label-xs">
              Card number
            </FieldLabel>
            <Input
              id="card-number"
              placeholder="0000 0000 0000 0000"
              {...maskProps}
            />
          </Field>
          <FieldGroup className="kora:flex-row kora:gap-0">
            <Field>
              <FieldLabel htmlFor="expiry-date" className="kora:text-label-xs">
                Expiry Date
              </FieldLabel>
              <Input
                id="expiry-date"
                {...expiryMask}
                className="kora:rounded-e-none kora:border-e-1"
              />
            </Field>
            <Field>
              <FieldLabel htmlFor="cvv" className="kora:text-label-xs">
                CVV
              </FieldLabel>
              <Input
                id="cvv"
                placeholder="000"
                {...cvvMaskProps}
                className="kora:rounded-s-none kora:border-s-1"
              />
            </Field>
          </FieldGroup>
        </div>
        <Button className="kora:w-full kora:bg-checkout-green-500 kora:hover:bg-checkout-green-500/90">
          <LockIcon />
          Pay 5000
        </Button>
      </CardContent>
      <CardFooter className="kora:border-t-0 kora:bg-transparent kora:pb-8">
        <Button
          variant="primary-ghost"
          className="kora:w-full"
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
      <CardHeader className="kora:space-y-6">
        <CardTitle className="kora:flex kora:flex-col kora:items-center kora:gap-2">
          <CreditCardIcon
            size={34}
            weight="fill"
            className="kora:text-neutral-500"
          />
          <span className="kora:text-body-lg kora:font-semibold">
            Pay {formattedAmount}
          </span>
        </CardTitle>
        <CardDescription className="kora:mx-auto kora:max-w-[35ch] kora:text-center kora:text-label-xs">
          <Copy value={amount.toString()}>
            <CopyTrigger
              aria-label="Copy documentation URL"
              className="kora:w-fit kora:p-1 kora:text-body-xs"
            >
              <span className="kora:group-data-copied/copy:hidden">
                Copy Amount
              </span>
              <span className="kora:hidden kora:group-data-copied/copy:inline">
                Copied
              </span>
              <CopyIcon />
              <CopyFeedback />
            </CopyTrigger>
          </Copy>
        </CardDescription>
      </CardHeader>
      <CardContent className="kora:space-y-4">
        <p className="kora:text-center kora:text-body-lg kora:font-bold">
          Before you make this transfer
        </p>
        <div className="kora:flex kora:flex-col kora:gap-6 kora:rounded-xs kora:bg-yellow-100 kora:p-6">
          <ul className="kora:flex kora:flex-col kora:gap-6">
            <li className="kora:flex kora:items-start kora:gap-2">
              <CheckCircleIcon
                weight="fill"
                size={20}
                className="kora:shrink-0 kora:text-neutral-600"
              />
              <div className="kora:text-yellow-700">
                <span className="kora:text-body-sm kora:font-semibold">
                  Transfer only the exact amount;
                </span>
                &nbsp;
                <span className="kora:text-body-sm">
                  Do not transfer an incorrect amount
                </span>
              </div>
            </li>
            <li className="kora:flex kora:items-start kora:gap-2">
              <CheckCircleIcon
                weight="fill"
                size={20}
                className="kora:shrink-0 kora:text-neutral-600"
              />
              <div className="kora:text-yellow-700">
                <span className="kora:text-body-sm kora:font-semibold">
                  Do not save or reuse the account;
                </span>
                &nbsp;
                <span className="kora:text-body-sm">
                  It can only accept a single transfer.
                </span>
              </div>
            </li>
            <li className="kora:flex kora:items-start kora:gap-2">
              <CheckCircleIcon
                weight="fill"
                size={20}
                className="kora:shrink-0 kora:text-neutral-600"
              />
              <div className="kora:text-yellow-700">
                <span className="kora:text-body-sm kora:font-semibold">
                  The account expires after
                </span>
                &nbsp;
                <span className="kora:text-body-sm">60 minutes</span>
              </div>
            </li>
          </ul>

          <Field className="kora:flex-row-reverse" orientation="horizontal">
            <FieldLabel
              htmlFor="consent"
              className="kora:text-label-xs kora:text-neutral-700"
            >
              I understand these instructions
            </FieldLabel>
            <Checkbox id="consent" />
          </Field>

          <Button className="kora:w-full" disabled>
            Continue
          </Button>
        </div>
      </CardContent>
      <CardFooter className="kora:justify-center kora:border-t-0 kora:bg-transparent kora:pb-6">
        <Button variant="neutral-ghost" onClick={onChangeView}>
          Change Payment Method
        </Button>
        <Separator orientation="vertical" className="kora:my-6 kora:h-4" />
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
      <CardHeader className="kora:space-y-6">
        <CardTitle className="kora:flex kora:flex-col kora:items-center kora:gap-2">
          <BankIcon size={34} weight="fill" className="kora:text-neutral-500" />
          <span className="kora:text-body-lg kora:font-semibold">
            Pay{" "}
            {formatNumber(5000, {
              style: "currency",
              currency: "NGN",
              currencyDisplay: "code",
            })}
          </span>
        </CardTitle>
        <CardDescription className="kora:mx-auto kora:max-w-[35ch] kora:text-center kora:text-label-xs">
          Which bank would you like to pay with?
        </CardDescription>
      </CardHeader>
      <CardContent className="kora:space-y-2">
        <div className="kora:flex kora:flex-col kora:gap-6 kora:rounded-xs kora:bg-neutral-200 kora:p-6">
          <Field>
            <FieldLabel htmlFor="sendingBank" className="kora:text-label-xs">
              Bank
            </FieldLabel>
            <CommandDropdownRoot
              items={banksItems}
              value={banksItems.find((bank) => bank.value === value) ?? null}
              onValueChange={(bank) => setValue(bank?.value ?? null)}
            >
              <CommandDropdownTrigger id="sendingBank" className="kora:w-full">
                <MagnifyingGlassIcon
                  weight="bold"
                  size={16}
                  className="kora:text-dark-grey-500!"
                />
                <span className="kora:flex kora:flex-1 kora:text-left">
                  <CommandDropdownValue placeholder="Find a bank" />
                </span>
              </CommandDropdownTrigger>
              <CommandDropdownContent className="kora:min-w-(--anchor-width) kora:p-2">
                <InputGroup className="kora:m-0!">
                  <InputGroupAddon>
                    <MagnifyingGlassIcon
                      weight="bold"
                      size={12}
                      className="kora:text-dark-grey-500!"
                    />
                  </InputGroupAddon>
                  <CommandDropdownInput
                    placeholder="Select a bank"
                    aria-label="Select a bank"
                    className="kora:text-body-xs kora:md:text-body-xs!"
                  />
                </InputGroup>
                <CommandDropdownEmpty className="kora:text-body-xs">
                  No banks found.
                </CommandDropdownEmpty>
                <CommandDropdownList>
                  {(bank: (typeof banksItems)[number]) => (
                    <CommandDropdownItem
                      key={bank.value}
                      value={bank}
                      className="kora:p-2 kora:text-body-xs"
                    >
                      <BankIcon className="kora:mr-2" />
                      <span>{bank.label}</span>
                    </CommandDropdownItem>
                  )}
                </CommandDropdownList>
                <Button
                  variant="link"
                  className="kora:w-full kora:justify-start kora:p-2 kora:text-body-xs"
                >
                  Can't find your bank here?
                </Button>
              </CommandDropdownContent>
            </CommandDropdownRoot>
          </Field>
        </div>
        <Button className="kora:w-full kora:bg-checkout-green-500 kora:hover:bg-checkout-green-500/90">
          <LockIcon />
          Pay with{" "}
          {banksList[value as unknown as keyof typeof banksList] || "Bank"}
        </Button>
      </CardContent>
      <CardFooter className="kora:justify-center kora:border-t-0 kora:bg-transparent kora:pb-6">
        <Button variant="neutral-ghost" onClick={onChangeView}>
          Change Payment Method
        </Button>
        <Separator orientation="vertical" className="kora:my-6 kora:h-4" />
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
      <CardHeader className="kora:space-y-6">
        <CardTitle className="kora:flex kora:flex-col kora:items-center kora:gap-2 kora:rounded-2xs kora:bg-neutral-200 kora:p-4 kora:text-title-5 kora:font-semibold kora:text-[#4b83ed]">
          Pay{" "}
          {formatNumber(5000, {
            style: "currency",
            currency: "NGN",
            currencyDisplay: "code",
          })}
        </CardTitle>
      </CardHeader>
      <CardContent className="kora:space-y-6 kora:pb-12">
        <Field>
          <FieldLabel htmlFor="fullName" className="kora:text-label-xs">
            Full Name
          </FieldLabel>
          <Input id="fullName" placeholder="John Doe" />
        </Field>
        <FieldGroup className="kora:flex-row kora:gap-0">
          <Field>
            <FieldLabel htmlFor="email" className="kora:text-label-xs">
              Email
            </FieldLabel>
            <Input id="email" placeholder="johndoe@email.com" />
          </Field>
        </FieldGroup>
        <Button
          className="kora:w-full kora:bg-checkout-green-500 kora:hover:bg-checkout-green-500/90"
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
        <CardTitle className="kora:flex kora:flex-col kora:items-center kora:gap-2 kora:text-body-md kora:font-semibold">
          How would you like to pay?
        </CardTitle>
      </CardHeader>
      <CardContent className="kora:pb-12">
        <ul className="kora:flex kora:flex-col kora:divide-y-1 kora:divide-neutral-400 kora:rounded-b-2xs kora:bg-neutral-200">
          <li>
            <Button
              onClick={() => onChangeView("payWithDebitCard")}
              className="kora:h-auto kora:w-full kora:justify-between kora:py-4"
              variant="unset"
            >
              <span className="kora:flex kora:items-center kora:gap-2">
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
              className="kora:h-auto kora:w-full kora:justify-between kora:py-4"
              variant="unset"
            >
              <span className="kora:flex kora:items-center kora:gap-2">
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
              className="kora:h-auto kora:w-full kora:justify-between kora:py-4"
              variant="unset"
            >
              <span className="kora:flex kora:items-center kora:gap-2">
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
    <div className="kora:grid kora:min-h-0 kora:grow kora:place-content-center-safe kora:gap-4 kora:overflow-y-auto kora:bg-neutral-200 kora:p-4">
      {view === "initial" && (
        <>
          <div className="kora:flex kora:flex-col kora:items-center kora:gap-1">
            <h1 className="kora:text-title-5 kora:font-semibold">Magnolia</h1>
            <p className="kora:text-body-sm kora:font-medium kora:text-neutral-700">
              Kora HQ Developer
            </p>
          </div>
          <p className="kora:text-center kora:text-body-sm kora:text-neutral-600">
            This is a test link
          </p>
        </>
      )}
      <div className="kora:flex kora:gap-2">
        <Card className="kora:w-xs kora:gap-12 kora:bg-white">
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
          <Button size="icon-sm" variant="neutral-lighter" className="kora:p-1">
            <XIcon />
          </Button>
        )}
      </div>
    </div>
  );
}
