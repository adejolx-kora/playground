import {
  Button,
  Input,
  Separator,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from "@korapay/react";
import { StatusBadge } from "@korapay/react/atoms";
import { FileUpload } from "@korapay/react/file-upload";
import {
  Copy,
  CopyFeedback,
  CopyIcon,
  CopyTrigger,
  DataList,
  DataListItem,
  DataListLabel,
  DataListValue,
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@korapay/react/molecules";
import {
  ArrowBendUpRightIcon,
  ArrowLeftIcon,
  CheckIcon,
} from "@phosphor-icons/react";
import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Controller, useForm, useWatch, type FieldPath } from "react-hook-form";

import { createTriggerAdapter } from "@/lib/multistep-adapters";
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
  MultiStepModalStep,
  MultiStepModalSubmit,
  MultiStepModalTitle,
} from "@/ui/multistep-modal";

// eslint-disable-next-line react-refresh/only-export-components
export const Route = createFileRoute("/flow/escalate-chargeback")({
  component: EscalateChargebackFlow,
});

type EscalationValues = {
  amount: string;
  category: string;
  description: string;
  documents: File[];
};

type EscalationStepId = "details" | "confirm";

type EscalationStepMeta = {
  label: string;
  fields: readonly FieldPath<EscalationValues>[];
};

const initialValues: EscalationValues = {
  amount: "",
  category: "",
  description: "",
  documents: [],
};

const detailsStepMeta = {
  label: "Details",
  fields: ["amount", "category", "description"],
} satisfies EscalationStepMeta;

const confirmStepMeta = {
  label: "Confirm",
  fields: [],
} satisfies EscalationStepMeta;

const escalationSteps = [
  { id: "details", meta: detailsStepMeta },
  { id: "confirm", meta: confirmStepMeta },
] as const;

const chargebackCategories = [
  { value: "fraud", label: "Fraud" },
  { value: "customer-dispute", label: "Customer dispute" },
  {
    value: "processing-error",
    label: "Processing error dispute",
  },
  {
    value: "authorization-dispute",
    label: "Authorization dispute (invalid card, blocked card)",
  },
] as const;

const MIN_CHARGEBACK_AMOUNT = 10;
const MAX_CHARGEBACK_AMOUNT = 1230;
const MAX_CHARGEBACK_FILE_SIZE = 20 * 1024 * 1024;
const acceptedChargebackFileTypes = ["application/pdf"];

type ChargebackDocumentUploadProps = {
  files: File[];
  invalid?: boolean;
  onFilesChange: (files: File[]) => void;
};

function ChargebackDocumentUpload({
  files,
  invalid,
  onFilesChange,
}: ChargebackDocumentUploadProps) {
  return (
    <FileUpload
      id="chargeback-documents"
      label=""
      aria-label="Chargeback supporting documents"
      files={files}
      multiple={false}
      maxFileSize={MAX_CHARGEBACK_FILE_SIZE}
      fileTypes={acceptedChargebackFileTypes}
      onFilesChange={onFilesChange}
      aria-invalid={invalid}
      className="kora:gap-2"
    />
  );
}

