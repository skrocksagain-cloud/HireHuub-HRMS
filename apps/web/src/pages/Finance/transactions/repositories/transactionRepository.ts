import { addDoc, collection, doc, getDoc, getDocs, serverTimestamp, Timestamp, updateDoc, writeBatch, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';

import { db } from '../../../../firebase/firebase';
import type { AssociatePartner, ExpenseCategory, ExpenseLedgerEntry, ExpenseTransaction, ExpenseTransactionStatus, ExpenseTransactionStatusHistoryEntry, PaymentSource } from '../../../../types/Transaction';

const EXPENSE_TRANSACTIONS_COLLECTION = 'expenseTransactions';
const EXPENSE_LEDGER_COLLECTION = 'expenseLedger';
const expenseCategoriesCollection = collection(db, 'settings', 'finance', 'expenseCategories');
const paymentSourcesCollection = collection(db, 'settings', 'finance', 'paymentSources');
// Network owns these records. Transactions only reads them to resolve an expense reference.
const associatePartnersCollection = collection(db, 'associatePartners');
const timestamp = (value: unknown): Timestamp => value instanceof Timestamp ? value : Timestamp.now();

const expenseTransactionFrom = (snapshot: QueryDocumentSnapshot<DocumentData>): ExpenseTransaction => {
  const data = snapshot.data();
  return { id: snapshot.id, transactionNumber: String(data.transactionNumber ?? ''), transactionDate: String(data.transactionDate ?? ''), expenseCategoryId: String(data.expenseCategoryId ?? ''), expenseCategoryName: String(data.expenseCategoryName ?? ''), associatePartnerId: data.associatePartnerId === undefined ? undefined : String(data.associatePartnerId), associatePartnerName: data.associatePartnerName === undefined ? undefined : String(data.associatePartnerName), paidFromId: String(data.paidFromId ?? ''), paidFromName: String(data.paidFromName ?? ''), amount: Number(data.amount ?? 0), description: String(data.description ?? ''), referenceNumber: String(data.referenceNumber ?? ''), notes: String(data.notes ?? ''), status: data.status as ExpenseTransactionStatus, statusHistory: (data.statusHistory ?? []).map((entry: ExpenseTransactionStatusHistoryEntry) => ({ ...entry, changedAt: timestamp(entry.changedAt) })), createdBy: String(data.createdBy ?? ''), createdAt: timestamp(data.createdAt), updatedAt: timestamp(data.updatedAt) };
};

const categoryFrom = (snapshot: QueryDocumentSnapshot<DocumentData>): ExpenseCategory => {
  const data = snapshot.data();
  return { id: snapshot.id, name: String(data.name ?? ''), isActive: Boolean(data.isActive), requiresAssociatePartner: Boolean(data.requiresAssociatePartner), createdAt: timestamp(data.createdAt), updatedAt: timestamp(data.updatedAt) };
};

const associatePartnerFrom = (snapshot: QueryDocumentSnapshot<DocumentData>): AssociatePartner => {
  const data = snapshot.data();
  return { id: snapshot.id, name: String(data.name ?? ''), isActive: Boolean(data.isActive) };
};

const paymentSourceFrom = (snapshot: QueryDocumentSnapshot<DocumentData>): PaymentSource => {
  const data = snapshot.data();
  return { id: snapshot.id, name: String(data.name ?? ''), isActive: Boolean(data.isActive), createdAt: timestamp(data.createdAt), updatedAt: timestamp(data.updatedAt) };
};

const ledgerEntryFrom = (snapshot: QueryDocumentSnapshot<DocumentData>): ExpenseLedgerEntry => {
  const data = snapshot.data();
  return { id: snapshot.id, transactionId: String(data.transactionId ?? ''), transactionNumber: String(data.transactionNumber ?? ''), date: String(data.date ?? ''), expenseCategoryId: String(data.expenseCategoryId ?? ''), expenseCategoryName: String(data.expenseCategoryName ?? ''), amount: Number(data.amount ?? 0), paidFromId: String(data.paidFromId ?? ''), paidFromName: String(data.paidFromName ?? ''), description: String(data.description ?? ''), createdAt: timestamp(data.createdAt) };
};

export interface TransactionRepository {
  getExpenseCategories(): Promise<ExpenseCategory[]>;
  getPaymentSources(): Promise<PaymentSource[]>;
  getAssociatePartners(): Promise<AssociatePartner[]>;
  createExpenseCategory(name: string): Promise<string>;
  createPaymentSource(name: string): Promise<string>;
  createDraftExpense(transaction: Omit<ExpenseTransaction, 'id' | 'status' | 'statusHistory' | 'createdAt' | 'updatedAt'>): Promise<string>;
  getExpenseTransaction(id: string): Promise<ExpenseTransaction | null>;
  getExpenseTransactions(): Promise<ExpenseTransaction[]>;
  getLedgerEntries(): Promise<ExpenseLedgerEntry[]>;
  updateStatus(id: string, status: ExpenseTransactionStatus, statusHistory: ExpenseTransactionStatusHistoryEntry[]): Promise<void>;
  completeExpense(transaction: ExpenseTransaction, statusHistory: ExpenseTransactionStatusHistoryEntry[], ledgerEntry: Omit<ExpenseLedgerEntry, 'id' | 'createdAt'>): Promise<void>;
}

class FirestoreTransactionRepository implements TransactionRepository {
  async getExpenseCategories(): Promise<ExpenseCategory[]> {
    const result = await getDocs(expenseCategoriesCollection);
    return result.docs.map(categoryFrom);
  }

  async getPaymentSources(): Promise<PaymentSource[]> {
    const result = await getDocs(paymentSourcesCollection);
    return result.docs.map(paymentSourceFrom);
  }

  async getAssociatePartners(): Promise<AssociatePartner[]> {
    const result = await getDocs(associatePartnersCollection);
    return result.docs.map(associatePartnerFrom);
  }

  async createExpenseCategory(name: string): Promise<string> {
    const result = await addDoc(expenseCategoriesCollection, { name, isActive: true, requiresAssociatePartner: false, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return result.id;
  }

  async createPaymentSource(name: string): Promise<string> {
    const result = await addDoc(paymentSourcesCollection, { name, isActive: true, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    return result.id;
  }

  async createDraftExpense(transaction: Omit<ExpenseTransaction, 'id' | 'status' | 'statusHistory' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const draftStatus: ExpenseTransactionStatus = 'Draft';
    const { associatePartnerId, associatePartnerName, ...transactionFields } = transaction;
    const result = await addDoc(collection(db, EXPENSE_TRANSACTIONS_COLLECTION), {
      ...transactionFields,
      ...(associatePartnerId === undefined ? {} : { associatePartnerId }),
      ...(associatePartnerName === undefined ? {} : { associatePartnerName }),
      status: draftStatus,
      statusHistory: [{ status: draftStatus, changedAt: Timestamp.now(), changedBy: transaction.createdBy, remarks: 'Expense transaction recorded.' }],
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return result.id;
  }

  async getExpenseTransaction(id: string): Promise<ExpenseTransaction | null> {
    const snapshot = await getDoc(doc(db, EXPENSE_TRANSACTIONS_COLLECTION, id));
    return snapshot.exists() ? expenseTransactionFrom(snapshot) : null;
  }

  async getExpenseTransactions(): Promise<ExpenseTransaction[]> {
    const result = await getDocs(collection(db, EXPENSE_TRANSACTIONS_COLLECTION));
    return result.docs.map(expenseTransactionFrom);
  }

  async getLedgerEntries(): Promise<ExpenseLedgerEntry[]> {
    const result = await getDocs(collection(db, EXPENSE_LEDGER_COLLECTION));
    return result.docs.map(ledgerEntryFrom);
  }

  async updateStatus(id: string, status: ExpenseTransactionStatus, statusHistory: ExpenseTransactionStatusHistoryEntry[]): Promise<void> {
    await updateDoc(doc(db, EXPENSE_TRANSACTIONS_COLLECTION, id), { status, statusHistory, updatedAt: serverTimestamp() });
  }

  async completeExpense(transaction: ExpenseTransaction, statusHistory: ExpenseTransactionStatusHistoryEntry[], ledgerEntry: Omit<ExpenseLedgerEntry, 'id' | 'createdAt'>): Promise<void> {
    const batch = writeBatch(db);
    batch.update(doc(db, EXPENSE_TRANSACTIONS_COLLECTION, transaction.id), { status: 'Completed', statusHistory, updatedAt: serverTimestamp() });
    batch.set(doc(collection(db, EXPENSE_LEDGER_COLLECTION)), { ...ledgerEntry, createdAt: serverTimestamp() });
    await batch.commit();
  }
}

export const transactionRepository: TransactionRepository = new FirestoreTransactionRepository();
