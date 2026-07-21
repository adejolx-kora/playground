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
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TypographyBody,
  TypographyLabel,
  TypographyTitle,
} from "@korapay/react";
import {
  FileUploadDescription,
  FileUploadDropzone,
  FileUploadInput,
  FileUploadLabel,
  FileUploadRoot,
  FileUploadStatus,
  useFileUpload,
} from "@korapay/react/file-upload";
import { Field, FieldError, FieldGroup } from "@korapay/react/molecules";
import {
  ArrowCircleUpIcon,
  FileIcon,
  InfoIcon,
  PlusIcon,
  WarningIcon,
} from "@phosphor-icons/react";
import { useState, type ReactNode } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";

import { MultiStepNext, MultiStepPanel } from "@/ui/multistep/multistep";

import type { SignupValues } from "./onboarding-config";

const MAX_DOCUMENT_SIZE = 20 * 1024 * 1024;
const acceptedDocumentTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/png",
];

const documentTypeItems = [
  { label: "National ID", value: "national-id" },
  { label: "Driver's licence", value: "drivers-licence" },
  { label: "International passport", value: "international-passport" },
  { label: "Voter's card", value: "voters-card" },
];

type DocumentFieldName =
  | "identityDocument"
  | "proofOfAddress"
  | "additionalDocuments";

type DocumentUploadFieldProps = {
  description?: ReactNode;
  form: UseFormReturn<SignupValues>;
  hideLabel?: boolean;
  label: string;
  name: DocumentFieldName;
  required?: boolean;
};

function DocumentUploadField({
  description,
  form,
  hideLabel = false,
  label,
  name,
  required = false,
}: DocumentUploadFieldProps) {
  const error = form.formState.errors[name];

  return (
    <Controller
      control={form.control}
      name={name}
      rules={
        required
          ? {
              validate: (files) =>
                files.length > 0 || `Upload ${label.toLowerCase()}.`,
            }
          : undefined
      }
      render={({ field }) => (
        <DocumentFileUpload
          id={`signup-${name}`}
          files={field.value}
          hideLabel={hideLabel}
          label={label}
          description={description}
          invalid={Boolean(error)}
          onFilesChange={field.onChange}
        >
          <FieldError>{error?.message}</FieldError>
        </DocumentFileUpload>
      )}
    />
  );
}

type DocumentFileUploadProps = {
  children?: ReactNode;
  description?: ReactNode;
  files: File[];
  hideLabel: boolean;
  id: string;
  invalid: boolean;
  label: string;
  onFilesChange: (files: File[]) => void;
};

function DocumentFileUpload({
  children,
  description,
  files,
  hideLabel,
  id,
  invalid,
  label,
  onFilesChange,
}: DocumentFileUploadProps) {
  const upload = useFileUpload({
    id,
    files,
    multiple: false,
    maxFileSize: MAX_DOCUMENT_SIZE,
    fileTypes: acceptedDocumentTypes,
    onFilesChange,
    "aria-invalid": invalid,
  });
  const file = upload.files[0];

  return (
    <FileUploadRoot upload={upload} className="kora:gap-2">
      {hideLabel ? (
        <FileUploadLabel className="kora:sr-only">{label}</FileUploadLabel>
      ) : (
        <div className="kora:flex kora:items-center kora:gap-1.5">
          <FileUploadLabel>{label}</FileUploadLabel>
          <Tooltip>
            <TooltipTrigger
              type="button"
              aria-label={`${label} upload information`}
              className="kora:rounded-full"
            >
              <InfoIcon weight="fill" color="#aabdce" size={18} aria-hidden />
            </TooltipTrigger>
            <TooltipContent>
              Upload one PDF, DOCX, or PNG file up to 20 MB.
            </TooltipContent>
          </Tooltip>
        </div>
      )}
      <FileUploadInput />
      <FileUploadDropzone className="kora:flex kora:min-h-14 kora:items-center kora:justify-between kora:gap-4 kora:border-0 kora:bg-surface-neutral-subtle kora:px-4 kora:py-3 kora:text-left">
        <span className="kora:flex kora:min-w-0 kora:items-center kora:gap-2 kora:text-label-md kora:text-content-default-secondary">
          <FileIcon
            weight="fill"
            className="kora:size-5 kora:shrink-0"
            aria-hidden
          />
          <span className="kora:truncate">{file?.name ?? label}</span>
        </span>
        <span className="kora:flex kora:shrink-0 kora:items-center kora:gap-1.5 kora:text-label-md kora:text-content-brand-primary">
          {file ? "Replace" : "Upload"}
          <ArrowCircleUpIcon
            weight="fill"
            className="kora:size-5"
            aria-hidden
          />
        </span>
      </FileUploadDropzone>
      {description ? (
        <FileUploadDescription>{description}</FileUploadDescription>
      ) : null}
      <FileUploadStatus className="kora:sr-only" />
      {children}
    </FileUploadRoot>
  );
}

