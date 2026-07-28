import { Timestamp } from 'firebase/firestore';

import { transactionRepository } from '../repositories/transactionRepository';
import type { AssociatePartner, ExpenseCategory, ExpenseLedgerEntry, ExpenseTransaction, ExpenseTransactionStatus, ExpenseTransactionStatusHistoryEntry, PaymentSource, RecordExpenseInput } from '../../../../types/Transaction';

const validateDate = (value: string, label: string): void => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number.isNaN(Date.parse(`${value}T00:00:00`))) throw new Error(`${label} must use YYYY-MM-DD.`);
};

const validateExpense = (input: RecordExpenseInput): void => {
  validateDate(input.transactionDate, 'Transaction date');
  if (!input.expenseCategoryId.trim() || !input.paidFromId.trim()) throw new Error('Expense category and payment source are required.');
  if (!Number.isFinite(input.amount) || input.amount <= 0) throw new Error('Expense amount must be greater than zero.');
  if (!input.description.trim()) throw new Error('Expense description is required.');
};

class TransactionService {
  async getConfiguration(): Promise<{ expenseCategories: ExpenseCategory[]; paymentSources: PaymentSource[] }> {
    const [expenseCategories, paymentSources] = await Promise.all([transactionRepository.getExpenseCategories(), transactionRepository.getPaymentSources()]);
    return { expenseCategories: expenseCategories.filter((category) => category.isActive), paymentSources: paymentSources.filter((source) => source.isActive) };
  }

  async getActiveAssociatePartners(): Promise<AssociatePartner[]> {
    const partners = await transactionRepository.getAssociatePartners();
    return partners.filter((partner) => partner.isActive);
  }

  async addExpenseCategory(name: string): Promise<string> {
    const normalizedName = name.trim();
    if (!normalizedName) throw new Error('Expense category name is required.');
    const categories = await transactionRepository.getExpenseCategories();
    if (categories.some((category) => category.name.localeCompare(normalizedName, undefined, { sensitivity: 'accent' }) === 0)) throw new Error('An expense category with this name already exists.');
    return transactionRepository.createExpenseCategory(normalizedName);
  }

  async addPaymentSource(name: string): Promise<string> {
    const normalizedName = name.trim();
    if (!normalizedName) throw new Error('Payment source name is required.');
    const sources = await transactionRepository.getPaymentSources();
    if (sources.some((source) => source.name.localeCompare(normalizedName, undefined, { sensitivity: 'accent' }) === 0)) throw new Error('A payment source with this name already exists.');
    return transactionRepository.createPaymentSource(normalizedName);
  }

  async recordExpense(input: RecordExpenseInput, createdBy: string): Promise<string> {
    validateExpense(input);
    if (!createdBy.trim()) throw new Error('Transaction creator is required.');
    const configuration = await this.getConfiguration();
    const category = configuration.expenseCategories.find((item) => item.id === input.expenseCategoryId);
    const paymentSource = configuration.paymentSources.find((item) => item.id === input.paidFromId);
    if (!category || !paymentSource) throw new Error('Select an active expense category and payment source.');
    const associatePartnerId = input.associatePartnerId?.trim() || undefined;
    if (category.requiresAssociatePartner && !associatePartnerId) throw new Error('An active associate partner is required for the selected expense category.');

    let associatePartner: AssociatePartner | undefined;
    if (associatePartnerId) {
      associatePartner = (await this.getActiveAssociatePartners()).find((partner) => partner.id === associatePartnerId);
      if (!associatePartner) throw new Error('Select an active associate partner from Workbench Network.');
      if (!associatePartner.name.trim()) throw new Error('The selected associate partner has no name and cannot be used for an expense transaction.');
    }

    return transactionRepository.createDraftExpense({ transactionNumber: `EXP/${Date.now()}`, transactionDate: input.transactionDate, expenseCategoryId: category.id, expenseCategoryName: category.name, associatePartnerId: associatePartner?.id, associatePartnerName: associatePartner?.name, paidFromId: paymentSource.id, paidFromName: paymentSource.name, amount: input.amount, description: input.description.trim(), referenceNumber: input.referenceNumber?.trim() ?? '', notes: input.notes?.trim() ?? '', createdBy });
  }

  async completeExpense(transactionId: string, completedBy: string, remarks = ''): Promise<void> {
    const transaction = await this.requireTransaction(transactionId);
    if (transaction.status !== 'Draft') throw new Error('Only draft expense transactions can be completed.');
    if (!completedBy.trim()) throw new Error('Transaction completer is required.');
    const statusHistory = [...transaction.statusHistory, this.statusEntry('Completed', completedBy, remarks.trim() || 'Expense transaction completed.')];
    const ledgerEntry: Omit<ExpenseLedgerEntry, 'id' | 'createdAt'> = { transactionId: transaction.id, transactionNumber: transaction.transactionNumber, date: transaction.transactionDate, expenseCategoryId: transaction.expenseCategoryId, expenseCategoryName: transaction.expenseCategoryName, amount: transaction.amount, paidFromId: transaction.paidFromId, paidFromName: transaction.paidFromName, description: transaction.description };
    await transactionRepository.completeExpense(transaction, statusHistory, ledgerEntry);
  }

  async cancelExpense(transactionId: string, cancelledBy: string, remarks = ''): Promise<void> {
    const transaction = await this.requireTransaction(transactionId);
    if (transaction.status !== 'Draft') throw new Error('Completed or cancelled expense transactions cannot be changed.');
    if (!cancelledBy.trim()) throw new Error('Transaction canceller is required.');
    await transactionRepository.updateStatus(transaction.id, 'Cancelled', [...transaction.statusHistory, this.statusEntry('Cancelled', cancelledBy, remarks.trim() || 'Expense transaction cancelled.')]);
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
