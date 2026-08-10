import { billingRepository } from '../repositories/billingRepository';
import { adminService } from '../../../../services/admin/adminService';
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
    const adminCompany = await adminService.getCompanySettings();
    const invoiceTemplate = await adminService.getDocumentTemplateByType('invoice');

    const missingFields: string[] = [];
    if (!adminCompany?.companyName) missingFields.push('Company Name');
    if (!adminCompany?.gstin) missingFields.push('GSTIN');
    if (!adminCompany?.address) missingFields.push('Company Registered Address');
    if (!adminCompany?.bankDetails?.accountNumber) missingFields.push('Bank Account Number');
    if (!adminCompany?.pan) missingFields.push('PAN');
    if (!adminCompany?.registeredState) missingFields.push('Registered State');
    if (!adminCompany?.postalCode) missingFields.push('Postal Code');
    if (!adminCompany?.invoicePrefix) missingFields.push('Invoice Prefix');
    if (!invoiceTemplate) missingFields.push('Active Invoice Document Template');

    if (missingFields.length > 0) {
      throw new Error(
        `Invoice cannot be generated.\nMissing in Administration -> Management -> Company Settings:\n• ${missingFields.join('\n• ')}`
      );
    }

    return {
      id: adminCompany.id,
      companyName: adminCompany.companyName,
      legalName: adminCompany.companyName,
      gstin: adminCompany.gstin,
      pan: adminCompany.pan,
      registeredAddress: {
        line1: adminCompany.address,
        city: adminCompany.registeredCity || '',
        state: adminCompany.registeredState!,
        postalCode: adminCompany.postalCode!,
        country: 'India',
      },
      bankDetails: {
        bankName: adminCompany.bankDetails.bankName,
        accountNumber: adminCompany.bankDetails.accountNumber,
        ifscCode: adminCompany.bankDetails.ifscCode,
        branchName: adminCompany.bankDetails.branchName,
        accountHolderName: adminCompany.companyName,
      },
      invoicePrefix: adminCompany.invoicePrefix!,
      invoiceTemplateId: invoiceTemplate!.id,
      invoiceTemplateVersion: invoiceTemplate!.version || 1,
      authorizedSignatory: adminCompany.signatures?.find((signature) => signature.isActive)?.name || '',
      isActive: true,
      configuration: {
        invoiceSequencePadding: 4,
        financialYearStartMonth: adminCompany.financialYearStartMonth || 1,
      },
      createdAt: new Date().toISOString() as any,
      updatedAt: new Date().toISOString() as any,
    };
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
    const company = await this.getFixedBillingCompany();
    return invoiceNumberService.previewNextInvoiceNumber(company.id, invoiceDate, knownCount);
  }

  async generateCreditNoteNumber(creditNoteDate: Date): Promise<InvoiceNumber> {
    const company = await this.getFixedBillingCompany();
    return invoiceNumberService.generateNextCreditNoteNumber(company.id, creditNoteDate);
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
    if (!id.trim() || id === 'comp-main') {
      return this.getFixedBillingCompany();
    }
    const company = await billingRepository.getBillingCompany(id);
    if (!company) {
      return this.getFixedBillingCompany();
    }
    if (!company.isActive) throw new Error('Billing company is inactive.');
    return company;
  }
}

export const billingService = new BillingService();
