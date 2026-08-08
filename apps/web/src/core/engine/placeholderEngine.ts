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
      company_name: comp.companyName || 'Hire Huub Pvt Ltd',
      brand_name: comp.brandName || 'Hire Huub One',
      company_address: comp.address || 'Suite 401, Apex Tech Hub, Baner, Pune, MH 411045',
      gstin: comp.gstin || '27AAAAA0000A1Z5',
      pan: comp.pan || 'AAAAA0000A',
      cin: comp.cin || 'U72900PN2026PTC000000',
      company_email: comp.email || 'contact@hirehuub.com',
      company_phone: comp.phone || '+91 98765 43210',
      website: comp.website || 'https://hirehuub.com',
      bank_name: comp.bankDetails?.bankName || 'HDFC Bank',
      account_number: comp.bankDetails?.accountNumber || '50200012345678',
      ifsc: comp.bankDetails?.ifscCode || 'HDFC0000123',
      branch_name: comp.bankDetails?.branchName || 'Baner Branch',
      logo: comp.logoUrl || '',
      stamp: comp.stampUrl || '',
      signature: comp.signatures?.[0]?.signatureUrl || '',

      // Employee & HR Placeholders
      employee_name: emp.fullName || [emp.firstName, emp.lastName].filter(Boolean).join(' ') || 'Valued Team Member',
      employee_id: emp.employeeId || 'HH0001',
      designation: emp.designation || 'Senior Software Engineer',
      department: emp.department || 'Engineering',
      reporting_manager: emp.reportingManager || 'Rahul Sharma (VP Staffing)',
      joining_date: emp.joiningDate || new Date().toLocaleDateString(),
      employment_type: emp.employmentType || 'Full-Time',
      salary: emp.ctc ? String(emp.ctc) : '12,00,000 INR',
      basic_pay: emp.basicPay ? String(emp.basicPay) : '50,000 INR',
      net_pay: emp.netPay ? String(emp.netPay) : '85,000 INR',
      date: new Date().toLocaleDateString(),

      // Recruitment & Candidate Placeholders
      candidate_name: cand.name || 'Candidate Name',
      candidate_email: cand.email || 'candidate@example.com',
      candidate_phone: cand.phone || '+91 98765 00000',
      interview_date: cand.interviewDate || new Date().toLocaleDateString(),
      interview_time: cand.interviewTime || '11:00 AM IST',
      recruiter_name: cand.recruiterName || 'HR Talent Acquisition',

      // Client & Finance Placeholders
      client_name: cli.name || 'Valued Client',
      client_brand: cli.brandName || cli.name || 'Valued Client',
      client_gstin: cli.gstin || '27BBBBB0000B1Z5',
      client_address: cli.address || 'Corporate Office',
      invoice_number: fin.invoiceNumber || 'HH2026-0001',
      invoice_date: fin.invoiceDate || new Date().toLocaleDateString(),
      invoice_amount: fin.invoiceAmount ? String(fin.invoiceAmount) : '1,00,000',
      gst_amount: fin.gstAmount ? String(fin.gstAmount) : '18,000',
      grand_total: fin.grandTotal ? String(fin.grandTotal) : '1,18,000',
      amount_in_words: fin.amountInWords || 'One Lakh Eighteen Thousand Rupees Only',
      credit_note_number: fin.creditNoteNumber || 'CN2026-0001',
    };

    // Merge any custom module placeholders dynamically
    Object.entries(add).forEach(([key, val]) => {
      dict[key.toLowerCase()] = String(val);
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
