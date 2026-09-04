import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { adminDb } from '../config/firebaseAdmin';
import { TemplateResolver } from '../services/templateResolver';
import { GoogleDocEngine } from '../services/googleDocEngine';

export interface GenerateDocumentV3Payload {
  brandId: string;
  documentType: string;
  entityId: string;
  requestId?: string;
  folderId?: string;
  template?: {
    templateId?: string;
  };
  data?: Record<string, unknown>;
  editableData?: Record<string, unknown>;
}

export interface GenerateDocumentV3Response {
  success: boolean;
  requestId: string;
  documentId: string | null;
  documentType: string;
  fileName: string | null;
  fileUrl: string | null;
  driveFileId: string | null;
  version: string;
  generatedAt: string;
  error: {
    code: string;
    message: string;
  } | null;
}

function formatCurrency(num: unknown): string {
  const val = typeof num === 'number' ? num : parseFloat(String(num));
  if (isNaN(val)) return '₹0';
  return '₹' + Math.round(val).toLocaleString('en-IN');
}

/**
 * Builds standard placeholder dictionary for Offer Letter.
 */
function buildOfferPlaceholderDictionary(payload: GenerateDocumentV3Payload): Record<string, string> {
  const data = payload.data || {};
  const pfApp = data.pfApplicable !== false;
  const esiApp = data.esiApplicable !== false;

  const personNameVal = String(data.candidateName || data.personName || '');
  const personAddrVal = String(data.candidateAddress || data.personAddress || '');
  const personEmailVal = String(data.candidateEmail || data.personEmail || '');
  const personPhoneVal = String(data.candidatePhone || data.personPhone || '');

  return {
    LEGAL_NAME: String(data.legalName || data.companyName || 'Hire Huub People Solution Private Limited'),
    BRAND_NAME: String(data.brandName || 'Hire Huub'),
    BRAND_ADDRESS: String(data.brandAddress || 'Bangalore, Karnataka'),
    BRAND_EMAIL: String(data.brandEmail || 'hr@hirehuub.com'),
    BRAND_PHONE: String(data.brandPhone || '+91 98765 43210'),
    BRAND_WEBSITE: String(data.brandWebsite || 'www.hirehuub.com'),

    PERSON_NAME: personNameVal,
    PERSON_ADDRESS: personAddrVal,
    PERSON_EMAIL: personEmailVal,
    PERSON_PHONE: personPhoneVal,

    CANDIDATE_NAME: personNameVal,
    CANDIDATE_ADDRESS: personAddrVal,
    CANDIDATE_EMAIL: personEmailVal,
    CANDIDATE_PHONE: personPhoneVal,

    OFFER_REFERENCE: payload.entityId || String(data.offerReference || ''),
    OFFER_DATE: String(data.offerDate || new Date().toISOString().split('T')[0]),
    JOINING_DATE: String(data.joiningDate || ''),

    DESIGNATION: String(data.designation || ''),
    DEPARTMENT: String(data.department || ''),
    WORK_LOCATION: String(data.workLocation || ''),
    REPORTING_MANAGER: String(data.reportingManager || ''),

    MONTHLY_GROSS: formatCurrency(data.monthlyGross),
    ANNUAL_GROSS: formatCurrency(data.annualGross || (data.monthlyGross ? Number(data.monthlyGross) * 12 : 0)),

    BASIC_MONTHLY: formatCurrency(data.basicMonthly),
    BASIC_ANNUAL: formatCurrency(data.basicAnnual),

    HRA_MONTHLY: formatCurrency(data.hraMonthly),
    HRA_ANNUAL: formatCurrency(data.hraAnnual),

    CONVEYANCE_MONTHLY: formatCurrency(data.conveyanceMonthly || 0),
    CONVEYANCE_ANNUAL: formatCurrency(data.conveyanceAnnual || 0),

    MOBILE_MONTHLY: formatCurrency(data.mobileMonthly || 0),
    MOBILE_ANNUAL: formatCurrency(data.mobileAnnual || 0),

    SPECIAL_MONTHLY: formatCurrency(data.specialMonthly),
    SPECIAL_ANNUAL: formatCurrency(data.specialAnnual),

    PROFESSIONAL_TAX_MONTHLY: formatCurrency(data.professionalTaxMonthly),
    PROFESSIONAL_TAX_ANNUAL: formatCurrency(data.professionalTaxAnnual),

    EMPLOYEE_PF_MONTHLY: pfApp ? formatCurrency(data.employeePfMonthly) : 'Not Applicable',
    EMPLOYEE_PF_ANNUAL: pfApp ? formatCurrency(data.employeePfAnnual) : 'Not Applicable',

    EMPLOYER_PF_MONTHLY: pfApp ? formatCurrency(data.employerPfMonthly) : 'Not Applicable',
    EMPLOYER_PF_ANNUAL: pfApp ? formatCurrency(data.employerPfAnnual) : 'Not Applicable',

    EMPLOYEE_ESI_MONTHLY: esiApp ? formatCurrency(data.employeeEsiMonthly) : 'Not Applicable',
    EMPLOYEE_ESI_ANNUAL: esiApp ? formatCurrency(data.employeeEsiAnnual) : 'Not Applicable',

    EMPLOYER_ESI_MONTHLY: esiApp ? formatCurrency(data.employerEsiMonthly) : 'Not Applicable',
    EMPLOYER_ESI_ANNUAL: esiApp ? formatCurrency(data.employerEsiAnnual) : 'Not Applicable',

    NET_TAKE_HOME_MONTHLY: formatCurrency(data.netTakeHomeMonthly),
    NET_TAKE_HOME_ANNUAL: formatCurrency(data.netTakeHomeAnnual),
  };
}

