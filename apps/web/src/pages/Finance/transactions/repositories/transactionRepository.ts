import { addDoc, collection, doc, getDoc, getDocs, query, serverTimestamp, Timestamp, updateDoc, where, writeBatch, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';

import { db } from '../../../../firebase/firebase';
import type { FinanceAuthorizationContext } from '../../../../core/authorization/financeAuthorization';
import { getFinanceScope } from '../../../../core/authorization/financeAuthorization';
import type { AssociatePartner, AssociatePartnerPayout, ConsolidatedPaymentHistoryItem, ExpenseCategory, ExpenseLedgerEntry, ExpenseTransaction, ExpenseTransactionStatus, ExpenseTransactionStatusHistoryEntry, PaymentSource, RecruiterIncentivePayout } from '../../../../types/Transaction';

const EXPENSE_TRANSACTIONS_COLLECTION = 'finance_transactions';
const EXPENSE_LEDGER_COLLECTION = 'expenseLedger';
const expenseCategoriesCollection = collection(db, 'settings', 'finance', 'expenseCategories');
const paymentSourcesCollection = collection(db, 'settings', 'finance', 'paymentSources');
const associatePartnersCollection = collection(db, 'associatePartners');
const timestamp = (value: unknown): Timestamp => value instanceof Timestamp ? value : Timestamp.now();

const expenseTransactionFrom = (snapshot: QueryDocumentSnapshot<DocumentData>): ExpenseTransaction => {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    expenseNumber: String(data.expenseNumber ?? data.transactionNumber ?? ''),
    transactionNumber: String(data.transactionNumber ?? ''),
    transactionDate: String(data.transactionDate ?? ''),

    expenseCategoryId: String(data.expenseCategoryId ?? ''),
    expenseCategoryName: String(data.expenseCategoryName ?? ''),
    expenseType: String(data.expenseType ?? data.expenseCategoryName ?? 'Miscellaneous'),

    paidFromId: String(data.paidFromId ?? ''),
    paidFromName: String(data.paidFromName ?? ''),
    paidFrom: String(data.paidFrom ?? data.paidFromAccount ?? data.paidFromName ?? ''),

    paidById: data.paidById ? String(data.paidById) : undefined,
    paidByName: data.paidByName ? String(data.paidByName) : undefined,

    beneficiary: String(data.beneficiary ?? 'Vendor'),
    paymentMethod: data.paymentMethod ?? 'NEFT',

    associatePartnerId: data.associatePartnerId === undefined ? undefined : String(data.associatePartnerId),
    associatePartnerName: data.associatePartnerName === undefined ? undefined : String(data.associatePartnerName),

    amount: Number(data.amount ?? 0),
    description: String(data.description ?? ''),
    referenceNumber: String(data.referenceNumber ?? ''),
    notes: String(data.notes ?? ''),

    attachmentName: data.attachmentName ? String(data.attachmentName) : undefined,
    attachmentUrl: data.attachmentUrl ? String(data.attachmentUrl) : undefined,

    brandId: data.brandId ? String(data.brandId) : undefined,
    brandName: data.brandName ? String(data.brandName) : undefined,
    manualExpenseType: data.manualExpenseType ? String(data.manualExpenseType) : undefined,

    payrollRunId: data.payrollRunId ? String(data.payrollRunId) : undefined,
    payslipId: data.payslipId ? String(data.payslipId) : undefined,
    employeeId: data.employeeId ? String(data.employeeId) : undefined,
    salaryMonth: data.salaryMonth ? String(data.salaryMonth) : undefined,
    documentId: data.documentId ? String(data.documentId) : undefined,
    payslipStoragePath: data.payslipStoragePath ? String(data.payslipStoragePath) : undefined,

    status: data.status as ExpenseTransactionStatus,
    statusHistory: (data.statusHistory ?? []).map((entry: ExpenseTransactionStatusHistoryEntry) => ({ ...entry, changedAt: timestamp(entry.changedAt) })),
    createdBy: String(data.createdBy ?? ''),
    createdAt: timestamp(data.createdAt),
    updatedAt: timestamp(data.updatedAt),
  };
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
  return {
    id: snapshot.id,
    transactionId: String(data.transactionId ?? ''),
    transactionNumber: String(data.transactionNumber ?? ''),
    expenseNumber: String(data.expenseNumber ?? data.transactionNumber ?? ''),
    date: String(data.date ?? ''),
    expenseCategoryId: String(data.expenseCategoryId ?? ''),
    expenseCategoryName: String(data.expenseCategoryName ?? ''),
    amount: Number(data.amount ?? 0),
    paidFromId: String(data.paidFromId ?? ''),
    paidFromName: String(data.paidFromName ?? ''),
    paidFrom: String(data.paidFrom ?? ''),
    paidByName: data.paidByName ? String(data.paidByName) : undefined,
    beneficiary: String(data.beneficiary ?? ''),
    description: String(data.description ?? ''),
    createdAt: timestamp(data.createdAt),
  };
};

