import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  deleteDoc,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '../../../../firebase/firebase';
import type { InvoiceTemplate, InvoiceTemplateInput } from '../../../../types/InvoiceTemplate';

const COLLECTION_NAME = 'invoice_templates';

export class InvoiceTemplateRepository {
  async getTemplates(): Promise<InvoiceTemplate[]> {
    try {
      const colRef = collection(db, COLLECTION_NAME);
      const q = query(colRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);
      const list: InvoiceTemplate[] = [];

      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        list.push({
          id: docSnap.id,
          templateId: data.templateId || docSnap.id,
          templateName: data.templateName || 'Invoice Template',
          companyName: data.companyName || 'Hire Huub',
          version: data.version || 1,
          uploadedAt: data.uploadedAt || data.createdAt || new Date().toISOString(),
          uploadedBy: data.uploadedBy || 'System',
          status: data.status || 'Active',
          fileUrl: data.fileUrl || '',
          storagePath: data.storagePath || '',
          fileName: data.fileName || 'template.xlsx',
          fileSize: data.fileSize || 0,
          mimeType: data.mimeType || 'application/octet-stream',
          remarks: data.remarks || '',
          createdAt: data.createdAt || Timestamp.now(),
          updatedAt: data.updatedAt || Timestamp.now(),
        });
      });

      return list;
    } catch {
      return [];
    }
  }

  async getTemplate(id: string): Promise<InvoiceTemplate | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, id);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) return null;
      const data = docSnap.data();
      return {
        id: docSnap.id,
        templateId: data.templateId || docSnap.id,
        templateName: data.templateName || 'Invoice Template',
        companyName: data.companyName || 'Hire Huub',
        version: data.version || 1,
        uploadedAt: data.uploadedAt || data.createdAt || new Date().toISOString(),
        uploadedBy: data.uploadedBy || 'System',
        status: data.status || 'Active',
        fileUrl: data.fileUrl || '',
        storagePath: data.storagePath || '',
        fileName: data.fileName || 'template.xlsx',
        fileSize: data.fileSize || 0,
        mimeType: data.mimeType || 'application/octet-stream',
        remarks: data.remarks || '',
        createdAt: data.createdAt || Timestamp.now(),
        updatedAt: data.updatedAt || Timestamp.now(),
      };
    } catch {
      return null;
    }
  }

  async saveTemplate(input: InvoiceTemplateInput): Promise<string> {
    const colRef = collection(db, COLLECTION_NAME);
    const newDocRef = doc(colRef);
    const now = Timestamp.now();
    const payload = {
      templateId: input.templateId,
      templateName: input.templateName,
      companyName: input.companyName,
      version: input.version || 1,
      uploadedAt: now.toDate().toISOString(),
      uploadedBy: input.uploadedBy,
      status: input.status || 'Active',
      fileUrl: input.fileUrl,
      storagePath: input.storagePath,
      fileName: input.fileName,
      fileSize: input.fileSize,
      mimeType: input.mimeType,
      remarks: input.remarks || '',
      createdAt: now,
      updatedAt: now,
    };
    await setDoc(newDocRef, payload);
    return newDocRef.id;
  }

  async updateTemplate(id: string, updates: Partial<InvoiceTemplate>): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    const payload = {
      ...updates,
      updatedAt: Timestamp.now(),
    };
    await updateDoc(docRef, payload);
  }

  async deleteTemplate(id: string): Promise<void> {
    const docRef = doc(db, COLLECTION_NAME, id);
    await deleteDoc(docRef);
  }
}

export const invoiceTemplateRepository = new InvoiceTemplateRepository();
