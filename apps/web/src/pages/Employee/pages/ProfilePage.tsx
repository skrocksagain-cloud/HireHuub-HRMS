import { useState, useEffect } from 'react';
import { User, ShieldCheck, CreditCard, MapPin, CheckCircle2, AlertCircle, Save, Eye, EyeOff, FileText, Download, Mail } from 'lucide-react';

import DashboardLayout from '../../../layouts/DashboardLayout';
import PageHeader from '../../../ui/PageHeader';
import { useAuth } from '../../../context/AuthContext';
import { employeeService } from '../services/employeeService';
import type { Employee } from '../types/Employee';
import { payslipService, type PayslipDisplayItem } from '../../../services/payroll/payslipService';

export default function ProfilePage() {
  const { user } = useAuth();

  const [employee, setEmployee] = useState<Employee | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Editable Form Fields
  const [email, setEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  const [address, setAddress] = useState('');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [aadhaarNumber, setAadhaarNumber] = useState('');
  const [panNumber, setPanNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [ifscCode, setIfscCode] = useState('');

  // Masking Toggle States
  const [showAadhaar, setShowAadhaar] = useState(false);
  const [showPan, setShowPan] = useState(false);
  const [showAccount, setShowAccount] = useState(false);

  // Self-Service Payslips Tab State
  const [activeTab, setActiveTab] = useState<'details' | 'payslips'>('details');
  const [payslips, setPayslips] = useState<PayslipDisplayItem[]>([]);
  const [loadingPayslips, setLoadingPayslips] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const empId = user?.employeeId || user?.id || '';

    const fetchProfile = async () => {
      try {
        setLoading(true);
        let empRecord: Employee | null = null;
        if (empId) {
          empRecord = await employeeService.getEmployeeById(empId);
        }

        if (!empRecord) {
          const allEmps = await employeeService.getEmployees();
          empRecord = allEmps.find((e) => e.email === user?.email || e.id === user?.id) || allEmps[0] || null;
        }

        if (isMounted && empRecord) {
          setEmployee(empRecord);
          setEmail(empRecord.email || '');
          setMobileNumber(empRecord.mobileNumber || '');
          setAddress(empRecord.address || '');
          setFatherName(empRecord.fatherName || '');
          setMotherName(empRecord.motherName || '');
          setDateOfBirth(empRecord.dateOfBirth || '');
          setAadhaarNumber(empRecord.aadhaarNumber || '');
          setPanNumber(empRecord.panNumber || '');
          setBankName(empRecord.bankName || '');
          setBranchName(empRecord.branchName || '');
          setAccountNumber(empRecord.accountNumber || '');
          setIfscCode(empRecord.ifscCode || '');

          // Load Self-Service Payslips securely filtered by employeeId
          const resolvedEmpId = (empRecord.employeeId || empRecord.employeeCode || empRecord.id || '').trim();
          setLoadingPayslips(true);
          const pList = await payslipService.getPayslipsForEmployee(resolvedEmpId);
          if (isMounted) setPayslips(pList);
        }
      } catch (caught) {
        if (isMounted) {
          setErrorMsg(caught instanceof Error ? caught.message : 'Failed to load profile.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
          setLoadingPayslips(false);
        }
      }
    };

    void fetchProfile();
    return () => {
      isMounted = false;
    };
  }, [user]);

  const handleDownloadPayslip = async (p: PayslipDisplayItem) => {
    try {
      setDownloadingId(p.id);
      setErrorMsg(null);
      await payslipService.downloadPayslipPDF(p.storagePath, `Payslip_${p.employeeId}_${p.month}.pdf`);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Payslip PDF is unavailable. Please contact HR.');
    } finally {
      setDownloadingId(null);
    }
  };

  // Masking Helpers
  const formatMaskedAadhaar = (val: string) => {
    const clean = val.replace(/\s+/g, '');
    if (clean.length < 4) return clean || 'Not Provided';
    return `XXXX XXXX ${clean.slice(-4)}`;
  };

  const formatMaskedPan = (val: string) => {
    const clean = val.trim();
    if (clean.length < 4) return clean || 'Not Provided';
    return `XXXXX${clean.slice(-4).toUpperCase()}`;
  };

  const formatMaskedAccount = (val: string) => {
    const clean = val.trim();
    if (clean.length < 4) return clean || 'Not Provided';
    return `******${clean.slice(-4)}`;
  };

  
  
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!employee || !employee.id) return;

    // Date of Birth Validation (not in future)
    if (dateOfBirth) {
      const selectedDOB = new Date(dateOfBirth);
      const today = new Date();
      if (selectedDOB > today) {
        setErrorMsg('Date of Birth cannot be a future date.');
        return;
      }
    }

    try {
      setSaving(true);
      setErrorMsg(null);
      setStatusMsg(null);

      const updatedPayload: Partial<Employee> = {
        email: email.trim(),
        mobileNumber: mobileNumber.trim(),
        address: address.trim(),
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        dateOfBirth: dateOfBirth,
        aadhaarNumber: aadhaarNumber.trim(),
        panNumber: panNumber.trim(),
        bankName: bankName.trim(),
        branchName: branchName.trim(),
        accountNumber: accountNumber.trim(),
        ifscCode: ifscCode.trim(),
      };

      await employeeService.updateEmployeeFields(employee.id, updatedPayload);

      setEmployee({ ...employee, ...updatedPayload });
      setStatusMsg('Profile details saved successfully! Employee master updated.');
    } catch (caught) {
      setErrorMsg(caught instanceof Error ? caught.message : 'Failed to save profile changes.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-xs text-slate-500 font-medium">Loading Employee Profile…</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-5xl mx-auto font-sans">
        <PageHeader
          title="Employee Profile"
          description="Manage your personal details, bank information, and official payslips."
        />

        {statusMsg && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-2xl flex items-center gap-2">
            <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
            <div>{statusMsg}</div>
          </div>
        )}

        {errorMsg && (
          <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-2xl flex items-center gap-2">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <div>{errorMsg}</div>
          </div>
        )}

        {/* Profile Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'details'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <User size={14} /> Personal & Bank Details
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payslips')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-2 ${
              activeTab === 'payslips'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileText size={14} /> Payslips ({payslips.length})
          </button>
        </div>

        {activeTab === 'payslips' ? (
          /* Payslips Register Tab */
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                  <FileText size={16} className="text-emerald-600" /> My Official Payslips
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Generated monthly salary disbursement statements.
                </p>
              </div>
              <div className="text-xs font-bold text-slate-500 font-mono">
                Total: {payslips.length} Statements
              </div>
            </div>

            {loadingPayslips ? (
              <div className="p-8 text-center text-xs text-slate-400">Loading payslips…</div>
            ) : payslips.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-xl font-medium">
                No payslips available.
              </div>
            ) : (
              <div className="overflow-x-auto border border-slate-200 rounded-xl">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-200">
                    <tr>
                      <th className="p-3">Month</th>
                      <th className="p-3 text-right">Gross</th>
                      <th className="p-3 text-right">Deductions</th>
                      <th className="p-3 text-right">Net Pay</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {payslips.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-50/80">
                        <td className="p-3 font-bold text-slate-800">{p.fullMonthName}</td>
                        <td className="p-3 text-right font-mono text-slate-600">
                          ₹{p.gross.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-right font-mono text-slate-600">
                          ₹{p.deductions.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-emerald-700">
                          ₹{p.netPay.toLocaleString('en-IN')}
                        </td>
                        <td className="p-3 text-center">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {p.status}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            disabled={downloadingId === p.id}
                            onClick={() => void handleDownloadPayslip(p)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl font-bold text-[11px] transition flex items-center gap-1.5 mx-auto disabled:opacity-50"
                          >
                            <Download size={12} />
                            {downloadingId === p.id ? 'Downloading…' : 'Download PDF'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : (
          /* Personal & Bank Details Tab */
          <form onSubmit={handleSaveProfile} className="space-y-6">
            {/* Auto Read-Only Fields */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-4">
              <div className="font-bold text-xs text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <ShieldCheck size={16} className="text-emerald-600" /> System Managed Master Record (Read-Only)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Employee Name</label>
                  <input
                    type="text"
                    value={employee?.fullName || user?.name || ''}
                    readOnly
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-xs font-bold text-slate-700 cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Employee ID / Code</label>
                  <input
                    type="text"
                    value={employee?.employeeId || employee?.employeeCode || ''}
                    readOnly
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-xs font-mono font-bold text-slate-700 cursor-not-allowed"
                  />
                </div>
              
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Joining Date</label>
                  <input
                    type="date"
                    value={employee?.joiningDate || ''}
                    readOnly
                    className="w-full rounded-xl border border-slate-200 bg-slate-100 p-2.5 text-xs font-bold text-slate-700 cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <Mail size={16} className="text-emerald-600" /> Contact Details
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Email Address (Profile)</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile Number</label>
                  <input
                    type="tel"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Personal Details */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <MapPin size={16} className="text-emerald-600" /> Personal Profile & Family Details
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Residential Address</label>
                  <textarea
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Enter complete residential address"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Father's Name</label>
                  <input
                    type="text"
                    value={fatherName} onChange={(e) => setFatherName(e.target.value)} placeholder="Enter Father's Name" className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mother's Name</label>
                  <input
                    type="text"
                    value={motherName} onChange={(e) => setMotherName(e.target.value)} placeholder="Enter Mother's Name" className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={dateOfBirth} onChange={(e) => setDateOfBirth(e.target.value)} className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Identity & Bank Information */}
            <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-xs">
              <div className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-2 border-b border-slate-100 pb-3">
                <CreditCard size={16} className="text-emerald-600" /> Identity & Bank Account Details
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Aadhaar Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Aadhaar Number</label>
                    <button
                      type="button"
                      onClick={() => setShowAadhaar(!showAadhaar)}
                      className="text-[11px] font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      {showAadhaar ? <EyeOff size={12} /> : <Eye size={12} />} {showAadhaar ? 'Mask' : 'Unmask'}
                    </button>
                  </div>
                  {showAadhaar ? (
                    <input
                      type="text"
                      aria-label="Aadhaar Number"
                      value={aadhaarNumber} onChange={(e) => setAadhaarNumber(e.target.value)} placeholder="12-digit Aadhaar Number" className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-mono text-slate-800 focus:border-emerald-500 focus:outline-none"
                    />
                  ) : (
                    <input
                      type="text"
                      aria-label="Masked Aadhaar Number"
                      value={formatMaskedAadhaar(aadhaarNumber)}
                      readOnly
                      onClick={() => setShowAadhaar(true)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-mono text-slate-800 cursor-pointer"
                    />
                  )}
                </div>

                {/* PAN Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">PAN Number</label>
                    <button
                      type="button"
                      onClick={() => setShowPan(!showPan)}
                      className="text-[11px] font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      {showPan ? <EyeOff size={12} /> : <Eye size={12} />} {showPan ? 'Mask' : 'Unmask'}
                    </button>
                  </div>
                  {showPan ? (
                    <input
                      type="text"
                      aria-label="PAN Number"
                      value={panNumber} onChange={(e) => setPanNumber(e.target.value.toUpperCase())} placeholder="10-digit PAN Number" className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-mono uppercase text-slate-800 focus:border-emerald-500 focus:outline-none"
                    />
                  ) : (
                    <input
                      type="text"
                      aria-label="Masked PAN Number"
                      value={formatMaskedPan(panNumber)}
                      readOnly
                      onClick={() => setShowPan(true)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-mono uppercase text-slate-800 cursor-pointer"
                    />
                  )}
                </div>

                {/* Bank Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bank Name</label>
                  <input
                    type="text"
                    aria-label="Bank Name"
                    value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="e.g. HDFC Bank" className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Branch Name */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Branch Name</label>
                  <input
                    type="text"
                    aria-label="Branch Name"
                    value={branchName} onChange={(e) => setBranchName(e.target.value)} placeholder="e.g. Salt Lake Sector V" className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                {/* Bank Account Number */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700">Bank Account Number</label>
                    <button
                      type="button"
                      onClick={() => setShowAccount(!showAccount)}
                      className="text-[11px] font-semibold text-emerald-600 hover:underline flex items-center gap-1"
                    >
                      {showAccount ? <EyeOff size={12} /> : <Eye size={12} />} {showAccount ? 'Mask' : 'Unmask'}
                    </button>
                  </div>
                  {showAccount ? (
                    <input
                      type="text"
                      aria-label="Bank Account Number"
                      value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)} placeholder="Enter Account Number" className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-mono text-slate-800 focus:border-emerald-500 focus:outline-none"
                    />
                  ) : (
                    <input
                      type="text"
                      aria-label="Masked Account Number"
                      value={formatMaskedAccount(accountNumber)}
                      readOnly
                      onClick={() => setShowAccount(true)}
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-mono text-slate-800 cursor-pointer"
                    />
                  )}
                </div>

                {/* IFSC Code */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">IFSC Code</label>
                  <input
                    type="text"
                    aria-label="IFSC Code"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    placeholder="e.g. HDFC0001234"
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs font-mono uppercase text-slate-800 focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="rounded-xl bg-emerald-600 px-6 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 transition flex items-center gap-2 shadow-xs"
              >
                <Save size={16} /> {saving ? 'Saving Profile…' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
