import { useEffect, useState, useMemo } from "react";
import { FileText, Building2, User, AlertCircle, CheckCircle2, ShieldCheck, Calculator, RefreshCw } from "lucide-react";
import Drawer from "../../../ui/Drawer";
import { adminService } from "../../../services/admin/adminService";
import { auditService } from "../../../core/audit/auditService";
import { employeeService } from "../services/employeeService";
import { offerRepository } from "../../../services/offer/repositories/offerRepository";
import { updateOfferStatus } from "../../../services/offer/offerService";
import { AutomationService } from "../../../services/automation/automationService";
import { documentService } from "../../../services/document/documentService";
import { storageService } from "../../../services/document/storageService";
import { SalaryCalculator, type SalaryBreakupResult } from "../../../core/payroll/salaryEngine";

import type { DepartmentItem, DesignationItem, BrandProfile } from "../../../types/Admin";
import type { Employee } from "../types/Employee";
import type { Offer } from "../../../types/Offer";

interface GenerateOfferDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  departments?: string[];
  designations?: string[];
}

export default function GenerateOfferDrawer({
  isOpen,
  onClose,
}: GenerateOfferDrawerProps) {
  // Live Master Data States
  const [brandsList, setBrandsList] = useState<BrandProfile[]>([]);
  const [departmentsList, setDepartmentsList] = useState<DepartmentItem[]>([]);
  const [designationsList, setDesignationsList] = useState<DesignationItem[]>([]);
  const [activeEmployees, setActiveEmployees] = useState<Employee[]>([]);

  // Brand State
  const [selectedBrandId, setSelectedBrandId] = useState<string>("");

  // Candidate Information State
  const [candidateName, setCandidateName] = useState<string>("");
  const [candidateAddress, setCandidateAddress] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [mobileNumber, setMobileNumber] = useState<string>("");

  // Employment Information State
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string>("");
  const [departmentName, setDepartmentName] = useState<string>("");
  const [selectedDesignationId, setSelectedDesignationId] = useState<string>("");
  const [designationName, setDesignationName] = useState<string>("");
  const [workLocation, setWorkLocation] = useState<string>("");
  const [joiningDate, setJoiningDate] = useState<string>("");
  const [reportingManagerId, setReportingManagerId] = useState<string>("");
  const [reportingManagerName, setReportingManagerName] = useState<string>("");

  // Offer Reference & Date State
  const [offerReference, setOfferReference] = useState<string>("");
  const [offerDate, setOfferDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Compensation State
  const [monthlyGrossInput, setMonthlyGrossInput] = useState<string>("");
  const [pfApplicable, setPfApplicable] = useState<boolean>(true);
  const [esiApplicable, setEsiApplicable] = useState<boolean>(true);

  // Workflow & Status States
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [successResult, setSuccessResult] = useState<{
    offerRef: string;
    pdfUrl: string | null;
    documentId: string | null;
  } | null>(null);

  const [isOpeningDoc, setIsOpeningDoc] = useState<boolean>(false);

  const handleViewDocument = async () => {
    if (!successResult?.pdfUrl) return;

    const rawPath = successResult.pdfUrl;

    if (rawPath.startsWith("http://") || rawPath.startsWith("https://")) {
      window.open(rawPath, "_blank");
      return;
    }

    setIsOpeningDoc(true);
    try {
      const authenticatedUrl = await storageService.getDownloadUrl(rawPath);
      window.open(authenticatedUrl, "_blank");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Unable to load document view URL.";
      setErrorMessage(msg);
    } finally {
      setIsOpeningDoc(false);
    }
  };


  // Computed Compensation Structure via SalaryCalculator
  const monthlyGrossNum = useMemo(() => {
    const parsed = parseFloat(monthlyGrossInput);
    return isNaN(parsed) || parsed < 0 ? 0 : parsed;
  }, [monthlyGrossInput]);

  const salaryBreakup: SalaryBreakupResult = useMemo(() => {
    return SalaryCalculator.calculateSalaryStructure(monthlyGrossNum, {
      isPfApplicable: pfApplicable,
      isEsicApplicable: esiApplicable,
    });
  }, [monthlyGrossNum, pfApplicable, esiApplicable]);

  // Currency Formatter
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0,
    }).format(val);

  // Fetch Live Master Data & Generate Atomic Offer Number when drawer opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    setErrorMessage("");
    setSuccessResult(null);

    const loadData = async () => {
      try {
        const [companySettings, depts, desigs, emps, nextRef] = await Promise.all([
          adminService.getCompanySettings().catch(() => null),
          adminService.getDepartments().catch(() => []),
          adminService.getDesignations().catch(() => []),
          employeeService.getEmployees().catch(() => []),
          offerRepository.getNextOfferNumber().catch(() => `HH/OFFER/${new Date().getFullYear()}/0001`),
        ]);

        if (!isMounted) return;

        // Populate Brands
        const activeBrands = (companySettings?.brandProfilesList || []).filter((b) => b.isActive !== false);
        setBrandsList(activeBrands);
        if (activeBrands.length > 0) {
          const defaultB = activeBrands.find((b) => b.isDefault) || activeBrands[0];
          setSelectedBrandId(defaultB.id);
        } else {
          setSelectedBrandId("hirehuub");
        }

        setDepartmentsList(depts.filter((d) => d.isActive !== false));
        setDesignationsList(desigs.filter((d) => d.isActive !== false));
        setActiveEmployees(emps.filter((e) => e.status === "Active" || e.employmentStatus === "Active"));
        setOfferReference(nextRef);
        setOfferDate(new Date().toISOString().split("T")[0]);
      } catch {
        if (isMounted) {
          setErrorMessage("Failed to load live ERP master data.");
        }
      }
    };

    void loadData();

    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  const handleDepartmentChange = (deptId: string) => {
    setSelectedDepartmentId(deptId);
    const dept = departmentsList.find((d) => d.id === deptId);
    setDepartmentName(dept?.name || "");
  };

  const handleDesignationChange = (desigId: string) => {
    setSelectedDesignationId(desigId);
    const desig = designationsList.find((d) => d.id === desigId);
    setDesignationName(desig?.name || "");
  };

  const handleManagerChange = (mgrId: string) => {
    setReportingManagerId(mgrId);
    const mgr = activeEmployees.find((e) => e.id === mgrId || e.employeeId === mgrId);
    if (mgr) {
      setReportingManagerName(`${mgr.firstName} ${mgr.lastName}`);
    } else {
      setReportingManagerName("");
    }
  };

  // Execute Offer Generation
  const handleGenerateOffer = async () => {
    setErrorMessage("");

    // Form Validation
    if (!selectedBrandId) {
      setErrorMessage("Please select an Active Brand.");
      return;
    }
    if (!candidateName.trim()) {
      setErrorMessage("Please enter Name of the Person Being Offered.");
      return;
    }
    if (!candidateAddress.trim()) {
      setErrorMessage("Please enter Address of the Person Being Offered.");
      return;
    }
    if (!email.trim()) {
      setErrorMessage("Please enter Email of the Person Being Offered.");
      return;
    }
    if (!mobileNumber.trim()) {
      setErrorMessage("Please enter Phone Number of the Person Being Offered.");
      return;
    }
    if (!selectedDesignationId || !designationName) {
      setErrorMessage("Please select a Designation.");
      return;
    }
    if (!selectedDepartmentId || !departmentName) {
      setErrorMessage("Please select a Department.");
      return;
    }
    if (!workLocation.trim()) {
      setErrorMessage("Please enter Work Location.");
      return;
    }
    if (!joiningDate) {
      setErrorMessage("Please select a Joining Date.");
      return;
    }
    if (!reportingManagerId || !reportingManagerName) {
      setErrorMessage("Please select a Reporting Manager.");
      return;
    }
    if (!monthlyGrossNum || monthlyGrossNum <= 0) {
      setErrorMessage("Please enter a valid positive Monthly Gross CTC.");
      return;
    }

    setIsGenerating(true);

    try {
      // 1. Construct Complete Offer Record with Historical Snapshot
      const nameParts = candidateName.trim().split(" ");
      const firstName = nameParts[0] || "";
      const lastName = nameParts.slice(1).join(" ") || "";
      const validTillDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

      const offerRecordPayload: Offer = {
        offerId: offerReference,
        status: "Draft",
        offerDate,
        validTill: validTillDate,

        firstName,
        middleName: "",
        lastName,
        fullName: candidateName.trim(),
        gender: "Male",
        mobile: mobileNumber.trim(),
        personalEmail: email.trim(),
        currentAddress: candidateAddress.trim(),

        departmentId: selectedDepartmentId,
        departmentName,
        designationId: selectedDesignationId,
        designationName,
        reportingManagerId,
        reportingManager: reportingManagerName,
        employmentType: "Permanent",
        workLocation: workLocation.trim(),
        joiningDate,
        probationPeriod: 90,

        monthlyGrossSalary: salaryBreakup.monthlyGross,
        annualCTC: salaryBreakup.annualCtc,
        basicSalary: salaryBreakup.basicPay,
        hra: salaryBreakup.hra,
        conveyanceAllowance: 0,
        mobileAllowance: 0,
        specialAllowance: salaryBreakup.specialAllowance,
        professionalTax: salaryBreakup.professionalTax,
        netTakeHome: salaryBreakup.netSalary,

        pfApplicable,
        esiApplicable,

        brandId: selectedBrandId,
        employeePf: salaryBreakup.employeePf,
        employerPf: salaryBreakup.employerPf,
        employeeEsi: salaryBreakup.employeeEsic,
        employerEsi: salaryBreakup.employerEsic,
        annualGross: salaryBreakup.monthlyGross * 12,
        annualNetTakeHome: salaryBreakup.netSalary * 12,

        remarks: `Generated via ERP Offer Hub for ${candidateName.trim()}`,
        documentId: "",
        pdfUrl: "",
        timeline: [
          {
            id: `time-${Date.now()}`,
            title: "Offer Created",
            description: `Offer ${offerReference} initialized in ERP.`,
            status: "Completed",
            createdBy: "Super Admin",
            createdAt: new Date().toISOString(),
          },
        ],
        employeeId: "",
        createdBy: "Super Admin",
        updatedBy: "Super Admin",
      };

      // 2. Persist Offer Record in Firestore (`offers` collection)
      const savedOffer = await offerRepository.saveOffer(offerRecordPayload);
      const persistentOfferId = savedOffer.id || offerReference;

      // 3. Log Audit: Offer Created
      await auditService.record({
        module: "Recruitment",
        action: "Offer Created",
        recordId: persistentOfferId,
        performedBy: "Super Admin",
        role: "HR",
        newValue: { offerReference, candidateName: candidateName.trim(), monthlyGross: salaryBreakup.monthlyGross },
        remarks: `Created offer record ${offerReference} for ${candidateName.trim()}`,
      }).catch(() => null);

      // 3.6. Resolve Published Default OFFER_LETTER Template for Brand
      const defaultTemplateConfig = await adminService.getPublishedBrandDefaultTemplate(selectedBrandId, "OFFER_LETTER").catch(() => null);

      if (!defaultTemplateConfig || defaultTemplateConfig.lifecycleState !== "Published") {
        setErrorMessage("No published Offer Letter template is configured for this Brand. Please publish a template in Offer Letter Studio.");
        return;
      }

      // 4. Construct Automation Hub Payload for Native Document Engine
      const automationPayload = {
        brandId: selectedBrandId,
        documentType: "OFFER_LETTER",
        entityId: offerReference,
        data: {
          offerReference,
          offerDate,
          candidateName: candidateName.trim(),
          candidateAddress: candidateAddress.trim(),
          candidateEmail: email.trim(),
          candidatePhone: mobileNumber.trim(),
          designation: designationName,
          department: departmentName,
          workLocation: workLocation.trim(),
          joiningDate,
          reportingManager: reportingManagerName,
          monthlyGross: salaryBreakup.monthlyGross,
          annualGross: salaryBreakup.monthlyGross * 12,
          basicMonthly: salaryBreakup.basicPay,
          basicAnnual: salaryBreakup.basicPay * 12,
          hraMonthly: salaryBreakup.hra,
          hraAnnual: salaryBreakup.hra * 12,
          specialMonthly: salaryBreakup.specialAllowance,
          specialAnnual: salaryBreakup.specialAllowance * 12,
          professionalTaxMonthly: salaryBreakup.professionalTax,
          professionalTaxAnnual: salaryBreakup.professionalTax * 12,
          employeePfMonthly: salaryBreakup.employeePf,
          employeePfAnnual: salaryBreakup.employeePf * 12,
          employerPfMonthly: salaryBreakup.employerPf,
          employerPfAnnual: salaryBreakup.employerPf * 12,
          employeeEsiMonthly: salaryBreakup.employeeEsic,
          employeeEsiAnnual: salaryBreakup.employeeEsic * 12,
          employerEsiMonthly: salaryBreakup.employerEsic,
          employerEsiAnnual: salaryBreakup.employerEsic * 12,
          netTakeHomeMonthly: salaryBreakup.netSalary,
          netTakeHomeAnnual: salaryBreakup.netSalary * 12,
          annualCtc: salaryBreakup.annualCtc,
          pfApplicable,
          esiApplicable,
        },
        editableData: {
          offerDate,
          joiningDate,
          workLocation: workLocation.trim(),
          monthlyGrossSalary: salaryBreakup.monthlyGross,
        },
      };

      // 5. Trigger Automation Service Proxy to Firebase Cloud Function
      const autoResponse = await AutomationService.requestDocumentGeneration(automationPayload);

      if (!autoResponse.success) {
        throw new Error(autoResponse.error?.message || "Failed to generate Offer Letter via Automation Hub.");
      }

      const generatedFileUrl = autoResponse.fileUrl || "";
      const driveFileId = autoResponse.driveFileId || "";

      // 6. Create Document Metadata Record in Firestore (`documents` collection)
      const docRecordId = await documentService.create({
        id: `doc-offer-${Date.now()}`,
        documentId: autoResponse.documentId || offerReference,
        companyId: selectedBrandId,
        branchId: "",
        category: "HR",
        module: "Offer",
        documentType: "Offer Letter",
        referenceId: persistentOfferId,
        title: `Offer Letter - ${candidateName.trim()} (${offerReference})`,
        fileName: autoResponse.fileName || `Offer_Letter_${offerReference.replace(/\//g, "_")}_${candidateName.trim().replace(/[\/\\:*?"<>|]/g, "_")}.pdf`,
        version: 1,
        status: "Generated",
        storagePath: `hr/offer-letters/${offerReference.replace(/\//g, "_")}.pdf`,
        downloadUrl: generatedFileUrl,
        fileUrl: generatedFileUrl,
        fileSize: 0,
        mimeType: "application/pdf",
        requiresSignature: true,
        isSigned: false,
        signedBy: "",
        qrCodeUrl: "",
        isLocked: true,
        generatedBy: "Super Admin",
        generatedAt: autoResponse.generatedAt || new Date().toISOString(),
        emailed: false,
        emailedTo: email.trim(),
        downloadCount: 0,
        archived: false,
        remarks: `Generated via Automation Hub (Drive ID: ${driveFileId})`,
        createdBy: "Super Admin",
        updatedBy: "Super Admin",
        tags: ["OfferLetter", "PersonBeingOffered", designationName],
      });

      // 7. Update Offer Record with documentId, pdfUrl & Status = "Generated"
      await updateOfferStatus(persistentOfferId, "Generated").catch(() => null);
      await offerRepository.saveOffer({
        ...savedOffer,
        id: persistentOfferId,
        documentId: docRecordId,
        pdfUrl: generatedFileUrl,
        status: "Generated",
      });

      // 8. Log Audit: Offer Letter Generated
      await auditService.record({
        module: "Recruitment",
        action: "Offer Letter Generated",
        recordId: persistentOfferId,
        performedBy: "Super Admin",
        role: "HR",
        newValue: {
          offerReference,
          documentId: docRecordId,
          pdfUrl: generatedFileUrl,
        },
        remarks: `Successfully generated Offer Letter PDF for ${candidateName.trim()} (${offerReference}).`,
      }).catch(() => null);

      // 9. Show Success Screen State
      setSuccessResult({
        offerRef: offerReference,
        pdfUrl: generatedFileUrl,
        documentId: docRecordId,
      });

    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "An unexpected error occurred during offer generation.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Generate Offer Letter">
      <form onSubmit={(e) => e.preventDefault()} className="space-y-6 text-xs text-slate-700">

        {/* Error Alert */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-semibold text-xs flex items-start gap-2">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* SUCCESS VIEW */}
        {successResult ? (
          <div className="py-8 space-y-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-sm">
              <CheckCircle2 size={36} />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">✓ Offer Letter Generated</h3>
              <p className="text-xs text-slate-500">
                The offer document has been generated and linked to the document library.
              </p>
            </div>

            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-sm mx-auto space-y-2 text-left">
              <div className="flex justify-between items-center text-xs border-b border-slate-200 pb-2">
                <span className="font-semibold text-slate-500">Offer Reference:</span>
                <span className="font-bold text-slate-900 font-mono">{successResult.offerRef}</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-1">
                <span className="font-semibold text-slate-500">Person Being Offered:</span>
                <span className="font-bold text-slate-900">{candidateName}</span>
              </div>
            </div>

            <div className="flex items-center justify-center gap-3 pt-4">
              {successResult.pdfUrl ? (
                <button
                  type="button"
                  disabled={isOpeningDoc}
                  onClick={handleViewDocument}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition disabled:opacity-60"
                >
                  <FileText size={15} />
                  <span>{isOpeningDoc ? "Opening Document..." : "View Document"}</span>
                </button>
              ) : null}

              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
              >
                Close
              </button>
            </div>
          </div>
        ) : (
          /* FORM VIEW */
          <>
            {/* Section 1: Brand & Offer Metadata */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Building2 size={16} className="text-emerald-600" />
                  <span>1. Brand &amp; Offer Reference</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 font-semibold block uppercase tracking-wider">Offer Ref</span>
                  <span className="text-xs font-mono font-bold text-emerald-700">{offerReference || "Loading..."}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Brand *</label>
                  <select
                    value={selectedBrandId}
                    onChange={(e) => setSelectedBrandId(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-semibold text-slate-800"
                  >
                    <option value="" disabled>Select Active Brand</option>
                    {brandsList.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.brandName} {b.isDefault ? "(Default)" : ""}
                      </option>
                    ))}
                    {brandsList.length === 0 && <option value="hirehuub">Hire Huub</option>}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Offer Date</label>
                  <input
                    type="date"
                    value={offerDate}
                    onChange={(e) => setOfferDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium text-slate-800"
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Person Being Offered */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-slate-900 font-bold">
                <User size={16} className="text-sky-600" />
                <span>2. Person Being Offered</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Name of the Person Being Offered *</label>
                  <input
                    type="text"
                    placeholder="e.g. Ananya Roy"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email of the Person Being Offered *</label>
                  <input
                    type="email"
                    placeholder="ananya.roy@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Phone Number of the Person Being Offered *</label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={mobileNumber}
                    onChange={(e) => setMobileNumber(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-xs"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Address of the Person Being Offered *</label>
                  <input
                    type="text"
                    placeholder="Residential Address"
                    value={candidateAddress}
                    onChange={(e) => setCandidateAddress(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500 text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Position & Department Details */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 border-b border-slate-200 pb-2 text-slate-900 font-bold">
                <Building2 size={16} className="text-indigo-600" />
                <span>3. Position &amp; Department</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Department *</label>
                  <select
                    value={selectedDepartmentId}
                    onChange={(e) => handleDepartmentChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-semibold text-slate-800"
                  >
                    <option value="">Select Department</option>
                    {departmentsList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Designation *</label>
                  <select
                    value={selectedDesignationId}
                    onChange={(e) => handleDesignationChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 text-xs font-semibold text-slate-800"
                  >
                    <option value="">Select Designation</option>
                    {designationsList.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Work Location *</label>
                  <input
                    type="text"
                    placeholder="e.g. Bangalore / Remote"
                    value={workLocation}
                    onChange={(e) => setWorkLocation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Joining Date *</label>
                  <input
                    type="date"
                    value={joiningDate}
                    onChange={(e) => setJoiningDate(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Reporting Manager *</label>
                  <select
                    value={reportingManagerId}
                    onChange={(e) => handleManagerChange(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-800"
                  >
                    <option value="">Select Reporting Manager</option>
                    {activeEmployees.map((e) => (
                      <option key={e.id || e.employeeId} value={e.id || e.employeeId}>
                        {e.firstName} {e.lastName} ({e.designation || "Active"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Section 4: Compensation & Statutory Switches */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <div className="flex items-center gap-2 text-slate-900 font-bold">
                  <Calculator size={16} className="text-emerald-600" />
                  <span>4. Compensation &amp; Statutory Benefits</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monthly Gross CTC (₹) *</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="e.g. 25000"
                    value={monthlyGrossInput}
                    onChange={(e) => setMonthlyGrossInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-xs font-bold text-slate-900"
                  />
                </div>

                <div className="flex items-center gap-4 py-2">
                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={pfApplicable}
                      onChange={(e) => setPfApplicable(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>PF Applicable</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700">
                    <input
                      type="checkbox"
                      checked={esiApplicable}
                      onChange={(e) => setEsiApplicable(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>ESI Applicable</span>
                  </label>
                </div>
              </div>

              {/* LIVE COMPENSATION PREVIEW TABLE */}
              {salaryBreakup.monthlyGross > 0 ? (
                <div className="mt-3 bg-slate-50 border border-slate-200 rounded-2xl overflow-hidden text-[11px]">
                  <div className="bg-slate-100 px-3 py-2 border-b border-slate-200 font-bold text-slate-800 flex justify-between">
                    <span>Compensation Component</span>
                    <div className="flex gap-8">
                      <span className="w-20 text-right">Monthly</span>
                      <span className="w-24 text-right">Annual</span>
                    </div>
                  </div>
                  <div className="divide-y divide-slate-200/60 font-medium text-slate-700">
                    <div className="px-3 py-1.5 flex justify-between">
                      <span>Basic Pay (50%)</span>
                      <div className="flex gap-8">
                        <span className="w-20 text-right">{formatCurrency(salaryBreakup.basicPay)}</span>
                        <span className="w-24 text-right">{formatCurrency(salaryBreakup.basicPay * 12)}</span>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 flex justify-between">
                      <span>HRA (20%)</span>
                      <div className="flex gap-8">
                        <span className="w-20 text-right">{formatCurrency(salaryBreakup.hra)}</span>
                        <span className="w-24 text-right">{formatCurrency(salaryBreakup.hra * 12)}</span>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 flex justify-between">
                      <span>Special Allowance</span>
                      <div className="flex gap-8">
                        <span className="w-20 text-right">{formatCurrency(salaryBreakup.specialAllowance)}</span>
                        <span className="w-24 text-right">{formatCurrency(salaryBreakup.specialAllowance * 12)}</span>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 flex justify-between text-slate-500">
                      <span>Professional Tax</span>
                      <div className="flex gap-8">
                        <span className="w-20 text-right">{formatCurrency(salaryBreakup.professionalTax)}</span>
                        <span className="w-24 text-right">{formatCurrency(salaryBreakup.professionalTax * 12)}</span>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 flex justify-between text-slate-500">
                      <span>Employee PF (12%)</span>
                      <div className="flex gap-8">
                        <span className="w-20 text-right">{pfApplicable ? formatCurrency(salaryBreakup.employeePf) : "Not Applicable"}</span>
                        <span className="w-24 text-right">{pfApplicable ? formatCurrency(salaryBreakup.employeePf * 12) : "Not Applicable"}</span>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 flex justify-between text-slate-500">
                      <span>Employer PF (12%)</span>
                      <div className="flex gap-8">
                        <span className="w-20 text-right">{pfApplicable ? formatCurrency(salaryBreakup.employerPf) : "Not Applicable"}</span>
                        <span className="w-24 text-right">{pfApplicable ? formatCurrency(salaryBreakup.employerPf * 12) : "Not Applicable"}</span>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 flex justify-between text-slate-500">
                      <span>Employee ESI (0.75%)</span>
                      <div className="flex gap-8">
                        <span className="w-20 text-right">{esiApplicable && salaryBreakup.isEsicEligible ? formatCurrency(salaryBreakup.employeeEsic) : "Not Applicable"}</span>
                        <span className="w-24 text-right">{esiApplicable && salaryBreakup.isEsicEligible ? formatCurrency(salaryBreakup.employeeEsic * 12) : "Not Applicable"}</span>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 flex justify-between text-slate-500">
                      <span>Employer ESI (3.25%)</span>
                      <div className="flex gap-8">
                        <span className="w-20 text-right">{esiApplicable && salaryBreakup.isEsicEligible ? formatCurrency(salaryBreakup.employerEsic) : "Not Applicable"}</span>
                        <span className="w-24 text-right">{esiApplicable && salaryBreakup.isEsicEligible ? formatCurrency(salaryBreakup.employerEsic * 12) : "Not Applicable"}</span>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 flex justify-between bg-emerald-50/50 font-bold text-slate-900">
                      <span>Gross CTC</span>
                      <div className="flex gap-8">
                        <span className="w-20 text-right">{formatCurrency(salaryBreakup.monthlyGross)}</span>
                        <span className="w-24 text-right">{formatCurrency(salaryBreakup.monthlyGross * 12)}</span>
                      </div>
                    </div>
                    <div className="px-3 py-1.5 flex justify-between bg-emerald-100/50 font-bold text-emerald-900">
                      <span>Net Take Home</span>
                      <div className="flex gap-8">
                        <span className="w-20 text-right">{formatCurrency(salaryBreakup.netSalary)}</span>
                        <span className="w-24 text-right">{formatCurrency(salaryBreakup.netSalary * 12)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>

            {/* Form Footer Action */}
            <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleGenerateOffer}
                disabled={isGenerating}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-2 disabled:opacity-50"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Generating Offer Letter...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={15} />
                    <span>Generate Offer Letter</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </form>
    </Drawer>
  );
}

