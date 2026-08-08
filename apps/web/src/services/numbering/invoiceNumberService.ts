import { billingRepository } from '../../pages/Finance/billing/repositories/billingRepository';
import type { InvoiceNumber } from '../../types/BillingCompany';

export class InvoiceNumberService {
  private static INVOICE_PREFIX = 'HH';
  private static CREDIT_NOTE_PREFIX = 'HHCN';
  private static EXPENSE_PREFIX = 'HHEXP';
  private static PADDING_DIGITS = 4;

  /**
   * Generates next atomic Invoice Number following Hire Huub Enterprise Standard.
   * Format: HH2026-0001, HH2026-0002... Next year: HH2027-0001
   */
  async generateNextInvoiceNumber(billingCompanyId: string, invoiceDate: Date): Promise<InvoiceNumber> {
    const year = invoiceDate.getFullYear();
    const financialYear = String(year);
    const sequence = await billingRepository.nextInvoiceSequence(billingCompanyId, financialYear);

    const value = `${InvoiceNumberService.INVOICE_PREFIX}${year}-${String(sequence).padStart(InvoiceNumberService.PADDING_DIGITS, '0')}`;

    return {
      value,
      financialYear,
      sequence,
    };
  }

  /**
   * Previews next Invoice Number for read-only UI display.
   */
  async previewNextInvoiceNumber(billingCompanyId: string, invoiceDate: Date = new Date(), knownCount = 0): Promise<string> {
    const year = invoiceDate.getFullYear();
    const financialYear = String(year);

    try {
      const currentSeq = await billingRepository.getCurrentInvoiceSequence(billingCompanyId, financialYear);
      const nextSeq = Math.max(currentSeq + 1, knownCount + 1);
      return `${InvoiceNumberService.INVOICE_PREFIX}${year}-${String(nextSeq).padStart(InvoiceNumberService.PADDING_DIGITS, '0')}`;
    } catch {
      const nextSeq = knownCount + 1;
      return `${InvoiceNumberService.INVOICE_PREFIX}${year}-${String(nextSeq).padStart(InvoiceNumberService.PADDING_DIGITS, '0')}`;
    }
  }

  /**
   * Generates next atomic Credit Note Number following Hire Huub Enterprise Standard.
   * Format: HHCN2026-0001, HHCN2026-0002...
   */
  async generateNextCreditNoteNumber(billingCompanyId: string, creditNoteDate: Date): Promise<InvoiceNumber> {
    const year = creditNoteDate.getFullYear();
    const financialYear = String(year);
    const sequence = await billingRepository.nextCreditNoteSequence(billingCompanyId, financialYear);

    const value = `${InvoiceNumberService.CREDIT_NOTE_PREFIX}${year}-${String(sequence).padStart(InvoiceNumberService.PADDING_DIGITS, '0')}`;

    return {
      value,
      financialYear,
      sequence,
    };
  }

  /**
   * Previews next Credit Note Number for read-only UI display.
   */
  async previewNextCreditNoteNumber(knownCount = 0, date: Date = new Date()): Promise<string> {
    const year = date.getFullYear();
    const nextSeq = knownCount + 1;
    return `${InvoiceNumberService.CREDIT_NOTE_PREFIX}${year}-${String(nextSeq).padStart(InvoiceNumberService.PADDING_DIGITS, '0')}`;
  }

  /**
   * Previews / Generates next Expense Number following Hire Huub Enterprise Standard.
   * Format: HHEXP2026-0001, HHEXP2026-0002...
   */
  previewNextExpenseNumber(knownCount = 0, date: Date = new Date()): string {
    const year = date.getFullYear();
    const nextSeq = knownCount + 1;
    return `${InvoiceNumberService.EXPENSE_PREFIX}${year}-${String(nextSeq).padStart(InvoiceNumberService.PADDING_DIGITS, '0')}`;
  }
}

export const invoiceNumberService = new InvoiceNumberService();
