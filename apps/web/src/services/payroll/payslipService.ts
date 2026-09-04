/* eslint-disable */
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { storageService } from '../document/storageService';
import type { GeneratedPayslipRecord } from '../../types/Admin';

const PAYSLIP_COLLECTION = 'generated_payslips';
const DOCUMENTS_COLLECTION = 'documents';

export interface PayslipDisplayItem {
  id: string;
  payrollRunId: string;
  employeeId: string;
  employeeName: string;
  month: string;
  fullMonthName: string;
  gross: number;
  deductions: number;
  netPay: number;
  status: string;
  generatedAt: string;
  storagePath: string;
}

const formatMonthName = (yearMonth: string): string => {
  if (!yearMonth || !yearMonth.includes('-')) return yearMonth;
  const [yearStr, monthStr] = yearMonth.split('-');
  const monthNum = parseInt(monthStr, 10);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const name = monthNames[monthNum - 1] || yearMonth;
  return `${name} ${yearStr}`;
};

class PayslipService {
  /**
   * Authoritatively resolves exact Storage path for a payslip record or reference.
   * Priority: 1. Direct storagePath on record -> 2. documents collection by referenceId = payslipId -> 3. documents collection by referenceId = employeeId + month tag.
  /**
   * Helper to normalize HTTPS download URLs or raw paths into canonical relative Storage paths.
   */
  normalizeStoragePath(rawPath?: string): string {
    if (!rawPath || !rawPath.trim()) return '';
    const clean = rawPath.trim();
    if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
      return clean;
    }
    if (clean.includes('/o/')) {
      try {
        const encoded = clean.split('/o/')[1].split('?')[0];
        return decodeURIComponent(encoded);
      } catch {
        return clean;
      }
    }
    return clean;
  }

  /**
   * Resolves storage path for a payslip record using direct path, documents collection, or fallback tags.
   */
  async resolvePayslipStoragePath(payslipId: string, directPath?: string, employeeId?: string, month?: string): Promise<string> {
    const normalizedDirect = this.normalizeStoragePath(directPath);
    if (normalizedDirect) return normalizedDirect;

    // Look up documents collection by referenceId = payslipId
    if (payslipId && payslipId.trim()) {
      try {
        const docsQuery = query(
          collection(db, DOCUMENTS_COLLECTION),
          where('referenceId', '==', payslipId.trim()),
          where('documentType', '==', 'Payslip')
        );
        const docsSnap = await getDocs(docsQuery);
        if (!docsSnap.empty) {
          const docData = docsSnap.docs[0].data();
          if (docData?.storagePath) return this.normalizeStoragePath(docData.storagePath);
        }
      } catch {
        // Fallthrough
      }
    }

    // Look up documents collection by document ID
    if (payslipId && payslipId.trim()) {
      try {
        const docSnap = await getDoc(doc(db, DOCUMENTS_COLLECTION, payslipId.trim()));
        if (docSnap.exists() && docSnap.data()?.storagePath) {
          return this.normalizeStoragePath(docSnap.data().storagePath);
        }
      } catch {
        // Fallthrough
      }
    }

    // Look up documents collection by employeeId & month tag
    if (employeeId && month) {
      try {
        const docsQuery = query(
          collection(db, DOCUMENTS_COLLECTION),
          where('referenceId', '==', employeeId.trim()),
          where('documentType', '==', 'Payslip')
        );
        const docsSnap = await getDocs(docsQuery);
        const matched = docsSnap.docs.find((d) => {
          const tags = d.data()?.tags || [];
          return tags.includes(month);
        });
        if (matched && matched.data()?.storagePath) {
          return this.normalizeStoragePath(matched.data().storagePath);
        }
      } catch {
        // Fallthrough
      }
    }

    return '';
  }

  /**
   * Fetches authoritative generated payslips for a given employee from Firestore.
   * Securely filtered by employeeId at the database query layer.
   */
  async getPayslipsForEmployee(employeeId: string): Promise<PayslipDisplayItem[]> {
    if (!employeeId || !employeeId.trim()) return [];

    try {
      // 1. Query generated_payslips collection
      const payslipsQuery = query(
        collection(db, PAYSLIP_COLLECTION),
        where('employeeId', '==', employeeId.trim())
      );
      const snapshot = await getDocs(payslipsQuery);

      // 2. Query documents collection for storagePath mapping
      const docsQuery = query(
        collection(db, DOCUMENTS_COLLECTION),
        where('documentType', '==', 'Payslip'),
        where('referenceId', '==', employeeId.trim())
      );
      const docsSnap = await getDocs(docsQuery).catch(() => ({ docs: [] } as any));
      const refPathMap = new Map<string, string>();
      docsSnap.docs.forEach((d: any) => {
        const data = d.data();
        if (data?.storagePath) {
          if (data.referenceId) refPathMap.set(data.referenceId, data.storagePath);
          if (d.id) refPathMap.set(d.id, data.storagePath);
          const tags = data.tags || [];
          const mTag = tags.find((t: string) => /^\d{4}-\d{2}$/.test(t));
          if (mTag && data.referenceId) {
            refPathMap.set(`${data.referenceId}_${mTag}`, data.storagePath);
          }
        }
      });

      const list: PayslipDisplayItem[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as GeneratedPayslipRecord & { documentId?: string };
        const calcRes = data.snapshot?.calculationResult;
        const gross = calcRes?.grossEarnings ?? (data.snapshot?.salaryStructureSnapshot?.monthlyCtc || data.netPay);
        const deductions = calcRes?.totalDeductions ?? Math.max(0, gross - data.netPay);
        const netPay = data.netPay;

        const resolvedPath =
          data.storagePath ||
          refPathMap.get(docSnap.id) ||
          refPathMap.get(data.documentId || '') ||
          refPathMap.get(`${data.employeeId}_${data.month}`) ||
          '';

        return {
          id: docSnap.id,
          payrollRunId: data.payrollRunId || '',
          employeeId: data.employeeId,
          employeeName: data.employeeName || 'Employee',
          month: data.month,
          fullMonthName: formatMonthName(data.month),
          gross,
          deductions,
          netPay,
          status: data.status || 'Generated',
          generatedAt: data.generatedAt ? data.generatedAt.split('T')[0] : '',
          storagePath: resolvedPath,
        };
      });

      // Sort by month descending
      return list.sort((a, b) => b.month.localeCompare(a.month));
    } catch {
      return [];
    }
  }

  /**
   * Fetches single generated payslip record by ID.
   */
  async getPayslipById(payslipId: string): Promise<PayslipDisplayItem | null> {
    if (!payslipId || !payslipId.trim()) return null;
    try {
      const docSnap = await getDoc(doc(db, PAYSLIP_COLLECTION, payslipId.trim()));
      let data: GeneratedPayslipRecord | null = null;
      let pId = payslipId.trim();

      if (docSnap.exists()) {
        data = docSnap.data() as GeneratedPayslipRecord;
      }

      if (!data) return null;

      const calcRes = data.snapshot?.calculationResult;
      const gross = calcRes?.grossEarnings ?? (data.snapshot?.salaryStructureSnapshot?.monthlyCtc || data.netPay);
      const deductions = calcRes?.totalDeductions ?? Math.max(0, gross - data.netPay);

      const resolvedPath = await this.resolvePayslipStoragePath(pId, data.storagePath, data.employeeId, data.month);

      return {
        id: pId,
        payrollRunId: data.payrollRunId || '',
        employeeId: data.employeeId,
        employeeName: data.employeeName || 'Employee',
        month: data.month,
        fullMonthName: formatMonthName(data.month),
        gross,
        deductions,
        netPay: data.netPay,
        status: data.status || 'Generated',
        generatedAt: data.generatedAt ? data.generatedAt.split('T')[0] : '',
        storagePath: resolvedPath,
      };
    } catch {
      return null;
    }
  }

  /**
   * Securely opens or triggers download of payslip PDF directly in browser via authenticated download URL.
   * Eliminates browser CORS restrictions by avoiding client-side fetch().
   */
  async openPayslipPDF(storagePath: string): Promise<void> {
    const cleanPath = this.normalizeStoragePath(storagePath);
    if (!cleanPath) {
      throw new Error('Payslip PDF is unavailable. Please contact HR.');
    }

    const exists = await storageService.exists(cleanPath);
    if (!exists) {
      throw new Error('Payslip PDF is unavailable. Please contact HR.');
    }

    const downloadUrl = await storageService.getDownloadUrl(cleanPath);
    if (!downloadUrl) {
      throw new Error('Payslip PDF is unavailable. Please contact HR.');
    }

    window.open(downloadUrl, '_blank', 'noopener,noreferrer');
  }

  /**
   * Securely opens/downloads payslip PDF directly using browser download URL.
   * Avoids CORS errors by avoiding client-side fetch() and blob conversion.
   */
  async downloadPayslipPDF(storagePath: string, fileName?: string): Promise<void> {
    const cleanPath = this.normalizeStoragePath(storagePath);
    if (!cleanPath) {
      throw new Error('Payslip PDF is unavailable. Please contact HR.');
    }

    try {
      const exists = await storageService.exists(cleanPath);
      if (!exists) {
        throw new Error('Payslip PDF is unavailable. Please contact HR.');
      }

      const downloadUrl = await storageService.getDownloadUrl(cleanPath);
      if (!downloadUrl) {
        throw new Error('Payslip PDF is unavailable. Please contact HR.');
      }

      const link = document.createElement('a');
      link.href = downloadUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      if (fileName) link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payslip PDF is unavailable. Please contact HR.';
      throw new Error(msg.includes('unavailable') ? msg : 'Payslip PDF is unavailable. Please contact HR.');
    }
  }
}

export const payslipService = new PayslipService();
