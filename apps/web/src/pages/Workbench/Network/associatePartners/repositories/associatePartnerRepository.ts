import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../../../../../firebase/firebase';
import type {
  AssociatePartner,
  CreateAssociatePartnerInput,
  AssociatePartnerCandidateSubmission,
  AssociatePartnerDashboardMetrics,
} from '../../../../../types/AssociatePartner';

const partnersCollection = collection(db, 'associate_partners');

const calculateMetrics = (submissions: AssociatePartnerCandidateSubmission[]): AssociatePartnerDashboardMetrics => {
  const totalSubmitted = submissions.length;
  const selected = submissions.filter((s) => s.status === 'Selected').length;
  const joined = submissions.filter((s) => s.status === 'Joined').length;
  const active = joined; // Joined candidates automatically become Active
  const eligible = submissions.filter((s) => s.eligibilityStatus === 'Eligible').length;

  return {
    totalSubmitted,
    selected,
    joined,
    active,
    eligible,
  };
};

export function formatPartnerCode(serial: number): string {
  return `HH/AP/${String(serial).padStart(6, '0')}`;
}

const partnerFromDoc = (id: string, value: Record<string, unknown>): AssociatePartner => {
  const rawSubmissions = Array.isArray(value.submissions) ? (value.submissions as AssociatePartnerCandidateSubmission[]) : [];
  // Strip obsolete billingStatus from submissions during document mapping
  const cleanedSubmissions = rawSubmissions.map((sub) => {
    const { billingStatus, ...rest } = sub as AssociatePartnerCandidateSubmission & { billingStatus?: unknown };
    return rest;
  });

  return {
    id,
    partnerCode: String(value.partnerCode ?? id),
    subVendorName: String(value.subVendorName ?? ''),
    name: String(value.name ?? value.subVendorName ?? ''),
    contactPerson: String(value.contactPerson ?? ''),
    email: String(value.email ?? ''),
    phone: String(value.phone ?? ''),
    city: String(value.city ?? ''),
    state: String(value.state ?? ''),
    status: (value.status as AssociatePartner['status']) || 'Active',
    type: (value.type as AssociatePartner['type']) || 'SME',
    reportingTo: typeof value.reportingTo === 'object' && value.reportingTo
      ? (value.reportingTo as AssociatePartner['reportingTo'])
      : { employeeId: '', employeeName: '' },
    bankDetails: typeof value.bankDetails === 'object' && value.bankDetails
      ? (value.bankDetails as AssociatePartner['bankDetails'])
      : { bankName: '', accountNumber: '', ifscCode: '' },
    pan: String(value.pan ?? ''),
    aadhaarOrTradeLicence: String(value.aadhaarOrTradeLicence ?? ''),
    submissions: cleanedSubmissions,
    metrics: calculateMetrics(cleanedSubmissions),
    createdAt: String(value.createdAt ?? ''),
    updatedAt: String(value.updatedAt ?? ''),
  };
};

class AssociatePartnerRepository {
  async getPartners(): Promise<AssociatePartner[]> {
    const snap = await getDocs(partnersCollection);
    return snap.docs.map((d) => partnerFromDoc(d.id, d.data()));
  }

  async getPartnerById(id: string): Promise<AssociatePartner | null> {
    const docRef = doc(db, 'associate_partners', id);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return partnerFromDoc(snap.id, snap.data());
  }

  async createPartner(input: CreateAssociatePartnerInput): Promise<AssociatePartner> {
    const now = new Date().toISOString();
    const emptySubmissions: AssociatePartnerCandidateSubmission[] = [];

    // Atomic / sequential partner code calculation: HH/AP/000001
    const snap = await getDocs(partnersCollection);
    let maxSerial = 0;
    snap.docs.forEach((d) => {
      const code = String(d.data().partnerCode ?? '');
      const match = code.match(/HH\/AP\/(\d+)/) || code.match(/AP-(\d+)/) || code.match(/(\d+)/);
      if (match) {
        const num = parseInt(match[1], 10);
        if (!isNaN(num) && num > maxSerial) maxSerial = num;
      }
    });

    const partnerCode = formatPartnerCode(maxSerial + 1);

    const payload = {
      partnerCode,
      subVendorName: input.subVendorName.trim(),
      name: input.subVendorName.trim(),
      contactPerson: input.contactPerson.trim(),
      email: input.email.trim(),
      phone: input.phone.trim(),
      city: input.city.trim(),
      state: input.state.trim(),
      type: input.type,
      status: 'Active',
      reportingTo: {
        employeeId: input.reportingToEmployeeId,
        employeeName: input.reportingToEmployeeName,
      },
      bankDetails: {
        bankName: input.bankName,
        accountNumber: input.accountNumber,
        ifscCode: input.ifscCode,
      },
      pan: input.pan.trim(),
      aadhaarOrTradeLicence: input.aadhaarOrTradeLicence.trim(),
      submissions: emptySubmissions,
      metrics: calculateMetrics(emptySubmissions),
      createdAt: now,
      updatedAt: now,
    };

    const docRef = await addDoc(partnersCollection, payload);
    const createdSnap = await getDoc(docRef);
    return partnerFromDoc(createdSnap.id, createdSnap.data() as Record<string, unknown>);
  }

  async updatePartner(id: string, updates: Partial<AssociatePartner>): Promise<AssociatePartner> {
    const docRef = doc(db, 'associate_partners', id);
    const currentSnap = await getDoc(docRef);
    if (!currentSnap.exists()) throw new Error(`Associate Partner with ID ${id} not found.`);

    const current = partnerFromDoc(currentSnap.id, currentSnap.data());
    const updatedSubmissions = updates.submissions || current.submissions;
    const updatedMetrics = calculateMetrics(updatedSubmissions);

    const now = new Date().toISOString();
    const payload = {
      ...updates,
      metrics: updatedMetrics,
      updatedAt: now,
    };

    await updateDoc(docRef, payload);
    const updatedSnap = await getDoc(docRef);
    return partnerFromDoc(updatedSnap.id, updatedSnap.data() as Record<string, unknown>);
  }
}

export const associatePartnerRepository = new AssociatePartnerRepository();

