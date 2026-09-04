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
  gross?: string | number;
  net?: string | number;
  pf?: string | number;
  esi?: string | number;
  ptax?: string | number;
  amountInWords?: string;
}

export interface InvoiceProvider {
  number?: string;
  date?: string;
  amount?: string | number;
  gstAmount?: string | number;
  total?: string | number;
  amountInWords?: string;
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
  company?: Record<string, unknown>;
  organization?: OrganizationProvider;
  employee?: EmployeeProvider & Record<string, unknown>;
  candidate?: CandidateProvider & Record<string, unknown>;
  client?: ClientProvider & Record<string, unknown>;
  vendor?: VendorProvider & Record<string, unknown>;
  salary?: SalaryProvider & Record<string, unknown>;
  payroll?: SalaryProvider & Record<string, unknown>;
  invoice?: InvoiceProvider & Record<string, unknown>;
  finance?: InvoiceProvider & Record<string, unknown>;
  attendance?: AttendanceProvider & Record<string, unknown>;
  leave?: LeaveProvider & Record<string, unknown>;
  performance?: PerformanceProvider & Record<string, unknown>;
  additional?: Record<string, unknown>;
}

class BackendPlaceholderEngine {
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

    const companyName = String(org.name || comp.companyName || comp.name || '');
    const companyAddress = String(org.address || comp.address || '');
    const companyPhone = String(org.phone || comp.phone || '');
    const companyEmail = String(org.email || comp.email || '');
    const companyGstin = String(org.gstin || comp.gstin || '');
    const companyPan = String(org.pan || comp.pan || '');
    const companyCin = String(org.cin || comp.cin || '');
    const companyBank = String(org.bankName || (comp.bankDetails as Record<string, string>)?.bankName || '');
    const companyAccount = String(org.accountNumber || (comp.bankDetails as Record<string, string>)?.accountNumber || '');
    const companyIfsc = String(org.ifsc || (comp.bankDetails as Record<string, string>)?.ifscCode || '');
    const companyBranch = String(org.branchName || (comp.bankDetails as Record<string, string>)?.branchName || '');
    const companyLogo = String(org.logo || comp.logoUrl || '');
    const companyStamp = String(org.stamp || comp.stampUrl || '');

    const empName = String(emp.name || emp.fullName || '');
    const empCode = String(emp.code || emp.employeeId || '');
    const empDesig = String(emp.designation || '');
    const empDept = String(emp.department || '');
    const empManager = String(emp.manager || emp.reportingManager || '');
    const empJoining = String(emp.joiningDate || emp.joining_date || '');
    const empType = String(emp.employmentType || '');
    const empLocation = String(emp.workLocation || '');

    const salCtc = String(sal.ctc || emp.ctc || '');
    const salBasic = String(sal.basic || emp.basicPay || '');
    const salHra = String(sal.hra || '');
    const salGross = String(sal.gross || emp.ctc || '');
    const salNet = String(sal.net || emp.netPay || '');

    const invNum = String(inv.number || '');
    const invDate = String(inv.date || '');
    const invTotal = String(inv.total || inv.grandTotal || '');

    const dict: Record<string, string> = {
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

      'department.name': empDept,

      'candidate.name': String(cand.name || ''),
      'candidate.email': String(cand.email || ''),
      'candidate.phone': String(cand.phone || ''),
      'candidate.role': String(cand.role || ''),

      'client.name': String(cli.name || ''),
      'client.gstin': String(cli.gstin || ''),
      'client.address': String(cli.address || ''),

      'vendor.name': String(ven.name || ''),
      'vendor.address': String(ven.address || ''),
      'vendor.gstin': String(ven.gstin || ''),

      'salary.ctc': salCtc,
      'salary.basic': salBasic,
      'salary.hra': salHra,
      'salary.gross': salGross,
      'salary.net': salNet,

      'invoice.number': invNum,
      'invoice.date': invDate,
      'invoice.total': invTotal,

      'attendance.present': String(att.presentDays || ''),
      'leave.balance': String(lea.balance || ''),
      'performance.rating': String(perf.rating || ''),

      date: new Date().toLocaleDateString(),

      // Flat aliases for backwards compatibility
      company_name: companyName,
      company_address: companyAddress,
      employee_name: empName,
      employee_id: empCode,
      designation: empDesig,
      department: empDept,
      joining_date: empJoining,
      candidate_name: String(cand.name || ''),
      candidate_email: String(cand.email || ''),
      candidate_phone: String(cand.phone || ''),
      invoice_number: invNum,
      grand_total: invTotal,
    };

    Object.entries(add).forEach(([key, val]) => {
      dict[key.toLowerCase()] = String(val ?? '');
      dict[key] = String(val ?? '');
    });

    return dict;
  }
}

export const backendPlaceholderEngine = new BackendPlaceholderEngine();
