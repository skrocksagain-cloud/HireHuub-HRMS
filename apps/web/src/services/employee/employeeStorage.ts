import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { storage } from "../../firebase/firebase";

/**
 * Upload Employee Profile Photo
 */
export async function uploadEmployeePhoto(
  employeeId: string,
  file: File
): Promise<string> {
  const storageRef = ref(
    storage,
    `employees/${employeeId}/profile/photo`
  );

  await uploadBytes(storageRef, file);

  return await getDownloadURL(storageRef);
}

/**
 * Upload Employee Document
 *
 * documentType examples:
 * aadhaar
 * pan
 * resume
 * bank-proof
 * education
 * experience
 * offer-letter
 * joining-letter
 */
export async function uploadEmployeeDocument(
  employeeId: string,
  documentType: string,
  file: File
): Promise<string> {
  const extension =
    file.name.split(".").pop() ?? "";

  const storageRef = ref(
    storage,
    `employees/${employeeId}/documents/${documentType}.${extension}`
  );

  await uploadBytes(storageRef, file);

  return await getDownloadURL(storageRef);
}

/**
 * Delete Employee Photo
 */
export async function deleteEmployeePhoto(
  employeeId: string
): Promise<void> {
  const storageRef = ref(
    storage,
    `employees/${employeeId}/profile/photo`
  );

  await deleteObject(storageRef);
}

/**
 * Delete Employee Document
 */
export async function deleteEmployeeDocument(
  employeeId: string,
  documentType: string,
  extension: string
): Promise<void> {
  const storageRef = ref(
    storage,
    `employees/${employeeId}/documents/${documentType}.${extension}`
  );

  await deleteObject(storageRef);
}

/**
 * Get Employee Photo URL
 */
export async function getEmployeePhotoUrl(
  employeeId: string
): Promise<string> {
  const storageRef = ref(
    storage,
    `employees/${employeeId}/profile/photo`
  );

  return await getDownloadURL(storageRef);
}

/**
 * Get Employee Document URL
 */
export async function getEmployeeDocumentUrl(
  employeeId: string,
  documentType: string,
  extension: string
): Promise<string> {
  const storageRef = ref(
    storage,
    `employees/${employeeId}/documents/${documentType}.${extension}`
  );

  return await getDownloadURL(storageRef);
}