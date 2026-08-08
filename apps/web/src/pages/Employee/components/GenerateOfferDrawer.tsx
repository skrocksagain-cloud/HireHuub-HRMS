import { useState } from "react";
import { Eye, Calculator, Building2, User, Sparkles } from "lucide-react";
import Drawer from "../../../ui/Drawer";
import documentEngine, { type DocumentResult } from "../../../core/engine/documentEngine";
import DocumentPreviewModal from "../../../components/DocumentPreviewModal";

interface GenerateOfferDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  departments: string[];
  designations: string[];
}

export default function GenerateOfferDrawer({
  isOpen,
  onClose,
  departments,
  designations,
}: GenerateOfferDrawerProps) {
  // Form State
  const [candidateName, setCandidateName] = useState<string>("Rohan Sharma");
  const [mobileNumber, setMobileNumber] = useState<string>("9876543210");
  const [email, setEmail] = useState<string>("rohan.sharma@example.com");

  const [department, setDepartment] = useState<string>(departments[0] || "Engineering");
  const [designation, setDesignation] = useState<string>(designations[0] || "Senior Software Engineer");
  const [reportingManager, setReportingManager] = useState<string>("Vikramaditya Rao");
  const [employmentType, setEmploymentType] = useState<string>("Full-Time");
  const [joiningDate, setJoiningDate] = useState<string>(
    new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0]
  );
  const [probation, setProbation] = useState<string>("6 Months");
  const [noticePeriod, setNoticePeriod] = useState<string>("2 Months");

  const [monthlySalary, setMonthlySalary] = useState<number>(75000);

  // Document Result & Preview Modal State
  const [documentResult, setDocumentResult] = useState<DocumentResult | null>(null);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');

  // Auto Calculations
  const annualCTC = monthlySalary * 12;
  const basicSalary = Math.round(monthlySalary * 0.5);
  const hra = Math.round(monthlySalary * 0.2);
  const specialAllowance = Math.round(monthlySalary * 0.2);
  const pfContribution = Math.round(monthlySalary * 0.07);
  const professionalTax = 200;
  const netTakeHome = monthlySalary - (pfContribution + professionalTax);

  const handleGenerateAndPreview = async () => {
    setIsGenerating(true);
    setErrorMessage('');

    try {
      const res = await documentEngine.generate({
        module: 'HR',
        type: 'Offer Letter',
        identifier: candidateName.replace(/\s+/g, '_'),
        generatedBy: 'admin',
        generatedByName: 'Super Admin',
        context: {
          employee: {
            fullName: candidateName,
            email,
            mobile: mobileNumber,
            department,
            designation,
            reportingManager,
            joiningDate,
            employmentType,
            ctc: `₹${annualCTC.toLocaleString("en-IN")} LPA`,
            basicPay: `₹${basicSalary.toLocaleString("en-IN")}`,
            netPay: `₹${netTakeHome.toLocaleString("en-IN")}`,
          },
          additional: {
            probation_period: probation,
            notice_period: noticePeriod,
          },
        },
      });

      if (!res.success) {
        setErrorMessage(res.error || 'Failed to generate document');
      } else {
        setDocumentResult(res);
      }
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Error generating offer letter');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <>
      <Drawer isOpen={isOpen} onClose={onClose} title="Generate Candidate Offer Letter">
        <form onSubmit={(e) => e.preventDefault()} className="space-y-6 text-xs text-slate-700">
          
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-semibold text-xs">
              {errorMessage}
            </div>
          )}

          {/* Section: Candidate Info */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-slate-900 font-bold">
              <User size={16} className="text-emerald-600" />
              <span>1. Candidate Information</span>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Full Name</label>
              <input
                type="text"
                value={candidateName}
                onChange={(e) => setCandidateName(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mobile Number</label>
                <input
                  type="text"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* Section: Employment Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-slate-900 font-bold">
              <Building2 size={16} className="text-emerald-600" />
              <span>2. Employment Information</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Engineering">Engineering</option>
                  <option value="Human Resources">Human Resources</option>
                  <option value="Sales & Business">Sales & Business</option>
                  <option value="Finance & Accounts">Finance & Accounts</option>
                  <option value="Operations">Operations</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Designation</label>
                <input
                  type="text"
                  value={designation}
                  onChange={(e) => setDesignation(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Reporting Manager</label>
                <input
                  type="text"
                  value={reportingManager}
                  onChange={(e) => setReportingManager(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Employment Type</label>
                <select
                  value={employmentType}
                  onChange={(e) => setEmploymentType(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                >
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="Contract">Contract</option>
                  <option value="Internship">Internship</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Joining Date</label>
                <input
                  type="date"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                  required
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Probation</label>
                <select
                  value={probation}
                  onChange={(e) => setProbation(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                >
                  <option value="3 Months">3 Months</option>
                  <option value="6 Months">6 Months</option>
                  <option value="None">None</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notice Period</label>
                <select
                  value={noticePeriod}
                  onChange={(e) => setNoticePeriod(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                >
                  <option value="1 Month">1 Month</option>
                  <option value="2 Months">2 Months</option>
                  <option value="3 Months">3 Months</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Salary Structure & Breakup */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-slate-900 font-bold">
              <Calculator size={16} className="text-emerald-600" />
              <span>3. Salary Structure & Breakup</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Monthly Gross Salary (₹)</label>
              <input
                type="number"
                min="10000"
                step="1000"
                value={monthlySalary}
                onChange={(e) => setMonthlySalary(Number(e.target.value))}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-bold text-slate-900"
                required
              />
            </div>

            <div className="p-4 bg-slate-900 text-white rounded-2xl space-y-2">
              <div className="flex justify-between items-center text-xs font-bold text-emerald-400 border-b border-slate-800 pb-2">
                <span>Calculated Annual CTC:</span>
                <span className="text-sm">₹{annualCTC.toLocaleString("en-IN")} LPA</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-300">
                <div className="flex justify-between">
                  <span>Basic Salary (50%):</span>
                  <span>₹{basicSalary.toLocaleString("en-IN")} / mo</span>
                </div>
                <div className="flex justify-between">
                  <span>House Rent Allowance HRA (20%):</span>
                  <span>₹{hra.toLocaleString("en-IN")} / mo</span>
                </div>
                <div className="flex justify-between">
                  <span>Special Allowance (20%):</span>
                  <span>₹{specialAllowance.toLocaleString("en-IN")} / mo</span>
                </div>
                <div className="flex justify-between text-amber-300">
                  <span>Deductions (PF 7% + PT):</span>
                  <span>- ₹{(pfContribution + professionalTax).toLocaleString("en-IN")} / mo</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-slate-800 font-bold text-emerald-300 text-xs">
                  <span>Net Estimated Take-Home:</span>
                  <span>₹{netTakeHome.toLocaleString("en-IN")} / mo</span>
                </div>
              </div>
            </div>
          </div>

          {/* Offer Template Reference Note */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-[11px] flex items-start gap-2">
            <Sparkles size={16} className="text-emerald-600 shrink-0 mt-0.5" />
            <span>
              Document Engine resolves Admin Offer Letter template, company logo, official stamp, and assigned signatures automatically.
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={isGenerating}
              onClick={handleGenerateAndPreview}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-xs transition"
            >
              <Eye size={15} />
              <span>{isGenerating ? 'Generating…' : 'Generate & Preview Offer'}</span>
            </button>
          </div>
        </form>
      </Drawer>

      {/* Interactive Document Preview Modal */}
      {documentResult && (
        <DocumentPreviewModal
          result={documentResult}
          onClose={() => setDocumentResult(null)}
        />
      )}
    </>
  );
}