type DocumentsStepProps = {
  form: UseFormReturn<SignupValues>;
};

export function DocumentsStep({ form }: DocumentsStepProps) {
  const [showAdditionalDocument, setShowAdditionalDocument] = useState(false);
  const { errors } = form.formState;

  return (
    <MultiStepPanel stepId="documents">
      <Card className="kora:gap-0 kora:overflow-visible kora:py-0 kora:ring-0">
        <CardHeader className="kora:p-0">
          <TypographyTitle level={5} className="kora:font-semibold">
            Upload verification documents
          </TypographyTitle>
          <TypographyBody
            size="md"
            className="kora:mt-2 kora:max-w-md kora:leading-relaxed kora:text-content-default-secondary"
          >
            For verification, you&apos;ll need to upload the documents indicated
            below, based on your type of business. Only .pdf, .docx, and .png
            files are allowed (max size 20MB each).
          </TypographyBody>
        </CardHeader>

        <CardContent className="kora:mt-6 kora:p-0">
          <FieldGroup className="kora:gap-5">
            <Field
              data-invalid={Boolean(
                errors.identityDocumentType ||
                errors.identityRegistrationNumber ||
                errors.identityDocument,
              )}
            >
              <div className="kora:flex kora:items-center kora:gap-1.5">
                <TypographyLabel>Valid ID</TypographyLabel>
                <Tooltip>
                  <TooltipTrigger type="button" className="kora:rounded-full">
                    <InfoIcon
                      weight="fill"
                      color="#aabdce"
                      size={18}
                      aria-hidden
                    />
                  </TooltipTrigger>
                  <TooltipContent>
                    Upload one PDF, DOCX, or PNG file up to 20 MB.
                  </TooltipContent>
                </Tooltip>
              </div>
              <FieldGroup className="kora:grid kora:grid-cols-1 kora:gap-3 kora:sm:grid-cols-[2fr_3fr]">
                <Controller
                  control={form.control}
                  name="identityDocumentType"
                  rules={{ required: "Select your document type." }}
                  render={({ field }) => (
                    <Select
                      items={documentTypeItems}
                      value={field.value}
                      onValueChange={(value) => field.onChange(value ?? "")}
                    >
                      <SelectTrigger
                        aria-label="Valid ID document type"
                        className="kora:h-14 kora:w-full"
                        aria-invalid={Boolean(errors.identityDocumentType)}
                      >
                        <SelectValue placeholder="Document Type" />
                      </SelectTrigger>
                      <SelectContent>
                        {documentTypeItems.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                <Input
                  className="kora:h-14"
                  aria-label="ID registration number"
                  placeholder="Enter ID registration number"
                  aria-invalid={Boolean(errors.identityRegistrationNumber)}
                  {...form.register("identityRegistrationNumber", {
                    required: "Enter your ID registration number.",
                  })}
                />
              </FieldGroup>
              <FieldError>
                {errors.identityDocumentType?.message ??
                  errors.identityRegistrationNumber?.message}
              </FieldError>
              <DocumentUploadField
                form={form}
                name="identityDocument"
                label="Valid ID"
                hideLabel
                required
              />
            </Field>

            <DocumentUploadField
              form={form}
              name="proofOfAddress"
              label="Proof of Address"
              required
              description={
                <span className="kora:flex kora:items-start kora:gap-2 kora:text-body-sm kora:text-content-default-secondary">
                  <WarningIcon
                    className="kora:mt-0.5 kora:size-4 kora:shrink-0 kora:text-content-warning-primary"
                    aria-hidden
                  />
                  <span>
                    Utility bill presented must not exceed{" "}
                    <strong>3 months</strong> prior to submission date.
                  </span>
                </span>
              }
            />

            {showAdditionalDocument ? (
              <DocumentUploadField
                form={form}
                name="additionalDocuments"
                label="Additional Document"
              />
            ) : (
              <Button
                type="button"
                variant="neutral-ghost"
                className="kora:w-fit kora:gap-2 kora:px-0 kora:text-content-brand-primary kora:hover:bg-transparent"
                onClick={() => setShowAdditionalDocument(true)}
              >
                <PlusIcon className="kora:size-5" aria-hidden />
                Add another document
                {/* <InfoIcon weight="fill" color="#aabdce" size={18} aria-hidden /> */}
              </Button>
            )}
          </FieldGroup>

          <MultiStepNext size="xl" className="kora:mt-7 kora:w-full">
            Continue
          </MultiStepNext>
        </CardContent>
      </Card>
    </MultiStepPanel>
  );
}
