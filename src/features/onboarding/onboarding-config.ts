import type { FieldPath } from "react-hook-form";

export type SignupValues = {
  country: string;
  industry: string;
  businessType: string;
  dateOfBirth: Date | undefined;
  businessDescription: string;
  website: string;
  state: string;
  lga: string;
  address: string;
  landmark: string;
  identityDocumentType: string;
  identityRegistrationNumber: string;
  identityDocument: File[];
  proofOfAddress: File[];
  additionalDocuments: File[];
  settlementCurrency: string;
  accountNumber: string;
  bank: string;
  bvn: string;
  accountName: string;
};

export type SignupStepId =
  | "business-profile"
  | "business-information"
  | "documents"
  | "bank-details";

export type SignupStepMeta = {
  fields: readonly FieldPath<SignupValues>[];
};

export const signupSteps = [
  {
    id: "business-profile",
    meta: { fields: ["businessType"] },
  },
  {
    id: "business-information",
    meta: {
      fields: [
        "dateOfBirth",
        "businessDescription",
        "industry",
        "website",
        "country",
        "state",
        "lga",
        "address",
      ],
    },
  },
  {
    id: "documents",
    meta: {
      fields: [
        "identityDocumentType",
        "identityRegistrationNumber",
        "identityDocument",
        "proofOfAddress",
      ],
    },
  },
  {
    id: "bank-details",
    meta: {
      fields: ["settlementCurrency", "accountNumber", "bank", "bvn"],
    },
  },
] satisfies readonly {
  id: SignupStepId;
  meta: SignupStepMeta;
}[];

export const initialSignupValues: SignupValues = {
  country: "Nigeria",
  industry: "",
  businessType: "",
  dateOfBirth: undefined,
  businessDescription: "",
  website: "",
  state: "",
  lga: "",
  address: "",
  landmark: "",
  identityDocumentType: "",
  identityRegistrationNumber: "",
  identityDocument: [],
  proofOfAddress: [],
  additionalDocuments: [],
  settlementCurrency: "",
  accountNumber: "",
  bank: "",
  bvn: "",
  accountName: "",
};
