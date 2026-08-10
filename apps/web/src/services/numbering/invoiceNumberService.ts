import { billingRepository } from '../../pages/Finance/billing/repositories/billingRepository';
import { adminService } from '../admin/adminService';
import type { InvoiceNumber } from '../../types/BillingCompany';

export class InvoiceNumberService {
  private async getPrefixes() {
    const company = await adminService.getCompanySettings();
    const required = ['invoicePrefix', 'creditNotePrefix', 'expensePrefix'] as const;
    const missing = required.filter((key) => !company[key]?.trim());
    if (missing.length) {
      throw new Error(`Administration → Company Settings is missing numbering configuration: ${missing.join(', ')}.`);
    }
    return { invoicePrefix: company.invoicePrefix!, creditNotePrefix: company.creditNotePrefix!, expensePrefix: company.expensePrefix!, padding: 4 };
  }

  /**
   * Generates next atomic Invoice Number following Hire Huub Enterprise Standard.
   * Consumes invoicePrefix from Administration → Company Settings.
   */
  async generateNextInvoiceNumber(billingCompanyId: string, invoiceDate: Date): Promise<InvoiceNumber> {
    const year = invoiceDate.getFullYear();
    const financialYear = String(year);
    const sequence = await billingRepository.nextInvoiceSequence(billingCompanyId, financialYear);
    const { invoicePrefix, padding } = await this.getPrefixes();

    const value = `${invoicePrefix}${year}-${String(sequence).padStart(padding, '0')}`;

    return {
      value,
      financialYear,
      sequence,
    };
  }

  /**
   * Previews next Invoice Number for read-only UI display using Administration prefix.
   */
  async previewNextInvoiceNumber(billingCompanyId: string, invoiceDate: Date = new Date(), knownCount = 0): Promise<string> {
    const year = invoiceDate.getFullYear();
    const financialYear = String(year);
    const { invoicePrefix, padding } = await this.getPrefixes();

    try {
      const currentSeq = await billingRepository.getCurrentInvoiceSequence(billingCompanyId, financialYear);
      const nextSeq = Math.max(currentSeq + 1, knownCount + 1);
      return `${invoicePrefix}${year}-${String(nextSeq).padStart(padding, '0')}`;
    } catch {
      const nextSeq = knownCount + 1;
      return `${invoicePrefix}${year}-${String(nextSeq).padStart(padding, '0')}`;
    }
  }

  /**
   * Generates next atomic Credit Note Number using Administration creditNotePrefix.
   */
  async generateNextCreditNoteNumber(billingCompanyId: string, creditNoteDate: Date): Promise<InvoiceNumber> {
    const year = creditNoteDate.getFullYear();
    const financialYear = String(year);
    const sequence = await billingRepository.nextCreditNoteSequence(billingCompanyId, financialYear);
    const { creditNotePrefix, padding } = await this.getPrefixes();

    const value = `${creditNotePrefix}${year}-${String(sequence).padStart(padding, '0')}`;

    return {
      value,
      financialYear,
      sequence,
    };
  }

  /**
   * Previews next Credit Note Number using Administration prefix.
   */
  async previewNextCreditNoteNumber(knownCount = 0, date: Date = new Date()): Promise<string> {
    const year = date.getFullYear();
    const nextSeq = knownCount + 1;
    const { creditNotePrefix, padding } = await this.getPrefixes();
    return `${creditNotePrefix}${year}-${String(nextSeq).padStart(padding, '0')}`;
  }

  /**
   * Previews / Generates next Expense Number using Administration prefix.
   */
  async previewNextExpenseNumber(knownCount = 0, date: Date = new Date()): Promise<string> {
    const year = date.getFullYear();
    const nextSeq = knownCount + 1;
    const { expensePrefix, padding } = await this.getPrefixes();
    return `${expensePrefix}${year}-${String(nextSeq).padStart(padding, '0')}`;
  }
}

export const invoiceNumberService = new InvoiceNumberService();
