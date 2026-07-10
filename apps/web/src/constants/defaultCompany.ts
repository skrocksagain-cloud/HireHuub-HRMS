import type { Company } from "../types/Company";

export const DEFAULT_COMPANY: Company = {
  companyName: "",
  shortName: "",
  legalName: "",

  gstin: "",
  pan: "",
  cin: "",

  email: "",
  phone: "",
  website: "",

  address: "",
  city: "",
  state: "",
  pinCode: "",
  country: "India",

  employeePrefix: "HH",
  currentEmployeeNumber: 14,

  probationDays: 180,
  noticePeriod: 30,

  defaultGST: 18,
  currency: "INR",

  logoUrl: "",
  stampUrl: "",
  signatureUrl: "",
};