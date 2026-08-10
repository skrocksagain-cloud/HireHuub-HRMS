import { Timestamp } from 'firebase/firestore';

import { transactionRepository } from '../repositories/transactionRepository';
import { invoiceNumberService } from '../../../../services/numbering/invoiceNumberService';
import type {
  AssociatePartner,
  ExpenseCategory,
  ExpenseLedgerEntry,
  ExpenseTransaction,
  ExpenseTransactionStatus,
  ExpenseTransactionStatusHistoryEntry,
  PaymentSource,
  RecordExpenseInput,
} from '../../../../types/Transaction';

const DEFAULT_EXPENSE_TYPES = [
  'Recruiter Incentive',
  'Associate Partner Payment',
  'Salary',
  'Office Rent',
  'Internet',
  'Electricity',
  'Travel',
  'Food & Refreshment',
  'Stationery',
  'Software Subscription',
  'Marketing',
  'Recruitment Expense',
  'Training',
  'Miscellaneous',
];

const DEFAULT_FINANCE_ACCOUNTS = [
  'HDFC Current Account',
  'ICICI Current Account',
  'Axis Bank Current Account',
  'Cash',
  'Petty Cash',
  'UPI Collection Account',
];

const validateDate = (value: string, label: string): void => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00`))) {
    throw new Error(`${label} must use YYYY-MM-DD.`);
  }
};

const validateExpense = (input: RecordExpenseInput): void => {
  validateDate(input.transactionDate, 'Expense date');
  if (!input.expenseType.trim()) throw new Error('Expense Type is required.');
  if (!input.paidFrom.trim()) throw new Error('Paid From selection is required.');
  if (input.paidFrom === 'Management') {
    if (!input.paidById?.trim() || !input.paidByName?.trim()) {
      throw new Error('Paid By (Super Admin employee) is mandatory when Paid From is set to Management.');
    }
  }
  if (!input.beneficiary.trim()) throw new Error('Beneficiary / Vendor name is required.');
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error('Expense amount must be greater than zero.');
  if (!input.description.trim()) throw new Error('Expense description is required.');
};

class TransactionService {
  async getExpenseCategoriesList(): Promise<string[]> {
    try {
      const config = await transactionRepository.getExpenseCategories();
      const active = config.filter((c) => c.isActive).map((c) => c.name);
      return active.length > 0 ? active : DEFAULT_EXPENSE_TYPES;
    } catch {
      return DEFAULT_EXPENSE_TYPES;
    }
  }

  async getFinanceAccountsList(): Promise<string[]> {
    try {
      const sources = await transactionRepository.getPaymentSources();
      const active = sources.filter((s) => s.isActive).map((s) => s.name);
      return active.length > 0 ? active : DEFAULT_FINANCE_ACCOUNTS;
    } catch {
      return DEFAULT_FINANCE_ACCOUNTS;
    }
  }

  async getConfiguration(): Promise<{ expenseCategories: ExpenseCategory[]; paymentSources: PaymentSource[] }> {
    const [expenseCategories, paymentSources] = await Promise.all([
      transactionRepository.getExpenseCategories(),
      transactionRepository.getPaymentSources(),
    ]);
    return {
      expenseCategories: expenseCategories.filter((category) => category.isActive),
      paymentSources: paymentSources.filter((source) => source.isActive),
    };
  }

  async getActiveAssociatePartners(): Promise<AssociatePartner[]> {
    const partners = await transactionRepository.getAssociatePartners();
    return partners.filter((partner) => partner.isActive);
  }

  async previewNextExpenseNumber(knownCount = 0): Promise<string> {
    return invoiceNumberService.previewNextExpenseNumber(knownCount);
  }

  async recordExpense(input: RecordExpenseInput, createdBy: string): Promise<string> {
    validateExpense(input);
    if (!createdBy.trim()) throw new Error('Transaction creator is required.');

    const dateObj = new Date(`${input.transactionDate}T00:00:00`);
    const expenseNumber = input.expenseNumber || await invoiceNumberService.previewNextExpenseNumber(0, dateObj);
    const isManagement = input.paidFrom === 'Management';

    return transactionRepository.createDraftExpense({
      expenseNumber,
      transactionNumber: expenseNumber,
      transactionDate: input.transactionDate,
      expenseCategoryId: input.expenseCategoryId || 'cat-gen',
      expenseCategoryName: input.expenseType,
      expenseType: input.expenseType,
      paidFromId: input.paidFromId || 'acc-gen',
      paidFromName: input.paidFrom,
      paidFrom: input.paidFrom,
      paidById: isManagement ? input.paidById : undefined,
      paidByName: isManagement ? input.paidByName : undefined,
      beneficiary: input.beneficiary,
      paymentMethod: input.paymentMethod,
      associatePartnerId: input.associatePartnerId,
      associatePartnerName: input.associatePartnerId ? input.beneficiary : undefined,
      amount: input.amount,
      description: input.description.trim(),
      referenceNumber: input.referenceNumber?.trim() ?? '',
      notes: input.notes?.trim() ?? '',
      attachmentName: input.attachmentName,
      attachmentUrl: input.attachmentUrl,
      createdBy,
    });
  }

  async completeExpense(transactionId: string, completedBy: string, remarks = ''): Promise<void> {
    const transaction = await this.requireTransaction(transactionId);
    if (transaction.status !== 'Draft') throw new Error('Only draft expense transactions can be completed.');
    if (!completedBy.trim()) throw new Error('Transaction completer is required.');
    const statusHistory = [
      ...transaction.statusHistory,
      this.statusEntry('Completed', completedBy, remarks.trim() || 'Expense transaction completed.'),
    ];
    const ledgerEntry: Omit<ExpenseLedgerEntry, 'id' | 'createdAt'> = {
      transactionId: transaction.id,
      transactionNumber: transaction.transactionNumber,
      expenseNumber: transaction.expenseNumber,
      date: transaction.transactionDate,
      expenseCategoryId: transaction.expenseCategoryId,
      expenseCategoryName: transaction.expenseCategoryName,
      amount: transaction.amount,
      paidFromId: transaction.paidFromId,
      paidFromName: transaction.paidFromName,
      paidFrom: transaction.paidFrom,
      paidByName: transaction.paidByName,
      beneficiary: transaction.beneficiary,
      description: transaction.description,
    };
    await transactionRepository.completeExpense(transaction, statusHistory, ledgerEntry);
  }

  async cancelExpense(transactionId: string, cancelledBy: string, remarks = ''): Promise<void> {
    const transaction = await this.requireTransaction(transactionId);
    if (transaction.status !== 'Draft') throw new Error('Completed or cancelled expense transactions cannot be changed.');
    if (!cancelledBy.trim()) throw new Error('Transaction canceller is required.');
    await transactionRepository.updateStatus(transaction.id, 'Cancelled', [
      ...transaction.statusHistory,
      this.statusEntry('Cancelled', cancelledBy, remarks.trim() || 'Expense transaction cancelled.'),
    ]);
  }

  async getExpenseHistory(): Promise<ExpenseTransaction[]> {
    return transactionRepository.getExpenseTransactions();
  }

  async getLedger(): Promise<ExpenseLedgerEntry[]> {
    return transactionRepository.getLedgerEntries();
  }

  private statusEntry(status: ExpenseTransactionStatus, changedBy: string, remarks: string): ExpenseTransactionStatusHistoryEntry {
    return { status, changedAt: Timestamp.now(), changedBy, remarks };
  }

  private async requireTransaction(id: string): Promise<ExpenseTransaction> {
    if (!id.trim()) throw new Error('Transaction ID is required.');
    const transaction = await transactionRepository.getExpenseTransaction(id);
    if (!transaction) throw new Error('Expense transaction was not found.');
    return transaction;
  }
}

export const transactionService = new TransactionService();
