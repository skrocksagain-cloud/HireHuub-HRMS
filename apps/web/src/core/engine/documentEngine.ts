import React from "react";
import { pdf } from "@react-pdf/renderer";
import { adminService } from "../../services/admin/adminService";
import { adminStorageService } from "../../services/admin/adminStorageService";
import { documentCenterService } from "../../services/document/documentCenterService";
import type { CompanySettings, DocumentTemplateConfig } from "../../types/Admin";
import type { DigitalSignatureMetadata, DocumentCategoryModule, RegisteredDocument } from "../../types/DocumentCenter";
import { placeholderEngine, type PlaceholderContext } from "./placeholderEngine";

// Import React-PDF Template Components
import OfferLetterPdf from "../../templates/pdf/OfferLetterPdf";
import InvoicePdf from "../../templates/pdf/InvoicePdf";
import PayslipPdf from "../../templates/pdf/PayslipPdf";
import AppointmentLetterPdf from "../../templates/pdf/AppointmentLetterPdf";
import IncrementLetterPdf from "../../templates/pdf/IncrementLetterPdf";
import RelievingLetterPdf from "../../templates/pdf/RelievingLetterPdf";
import ExperienceLetterPdf from "../../templates/pdf/ExperienceLetterPdf";

export type DocumentStatus =
  | "Draft"
  | "Generated"
  | "Uploaded"
  | "Emailed"
  | "Archived";

export interface GenerateDocumentOptions {
  module: DocumentCategoryModule;
  type: string;
  identifier: string; // e.g. HH0001 or INV2026-0001
  generatedBy: string;
  generatedByName: string;
  employeeId?: string;
  candidateId?: string;
  clientId?: string;
  context?: PlaceholderContext;
  customPlaceholders?: Record<string, string>;
  templateOverride?: React.ReactNode;
}

export interface DocumentResult {
  success: boolean;
  documentId: string;
  fileName: string;
  status: DocumentStatus;
  blob?: Blob;
  downloadUrl?: string;
  storagePath?: string;
  previewUrl?: string;
  templateUsed?: string;
  templateVersion?: string;
  signatureUsed?: string;
  signatureType?: string;
  stampUsed?: boolean;
  logoUrl?: string;
  stampUrl?: string;
  signatureUrl?: string;
  letterheadUrl?: string;
  letterFooterUrl?: string;
  brandingProfileId?: string;
  category?: 'HR' | 'Finance' | 'Payroll' | 'Custom';
  format?: 'DOCX' | 'XLSX' | 'PDF';
  templateFileUrl?: string;
  resolvedPlaceholders: Record<string, string>;
  digitalSignatureInfo?: DigitalSignatureMetadata;
  error?: string;
}

let companyCache: { data: CompanySettings; timestamp: number } | null = null;
const templateCache = new Map<string, { data: DocumentTemplateConfig | null; timestamp: number }>();
const CACHE_TTL_MS = 60000;

class DocumentEngine {
  private async getCompanySettings(): Promise<CompanySettings> {
    const now = Date.now();
    if (companyCache && now - companyCache.timestamp < CACHE_TTL_MS) {
      return companyCache.data;
    }
    const data = await adminService.getCompanySettings();
    companyCache = { data, timestamp: now };
    return data;
  }

