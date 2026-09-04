import { billingRepository } from '../../pages/Finance/billing/repositories/billingRepository';
import { adminService } from '../admin/adminService';
import type { InvoiceNumber } from '../../types/BillingCompany';

export class InvoiceNumberService {
  private async getPrefixes() {
    const company = await adminService.getCompanySettings();
    if (!company) {
      throw new Error('Administration → Company Settings is missing. Please configure Company Settings before using numbering features.');
    }
    const required = ['invoicePrefix', 'creditNotePrefix'] as const;
    const missing = required.filter((key) => !company[key]?.trim());
    if (missing.length) {
      throw new Error(`Administration → Company Settings is missing numbering configuration: ${missing.join(', ')}.`);
    }
    return { invoicePrefix: company.invoicePrefix!, creditNotePrefix: company.creditNotePrefix!, padding: 4 };
  }

  /**
   * Generates next atomic Invoice Number following Hire Huub Enterprise Standard.
   * Consumes invoicePrefix from Administration → Company Settings.
   */
  async generateNextInvoiceNumber(billingCompanyId: string, invoiceDate: Date): Promise<InvoiceNumber> {
    const year = invoiceDate.getFullYear();
    const financialYear = String(year);
    const sequence = await billingRepository.nextInvoiceSequence(billingCompanyId, financialYear);

    const value = `${year}/${String(sequence).padStart(5, '0')}`;

    return {
      value,
      financialYear,
      sequence,
    };
  }

  /**
   * Previews next Invoice Number for read-only UI display using approved YYYY/SEQUENCE format.
   */
  async previewNextInvoiceNumber(billingCompanyId: string, invoiceDate: Date = new Date(), knownCount = 0): Promise<string> {
    const year = invoiceDate.getFullYear();
    const financialYear = String(year);

    try {
      const currentSeq = await billingRepository.getCurrentInvoiceSequence(billingCompanyId, financialYear);
      const nextSeq = Math.max(currentSeq + 1, knownCount + 1);
      return `${year}/${String(nextSeq).padStart(5, '0')}`;
    } catch {
      const nextSeq = knownCount + 1;
      return `${year}/${String(nextSeq).padStart(5, '0')}`;
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

}

export const invoiceNumberService = new InvoiceNumberService();