/**
 * Firebase Cloud Function: generateDocumentV3
 * Directly handles document generation via Node.js Google Drive & Docs APIs.
 */
export const generateDocumentV3 = onCall<GenerateDocumentV3Payload>(
  {
    cors: true,
  },
  async (request): Promise<GenerateDocumentV3Response> => {
    const isAuthDisabled = process.env.AUTH_DISABLED !== 'false';

    // 1. Authentication Check
    if (!isAuthDisabled) {
      if (!request.auth) {
        throw new HttpsError('unauthenticated', 'Firebase authentication required.');
      }

      const authenticatedEmployeeId = request.auth.uid;
      const employeeQuery = await adminDb
        .collection('employees')
        .where('employeeId', '==', authenticatedEmployeeId)
        .limit(1)
        .get();

      if (employeeQuery.empty) {
        throw new HttpsError('permission-denied', 'Authenticated employee record was not found.');
      }
    }

    const payload = request.data;
    const reqId = payload?.requestId || `req_v3_${Date.now()}`;

    if (!payload || !payload.brandId || !payload.documentType || !payload.entityId) {
      throw new HttpsError('invalid-argument', 'Required parameters: brandId, documentType, entityId.');
    }

    try {
      // Always resolve through TemplateResolver to guarantee V3 resolution rules
      const resolved = await TemplateResolver.resolveTemplate(payload.documentType, payload.brandId);
      const templateId = resolved.templateId;
      const folderId = payload.folderId || resolved.folderId;

      console.log(`[generateDocumentV3] Resolved templateId = ${templateId}, folderId = ${folderId}`);

      // 3. Build Placeholders Dictionary
      const data = payload.data || {};
      const personName = String(data.candidateName || data.personName || 'Person');
      const offerRef = payload.entityId;

      const placeholders = buildOfferPlaceholderDictionary(payload);

      // 4. Sanitize Output File Name
      const sanitizedRef = offerRef.replace(/[\/\\:*?"<>|]/g, '_');
      const sanitizedName = personName.trim().replace(/[\/\\:*?"<>|]/g, '_');
      const fileName = `Offer_Letter_${sanitizedRef}_${sanitizedName}.pdf`;

      // 5. Generate PDF using direct Node.js GoogleDocEngine
      const offerDateStr = String(data.offerDate || '');
      const yearMatch = offerDateStr.match(/^(\d{4})/);
      const yearStr = yearMatch ? yearMatch[1] : new Date().getFullYear().toString();

      const result = await GoogleDocEngine.generateDocumentPDF({
        templateId,
        folderId,
        documentType: payload.documentType,
        entityId: payload.entityId,
        fileName,
        placeholders,
        yearStr,
      });

      return {
        success: true,
        requestId: reqId,
        documentId: result.documentId,
        documentType: result.documentType,
        fileName: result.fileName,
        fileUrl: result.fileUrl,
        driveFileId: result.driveFileId,
        version: '3.0.0',
        generatedAt: result.generatedAt,
        error: null,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown generation error.';
      return {
        success: false,
        requestId: reqId,
        documentId: null,
        documentType: payload.documentType,
        fileName: null,
        fileUrl: null,
        driveFileId: null,
        version: '3.0.0',
        generatedAt: new Date().toISOString(),
        error: {
          code: 'GENERATION_FAILED',
          message: msg,
        },
      };
    }
  }
);
