import {
  deleteObject,
  getDownloadURL,
  ref,
  uploadBytes,
} from "firebase/storage";

import { storage } from "../../firebase/firebase";

export interface UploadFileResult {
  success: boolean;

  storagePath: string;

  downloadUrl: string;

  fileSize: number;

  mimeType: string;
}

/**
 * ============================================================
 * Upload File
 * ============================================================
 */
export async function uploadFile(
  file: Blob,
  storagePath: string
): Promise<UploadFileResult> {
  const storageRef = ref(
    storage,
    storagePath
  );

  const snapshot = await uploadBytes(
    storageRef,
    file
  );

  const downloadUrl =
    await getDownloadURL(storageRef);

  return {
    success: true,

    storagePath,

    downloadUrl,

    fileSize: snapshot.metadata.size,

    mimeType:
      snapshot.metadata.contentType ??
      "application/octet-stream",
  };
}

/**
 * ============================================================
 * Get Download URL
 * ============================================================
 */
export async function getFileDownloadUrl(
  storagePath: string
): Promise<string> {
  const storageRef = ref(
    storage,
    storagePath
  );

  return await getDownloadURL(
    storageRef
  );
}

/**
 * ============================================================
 * Delete File
 * ============================================================
 */
export async function deleteFile(
  storagePath: string
): Promise<void> {
  const storageRef = ref(
    storage,
    storagePath
  );

  await deleteObject(storageRef);
}

/**
 * ============================================================
 * Build Standard Storage Path
 * ============================================================
 *
 * Example:
 *
 * documents/offer/OFF000001/v1/OfferLetter.pdf
 *
 */
export function buildStoragePath(
  module: string,
  referenceId: string,
  fileName: string,
  version = 1
): string {
  return `documents/${module.toLowerCase()}/${referenceId}/v${version}/${fileName}`;
}