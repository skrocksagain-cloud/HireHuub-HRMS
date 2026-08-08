import { billingRepository } from '../repositories/billingRepository';
import { invoiceNumberService } from '../../../../services/numbering/invoiceNumberService';
import type {
  BillingCompany,
  BillingCompanyInput,
  GstResolution,
  InvoiceNumber,
  InvoiceTemplateResolution,
} from '../../../../types/BillingCompany';
import type { CreditNote } from '../../../../types/CreditNote';
import type { Invoice, InvoiceStatus } from '../../../../types/Invoice';

const normalizeState = (state: string): string => state.trim().toLocaleUpperCase('en-IN');
const roundMoney = (value: number): number => Math.round((value + Number.EPSILON) * 100) / 100;

export interface InvoiceOutstandingBreakdown {
  invoiceAmount: number;
  creditNotesApplied: number;
  outstandingAmount: number;
}
const FIXED_BILLING_ENTITY_LEGAL_NAME = 'HIRE HUUB PEOPLE SOLUTION PRIVATE LIMITED';

const validateBillingCompany = (company: BillingCompanyInput): void => {
  if (!company.companyName.trim() || !company.legalName.trim()) throw new Error('Billing company names are required.');
  if (!company.gstin.trim() || !company.pan.trim()) throw new Error('GSTIN and PAN are required.');
  if (!company.registeredAddress.state.trim()) throw new Error('Registered state is required.');
  if (!company.invoicePrefix.trim() || !company.invoiceTemplateId.trim()) throw new Error('Invoice prefix and approved template are required.');
  if (!Number.isInteger(company.invoiceTemplateVersion) || company.invoiceTemplateVersion < 1) throw new Error('Invoice template version must be a positive whole number.');
  if (!Number.isInteger(company.configuration.financialYearStartMonth) || company.configuration.financialYearStartMonth < 1 || company.configuration.financialYearStartMonth > 12) throw new Error('Financial-year start month must be between 1 and 12.');
  if (!Number.isInteger(company.configuration.invoiceSequencePadding) || company.configuration.invoiceSequencePadding < 1) throw new Error('Invoice sequence padding must be a positive whole number.');
};

class BillingService {
  async getBillingCompanies(): Promise<BillingCompany[]> {
    return billingRepository.getBillingCompanies();
  }

  async getFixedBillingCompany(): Promise<BillingCompany> {
    const companies = await billingRepository.getBillingCompanies();
    const company = companies.find((candidate) => normalizeState(candidate.legalName) === FIXED_BILLING_ENTITY_LEGAL_NAME);
    if (!company) throw new Error('Hire Huub People Solution Private Limited billing configuration was not found.');
    if (!company.isActive) throw new Error('Hire Huub People Solution Private Limited billing configuration is inactive.');
    return company;
  }

  async createBillingCompany(company: BillingCompanyInput): Promise<string> {
    validateBillingCompany(company);
    return billingRepository.createBillingCompany(company);
  }

  async updateBillingCompany(id: string, company: BillingCompanyInput): Promise<void> {
    if (!id.trim()) throw new Error('Billing company ID is required.');
    validateBillingCompany(company);
    await billingRepository.updateBillingCompany(id, company);
  }

  async resolveGst(billingCompanyId: string, clientBillingState: string): Promise<GstResolution> {
    const company = await this.getActiveBillingCompany(billingCompanyId);
    const normalizedClientState = normalizeState(clientBillingState);
    const normalizedBillingState = normalizeState(company.registeredAddress.state);
    if (!normalizedClientState) throw new Error('Client billing state is required from Workbench.');

    return {
      type: normalizedBillingState === normalizedClientState ? 'CGST_SGST' : 'IGST',
      billingCompanyState: company.registeredAddress.state,
      clientBillingState: clientBillingState.trim(),
    };
  }

  async resolveInvoiceTemplate(billingCompanyId: string): Promise<InvoiceTemplateResolution> {
    const company = await this.getActiveBillingCompany(billingCompanyId);
    return { billingCompanyId: company.id, templateId: company.invoiceTemplateId, templateVersion: company.invoiceTemplateVersion };
  }

  async generateInvoiceNumber(billingCompanyId: string, invoiceDate: Date): Promise<InvoiceNumber> {
    const company = await this.getActiveBillingCompany(billingCompanyId);
    return invoiceNumberService.generateNextInvoiceNumber(company.id, invoiceDate);
  }

  async previewNextInvoiceNumber(invoiceDate: Date = new Date(), knownCount = 0): Promise<string> {
    try {
      const company = await this.getFixedBillingCompany();
      return invoiceNumberService.previewNextInvoiceNumber(company.id, invoiceDate, knownCount);
    } catch {
      const year = invoiceDate.getFullYear();
      const nextSeq = knownCount + 1;
      return `HH${year}-${String(nextSeq).padStart(4, '0')}`;
    }
  }

  async generateCreditNoteNumber(creditNoteDate: Date): Promise<InvoiceNumber> {
    try {
      const company = await this.getFixedBillingCompany();
      return invoiceNumberService.generateNextCreditNoteNumber(company.id, creditNoteDate);
    } catch {
      const year = creditNoteDate.getFullYear();
      return {
        value: `HHCN${year}-0001`,
        financialYear: String(year),
        sequence: 1,
      };
    }
  }

  async previewNextCreditNoteNumber(knownCount = 0): Promise<string> {
    return invoiceNumberService.previewNextCreditNoteNumber(knownCount);
  }

  
  calculateAppliedCreditAmount(creditNotes: CreditNote[]): number {
    return roundMoney(
      creditNotes
        .filter((note) => note.status === 'Applied' && note.snapshot)
        .reduce((total, note) => total + note.snapshot!.grandTotal, 0),
    );
  }

  calculateOutstandingAmount(invoiceAmount: number, appliedCreditAmount: number, status: InvoiceStatus): number {
    if (status === 'Paid' || status === 'Cancelled' || status === 'Draft') return 0;
    return roundMoney(Math.max(0, invoiceAmount - appliedCreditAmount));
  }

  resolveInvoiceOutstanding(invoice: Invoice, creditNotes: CreditNote[]): InvoiceOutstandingBreakdown {
    const invoiceAmount = invoice.snapshot?.grandTotal ?? 0;
    const creditNotesApplied = this.calculateAppliedCreditAmount(creditNotes);
    return {
      invoiceAmount,
      creditNotesApplied,
      outstandingAmount: this.calculateOutstandingAmount(invoiceAmount, creditNotesApplied, invoice.status),
    };
  }

  private async getActiveBillingCompany(id: string): Promise<BillingCompany> {
    if (!id.trim()) throw new Error('Billing company ID is required.');
    const company = await billingRepository.getBillingCompany(id);
    if (!company) throw new Error('Billing company was not found.');
    if (!company.isActive) throw new Error('Billing company is inactive.');
    return company;
  }
}

export const billingService = new BillingService();
