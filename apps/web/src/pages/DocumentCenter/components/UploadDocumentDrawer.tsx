import { useState, useEffect, type FormEvent } from "react";
import { Upload, X, FileText, CheckCircle2 } from "lucide-react";
import Drawer from "../../../ui/Drawer";
import type { TargetType, DocumentType, DocumentCategory, DocumentModule } from "../../../types/Document";
import { documentService } from "../../../services/document/documentService";
import { storageService } from "../../../services/document/storageService";
import { employeeService } from "../../Employee/services/employeeService";
import { clientService } from "../../Workbench/Network/clients/services/clientService";
import { workforceRepository } from "../../Workbench/workforce/repositories/workforceRepository";
import { useAuth } from "../../../context/AuthContext";

interface UploadDocumentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const TARGET_TYPES: TargetType[] = ["Employee", "Department", "Company", "Client", "Candidate", "Finance"];

const TARGET_DOCUMENT_TYPES: Record<TargetType, DocumentType[]> = {
  Employee: [
    "Offer Letter",
    "Appointment Letter",
    "Confirmation Letter",
    "Promotion Letter",
    "Increment Letter",
    "Experience Letter",
    "Relieving Letter",
    "Warning Letter",
    "Show Cause Notice",
    "NDA",
    "Joining Form",
    "Aadhaar",
    "PAN",
    "Bank Details",
    "Education Documents",
    "Other",
  ],
  Department: [
    "SOP",
    "Training Material",
    "HR Policy",
    "Recruitment Process",
    "Finance Process",
    "Sales Material",
    "Marketing Material",
    "Other",
  ],
  Company: [
    "Employee Handbook",
    "Holiday Calendar",
    "Company Policies",
    "Circular",
    "Notice",
    "Forms",
    "Other",
  ],
  Client: [
    "Agreement",
    "Purchase Order",
    "Work Order",
    "Invoice Copy",
    "Credit Note",
    "Other",
  ],
  Candidate: [
    "Resume",
    "Aadhaar",
    "PAN",
    "Bank Details",
    "Offer Letter",
    "Joining Documents",
    "Other",
  ],
  Finance: [
    "Invoice",
    "Credit Note",
    "Expense Bill",
    "GST Report",
    "Bank Statement",
    "Report",
    "Other",
  ],
};

