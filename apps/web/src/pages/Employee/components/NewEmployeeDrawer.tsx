import { useState, useEffect, useMemo } from "react";
import { UserCheck, FileCheck, X, Calculator } from "lucide-react";
import Drawer from "../../../ui/Drawer";
import type { EmployeeFormData, EmploymentType, Employee } from "../types/Employee";
import { employeeService } from "../services/employeeService";
import { designationMasterService } from "../services/designationMasterService";
import { adminService } from "../../../services/admin/adminService";
import type { DesignationItem } from "../../../types/Admin";

interface NewEmployeeDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  departments: string[];
  designations: string[];
  isSaving: boolean;
  onSave: (data: EmployeeFormData) => Promise<void>;
}

export default function NewEmployeeDrawer({
  isOpen,
  onClose,
  isSaving,
  onSave,
}: NewEmployeeDrawerProps) {
  const [employeeId, setEmployeeId] = useState<string>("");
  const [employeeCode, setEmployeeCode] = useState<string>("");

  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  const [department, setDepartment] = useState<string>("");
  const [designation, setDesignation] = useState<string>("");
  const [reportingManager, setReportingManager] = useState<string>("");

  const [activeDepartments, setActiveDepartments] = useState<string[]>([]);
  const [activeDesignationsList, setActiveDesignationsList] = useState<DesignationItem[]>([]);
  const [allEmployees, setAllEmployees] = useState<Employee[]>([]);

  const [availableDesignations, setAvailableDesignations] = useState<string[]>([]);
  const [eligibleManagers, setEligibleManagers] = useState<Array<{ id: string; label: string; value: string }>>([]);

  // Salary & Statutory Configuration State
  const [grossSalaryInput, setGrossSalaryInput] = useState<string>("");
  const [pfApplicable, setPfApplicable] = useState<boolean>(false);
  const [esicApplicable, setEsicApplicable] = useState<boolean>(false);
  const [ptApplicable, setPtApplicable] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      employeeService
        .getNextEmployeeId()
        .then((nextId) => {
          setEmployeeId(nextId);
          setEmployeeCode(nextId);
        })
        .catch(() => {
          setEmployeeId("");
          setEmployeeCode("");
        });

      adminService
        .getDepartments()
        .then((depts) => {
          const active = depts.filter((d) => d.isActive !== false).map((d) => d.name);
          setActiveDepartments(active);
        })
        .catch(() => setActiveDepartments([]));

      adminService
        .getDesignations()
        .then((desigs) => {
          setActiveDesignationsList(desigs.filter((d) => d.isActive !== false));
        })
        .catch(() => setActiveDesignationsList([]));

      employeeService
        .getEmployees()
        .then((emps) => {
          const active = emps.filter((e) => e.employmentStatus === "Active" || e.status === "Active");
          setAllEmployees(active);
        })
        .catch(() => setAllEmployees([]));
    }
  }, [isOpen]);

  useEffect(() => {
    if (!department) {
      setAvailableDesignations([]);
      setDesignation("");
      return;
    }

    const matching = activeDesignationsList
      .filter((r) => r.departmentName === department || !r.departmentId || !r.departmentName)
      .map((r) => r.name);
    const uniqueDesigs = [...new Set(matching)];
    setAvailableDesignations(uniqueDesigs);

    if (designation && !uniqueDesigs.includes(designation)) {
      setDesignation("");
    }
  }, [department, activeDesignationsList]);

  useEffect(() => {
    if (!department) {
      setEligibleManagers([]);
      setReportingManager("");
      return;
    }

    const activeEligible = designationMasterService.getEligibleReportingManagers(
      allEmployees,
      department,
      undefined,
      designation
    );

    const managerOptions = activeEligible.map((emp, index) => ({
      id: emp.id || emp.employeeId || emp.employeeCode || `mgr-${index}`,
      value: emp.fullName || `${emp.firstName} ${emp.lastName}`,
      label: `${emp.employeeCode || emp.employeeId || ""} — ${emp.fullName || `${emp.firstName} ${emp.lastName}`}${emp.designation ? ` (${emp.designation})` : ""}`,
    }));

    setEligibleManagers(managerOptions);
    if (reportingManager && !managerOptions.some((m) => m.value === reportingManager)) {
      setReportingManager("");
    }
  }, [department, designation, allEmployees]);

  const [employmentType, setEmploymentType] = useState<EmploymentType | "">("");
  const [joiningDate, setJoiningDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [workLocation, setWorkLocation] = useState<string>("");

  const [docAadhaarVerified, setDocAadhaarVerified] = useState<boolean>(false);
  const [docPanVerified, setDocPanVerified] = useState<boolean>(false);
  const [docPhotoVerified, setDocPhotoVerified] = useState<boolean>(false);
  const [docChequeVerified, setDocChequeVerified] = useState<boolean>(false);

  const [errorMsg, setErrorMsg] = useState<string>("");

  // Live Statutory Deduction Calculations
  const salaryCalc = useMemo(() => {
    const grossVal = parseFloat(grossSalaryInput.trim());
    if (isNaN(grossVal) || grossVal <= 0) {
      return {
        gross: 0,
        hasGross: false,
        pf: 0,
        esi: 0,
        pt: 0,
        totalDeductions: 0,
        netTakeHome: 0,
      };
    }

    const basicPay = Math.round(grossVal * 0.5);
    
    // PF Calculation: 12% of Basic, Capped at ₹1,800 if PF Applicable
    const pf = pfApplicable ? Math.min(1800, Math.round(basicPay * 0.12)) : 0;
    
    // ESI Calculation: 0.75% of Gross if Gross <= 21,000 and ESI Applicable
    const esi = esicApplicable ? (grossVal <= 21000 ? Math.round(grossVal * 0.0075) : 0) : 0;
    
    // PT Calculation: Slab based if PT Applicable (> 25000: 200, > 15000: 150, else 0)
    let pt = 0;
    if (ptApplicable) {
      if (grossVal > 25000) {
        pt = 200;
      } else if (grossVal > 15000) {
        pt = 150;
      }
    }

    const totalDeductions = pf + esi + pt;
    const netTakeHome = Math.max(0, grossVal - totalDeductions);

    return {
      gross: grossVal,
      hasGross: true,
      pf,
      esi,
      pt,
      totalDeductions,
      netTakeHome,
    };
  }, [grossSalaryInput, pfApplicable, esicApplicable, ptApplicable]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!firstName.trim() || !lastName.trim()) {
      setErrorMsg("Please fill all required personal and contact details.");
      return;
    }

    if (!department || !designation) {
      setErrorMsg("Please select department and designation from Administration Master Data.");
      return;
    }

    const numGross = parseFloat(grossSalaryInput.trim());
    if (isNaN(numGross) || numGross <= 0) {
      setErrorMsg("Please enter a valid Gross Take Home Salary greater than zero.");
      return;
    }

    try {
      let finalEmpId = employeeId;
      let finalEmpCode = employeeCode;
      if (!finalEmpId || !finalEmpCode) {
        const nextId = await employeeService.getNextEmployeeId();
        finalEmpId = finalEmpId || nextId;
        finalEmpCode = finalEmpCode || nextId;
      }

      const formData: EmployeeFormData = {
        employeeId: finalEmpId,
        employeeCode: finalEmpCode,
        firstName,
        lastName,
        gender: "Male",
        dateOfBirth: "",
        mobileNumber,
        email,
        department,
        designation,
        employmentType: (employmentType || "Permanent") as EmploymentType,
        joiningDate: joiningDate || new Date().toISOString().split('T')[0],
        reportingManager,
        workLocation,
        employmentStatus: "Active",
        photoUrl: "",
        address: "",
        emergencyContact: "",
        notes: "",
        grossSalary: salaryCalc.gross,
        pfApplicable,
        esicApplicable,
        ptApplicable,
        calculatedPf: salaryCalc.pf,
        calculatedEsic: salaryCalc.esi,
        calculatedPt: salaryCalc.pt,
        totalDeductions: salaryCalc.totalDeductions,
        netTakeHome: salaryCalc.netTakeHome,
      };

      await onSave(formData);
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to create employee.");
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="New Employee Onboarding">
      <form onSubmit={handleSubmit} className="space-y-6 text-xs text-slate-700">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center justify-between">
            <span>{errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg("")}><X size={14} /></button>
          </div>
        )}

        {/* Section 1: Official Employee Identification */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-slate-900 font-bold">
            <UserCheck size={16} className="text-emerald-600" />
            <span>1. Employee System Identifiers</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Employee ID</label>
              <input
                type="text"
                value={employeeId}
                readOnly
                placeholder="Auto-generated ID"
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none cursor-not-allowed opacity-80"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Employee Code</label>
              <input
                type="text"
                value={employeeCode}
                readOnly
                placeholder="Auto-generated Code"
                className="w-full p-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none cursor-not-allowed opacity-80"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 2: Personal Details */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">First Name *</label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="First Name"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Last Name *</label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Last Name"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Official Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="employee@company.com"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile Number</label>
              <input
                type="text"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="Mobile Number"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Job Role & Management */}
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Department *</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-semibold text-slate-800"
                required
              >
                <option value="" disabled>
                  {activeDepartments.length === 0 ? "No records available." : "Select Department..."}
                </option>
                {activeDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Designation * (Master Data)</label>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                disabled={!department || availableDesignations.length === 0}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-semibold text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
                required
              >
                <option value="" disabled>
                  {!department
                    ? "Select Department First"
                    : availableDesignations.length === 0
                    ? "No records available."
                    : "Select Designation..."}
                </option>
                {availableDesignations.map((desig) => (
                  <option key={desig} value={desig}>
                    {desig}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Reporting Manager</label>
              <select
                value={reportingManager}
                onChange={(e) => setReportingManager(e.target.value)}
                disabled={!department || eligibleManagers.length === 0}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-semibold text-slate-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">
                  {!department
                    ? "Select Department First"
                    : eligibleManagers.length === 0
                    ? "No records available."
                    : "Select Reporting Manager..."}
                </option>
                {eligibleManagers.map((mgr) => (
                  <option key={mgr.id} value={mgr.value}>
                    {mgr.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Joining Date *</label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Employment Type</label>
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value as EmploymentType)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-semibold text-slate-800"
              >
                <option value="" disabled>Select Type...</option>
                <option value="Permanent">Permanent</option>
                <option value="Contract">Contract</option>
                <option value="Trainee">Trainee</option>
                <option value="Intern">Intern</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Work Location</label>
              <input
                type="text"
                value={workLocation}
                onChange={(e) => setWorkLocation(e.target.value)}
                placeholder="Office Location / City"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-semibold text-slate-800"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Salary & Statutory Configuration */}
        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-slate-900 font-bold">
            <Calculator size={16} className="text-emerald-600" />
            <span>2. Salary & Statutory Configuration</span>
          </div>

          {/* Gross Salary Input */}
          <div>
            <label className="block font-semibold text-slate-700 mb-1">
              Gross Take Home Salary (₹) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-400 font-bold">₹</span>
              <input
                type="number"
                min="1"
                step="any"
                value={grossSalaryInput}
                onChange={(e) => setGrossSalaryInput(e.target.value)}
                placeholder="Enter Monthly Gross Salary"
                className="w-full pl-7 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-bold text-slate-900 text-sm"
                required
              />
            </div>
          </div>

          {/* Statutory Deduction Controls */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block font-semibold text-slate-800 text-[11px]">PF Applicable</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="pfApplicable"
                    checked={pfApplicable}
                    onChange={() => setPfApplicable(true)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-800">Yes</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="pfApplicable"
                    checked={!pfApplicable}
                    onChange={() => setPfApplicable(false)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-800">No</span>
                </label>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block font-semibold text-slate-800 text-[11px]">ESI Applicable</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="esicApplicable"
                    checked={esicApplicable}
                    onChange={() => setEsicApplicable(true)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-800">Yes</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="esicApplicable"
                    checked={!esicApplicable}
                    onChange={() => setEsicApplicable(false)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-800">No</span>
                </label>
              </div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
              <label className="block font-semibold text-slate-800 text-[11px]">Professional Tax Applicable</label>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="ptApplicable"
                    checked={ptApplicable}
                    onChange={() => setPtApplicable(true)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-800">Yes</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="ptApplicable"
                    checked={!ptApplicable}
                    onChange={() => setPtApplicable(false)}
                    className="text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-slate-800">No</span>
                </label>
              </div>
            </div>
          </div>

          {/* Salary Summary Table */}
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2">
            <h4 className="font-bold text-slate-900 text-xs">Salary Summary</h4>
            <div className="divide-y divide-slate-200 text-xs">
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600 font-medium">Gross Salary</span>
                <span className="font-bold text-slate-900 font-mono">
                  {salaryCalc.hasGross ? `₹ ${salaryCalc.gross.toLocaleString('en-IN')}` : '₹ —'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600 font-medium">PF</span>
                <span className="font-semibold text-slate-700 font-mono">
                  {salaryCalc.hasGross ? `₹ ${salaryCalc.pf.toLocaleString('en-IN')}` : '₹ —'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600 font-medium">ESI</span>
                <span className="font-semibold text-slate-700 font-mono">
                  {salaryCalc.hasGross ? `₹ ${salaryCalc.esi.toLocaleString('en-IN')}` : '₹ —'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600 font-medium">Professional Tax</span>
                <span className="font-semibold text-slate-700 font-mono">
                  {salaryCalc.hasGross ? `₹ ${salaryCalc.pt.toLocaleString('en-IN')}` : '₹ —'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-600 font-medium">Total Deductions</span>
                <span className="font-semibold text-rose-600 font-mono">
                  {salaryCalc.hasGross ? `₹ ${salaryCalc.totalDeductions.toLocaleString('en-IN')}` : '₹ —'}
                </span>
              </div>
              <div className="flex justify-between py-2 border-t-2 border-slate-300 font-bold bg-emerald-50/50 px-2 rounded-lg mt-1">
                <span className="text-emerald-950 font-bold">Net Take Home Salary</span>
                <span className="text-emerald-700 font-extrabold font-mono text-sm">
                  {salaryCalc.hasGross ? `₹ ${salaryCalc.netTakeHome.toLocaleString('en-IN')}` : '₹ —'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Section 3: Mandatory Document Verification Checkmarks */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-slate-900 font-bold">
            <FileCheck size={16} className="text-emerald-600" />
            <span>3. Mandatory Document Checklist</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={docAadhaarVerified}
                onChange={(e) => setDocAadhaarVerified(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-slate-800">Aadhaar Card Verified</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={docPanVerified}
                onChange={(e) => setDocPanVerified(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-slate-800">PAN Card Verified</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={docPhotoVerified}
                onChange={(e) => setDocPhotoVerified(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-slate-800">Passport Photo Uploaded</span>
            </label>

            <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition">
              <input
                type="checkbox"
                checked={docChequeVerified}
                onChange={(e) => setDocChequeVerified(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500"
              />
              <span className="font-semibold text-slate-800">Cancelled Cheque Verified</span>
            </label>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-slate-600 hover:bg-slate-100 font-semibold"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSaving}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-xs"
          >
            {isSaving ? "Creating Employee…" : "Create Employee"}
          </button>
        </div>
      </form>
    </Drawer>
  );
}
