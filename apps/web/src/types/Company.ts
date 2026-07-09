export interface Company {
  companyName: string;
  shortName: string;
  legalName: string;

  gstin: string;
  pan: string;
  cin: string;

  email: string;
  phone: string;
  website: string;

  address: string;
  city: string;
  state: string;
  pinCode: string;
  country: string;

  employeePrefix: string;
  currentEmployeeNumber: number;

  probationDays: number;
  noticePeriod: number;

  defaultGST: number;
  currency: string;

  logoUrl?: string;
  stampUrl?: string;
  signatureUrl?: string;
}