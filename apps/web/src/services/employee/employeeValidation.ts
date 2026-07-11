import {
  collection,
  getDocs,
  query,
  where,
  limit,
  } from "firebase/firestore";

import { db } from "../../firebase/firebase";

import type { Employee } from "../../types/Employee";

const employeeCollection = collection(db, "employees");

/**
 * Validate mandatory fields
 */
export function validateEmployee(employee: Employee): string[] {
  const errors: string[] = [];

  if (!employee.firstName.trim()) {
    errors.push("First Name is required.");
  }

  if (!employee.lastName.trim()) {
    errors.push("Last Name is required.");
  }

  if (!employee.officialEmail.trim()) {
    errors.push("Official Email is required.");
  }

  if (!employee.mobile.trim()) {
    errors.push("Mobile Number is required.");
  }

  if (!employee.departmentId.trim()) {
    errors.push("Department is required.");
  }

  if (!employee.designationId.trim()) {
    errors.push("Designation is required.");
  }

  if (!employee.roleId.trim()) {
    errors.push("Role is required.");
  }

  if (!employee.dateOfJoining.trim()) {
    errors.push("Date of Joining is required.");
  }

  if (!employee.employmentType) {
    errors.push("Employment Type is required.");
  }

  return errors;
}

/**
 * Check duplicate official email
 */
export async function isOfficialEmailExists(
  email: string,
  employeeDocId?: string
): Promise<boolean> {
  if (!email.trim()) return false;

  const q = query(
    employeeCollection,
    where("officialEmail", "==", email.trim()),
    limit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return false;

  if (
    employeeDocId &&
    snapshot.docs[0].id === employeeDocId
  ) {
    return false;
  }

  return true;
}

/**
 * Check duplicate mobile number
 */
export async function isMobileExists(
  mobile: string,
  employeeDocId?: string
): Promise<boolean> {
  if (!mobile.trim()) return false;

  const q = query(
    employeeCollection,
    where("mobile", "==", mobile.trim()),
    limit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return false;

  if (
    employeeDocId &&
    snapshot.docs[0].id === employeeDocId
  ) {
    return false;
  }

  return true;
}

/**
 * Check duplicate Aadhaar Number
 */
export async function isAadhaarExists(
  aadhaar: string,
  employeeDocId?: string
): Promise<boolean> {
  if (!aadhaar.trim()) return false;

  const q = query(
    employeeCollection,
    where("aadhaarNumber", "==", aadhaar.trim()),
    limit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return false;

  if (
    employeeDocId &&
    snapshot.docs[0].id === employeeDocId
  ) {
    return false;
  }

  return true;
}

/**
 * Check duplicate PAN Number
 */
export async function isPanExists(
  pan: string,
  employeeDocId?: string
): Promise<boolean> {
  if (!pan.trim()) return false;

  const q = query(
    employeeCollection,
    where("panNumber", "==", pan.trim().toUpperCase()),
    limit(1)
  );

  const snapshot = await getDocs(q);

  if (snapshot.empty) return false;

  if (
    employeeDocId &&
    snapshot.docs[0].id === employeeDocId
  ) {
    return false;
  }

  return true;
}

/**
 * Validate before save
 */
export async function validateEmployeeBeforeSave(
  employee: Employee,
  employeeDocId?: string
): Promise<string[]> {
  const errors = validateEmployee(employee);

  if (
    await isOfficialEmailExists(
      employee.officialEmail,
      employeeDocId
    )
  ) {
    errors.push("Official Email already exists.");
  }

  if (
    await isMobileExists(
      employee.mobile,
      employeeDocId
    )
  ) {
    errors.push("Mobile Number already exists.");
  }

  if (
    employee.aadhaarNumber &&
    (await isAadhaarExists(
      employee.aadhaarNumber,
      employeeDocId
    ))
  ) {
    errors.push("Aadhaar Number already exists.");
  }

  if (
    employee.panNumber &&
    (await isPanExists(
      employee.panNumber,
      employeeDocId
    ))
  ) {
    errors.push("PAN Number already exists.");
  }

  return errors;
}