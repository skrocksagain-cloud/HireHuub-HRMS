import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { storage } from '../../firebase/firebase';

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

class AdminStorageService {
  private async upload(path: string, file: File | Blob): Promise<{ url: string; path: string }> {
    const storageRef = ref(storage, path);
    await uploadBytes(storageRef, file);
    return { url: await getDownloadURL(storageRef), path };
  }

  /**
   * Upload Company Logo to /company/logo/
   */
  async uploadCompanyLogo(file: File): Promise<{ url: string; path: string }> {
    const ext = file.name.split('.').pop() || 'png';
    const path = `company/logo/logo_${Date.now()}.${ext}`;
    return this.upload(path, file);
  }

  /**
   * Upload Official Stamp to /company/stamps/
   */
  async uploadOfficialStamp(file: File): Promise<{ url: string; path: string }> {
    const ext = file.name.split('.').pop() || 'png';
    const path = `company/stamps/official_stamp_${Date.now()}.${ext}`;
    return this.upload(path, file);
  }



  /**
   * Upload Authorized Signature to /company/signatures/
   */
  async uploadSignature(signatoryId: string, file: File): Promise<{ url: string; path: string }> {
    const ext = file.name.split('.').pop() || 'png';
    const path = `company/signatures/${signatoryId}_${Date.now()}.${ext}`;
    return this.upload(path, file);
  }

  /**
   * Upload Generated Output File to /generated/[document-type-slug]/
   */
  async uploadGeneratedPdf(
    documentType: string,
    fileName: string,
    pdfBlob: Blob
  ): Promise<{ url: string; path: string }> {
    const slug = slugify(documentType);
    const path = `generated/${slug}/${fileName}_${Date.now()}.pdf`;
    return this.upload(path, pdfBlob);
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