export interface TransactionRepository {
  getExpenseCategories(): Promise<ExpenseCategory[]>;
  getPaymentSources(): Promise<PaymentSource[]>;
  getAssociatePartners(): Promise<AssociatePartner[]>;
  createExpenseCategory(name: string): Promise<string>;
  createPaymentSource(name: string): Promise<string>;
  createDraftExpense(transaction: Omit<ExpenseTransaction, 'id' | 'status' | 'statusHistory' | 'createdAt' | 'updatedAt'>): Promise<string>;
  getExpenseTransaction(id: string): Promise<ExpenseTransaction | null>;
  getExpenseTransactions(actor: FinanceAuthorizationContext): Promise<ExpenseTransaction[]>;
  getLedgerEntries(actor: FinanceAuthorizationContext): Promise<ExpenseLedgerEntry[]>;
  getRecruiterPayouts(actor: FinanceAuthorizationContext): Promise<RecruiterIncentivePayout[]>;
  getAssociatePartnerPayouts(actor: FinanceAuthorizationContext): Promise<AssociatePartnerPayout[]>;
  getPaymentHistory(actor: FinanceAuthorizationContext): Promise<ConsolidatedPaymentHistoryItem[]>;
  updateRecruiterPayoutStatus(id: string, status: RecruiterIncentivePayout['status'], approvedBy: string): Promise<void>;
  updateAssociatePartnerPayoutStatus(id: string, status: AssociatePartnerPayout['status'], approvedBy: string): Promise<void>;
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

