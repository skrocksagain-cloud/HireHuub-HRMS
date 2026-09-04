import type { CompanySettings } from '../../types/Admin';

export interface OrganizationProvider {
  name?: string;
  brandName?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
  phone?: string;
  email?: string;
  website?: string;
  gstin?: string;
  pan?: string;
  cin?: string;
  bankName?: string;
  accountNumber?: string;
  ifsc?: string;
  branchName?: string;
  logo?: string;
  stamp?: string;
  signature?: string;
}

export interface EmployeeProvider {
  name?: string;
  code?: string;
  designation?: string;
  department?: string;
  manager?: string;
  reportingManager?: string;
  joiningDate?: string;
  employmentType?: string;
  workLocation?: string;
  email?: string;
  mobile?: string;
}

export interface CandidateProvider {
  name?: string;
  email?: string;
  phone?: string;
  role?: string;
  interviewDate?: string;
  interviewTime?: string;
  recruiterName?: string;
}

export interface ClientProvider {
  id?: string;
  name?: string;
  brandName?: string;
  gstin?: string;
  address?: string;
  email?: string;
}

export interface VendorProvider {
  id?: string;
  name?: string;
  address?: string;
  gstin?: string;
  email?: string;
  poNumber?: string;
}

export interface SalaryProvider {
  ctc?: string | number;
  basic?: string | number;
  hra?: string | number;
  specialAllowance?: string | number;
  gross?: string | number;
  pf?: string | number;
  esi?: string | number;
  ptax?: string | number;
  net?: string | number;
  amountInWords?: string;
}

export interface InvoiceProvider {
  number?: string;
  date?: string;
  amount?: string | number;
  gstAmount?: string | number;
  total?: string | number;
  amountInWords?: string;
  creditNoteNumber?: string;
  poNumber?: string;
}

export interface AttendanceProvider {
  presentDays?: string | number;
  totalDays?: string | number;
  percentage?: string | number;
}

export interface LeaveProvider {
  balance?: string | number;
  taken?: string | number;
}

export interface PerformanceProvider {
  rating?: string | number;
  comments?: string;
}

export interface PlaceholderContext {
  company?: Partial<CompanySettings>;
  organization?: OrganizationProvider;
  employee?: EmployeeProvider & { fullName?: string; employeeId?: string; ctc?: string | number; basicPay?: string | number; netPay?: string | number };
  candidate?: CandidateProvider;
  client?: ClientProvider;
  vendor?: VendorProvider;
  salary?: SalaryProvider;
  payroll?: SalaryProvider;
  invoice?: InvoiceProvider;
  finance?: InvoiceProvider;
  attendance?: AttendanceProvider;
  leave?: LeaveProvider;
  performance?: PerformanceProvider;
  additional?: Record<string, string | number>;
}

