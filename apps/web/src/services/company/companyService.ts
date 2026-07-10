import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import type { Company } from "../../types/Company";

const COMPANY_ID = "hirehuub";

export async function getCompany(): Promise<Company | null> {
  const docRef = doc(db, "company", COMPANY_ID);

  const snapshot = await getDoc(docRef);

  console.log("Exists:", snapshot.exists());
  console.log("Data:", snapshot.data());

  if (!snapshot.exists()) {
    return null;
  }

  return snapshot.data() as Company;
}

export async function updateCompany(
  company: Company
): Promise<void> {
  const docRef = doc(db, "company", COMPANY_ID);

  await setDoc(docRef, company, {
    merge: true,
  });
}

export async function createCompany(
  company: Company
): Promise<void> {
  const docRef = doc(db, "company", COMPANY_ID);

  await setDoc(docRef, company);
}