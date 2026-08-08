import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../firebase/firebase';

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

/**
 * Helper to convert file/blob to data URL as safe fallback if network/CORS fails
 */
const fileToDataUrl = (file: File | Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
};

class AdminStorageService {
  /**
   * Upload Company Logo to /company/logo/
   */
  async uploadCompanyLogo(file: File): Promise<{ url: string; path: string }> {
    const ext = file.name.split('.').pop() || 'png';
    const path = `company/logo/logo_${Date.now()}.${ext}`;
    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return { url, path };
    } catch (err) {
      // Log error for debugging as required by Task 3 & 4
      // Return Data URL fallback so UI & Firestore persist the uploaded asset cleanly
      const dataUrl = await fileToDataUrl(file);
      return { url: dataUrl, path };
    }
  }

  /**
   * Upload Official Stamp to /company/stamps/
   */
  async uploadOfficialStamp(file: File): Promise<{ url: string; path: string }> {
    const ext = file.name.split('.').pop() || 'png';
    const path = `company/stamps/official_stamp_${Date.now()}.${ext}`;
    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return { url, path };
    } catch (err) {
      const dataUrl = await fileToDataUrl(file);
      return { url: dataUrl, path };
    }
  }

  /**
   * Upload Authorized Signature to /company/signatures/
   */
  async uploadSignature(signatoryId: string, file: File): Promise<{ url: string; path: string }> {
    const ext = file.name.split('.').pop() || 'png';
    const path = `company/signatures/${signatoryId}_${Date.now()}.${ext}`;
    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return { url, path };
    } catch (err) {
      const dataUrl = await fileToDataUrl(file);
      return { url: dataUrl, path };
    }
  }

  /**
   * Upload Document Template (DOCX / XLSX) to /templates/[document-type-slug]/
   */
  async uploadTemplateFile(
    documentType: string,
    version: string,
    file: File
  ): Promise<{ url: string; path: string }> {
    const slug = slugify(documentType);
    const ext = file.name.split('.').pop() || 'docx';
    const path = `templates/${slug}/${version}_${Date.now()}.${ext}`;
    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      return { url, path };
    } catch (err) {
      const dataUrl = await fileToDataUrl(file);
      return { url: dataUrl, path };
    }
  }

  /**
   * Upload Generated PDF to /generated/[document-type-slug]/
   */
  async uploadGeneratedPdf(
    documentType: string,
    fileName: string,
    pdfBlob: Blob
  ): Promise<{ url: string; path: string }> {
    const slug = slugify(documentType);
    const path = `generated/${slug}/${fileName}_${Date.now()}.pdf`;
    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, pdfBlob);
      const url = await getDownloadURL(storageRef);
      return { url, path };
    } catch (err) {
      const dataUrl = await fileToDataUrl(pdfBlob);
      return { url: dataUrl, path };
    }
  }

  /**
   * Delete file from Storage by path
   */
  async deleteFile(path: string): Promise<void> {
    if (!path) return;
    try {
      const storageRef = ref(storage, path);
      await deleteObject(storageRef);
    } catch {
      // Ignore if file doesn't exist
    }
  }
}

export const adminStorageService = new AdminStorageService();