class PlaceholderEngine {
  /**
   * Resolves and extracts complete placeholder dictionary from live ERP context.
   * Supports both universal `{{namespace.key}}` and flat `{{key}}` placeholder syntaxes.
   */
  resolvePlaceholders(context: PlaceholderContext): Record<string, string> {
    const comp = context.company || {};
    const org = context.organization || {};
    const emp = context.employee || {};
    const cand = context.candidate || {};
    const cli = context.client || {};
    const ven = context.vendor || {};
    const sal = context.salary || context.payroll || {};
    const inv = context.invoice || context.finance || {};
    const att = context.attendance || {};
    const lea = context.leave || {};
    const perf = context.performance || {};
    const add = context.additional || {};

    const companyName = org.name || comp.companyName || '';
    const companyAddress = org.address || comp.address || '';
    const companyPhone = org.phone || comp.phone || '';
    const companyEmail = org.email || comp.email || '';
    const companyGstin = org.gstin || comp.gstin || '';
    const companyPan = org.pan || comp.pan || '';
    const companyCin = org.cin || comp.cin || '';
    const companyBank = org.bankName || comp.bankDetails?.bankName || '';
    const companyAccount = org.accountNumber || comp.bankDetails?.accountNumber || '';
    const companyIfsc = org.ifsc || comp.bankDetails?.ifscCode || '';
    const companyBranch = org.branchName || comp.bankDetails?.branchName || '';
    const companyLogo = org.logo || comp.logoUrl || '';
    const companyStamp = org.stamp || comp.stampUrl || '';
    const companySignature = org.signature || comp.signatures?.[0]?.signatureUrl || '';

    const empName = emp.name || emp.fullName || '';
    const empCode = emp.code || emp.employeeId || '';
    const empDesig = emp.designation || '';
    const empDept = emp.department || '';
    const empManager = emp.manager || '';
    const empJoining = emp.joiningDate || '';
    const empType = emp.employmentType || '';
    const empLocation = emp.workLocation || '';

    const salCtc = String(sal.ctc || emp.ctc || '');
    const salBasic = String(sal.basic || emp.basicPay || '');
    const salHra = String(sal.hra || '');
    const salGross = String(sal.gross || emp.ctc || '');
    const salNet = String(sal.net || emp.netPay || '');
    const salPf = String(sal.pf || '');
    const salEsi = String(sal.esi || '');
    const salPtax = String(sal.ptax || '');

    const invNum = inv.number || '';
    const invDate = inv.date || '';
    const invAmount = String(inv.amount || '');
    const invGst = String(inv.gstAmount || '');
    const invTotal = String(inv.total || '');
    const invWords = inv.amountInWords || '';

    const dict: Record<string, string> = {
      // 1. Universal Namespace Syntax {{namespace.key}}
      'company.name': companyName,
      'company.address': companyAddress,
      'company.phone': companyPhone,
      'company.email': companyEmail,
      'company.gstin': companyGstin,
      'company.pan': companyPan,
      'company.cin': companyCin,
      'company.bank_name': companyBank,
      'company.account_number': companyAccount,
      'company.ifsc': companyIfsc,
      'company.branch_name': companyBranch,
      'company.logo': companyLogo,
      'company.stamp': companyStamp,
      'company.signature': companySignature,

      'organization.name': companyName,
      'organization.address': companyAddress,

      'employee.name': empName,
      'employee.code': empCode,
      'employee.designation': empDesig,
      'employee.department': empDept,
      'employee.manager': empManager,
      'employee.joining_date': empJoining,
      'employee.employment_type': empType,
      'employee.work_location': empLocation,
      'employee.email': emp.email || '',
      'employee.mobile': emp.mobile || '',

      'department.name': empDept,

      'candidate.name': cand.name || '',
      'candidate.email': cand.email || '',
      'candidate.phone': cand.phone || '',
      'candidate.role': cand.role || '',
      'candidate.interview_date': cand.interviewDate || '',
      'candidate.recruiter_name': cand.recruiterName || '',

      'client.name': cli.name || '',
      'client.brand': cli.brandName || cli.name || '',
      'client.gstin': cli.gstin || '',
      'client.address': cli.address || '',
      'client.email': cli.email || '',

      'vendor.name': ven.name || '',
      'vendor.address': ven.address || '',
      'vendor.gstin': ven.gstin || '',
      'vendor.po_number': ven.poNumber || '',

      'salary.ctc': salCtc,
      'salary.basic': salBasic,
      'salary.hra': salHra,
      'salary.gross': salGross,
      'salary.net': salNet,
      'salary.pf': salPf,
      'salary.esi': salEsi,
      'salary.ptax': salPtax,
      'salary.amount_in_words': sal.amountInWords || '',

      'payroll.basic': salBasic,
      'payroll.gross': salGross,
      'payroll.net': salNet,

      'invoice.number': invNum,
      'invoice.date': invDate,
      'invoice.amount': invAmount,
      'invoice.gst_amount': invGst,
      'invoice.total': invTotal,
      'invoice.amount_in_words': invWords,
      'invoice.po_number': inv.poNumber || '',

      'attendance.present': String(att.presentDays || ''),
      'attendance.total': String(att.totalDays || ''),
      'attendance.percentage': String(att.percentage || ''),

      'leave.balance': String(lea.balance || ''),
      'leave.taken': String(lea.taken || ''),

      'performance.rating': String(perf.rating || ''),
      'performance.comments': perf.comments || '',

      'date': new Date().toLocaleDateString(),

      // 2. Backward Compatibility Flat Keys (snake_case)
      company_name: companyName,
      brand_name: org.brandName || comp.brandName || '',
      company_address: companyAddress,
      gstin: companyGstin,
      pan: companyPan,
      cin: companyCin,
      company_email: companyEmail,
      company_phone: companyPhone,
      website: org.website || comp.website || '',
      bank_name: companyBank,
      account_number: companyAccount,
      ifsc: companyIfsc,
      branch_name: companyBranch,
      logo: companyLogo,
      stamp: companyStamp,
      signature: companySignature,

      employee_name: empName,
      employee_id: empCode,
      designation: empDesig,
      department: empDept,
      reporting_manager: empManager,
      joining_date: empJoining,
      employment_type: empType,
      salary: salGross,
      basic_pay: salBasic,
      net_pay: salNet,

      candidate_name: cand.name || '',
      candidate_email: cand.email || '',
      candidate_phone: cand.phone || '',
      interview_date: cand.interviewDate || '',
      interview_time: cand.interviewTime || '',
      recruiter_name: cand.recruiterName || '',

      client_name: cli.name || '',
      client_brand: cli.brandName || cli.name || '',
      client_gstin: cli.gstin || '',
      client_address: cli.address || '',
      invoice_number: invNum,
      invoice_date: invDate,
      invoice_amount: invAmount,
      gst_amount: invGst,
      grand_total: invTotal,
      amount_in_words: invWords,

      // 3. PascalCase Tokens
      InvoiceNumber: invNum,
      InvoiceDate: invDate,
      ClientName: cli.name || '',
      ClientGSTIN: cli.gstin || '',
      ClientAddress: cli.address || '',
      CompanyName: companyName,
      CompanyGSTIN: companyGstin,
      CompanyPAN: companyPan,
      CompanyCIN: companyCin,
      CompanyAddress: companyAddress,
      TaxableAmount: invAmount,
      GSTAmount: invGst,
      GrandTotal: invTotal,
      AmountInWords: invWords,
      BankName: companyBank,
      AccountNumber: companyAccount,
      IFSC: companyIfsc,
      BranchName: companyBranch,
    };

    // Merge custom dynamic context keys
    Object.entries(add).forEach(([key, val]) => {
      dict[key.toLowerCase()] = String(val);
      dict[key] = String(val);
    });

    return dict;
  }

  /**
   * Replaces all {{namespace.key}} or {{key}} inside a template string.
   */
  replaceInString(templateText: string, dictionary: Record<string, string>): string {
    if (!templateText) return '';
    return templateText.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, key) => {
      const lowerKey = key.toLowerCase();
      if (dictionary[key] !== undefined) return dictionary[key];
      if (dictionary[lowerKey] !== undefined) return dictionary[lowerKey];
      return match;
    });
  }
}

export const placeholderEngine = new PlaceholderEngine();

