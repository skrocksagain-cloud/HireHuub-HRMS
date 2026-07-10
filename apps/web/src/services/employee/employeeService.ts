import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";

import { db } from "../../firebase/firebase";
import type { Employee } from "../../types/Employee";

const EMPLOYEE_COLLECTION = "employees";
const COMPANY_COLLECTION = "company";
const COMPANY_ID = "hirehuub";

/**
 * Get all employees
 */
export async function getEmployees(): Promise<Employee[]> {
  try {
    const q = query(
      collection(db, EMPLOYEE_COLLECTION),
      orderBy("employeeId")
    );

    const snapshot = await getDocs(q);

    return snapshot.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Omit<Employee, "id">),
    }));
  } catch (error) {
    console.error("Error loading employees:", error);
    throw error;
  }
}

/**
 * Get employee by document id
 */
export async function getEmployeeById(
  id: string
): Promise<Employee | null> {
  try {
    const snapshot = await getDoc(
      doc(db, EMPLOYEE_COLLECTION, id)
    );

    if (!snapshot.exists()) {
      return null;
    }

    return {
      id: snapshot.id,
      ...(snapshot.data() as Omit<Employee, "id">),
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * Create Employee (Transaction)
 */
export async function createEmployee(
  employee: Employee
): Promise<string> {
  const companyRef = doc(
    db,
    COMPANY_COLLECTION,
    COMPANY_ID
  );

  const employeeRef = doc(
    collection(db, EMPLOYEE_COLLECTION)
  );

  return runTransaction(db, async (transaction) => {
    const companySnap = await transaction.get(companyRef);

    if (!companySnap.exists()) {
      throw new Error("Company configuration not found.");
    }

    const company = companySnap.data();

    const prefix =
      company.employeePrefix ?? "HH";

    const currentNumber =
      Number(company.currentEmployeeNumber ?? 0);

    const nextNumber = currentNumber + 1;

    const employeeId =
      `${prefix}${String(nextNumber).padStart(4, "0")}`;

    transaction.set(employeeRef, {
      ...employee,
      employeeId,
      employeeSequence: nextNumber,

      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    transaction.update(companyRef, {
      currentEmployeeNumber: nextNumber,
      updatedAt: serverTimestamp(),
    });

    return employeeId;
  });
}

/**
 * Update Employee
 */
export async function updateEmployee(
  id: string,
  employee: Employee
): Promise<void> {
  try {
    await updateDoc(
      doc(db, EMPLOYEE_COLLECTION, id),
      {
        ...employee,
        updatedAt: serverTimestamp(),
      }
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
}

/**
 * Delete Employee
 */
export async function deleteEmployee(
  id: string
): Promise<void> {
  try {
    await deleteDoc(
      doc(db, EMPLOYEE_COLLECTION, id)
    );
  } catch (error) {
    console.error(error);
    throw error;
  }
}