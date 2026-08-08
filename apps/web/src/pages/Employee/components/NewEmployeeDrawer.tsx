import { useState, useEffect } from "react";
import { UserCheck, ShieldCheck, FileCheck, X } from "lucide-react";
import Drawer from "../../../ui/Drawer";
import type { EmployeeFormData, EmploymentType, EmployeeStatus, Employee } from "../types/Employee";
import { employeeService } from "../services/employeeService";
import { designationMasterService, APPROVED_DEPARTMENTS } from "../services/designationMasterService";

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
  const [employeeId, setEmployeeId] = useState<string>("HH0001");
  const [employeeCode, setEmployeeCode] = useState<string>("HH0001");

  useEffect(() => {
    if (isOpen) {
      employeeService
        .getNextEmployeeId()
        .then((nextId) => {
          setEmployeeId(nextId);
          setEmployeeCode(nextId);
        })
        .catch(() => {
          setEmployeeId("HH0001");
          setEmployeeCode("HH0001");
        });
    }
  }, [isOpen]);

  const [firstName, setFirstName] = useState<string>("");
  const [lastName, setLastName] = useState<string>("");
  const [mobileNumber, setMobileNumber] = useState<string>("");
  const [email, setEmail] = useState<string>("");

  const approvedDepartments = APPROVED_DEPARTMENTS.filter((d) => d !== "Executive");
  const [department, setDepartment] = useState<string>("Recruitment");
  const [designation, setDesignation] = useState<string>("Recruitment Executive");
  const [reportingManager, setReportingManager] = useState<string>("Founder / Leadership");

  const [availableDesignations, setAvailableDesignations] = useState<string[]>([]);
  const [eligibleManagers, setEligibleManagers] = useState<Array<{ id: string; label: string; value: string }>>([]);

  useEffect(() => {
    designationMasterService
      .getDesignationsForDepartment(department)
      .then((desigs) => {
        setAvailableDesignations(desigs);
        if (desigs.length > 0 && !desigs.includes(designation)) {
          setDesignation(desigs[0]);
        }
      });
  }, [department]);

  useEffect(() => {
    employeeService.getEmployees().then((employees: Employee[]) => {
      const activeEligible = designationMasterService.getEligibleReportingManagers(
        employees,
        department,
        undefined,
        designation
      );

      const managerOptions = [
        { id: "leadership", value: "Founder / Leadership", label: "HH0000 — Leadership / Director (Executive)" },
        ...activeEligible.map((emp, index) => ({
          id: emp.id || emp.employeeId || emp.employeeCode || `mgr-${index}`,
          value: emp.fullName || `${emp.firstName} ${emp.lastName}`,
          label: `${emp.employeeCode || emp.employeeId || "HH0000"} — ${emp.fullName || `${emp.firstName} ${emp.lastName}`} (${emp.designation})`,
        })),
      ];

      setEligibleManagers(managerOptions);
      if (managerOptions.length > 0 && !managerOptions.some((m) => m.value === reportingManager)) {
        setReportingManager(managerOptions[0].value);
      }
    });
  }, [department, designation]);

  const [employmentType] = useState<EmploymentType>("Permanent");
  const [joiningDate, setJoiningDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [workLocation] = useState<string>("Pune HQ");
  const [employmentStatus] = useState<EmployeeStatus>("Active");

  // Salary Structure Master reference (Payroll integration reference)
  const [salaryStructure, setSalaryStructure] = useState<string>("Salary Structure Master (Default)");

  const [docAadhaarVerified, setDocAadhaarVerified] = useState<boolean>(true);
  const [docPanVerified, setDocPanVerified] = useState<boolean>(true);
  const [docPhotoVerified, setDocPhotoVerified] = useState<boolean>(true);
  const [docChequeVerified, setDocChequeVerified] = useState<boolean>(true);

  const [errorMsg, setErrorMsg] = useState<string>("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!firstName.trim() || !lastName.trim() || !email.trim() || !mobileNumber.trim()) {
      setErrorMsg("Please fill all required personal and contact details.");
      return;
    }

    try {
      const formData: EmployeeFormData = {
        employeeId,
        employeeCode,
        firstName,
        lastName,
        gender: "Male",
        dateOfBirth: "1996-05-15",
        mobileNumber,
        email,
        department,
        designation,
        employmentType,
        joiningDate,
        reportingManager,
        workLocation,
        employmentStatus,
        photoUrl: "",
        address: "Baner, Pune, Maharashtra",
        emergencyContact: "9876543210",
        notes: `Salary Structure Reference: ${salaryStructure} | Documents Verified`,
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
              <label className="block font-semibold text-slate-700 mb-1">First Name</label>
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
              <label className="block font-semibold text-slate-700 mb-1">Last Name</label>
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
                placeholder="employee@hirehuub.com"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mobile Number</label>
              <input
                type="text"
                value={mobileNumber}
                onChange={(e) => setMobileNumber(e.target.value)}
                placeholder="9876543210"
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                required
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
              >
                {approvedDepartments.map((dept) => (
                  <option key={dept} value={dept}>
                    {dept}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Designation * (Designation Master)</label>
              <select
                value={designation}
                onChange={(e) => setDesignation(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-semibold text-slate-800"
              >
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
              <label className="block font-semibold text-slate-700 mb-1">Reporting Manager * (Active Employees)</label>
              <select
                value={reportingManager}
                onChange={(e) => setReportingManager(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-semibold text-slate-800"
              >
                {eligibleManagers.map((mgr) => (
                  <option key={mgr.id} value={mgr.value}>
                    {mgr.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Joining Date</label>
              <input
                type="date"
                value={joiningDate}
                onChange={(e) => setJoiningDate(e.target.value)}
                className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none"
                required
              />
            </div>
          </div>
        </div>

        {/* Section 4: Payroll Reference */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-slate-900 font-bold">
            <ShieldCheck size={16} className="text-emerald-600" />
            <span>2. Payroll Reference</span>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Salary Structure Master Reference</label>
            <input
              type="text"
              value={salaryStructure}
              onChange={(e) => setSalaryStructure(e.target.value)}
              placeholder="Consumes Salary Structure Master from Payroll"
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-semibold text-slate-800"
            />
          </div>
        </div>

        {/* Section 5: Mandatory Document Verification Checkmarks */}
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
