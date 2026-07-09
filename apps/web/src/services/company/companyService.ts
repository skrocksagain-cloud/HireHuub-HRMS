import { Company } from "../../types/Company";

export async function getCompany(): Promise<Company | null> {
  // TODO: Read company from Firestore
  return null;
}

export async function createCompany(
  company: Company
): Promise<void> {
  // TODO: Create company document
}

export async function updateCompany(
  company: Company
): Promise<void> {
  // TODO: Update company document
}