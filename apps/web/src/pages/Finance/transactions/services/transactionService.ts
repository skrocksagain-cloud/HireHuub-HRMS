import { Timestamp } from 'firebase/firestore';

import { transactionRepository } from '../repositories/transactionRepository';
import type { FinanceAuthorizationContext } from '../../../../core/authorization/financeAuthorization';
import type {
  AssociatePartner,
  AssociatePartnerPayout,
  ConsolidatedPaymentHistoryItem,
  ExpenseCategory,
  ExpenseLedgerEntry,
  ExpenseTransaction,
  ExpenseTransactionStatus,
  ExpenseTransactionStatusHistoryEntry,
  PaymentSource,
  RecordExpenseInput,
  RecruiterIncentivePayout,
} from '../../../../types/Transaction';

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
    return (await transactionRepository.getExpenseCategories()).filter((c) => c.isActive).map((c) => c.name);
  }

  async getFinanceAccountsList(): Promise<string[]> {
    return (await transactionRepository.getPaymentSources()).filter((s) => s.isActive).map((s) => s.name);
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

  async previewNextExpenseNumber(): Promise<string> {
    return 'Auto-generated on save';
  }

  async recordExpense(input: RecordExpenseInput, createdBy: string): Promise<string> {
    validateExpense(input);
    if (!createdBy.trim()) throw new Error('Transaction creator is required.');

    const isManagement = input.paidFrom === 'Management';

    return transactionRepository.createDraftExpense({
      expenseNumber: '', // ignored
      transactionNumber: '', // ignored
      transactionDate: input.transactionDate,
      expenseCategoryId: input.expenseCategoryId,
      expenseCategoryName: input.expenseType,
      expenseType: input.expenseType,
      paidFromId: input.paidFromId,
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

  async getExpenseHistory(actor: FinanceAuthorizationContext): Promise<ExpenseTransaction[]> {
    return transactionRepository.getExpenseTransactions(actor);
  }

  async getLedger(actor: FinanceAuthorizationContext): Promise<ExpenseLedgerEntry[]> {
    return transactionRepository.getLedgerEntries(actor);
  }

  async getRecruiterPayouts(actor: FinanceAuthorizationContext): Promise<RecruiterIncentivePayout[]> { return transactionRepository.getRecruiterPayouts(actor); }
  async getAssociatePartnerPayouts(actor: FinanceAuthorizationContext): Promise<AssociatePartnerPayout[]> { return transactionRepository.getAssociatePartnerPayouts(actor); }
  async getPaymentHistory(actor: FinanceAuthorizationContext): Promise<ConsolidatedPaymentHistoryItem[]> { return transactionRepository.getPaymentHistory(actor); }
  async updateRecruiterPayoutStatus(id: string, status: RecruiterIncentivePayout['status'], actor: string): Promise<void> { await transactionRepository.updateRecruiterPayoutStatus(id, status, actor); }
  async updateAssociatePartnerPayoutStatus(id: string, status: AssociatePartnerPayout['status'], actor: string): Promise<void> { await transactionRepository.updateAssociatePartnerPayoutStatus(id, status, actor); }

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