export default function UploadDocumentDrawer({
  isOpen,
  onClose,
  onSuccess,
}: UploadDocumentDrawerProps) {
  const { user } = useAuth();

  const [title, setTitle] = useState("");
  const [targetType, setTargetType] = useState<TargetType>("Employee");
  const [documentType, setDocumentType] = useState<DocumentType>("Offer Letter");
  const [assignedToId, setAssignedToId] = useState("");
  const [description, setDescription] = useState("");
  const [version, setVersion] = useState<number>(1);
  const [tagsStr, setTagsStr] = useState("");
  const [effectiveDate, setEffectiveDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [employees, setEmployees] = useState<{ id: string; code: string; name: string }[]>([]);
  const [clients, setClients] = useState<{ id: string; name: string }[]>([]);
  const [candidates, setCandidates] = useState<{ id: string; name: string }[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    if (isOpen) {
      // Load dropdown options asynchronously
      employeeService
        .getEmployees()
        .then((emps) => {
          setEmployees(
            emps.map((e) => ({
              id: e.employeeId || e.id || e.employeeCode,
              code: e.employeeCode || e.employeeId,
              name: `${e.firstName} ${e.lastName}`,
            }))
          );
        })
        .catch(() => {});

      clientService
        .getClients()
        .then((cls) => {
          setClients(cls.map((c) => ({ id: c.id, name: c.name || c.billingName })));
        })
        .catch(() => {});

      workforceRepository
        .getWorkforceItems()
        .then((wfs) => {
          setCandidates(wfs.map((w) => ({ id: w.id || w.candidateId, name: w.candidateName })));
        })
        .catch(() => {});
    }
  }, [isOpen]);

  const handleTargetTypeChange = (newTarget: TargetType) => {
    setTargetType(newTarget);
    const availableTypes = TARGET_DOCUMENT_TYPES[newTarget];
    setDocumentType(availableTypes[0] || "Other");
    setAssignedToId("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrorMsg("");

    if (!title.trim()) {
      setErrorMsg("Document title is required.");
      return;
    }

    if (!selectedFile) {
      setErrorMsg("Please select a document file to upload.");
      return;
    }

    try {
      setIsSubmitting(true);

      // Compute Shared With display string
      let sharedWith = "Company → All Employees";
      let refId = "COMPANY";

      if (targetType === "Employee") {
        const emp = employees.find((e) => e.id === assignedToId) || employees[0];
        refId = emp?.id || "HH0001";
        sharedWith = `Employee → ${emp ? `${emp.code} - ${emp.name}` : assignedToId}`;
      } else if (targetType === "Department") {
        refId = assignedToId || "Recruitment";
        sharedWith = `Department → ${refId}`;
      } else if (targetType === "Client") {
        const cl = clients.find((c) => c.id === assignedToId);
        refId = cl?.id || assignedToId || "CLIENT";
        sharedWith = `Client → ${cl?.name || refId}`;
      } else if (targetType === "Candidate") {
        const cand = candidates.find((c) => c.id === assignedToId);
        refId = cand?.id || assignedToId || "CANDIDATE";
        sharedWith = `Candidate → ${cand?.name || refId}`;
      } else if (targetType === "Finance") {
        refId = assignedToId || "Invoice Module";
        sharedWith = `Finance → ${refId}`;
      }

      const docCategory: DocumentCategory =
        targetType === "Finance"
          ? "Finance"
          : targetType === "Department" || targetType === "Company"
          ? "Operations"
          : "HR";

      const docModule: DocumentModule =
        targetType === "Client"
          ? "Client"
          : targetType === "Finance"
          ? "Finance"
          : "Employee";

      let downloadUrl = URL.createObjectURL(selectedFile);
      let storagePath = `documents/${refId}/${selectedFile.name}`;
      let fileSize = selectedFile.size;
      let mimeType = selectedFile.type || "application/pdf";

      try {
        const uploadRes = await storageService.upload(selectedFile, storagePath);
        downloadUrl = uploadRes.downloadUrl;
        storagePath = uploadRes.storagePath;
        fileSize = uploadRes.fileSize;
        mimeType = uploadRes.mimeType;
      } catch {
        // Fallback to local object URL if storage bucket is offline
      }

      await documentService.create({
        documentId: `DOC${Date.now().toString().slice(-6)}`,
        companyId: "HH01",
        branchId: "MAIN",
        category: docCategory,
        module: docModule,
        documentType,
        targetType,
        sharedWith,
        assignedToId: refId,
        referenceId: refId,
        title: title.trim(),
        fileName: selectedFile.name,
        version: Number(version) || 1,
        status: "Uploaded",
        storagePath,
        downloadUrl,
        fileSize,
        mimeType,
        requiresSignature: false,
        isSigned: false,
        signedBy: "",
        qrCodeUrl: "",
        isLocked: false,
        generatedBy: user?.name || "Admin",
        emailed: false,
        emailedTo: "",
        downloadCount: 0,
        archived: false,
        description: description.trim(),
        tags: tagsStr
          ? tagsStr.split(",").map((t) => t.trim()).filter(Boolean)
          : [],
        effectiveDate,
        expiryDate,
        remarks: `Uploaded by ${user?.name || "Admin"}`,
        createdBy: user?.name || "Admin",
        updatedBy: user?.name || "Admin",
      });

      onSuccess();
      onClose();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : "Failed to upload document.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Upload Document (Master Repository)">
      <form onSubmit={handleSubmit} className="space-y-5 text-xs text-slate-700">
        {errorMsg && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-center justify-between">
            <span>{errorMsg}</span>
            <button type="button" onClick={() => setErrorMsg("")}>
              <X size={14} />
            </button>
          </div>
        )}

        {/* Document Title */}
        <div>
          <label className="block font-semibold text-slate-900 mb-1">Document Title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Annual Employment Agreement 2026"
            className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-semibold text-slate-900"
            required
          />
        </div>

        {/* Target Type & Category Selector */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-900 mb-1">Target Type *</label>
            <select
              value={targetType}
              onChange={(e) => handleTargetTypeChange(e.target.value as TargetType)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-semibold"
            >
              {TARGET_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-900 mb-1">Document Type *</label>
            <select
              value={documentType}
              onChange={(e) => setDocumentType(e.target.value as DocumentType)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-semibold"
            >
              {TARGET_DOCUMENT_TYPES[targetType].map((dt) => (
                <option key={dt} value={dt}>
                  {dt}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Dynamic Assignment Dropdown based on Target Type */}
        <div>
          <label className="block font-semibold text-slate-900 mb-1">Dynamic Assignment Selector *</label>
          {targetType === "Employee" && (
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-semibold"
            >
              <option value="">Select Employee</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.code} - {e.name}
                </option>
              ))}
            </select>
          )}

          {targetType === "Department" && (
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-semibold"
            >
              <option value="Recruitment">Recruitment Department</option>
              <option value="Operations">Operations Department</option>
              <option value="Sales">Sales Department</option>
              <option value="Finance">Finance Department</option>
            </select>
          )}

          {targetType === "Company" && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl flex items-center gap-2 font-semibold">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>Assigned to All Employees (Company-Wide)</span>
            </div>
          )}

          {targetType === "Client" && (
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-semibold"
            >
              <option value="">Select Client</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}

          {targetType === "Candidate" && (
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-semibold"
            >
              <option value="">Select Candidate</option>
              {candidates.map((cand) => (
                <option key={cand.id} value={cand.id}>
                  {cand.name}
                </option>
              ))}
            </select>
          )}

          {targetType === "Finance" && (
            <select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-emerald-500 focus:outline-none font-semibold"
            >
              <option value="Invoices">Invoices Module</option>
              <option value="Credit Notes">Credit Notes Module</option>
              <option value="Expenses">Expenses Module</option>
              <option value="Reports">Financial Reports</option>
            </select>
          )}
        </div>

        {/* File Upload Selector */}
        <div>
          <label className="block font-semibold text-slate-900 mb-1">Select File *</label>
          <div className="border-2 border-dashed border-slate-200 rounded-2xl p-4 text-center hover:border-emerald-500 transition cursor-pointer bg-slate-50">
            <input
              type="file"
              accept=".pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png,.zip"
              onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
              className="hidden"
              id="doc-file-input"
            />
            <label htmlFor="doc-file-input" className="cursor-pointer block space-y-1">
              <Upload size={24} className="mx-auto text-emerald-600" />
              <span className="font-semibold text-slate-800 block text-xs">
                {selectedFile ? selectedFile.name : "Click to browse or drop file here"}
              </span>
              <span className="text-[10px] text-slate-400 block">
                Supported: PDF, DOC, DOCX, XLS, XLSX, JPG, PNG, ZIP (Max 25MB)
              </span>
            </label>
          </div>
        </div>

        {/* Optional Metadata Fields */}
        <div className="space-y-3 pt-2 border-t border-slate-200">
          <span className="font-bold text-slate-900 block text-xs">Optional Metadata</span>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Version</label>
              <input
                type="number"
                step="0.1"
                value={version}
                onChange={(e) => setVersion(parseFloat(e.target.value) || 1)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Tags (Comma Separated)</label>
              <input
                type="text"
                value={tagsStr}
                onChange={(e) => setTagsStr(e.target.value)}
                placeholder="e.g. Confidential, 2026, Signed"
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Effective Date</label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Expiry Date</label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-semibold text-slate-700 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add optional notes or description..."
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none min-h-16"
            />
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
            disabled={isSubmitting}
            className="px-5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold shadow-xs disabled:opacity-50 transition flex items-center gap-1.5"
          >
            <FileText size={14} />
            <span>{isSubmitting ? "Uploading Document…" : "Upload to Document Center"}</span>
          </button>
        </div>
      </form>
    </Drawer>
  );
}
