import type { CompanySettings } from '../../types/Admin';

export interface PlaceholderContext {
  company?: Partial<CompanySettings>;
  employee?: {
    employeeId?: string;
    fullName?: string;
    firstName?: string;
    lastName?: string;
    designation?: string;
    department?: string;
    reportingManager?: string;
    joiningDate?: string;
    employmentType?: string;
    ctc?: string | number;
    basicPay?: string | number;
    netPay?: string | number;
    email?: string;
    mobile?: string;
  };
  candidate?: {
    id?: string;
    name?: string;
    email?: string;
    phone?: string;
    role?: string;
    interviewDate?: string;
    interviewTime?: string;
    recruiterName?: string;
  };
  client?: {
    id?: string;
    name?: string;
    brandName?: string;
    gstin?: string;
    address?: string;
    email?: string;
  };
  finance?: {
    invoiceNumber?: string;
    invoiceDate?: string;
    invoiceAmount?: string | number;
    gstAmount?: string | number;
    grandTotal?: string | number;
    amountInWords?: string;
    creditNoteNumber?: string;
  };
  additional?: Record<string, string | number>;
}

class PlaceholderEngine {
  /**
   * Resolves and extracts complete placeholder dictionary from live ERP context
   */
  resolvePlaceholders(context: PlaceholderContext): Record<string, string> {
    const comp = context.company || {};
    const emp = context.employee || {};
    const cand = context.candidate || {};
    const cli = context.client || {};
    const fin = context.finance || {};
    const add = context.additional || {};

    const dict: Record<string, string> = {
      // Company & Branding Placeholders
      company_name: comp.companyName || '', brand_name: comp.brandName || '', company_address: comp.address || '',
      gstin: comp.gstin || '', pan: comp.pan || '', cin: comp.cin || '', company_email: comp.email || '',
      company_phone: comp.phone || '', website: comp.website || '', bank_name: comp.bankDetails?.bankName || '',
      account_number: comp.bankDetails?.accountNumber || '', ifsc: comp.bankDetails?.ifscCode || '', branch_name: comp.bankDetails?.branchName || '',
      logo: comp.logoUrl || '',
      stamp: comp.stampUrl || '',
      signature: comp.signatures?.[0]?.signatureUrl || '',

      // Employee & HR Placeholders
      employee_name: emp.fullName || [emp.firstName, emp.lastName].filter(Boolean).join(' '), employee_id: emp.employeeId || '',
      designation: emp.designation || '', department: emp.department || '', reporting_manager: emp.reportingManager || '',
      joining_date: emp.joiningDate || '', employment_type: emp.employmentType || '', salary: emp.ctc ? String(emp.ctc) : '',
      basic_pay: emp.basicPay ? String(emp.basicPay) : '', net_pay: emp.netPay ? String(emp.netPay) : '',
      date: new Date().toLocaleDateString(),

      // Recruitment & Candidate Placeholders
      candidate_name: cand.name || '', candidate_email: cand.email || '', candidate_phone: cand.phone || '',
      interview_date: cand.interviewDate || '', interview_time: cand.interviewTime || '', recruiter_name: cand.recruiterName || '',

      // Client & Finance Placeholders
      client_name: cli.name || '', client_brand: cli.brandName || cli.name || '', client_gstin: cli.gstin || '', client_address: cli.address || '',
      invoice_number: fin.invoiceNumber || '', invoice_date: fin.invoiceDate || '', invoice_amount: fin.invoiceAmount ? String(fin.invoiceAmount) : '',
      gst_amount: fin.gstAmount ? String(fin.gstAmount) : '', grand_total: fin.grandTotal ? String(fin.grandTotal) : '',
      amount_in_words: fin.amountInWords || '', credit_note_number: fin.creditNoteNumber || '',

      // PascalCase invoice template tokens (match {{Key}} in uploaded Excel templates)
      InvoiceNumber: fin.invoiceNumber || '',
      InvoiceDate: fin.invoiceDate || '',
      PONumber: '',
      ClientName: cli.name || '',
      ClientGSTIN: cli.gstin || '',
      ClientGST: cli.gstin || '',
      ClientAddress: cli.address || '',
      ClientState: '',
      BillingAddress: cli.address || '',
      BillingName: cli.name || '',
      CompanyName: comp.companyName || '',
      CompanyGSTIN: comp.gstin || '',
      CompanyGST: comp.gstin || '',
      CompanyPAN: comp.pan || '',
      CompanyCIN: comp.cin || '',
      CompanyAddress: comp.address || '',
      TaxableAmount: fin.invoiceAmount ? String(fin.invoiceAmount) : '',
      Subtotal: fin.invoiceAmount ? String(fin.invoiceAmount) : '',
      CGST: '',
      SGST: '',
      IGST: '',
      GSTAmount: fin.gstAmount ? String(fin.gstAmount) : '', GrandTotal: fin.grandTotal ? String(fin.grandTotal) : '',
      AmountInWords: fin.amountInWords || '', BankName: comp.bankDetails?.bankName || '',
      AccountNumber: comp.bankDetails?.accountNumber || '', AccountHolderName: comp.companyName || '',
      IFSC: comp.bankDetails?.ifscCode || '', BranchName: comp.bankDetails?.branchName || '',
      AuthorisedSignatory: comp.signatures?.[0]?.name || '', AuthorizedSignatory: comp.signatures?.[0]?.name || '',
      GSTType: '',
      QRCode: '',
      CompanyLogo: comp.logoUrl || '',
      LineItems: '',
    };

    // Merge any custom module placeholders dynamically
    Object.entries(add).forEach(([key, val]) => {
      dict[key.toLowerCase()] = String(val);
      // Also register as-is to support PascalCase invoice template tokens
      dict[key] = String(val);
    });

    return dict;
  }

  /**
   * Replaces all {{placeholder}} keys inside a template string
   */
  replaceInString(templateText: string, dictionary: Record<string, string>): string {
    if (!templateText) return '';
    return templateText.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
      const lowerKey = key.toLowerCase();
      return dictionary[lowerKey] !== undefined ? dictionary[lowerKey] : `{{${key}}}`;
    });
  }
}

export const placeholderEngine = new PlaceholderEngine();
