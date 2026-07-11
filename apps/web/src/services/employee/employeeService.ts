import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";

import type { Employee } from "../../types/Employee";

const COLLECTION_NAME = "employees";

const employeeCollection = collection(
  db,
  COLLECTION_NAME
);

/**
 * Get all employees
 */
export async function getEmployees(): Promise<Employee[]> {
  const q = query(
    employeeCollection,
    orderBy("employeeSequence", "asc")
  );

  const snapshot = await getDocs(q);

  return snapshot.docs.map((document) => ({
    id: document.id,
    ...(document.data() as Employee),
  }));
}

/**
 * Get single employee
 */
export async function getEmployee(
  id: string
): Promise<Employee | null> {
  const reference = doc(db, COLLECTION_NAME, id);

  const snapshot = await getDoc(reference);

  if (!snapshot.exists()) {
    return null;
  }

  return {
    id: snapshot.id,
    ...(snapshot.data() as Employee),
  };
}

/**
 * Create employee
 */
export async function createEmployee(
  employee: Employee
): Promise<string> {
  const document = await addDoc(
    employeeCollection,
    {
      ...employee,

      createdAt: serverTimestamp(),

      updatedAt: serverTimestamp(),
    }
  );

  return document.id;
}

/**
 * Update employee
 */
export async function updateEmployee(
  id: string,
  employee: Partial<Employee>
): Promise<void> {
  const reference = doc(
    db,
    COLLECTION_NAME,
    id
  );

  await updateDoc(reference, {
    ...employee,

    updatedAt: serverTimestamp(),
  });
}

/**
 * Soft delete employee
 */
export async function deactivateEmployee(
  id: string
): Promise<void> {
  const reference = doc(
    db,
    COLLECTION_NAME,
    id
  );

  await updateDoc(reference, {
    status: "Inactive",

    updatedAt: serverTimestamp(),
  });
}

/**
 * Permanently delete employee
 * (Admin Only)
 */
export async function deleteEmployee(
  id: string
): Promise<void> {
  const reference = doc(
    db,
    COLLECTION_NAME,
    id
  );

  await deleteDoc(reference);
}