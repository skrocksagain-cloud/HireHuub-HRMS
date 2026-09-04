"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.backendPlaceholderEngine = void 0;
class BackendPlaceholderEngine {
    resolvePlaceholders(context) {
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
        const companyBank = String(org.bankName || comp.bankDetails?.bankName || '');
        const companyAccount = String(org.accountNumber || comp.bankDetails?.accountNumber || '');
        const companyIfsc = String(org.ifsc || comp.bankDetails?.ifscCode || '');
        const companyBranch = String(org.branchName || comp.bankDetails?.branchName || '');
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
        const dict = {
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
exports.backendPlaceholderEngine = new BackendPlaceholderEngine();
//# sourceMappingURL=placeholderEngine.js.map