function CaseSummary({ onEscalate }: { onEscalate: () => void }) {
  return (
    <section
      aria-labelledby="transaction-amount"
      className="kora:w-full kora:text-content-default-secondary"
    >
      <Button
        type="button"
        variant="primary-ghost"
        className="kora:-ml-2 kora:px-2"
        onClick={() => window.history.back()}
      >
        <ArrowLeftIcon aria-hidden />
        Go Back
      </Button>

      <div className="kora:mt-16 kora:flex kora:flex-col kora:gap-4 kora:md:flex-row kora:md:items-center">
        <div className="kora:flex kora:flex-wrap kora:items-center kora:gap-4">
          <h1
            id="transaction-amount"
            className="kora:text-title-5 kora:font-semibold kora:text-content-default-primary"
          >
            5,000.50{" "}
            <span className="kora:text-body-sm kora:font-semibold kora:text-content-default-tertiary">
              USD
            </span>
          </h1>
          <StatusBadge appearance="light" status="success" size="lg">
            Transaction Successful
          </StatusBadge>
        </div>

        <Button
          type="button"
          variant="neutral-lighter"
          className="kora:md:ml-auto"
          aria-label="Escalate chargeback"
          onClick={onEscalate}
        >
          Escalate...
          <ArrowBendUpRightIcon aria-hidden />
        </Button>
      </div>

      <Separator className="kora:mt-4" />

      <DataList
        orientation="horizontal"
        aria-label="Transaction details"
        className="kora:py-7 kora:xl:grid-cols-[0.85fr_0.8fr_1.3fr_1.15fr_1.25fr]"
      >
        <DataListItem className="kora:pb-4 kora:sm:pr-6 kora:xl:pb-0">
          <DataListLabel className="kora:text-body-sm kora:font-normal kora:tracking-normal kora:text-content-default-secondary kora:normal-case">
            Net Amount
          </DataListLabel>
          <DataListValue className="kora:mt-2 kora:text-body-sm kora:font-semibold">
            5,000.00 USD
          </DataListValue>
        </DataListItem>
        <DataListItem className="kora:py-4 kora:xl:py-0">
          <DataListLabel className="kora:text-body-sm kora:font-normal kora:tracking-normal kora:text-content-default-secondary kora:normal-case">
            Fee
          </DataListLabel>
          <DataListValue className="kora:mt-2 kora:text-body-sm kora:font-semibold">
            0.00 USD
          </DataListValue>
        </DataListItem>
        <DataListItem className="kora:py-4 kora:xl:py-0">
          <DataListLabel className="kora:text-body-sm kora:font-normal kora:tracking-normal kora:text-content-default-secondary kora:normal-case">
            Date / Time
          </DataListLabel>
          <DataListValue className="kora:mt-2 kora:text-body-sm kora:font-semibold">
            Oct 23, 2022, 08:47 AM
          </DataListValue>
        </DataListItem>
        <DataListItem className="kora:py-4 kora:xl:py-0">
          <DataListLabel className="kora:text-body-sm kora:font-normal kora:tracking-normal kora:text-content-default-secondary kora:normal-case">
            Customer Name
          </DataListLabel>
          <DataListValue className="kora:mt-2 kora:text-body-sm kora:font-semibold">
            Oluwadamilola Osei
          </DataListValue>
        </DataListItem>
        <DataListItem className="kora:pt-4 kora:xl:border-l! kora:xl:pt-0 kora:xl:pl-6!">
          <DataListLabel className="kora:text-body-sm kora:font-normal kora:tracking-normal kora:text-content-default-secondary kora:normal-case">
            Transaction ID
          </DataListLabel>
          <DataListValue className="kora:mt-2 kora:flex kora:items-center kora:gap-2 kora:text-body-sm kora:font-semibold kora:whitespace-nowrap">
            <span>KPY-PAY-B5YGB4W5OG45UG7</span>
            <Copy value="KPY-PAY-B5YGB4W5OG45UG7">
              <CopyTrigger
                aria-label="Copy transaction ID"
                className="kora:shrink-0 kora:text-content-default-tertiary"
              >
                <CopyIcon />
                <CopyFeedback />
              </CopyTrigger>
            </Copy>
          </DataListValue>
        </DataListItem>
      </DataList>
    </section>
  );
}

