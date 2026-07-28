import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, Timestamp, updateDoc, where, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';

import { db } from '../../../../firebase/firebase';
import type { CreateCreditNoteDraftInput, CreditNote, CreditNoteDocumentStorage, CreditNoteSnapshot, CreditNoteStatus, CreditNoteStatusHistoryEntry } from '../../../../types/CreditNote';

const CREDIT_NOTES_COLLECTION = 'creditNotes';
const timestamp = (value: unknown): Timestamp => value instanceof Timestamp ? value : Timestamp.now();

const creditNoteFrom = (snapshot: QueryDocumentSnapshot<DocumentData>): CreditNote => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    originalInvoiceId: String(data.originalInvoiceId ?? ''),
    creditType: data.creditType as CreditNote['creditType'],
    creditDate: String(data.creditDate ?? ''),
    reason: String(data.reason ?? ''),
    selections: data.selections as CreditNote['selections'],
    status: data.status as CreditNoteStatus,
    statusHistory: (data.statusHistory ?? []).map((entry: CreditNoteStatusHistoryEntry) => ({ ...entry, changedAt: timestamp(entry.changedAt) })),
    snapshot: data.snapshot as CreditNoteSnapshot | undefined,
    document: data.document as CreditNoteDocumentStorage | undefined,
    createdBy: String(data.createdBy ?? ''),
    createdAt: timestamp(data.createdAt),
    updatedAt: timestamp(data.updatedAt),
  };
};

export interface CreditNoteRepository {
  createDraft(input: CreateCreditNoteDraftInput, createdBy: string): Promise<string>;
  getCreditNote(id: string): Promise<CreditNote | null>;
  getCreditNotes(): Promise<CreditNote[]>;
  getCreditNotesForInvoice(invoiceId: string): Promise<CreditNote[]>;
  updateDraft(id: string, input: CreateCreditNoteDraftInput): Promise<void>;
  completeGeneration(id: string, snapshot: CreditNoteSnapshot, document: CreditNoteDocumentStorage, statusHistory: CreditNoteStatusHistoryEntry[]): Promise<void>;
  updateStatus(id: string, status: CreditNoteStatus, statusHistory: CreditNoteStatusHistoryEntry[]): Promise<void>;
}

class FirestoreCreditNoteRepository implements CreditNoteRepository {
  async createDraft(input: CreateCreditNoteDraftInput, createdBy: string): Promise<string> {
    const draftStatus: CreditNoteStatus = 'Draft';
    const result = await addDoc(collection(db, CREDIT_NOTES_COLLECTION), { ...input, selections: input.selections ?? [], status: draftStatus, statusHistory: [{ status: draftStatus, changedAt: Timestamp.now(), changedBy: createdBy, remarks: 'Credit note draft created.' }], createdBy, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return result.id;
  }

  async getCreditNote(id: string): Promise<CreditNote | null> {
    const snapshot = await getDoc(doc(db, CREDIT_NOTES_COLLECTION, id));
    return snapshot.exists() ? creditNoteFrom(snapshot) : null;
  }

  async getCreditNotes(): Promise<CreditNote[]> {
    const result = await getDocs(collection(db, CREDIT_NOTES_COLLECTION));
    return result.docs.map(creditNoteFrom);
  }

  async getCreditNotesForInvoice(invoiceId: string): Promise<CreditNote[]> {
    const result = await getDocs(query(collection(db, CREDIT_NOTES_COLLECTION), where('originalInvoiceId', '==', invoiceId)));
    return result.docs.map(creditNoteFrom);
  }

  async updateDraft(id: string, input: CreateCreditNoteDraftInput): Promise<void> {
    await updateDoc(doc(db, CREDIT_NOTES_COLLECTION, id), { ...input, selections: input.selections ?? [], updatedAt: serverTimestamp() });
  }

  async completeGeneration(id: string, snapshot: CreditNoteSnapshot, document: CreditNoteDocumentStorage, statusHistory: CreditNoteStatusHistoryEntry[]): Promise<void> {
    await updateDoc(doc(db, CREDIT_NOTES_COLLECTION, id), { status: 'Generated', snapshot, document, statusHistory, updatedAt: serverTimestamp() });
  }

  async updateStatus(id: string, status: CreditNoteStatus, statusHistory: CreditNoteStatusHistoryEntry[]): Promise<void> {
    await updateDoc(doc(db, CREDIT_NOTES_COLLECTION, id), { status, statusHistory, updatedAt: serverTimestamp() });
  }
}

export const creditNoteRepository: CreditNoteRepository = new FirestoreCreditNoteRepository();