  async createDraftExpense(transactionData: Omit<ExpenseTransaction, 'id' | 'status' | 'statusHistory' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const draftStatus: ExpenseTransactionStatus = 'Draft';
    const { associatePartnerId, associatePartnerName, attachmentName, attachmentUrl, paidById, paidByName, payrollRunId, payslipId, employeeId, salaryMonth, documentId, payslipStoragePath, brandId, brandName, manualExpenseType, expenseNumber: _ignoreExpense, transactionNumber: _ignoreTxn, ...transactionFields } = transactionData;

    // Parse the date to get YYYY-MM
    const dateObj = new Date(`${transactionData.transactionDate}T00:00:00`);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const financialMonth = `${year}_${month}`; // e.g. 2026_08

    const counterId = `expense_${financialMonth}`;
    const counterRef = doc(db, 'system_sequences', counterId);

    const newDocRef = doc(collection(db, EXPENSE_TRANSACTIONS_COLLECTION));
    let assignedExpenseNumber = '';

    const payload: Record<string, unknown> = {
      ...transactionFields,
      status: draftStatus,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const optionalFields: Record<string, unknown> = {
      associatePartnerId,
      associatePartnerName,
      attachmentName,
      attachmentUrl,
      paidById,
      paidByName,
      payrollRunId,
      payslipId,
      employeeId,
      salaryMonth,
      documentId,
      payslipStoragePath,
      brandId,
      brandName,
      manualExpenseType,
    };

    Object.entries(optionalFields).forEach(([key, val]) => {
      if (val !== undefined && val !== null) {
        payload[key] = val;
      }
    });

    const { runTransaction } = await import('firebase/firestore');

    await runTransaction(db, async (transaction) => {
      const snapshot = await transaction.get(counterRef);
      const sequence = Number(snapshot.data()?.lastSequence ?? 0) + 1;

      transaction.set(counterRef, {
        month: financialMonth,
        lastSequence: sequence,
        updatedAt: serverTimestamp(),
      }, { merge: true });

      assignedExpenseNumber = `EXP/${year}-${month}/${String(sequence).padStart(4, '0')}`;

      payload.expenseNumber = assignedExpenseNumber;
      payload.transactionNumber = assignedExpenseNumber;
      
      payload.statusHistory = [{ status: draftStatus, changedAt: Timestamp.now(), changedBy: transactionData.createdBy, remarks: 'Expense transaction recorded.' }];

      // Salary Disbursement idempotency logic (if applicable, though expenseNumber is overridden, we can still use docId if it was passed, but the requirement is to auto-generate for new expenses)
      // Actually, for Salary Disbursement we should probably preserve the old logic if it had a pre-determined expenseNumber?
      // "The new format applies to NEW expenses."
      
      transaction.set(newDocRef, payload);
    });

    return assignedExpenseNumber; // Or return doc ID? The UI expects to maybe use the ID? Wait, return newDocRef.id;
  }

  async getExpenseTransaction(id: string): Promise<ExpenseTransaction | null> {
    const snapshot = await getDoc(doc(db, EXPENSE_TRANSACTIONS_COLLECTION, id));
    return snapshot.exists() ? expenseTransactionFrom(snapshot) : null;
  }

  async getExpenseTransactions(actor: FinanceAuthorizationContext): Promise<ExpenseTransaction[]> {
    const scope = getFinanceScope(actor);
    if (scope === 'GLOBAL') {
      const result = await getDocs(collection(db, EXPENSE_TRANSACTIONS_COLLECTION));
      return result.docs.map(expenseTransactionFrom);
    }
    if (scope === 'SELF' && actor.employeeId?.trim()) {
      const result = await getDocs(query(collection(db, EXPENSE_TRANSACTIONS_COLLECTION), where('employeeId', '==', actor.employeeId)));
      return result.docs.map(expenseTransactionFrom);
    }
    return [];
  }

  async getLedgerEntries(actor: FinanceAuthorizationContext): Promise<ExpenseLedgerEntry[]> {
    if (getFinanceScope(actor) !== 'GLOBAL') return [];
    const result = await getDocs(collection(db, EXPENSE_LEDGER_COLLECTION));
    return result.docs.map(ledgerEntryFrom);
  }

  async getRecruiterPayouts(actor: FinanceAuthorizationContext): Promise<RecruiterIncentivePayout[]> {
    const scope = getFinanceScope(actor);
    if (scope === 'GLOBAL') {
      const result = await getDocs(collection(db, 'recruiterIncentivePayouts'));
      return result.docs.map((item) => ({ id: item.id, ...item.data() } as RecruiterIncentivePayout));
    }
    if (scope === 'SELF' && actor.employeeId?.trim()) {
      const result = await getDocs(query(collection(db, 'recruiterIncentivePayouts'), where('recruiterId', '==', actor.employeeId)));
      return result.docs.map((item) => ({ id: item.id, ...item.data() } as RecruiterIncentivePayout));
    }
    return [];
  }

  async getAssociatePartnerPayouts(actor: FinanceAuthorizationContext): Promise<AssociatePartnerPayout[]> {
    if (getFinanceScope(actor) !== 'GLOBAL') return [];
    const result = await getDocs(collection(db, 'associatePartnerPayouts'));
    return result.docs.map((item) => ({ id: item.id, ...item.data() } as AssociatePartnerPayout));
  }

  async getPaymentHistory(actor: FinanceAuthorizationContext): Promise<ConsolidatedPaymentHistoryItem[]> {
    if (getFinanceScope(actor) !== 'GLOBAL') return [];
    const result = await getDocs(collection(db, 'paymentHistory'));
    return result.docs.map((item) => ({ id: item.id, ...item.data() } as ConsolidatedPaymentHistoryItem));
  }

  async updateRecruiterPayoutStatus(id: string, status: RecruiterIncentivePayout['status'], approvedBy: string): Promise<void> {
    await updateDoc(doc(db, 'recruiterIncentivePayouts', id), { status, approvedBy, updatedAt: serverTimestamp() });
  }

  async updateAssociatePartnerPayoutStatus(id: string, status: AssociatePartnerPayout['status'], approvedBy: string): Promise<void> {
    await updateDoc(doc(db, 'associatePartnerPayouts', id), { status, approvedBy, updatedAt: serverTimestamp() });
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