export function EscalateChargebackFlow() {
  const [open, setOpen] = useState(false);
  const [session, setSession] = useState(0);
  const form = useForm<EscalationValues>({
    defaultValues: initialValues,
    mode: "onTouched",
  });
  const {
    control,
    formState: { errors },
    getValues,
    handleSubmit,
    register,
    reset,
    setValue,
    trigger,
  } = form;
  const values = useWatch({ control });

  const adapter = useMemo(
    () =>
      createTriggerAdapter<
        EscalationStepId,
        EscalationValues,
        FieldPath<EscalationValues>,
        EscalationStepMeta
      >({
        getValues,
        trigger,
        reset,
        invalidReason: "Complete the required fields before continuing.",
      }),
    [getValues, reset, trigger],
  );

  const handleOpenChange = (nextOpen: boolean) => {
    setOpen(nextOpen);

    if (!nextOpen) {
      reset(initialValues);
      setSession((currentSession) => currentSession + 1);
    }
  };

  return (
    <main className="kora:min-h-full kora:w-full kora:bg-surface-primary kora:px-8 kora:py-6">
      <CaseSummary onEscalate={() => setOpen(true)} />

      <MultiStepModal<EscalationStepId, EscalationValues, EscalationStepMeta>
        key={session}
        steps={escalationSteps}
        adapter={adapter}
        dialogProps={{ open, onOpenChange: handleOpenChange }}
        className="kora:sm:max-w-xl kora:sm:data-[current-step=confirm]:max-w-sm"
      >
        <MultiStepModalStep stepId="details">
          <MultiStepModalHeader className="kora:border-b kora:border-stroke-default-secondary">
            <MultiStepModalTitle className="kora:text-title-5">
              Escalate Chargeback
            </MultiStepModalTitle>
            <MultiStepModalDescription className="kora:mt-3 kora:max-w-2xl kora:text-body-sm">
              Fill in the details below to declare a dispute on this
              transaction. A transaction can only be escalated within 120 days
              after it was initiated.
            </MultiStepModalDescription>
          </MultiStepModalHeader>

          <MultiStepModalBody>
            <FieldGroup className="kora:gap-8">
              <Field data-invalid={Boolean(errors.amount)}>
                <FieldLabel
                  htmlFor="chargeback-amount"
                  className="kora:text-label-sm"
                >
                  Chargeback Amount (USD)
                </FieldLabel>
                <Input
                  id="chargeback-amount"
                  className="kora:h-14 kora:text-body-sm"
                  inputMode="decimal"
                  placeholder="Enter chargeback amount"
                  aria-invalid={Boolean(errors.amount)}
                  {...register("amount", {
                    required: "Enter the chargeback amount.",
                    validate: (value) => {
                      const amount = Number(value);

                      if (!Number.isFinite(amount)) {
                        return "Enter a valid chargeback amount.";
                      }

                      if (amount < MIN_CHARGEBACK_AMOUNT) {
                        return "Enter at least USD 10.00.";
                      }

                      if (amount > MAX_CHARGEBACK_AMOUNT) {
                        return "Enter no more than USD 1,230.00.";
                      }

                      return true;
                    },
                  })}
                />
                <div className="kora:flex kora:flex-col kora:gap-1 kora:text-body-sm kora:text-content-default-secondary kora:sm:flex-row kora:sm:items-center kora:sm:justify-between">
                  <span>
                    Minimum Amount:{" "}
                    <strong className="kora:font-semibold">USD 10.00</strong>
                  </span>
                  <span>
                    Maximum Amount:{" "}
                    <strong className="kora:font-semibold">USD 1,230.00</strong>
                  </span>
                </div>
                <FieldError>{errors.amount?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.category)}>
                <FieldLabel
                  htmlFor="chargeback-category"
                  className="kora:text-label-sm"
                >
                  Chargeback Category
                </FieldLabel>
                <Controller
                  control={control}
                  name="category"
                  rules={{
                    required: "Select a chargeback category.",
                  }}
                  render={({ field }) => (
                    <Select
                      items={chargebackCategories}
                      value={field.value}
                      onValueChange={(value) => field.onChange(value ?? "")}
                    >
                      <SelectTrigger
                        id="chargeback-category"
                        className="kora:h-14 kora:w-full kora:text-body-sm"
                        aria-invalid={Boolean(errors.category)}
                      >
                        <SelectValue placeholder="Select chargeback category" />
                      </SelectTrigger>
                      <SelectContent>
                        {chargebackCategories.map((category) => (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                            className="kora:whitespace-normal"
                          >
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <FieldError>{errors.category?.message}</FieldError>
              </Field>

              <Field data-invalid={Boolean(errors.description)}>
                <FieldLabel
                  htmlFor="chargeback-description"
                  className="kora:text-label-sm"
                >
                  Description
                </FieldLabel>
                <Textarea
                  id="chargeback-description"
                  className="kora:min-h-24 kora:text-body-sm"
                  placeholder="Please provide detailed description of purchase and explanation of dispute"
                  aria-invalid={Boolean(errors.description)}
                  {...register("description", {
                    required: "Add a dispute description.",
                    minLength: {
                      value: 20,
                      message: "Use at least 20 characters.",
                    },
                  })}
                />
                <FieldError>{errors.description?.message}</FieldError>
              </Field>

              <Field>
                <div>
                  <FieldLabel className="kora:text-label-sm">
                    Submit documents to validate this chargeback{" "}
                    <span className="kora:font-normal">(optional)</span>
                  </FieldLabel>
                  <p className="kora:mt-5 kora:text-body-sm kora:text-content-default-tertiary">
                    Add all supporting documents in one pdf file. preferably in
                    A4 size for best result. After submitting, you will not be
                    able to make anymore changes .
                  </p>
                </div>
                <ChargebackDocumentUpload
                  files={values.documents ?? []}
                  onFilesChange={(files) => {
                    setValue("documents", files, {
                      shouldDirty: true,
                      shouldTouch: true,
                    });
                  }}
                />
              </Field>
            </FieldGroup>
          </MultiStepModalBody>
          <MultiStepModalFooter className="kora:gap-5 kora:border-t kora:border-stroke-default-secondary">
            <MultiStepModalClose
              variant="neutral-lighter"
              className="kora:w-32"
            >
              Back
            </MultiStepModalClose>
            <MultiStepModalNext className="kora:w-32">
              Submit
            </MultiStepModalNext>
          </MultiStepModalFooter>
        </MultiStepModalStep>

        <MultiStepModalStep
          stepId="confirm"
          render={<form onSubmit={handleSubmit(() => undefined)} noValidate />}
        >
          <MultiStepModalHeader>
            <MultiStepModalTitle className="kora:text-title-7">
              Escalate Chargeback
            </MultiStepModalTitle>
            <MultiStepModalDescription className="kora:mt-2 kora:text-body-sm">
              Are you sure you want to declare a dispute on this transaction?
              You will be charged a $20 processing fee for this chargeback.
            </MultiStepModalDescription>
          </MultiStepModalHeader>
          <MultiStepModalFooter
            align="none"
            className="kora:gap-3 kora:border-t kora:border-stroke-default-secondary kora:bg-surface-neutral-subtle"
          >
            <MultiStepModalPrevious
              variant="neutral-lighter"
              className="kora:flex-1"
            >
              Back
            </MultiStepModalPrevious>
            <MultiStepModalSubmit className="kora:flex-1">
              Yes, submit
            </MultiStepModalSubmit>
          </MultiStepModalFooter>
        </MultiStepModalStep>

        <MultiStepModalFeedback>
          <div className="kora:flex kora:flex-col kora:items-center kora:px-22.5 kora:py-md kora:text-center">
            <span className="kora:flex kora:size-16 kora:items-center kora:justify-center kora:rounded-full kora:bg-[#20b816] kora:text-content-inverse-primary">
              <CheckIcon size={32} weight="bold" aria-hidden />
            </span>
            <div>
              <MultiStepModalTitle className="kora:text-title-6 kora:mt-8">
                Chargeback Escalated
              </MultiStepModalTitle>
              <MultiStepModalDescription className="kora:mt-3 kora:text-body-sm">
                The chargeback has been escalated successfully.
              </MultiStepModalDescription>
            </div>
            <MultiStepModalClose
              variant="primary-ghost"
              className="kora:mt-8 kora:h-auto kora:p-1"
            >
              Dismiss
            </MultiStepModalClose>
          </div>
        </MultiStepModalFeedback>
      </MultiStepModal>
    </main>
  );
}