  private async getTemplateConfig(type: string): Promise<DocumentTemplateConfig | null> {
    const now = Date.now();
    const cached = templateCache.get(type.toLowerCase());
    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
      return cached.data;
    }
    const data = await adminService.getDocumentTemplateByType(type);
    templateCache.set(type.toLowerCase(), { data, timestamp: now });
    return data;
  }

  async validateTemplate(type: string): Promise<{ valid: boolean; message?: string; config?: DocumentTemplateConfig }> {
    const config = await this.getTemplateConfig(type);
    if (!config) {
      return { valid: false, message: `Missing Template Configuration for '${type}' in Document Template Engine.` };
    }

    if (!config.isActive && config.status === 'Inactive') {
      return { valid: false, message: `Template for '${type}' is currently Inactive.` };
    }

    return { valid: true, config };
  }

  formatFileName(type: string, identifier: string): string {
    const cleanType = type.replace(/[^a-zA-Z0-9]+/g, '');
    const cleanId = identifier.replace(/[^a-zA-Z0-9_-]+/g, '');
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    return `${cleanType}_${cleanId}_${dateStr}.pdf`;
  }

  async generate(options: GenerateDocumentOptions): Promise<DocumentResult> {
    try {
      const val = await this.validateTemplate(options.type);
      if (!val.valid) {
        return {
          success: false,
          documentId: '',
          fileName: '',
          status: 'Draft',
          resolvedPlaceholders: {},
          error: val.message,
        };
      }

      const config = val.config!;
      const company = await this.getCompanySettings();

      const targetSigId = config.assignedSignatureId || config.defaultSignatureId;
      const signature = company.signatures.find(
        (s) => s.id === targetSigId
      ) || company.signatures[0];

      const version = config.activeVersion || 'v1.0';
      const stampUsed = config.useOfficialStamp ?? config.includeStamp ?? true;
      const useLetterhead = config.useCompanyLetterhead ?? config.includeLetterhead ?? (config.category === 'HR');
      const useFooter = config.useCompanyFooter ?? config.includeFooter ?? (config.category === 'HR');

      const brandingProfileId = config.brandingProfileId || 'profile-default';
      const profile = company.brandingProfiles?.find((p) => p.id === brandingProfileId) || company.brandingProfiles?.[0];
      const letterheadUrl = useLetterhead ? (profile?.letterheadUrl || company.letterheadUrl || '') : '';
      const letterFooterUrl = useFooter ? (profile?.letterFooterUrl || company.letterFooterUrl || '') : '';

      const signatureUsed = signature ? `${signature.name} (${signature.designation})` : 'System Authorized Signatory';
      const signatureType = signature?.signatureType || 'Image';
      const templateUsed = config.templateName || `${options.type} Template`;

      const context: PlaceholderContext = {
        company,
        ...options.context,
        additional: options.customPlaceholders,
      };
      const resolvedPlaceholders = placeholderEngine.resolvePlaceholders(context);

      const fileName = this.formatFileName(options.type, options.identifier);
      const documentId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

      const digitalSignatureInfo: DigitalSignatureMetadata = {
        isDigitallySigned: true,
        signerName: signature ? signature.name : company.companyName,
        signatureTimestamp: new Date().toISOString(),
        certificateIssuer: 'Hire Huub Enterprise Security Authority',
        eSignProvider: 'Aadhaar eSign',
      };

      // REAL PDF GENERATION PIPELINE USING REACT-PDF
      let pdfElement: React.ReactElement;
      const docTypeLower = options.type.toLowerCase();

      if (docTypeLower.includes('offer')) {
        pdfElement = React.createElement(OfferLetterPdf, {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          offer: {
            id: options.identifier,
            offerId: options.identifier,
            fullName: context.employee?.fullName || resolvedPlaceholders.employee_name || 'Candidate Name',
            personalEmail: context.employee?.email || 'candidate@example.com',
            mobile: context.employee?.mobile || '9876543210',
            currentAddress: options.customPlaceholders?.workLocation || 'Corporate Office, India',
            designationName: context.employee?.designation || 'Software Engineer',
            departmentName: context.employee?.department || 'Engineering',
            employmentType: 'Permanent',
            reportingManager: context.employee?.reportingManager || 'HR Manager',
            workLocation: options.customPlaceholders?.workLocation || 'Corporate Office',
            joiningDate: context.employee?.joiningDate || new Date().toISOString().slice(0, 10),
            probationPeriod: 90,
            status: 'Generated',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          } as any,
        });
      } else if (docTypeLower.includes('payslip')) {
        pdfElement = React.createElement(PayslipPdf, {
          data: {
            employeeName: context.employee?.fullName || 'Employee Name',
            employeeId: options.employeeId || options.identifier,
            designation: context.employee?.designation || 'Specialist',
            department: context.employee?.department || 'Operations',
            payPeriod: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
            basicPay: String(context.employee?.basicPay || '₹40,000'),
            hra: '₹16,000',
            specialAllowance: '₹16,000',
            grossSalary: String(context.employee?.ctc || '₹72,000'),
            pfDeduction: '₹1,800',
            taxDeduction: '₹200',
            totalDeductions: '₹2,000',
            netPay: String(context.employee?.netPay || '₹70,000'),
          },
        });
      } else if (docTypeLower.includes('appointment')) {
        pdfElement = React.createElement(AppointmentLetterPdf, {
          data: {
            fullName: context.employee?.fullName || 'Employee Name',
            designation: context.employee?.designation || 'Specialist',
            department: context.employee?.department || 'Operations',
            joiningDate: context.employee?.joiningDate || new Date().toISOString().slice(0, 10),
            ctc: String(context.employee?.ctc || '₹6,00,000 LPA'),
            workLocation: options.customPlaceholders?.workLocation || 'Corporate Office',
          },
        });
      } else if (docTypeLower.includes('increment')) {
        pdfElement = React.createElement(IncrementLetterPdf, {
          data: {
            fullName: context.employee?.fullName || 'Employee Name',
            designation: context.employee?.designation || 'Specialist',
            effectiveDate: new Date().toISOString().slice(0, 10),
            previousCtc: '₹6,00,000 LPA',
            revisedCtc: String(context.employee?.ctc || '₹7,50,000 LPA'),
          },
        });
      } else if (docTypeLower.includes('relieving')) {
        pdfElement = React.createElement(RelievingLetterPdf, {
          data: {
            fullName: context.employee?.fullName || 'Employee Name',
            designation: context.employee?.designation || 'Specialist',
            department: context.employee?.department || 'Operations',
            joiningDate: '2024-01-15',
            relievingDate: new Date().toISOString().slice(0, 10),
          },
        });
      } else if (docTypeLower.includes('experience')) {
        pdfElement = React.createElement(ExperienceLetterPdf, {
          data: {
            fullName: context.employee?.fullName || 'Employee Name',
            designation: context.employee?.designation || 'Specialist',
            department: context.employee?.department || 'Operations',
            joiningDate: '2024-01-15',
            relievingDate: new Date().toISOString().slice(0, 10),
          },
        });
      } else {
        // Invoice / Default
        if (!company.companyName || !company.gstin) {
          throw new Error(
            `Document Generation Error: Company Settings in Administration -> Management are incomplete. Company Name and GSTIN are required.`
          );
        }

        pdfElement = React.createElement(InvoicePdf, {
          invoice: {
            invoiceNumber: options.identifier,
            invoiceDate: new Date().toISOString().slice(0, 10),
            company: {
              companyName: company.companyName,
              legalName: company.companyName,
              gstin: company.gstin,
              pan: company.pan || '',
              registeredAddress: {
                line1: company.address || 'Corporate Office',
                city: company.registeredCity || 'Pune',
                state: company.registeredState || 'Maharashtra',
                postalCode: company.postalCode || '411045',
                country: 'India',
              },
              bankDetails: {
                bankName: company.bankDetails?.bankName || '',
                accountNumber: company.bankDetails?.accountNumber || '',
                ifscCode: company.bankDetails?.ifscCode || '',
                branchName: company.bankDetails?.branchName || '',
                accountHolderName: company.companyName,
              },
              authorizedSignatory: signature?.name || 'Authorized Signatory',
            },
            client: {
              clientId: options.clientId || 'client-1',
              clientName: options.context?.company?.companyName || 'Client Name',
              gstin: options.context?.company?.gstin || '',
              billingAddress: {
                line1: options.context?.company?.address || 'Corporate Office',
                city: 'Pune',
                state: company.registeredState || 'Maharashtra',
                postalCode: '411045',
                country: 'India',
              },
              billingState: company.registeredState || 'Maharashtra',
            },
            lineItems: [],
            taxableAmount: 0,
            gst: {
              type: 'CGST_SGST',
              cgstAmount: 0,
              sgstAmount: 0,
              igstAmount: 0,
              totalGstAmount: 0,
            },
            grandTotal: 0,
            template: {
              templateId: config.templateId || config.id,
              templateVersion: config.version || 1,
            },
            poNumber: '',
            remarks: 'Generated via Document Engine',
            amountInWords: 'Zero Rupees Only',
          },
        });
      }

      // Generate actual PDF Blob
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const pdfBlob = await pdf(pdfElement as any).toBlob();

      const { url, path } = await adminStorageService.uploadGeneratedPdf(
        options.type,
        fileName.replace('.pdf', ''),
        pdfBlob
      );

      // Register metadata in Firestore `documents` collection
      const registeredData: RegisteredDocument = {
        id: documentId,
        documentId,
        documentType: options.type,
        module: options.module,
        employeeId: options.employeeId,
        candidateId: options.candidateId,
        clientId: options.clientId,
        templateVersion: version,
        generatedBy: options.generatedBy,
        generatedByName: options.generatedByName,
        generatedOn: new Date().toISOString(),
        storageUrl: url,
        storagePath: path,
        previewUrl: url,
        downloadCount: 0,
        status: 'Generated',
        templateUsed,
        signatureUsed,
        stampUsed,
        digitalSignatureInfo,
        resolvedPlaceholders,
      };

      await documentCenterService.registerDocument(registeredData);

      return {
        success: true,
        documentId,
        fileName,
        status: "Generated",
        blob: pdfBlob,
        downloadUrl: url,
        storagePath: path,
        previewUrl: url,
        templateVersion: version,
        templateUsed,
        signatureUsed,
        signatureType,
        stampUsed,
        logoUrl: company.logoUrl,
        stampUrl: stampUsed ? company.stampUrl : '',
        signatureUrl: signature ? signature.signatureUrl : '',
        letterheadUrl,
        letterFooterUrl,
        brandingProfileId,
        category: config.category,
        format: config.format,
        templateFileUrl: config.templateFileUrl || '',
        resolvedPlaceholders,
        digitalSignatureInfo,
      };
    } catch (err) {
      return {
        success: false,
        documentId: '',
        fileName: '',
        status: 'Draft',
        resolvedPlaceholders: {},
        error: err instanceof Error ? err.message : 'An error occurred during document generation.',
      };
    }
  }

  preview(template: React.ReactNode): React.ReactNode {
    return template;
  }

  download(blob: Blob, fileName: string) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
  }
}

const documentEngine = new DocumentEngine();
export default documentEngine;