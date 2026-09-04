"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateNativeDocument = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebaseAdmin_1 = require("../config/firebaseAdmin");
function formatCurrency(num) {
    const val = typeof num === 'number' ? num : parseFloat(String(num));
    if (isNaN(val))
        return '₹0';
    return '₹' + Math.round(val).toLocaleString('en-IN');
}
/**
 * Formats standard placeholders for Offer Letter generation.
 */
function buildNativeOfferPlaceholders(payload) {
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
        GROSS_CTC: formatCurrency(data.monthlyGross),
        ANNUAL_CTC: formatCurrency(data.annualGross || (data.monthlyGross ? Number(data.monthlyGross) * 12 : 0)),
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
        SPECIAL_ALLOWANCE_MONTHLY: formatCurrency(data.specialMonthly),
        SPECIAL_ALLOWANCE_ANNUAL: formatCurrency(data.specialAnnual),
        PROFESSIONAL_TAX_MONTHLY: formatCurrency(data.professionalTaxMonthly),
        PROFESSIONAL_TAX_ANNUAL: formatCurrency(data.professionalTaxAnnual),
        PROFESSIONAL_TAX: formatCurrency(data.professionalTaxMonthly),
        EMPLOYEE_PF_MONTHLY: pfApp ? formatCurrency(data.employeePfMonthly) : 'Not Applicable',
        EMPLOYEE_PF_ANNUAL: pfApp ? formatCurrency(data.employeePfAnnual) : 'Not Applicable',
        PF_EMPLOYEE: pfApp ? formatCurrency(data.employeePfMonthly) : 'Not Applicable',
        EMPLOYER_PF_MONTHLY: pfApp ? formatCurrency(data.employerPfMonthly) : 'Not Applicable',
        EMPLOYER_PF_ANNUAL: pfApp ? formatCurrency(data.employerPfAnnual) : 'Not Applicable',
        EMPLOYEE_ESI_MONTHLY: esiApp ? formatCurrency(data.employeeEsiMonthly) : 'Not Applicable',
        EMPLOYEE_ESI_ANNUAL: esiApp ? formatCurrency(data.employeeEsiAnnual) : 'Not Applicable',
        EMPLOYER_ESI_MONTHLY: esiApp ? formatCurrency(data.employerEsiMonthly) : 'Not Applicable',
        EMPLOYER_ESI_ANNUAL: esiApp ? formatCurrency(data.employerEsiAnnual) : 'Not Applicable',
        NET_TAKE_HOME_MONTHLY: formatCurrency(data.netTakeHomeMonthly),
        NET_TAKE_HOME_ANNUAL: formatCurrency(data.netTakeHomeAnnual),
        NET_TAKE_HOME: formatCurrency(data.netTakeHomeMonthly),
    };
}
/**
 * Firebase Cloud Function: generateNativeDocument
 * Generates document PDFs natively in Node.js and saves to private Firebase Storage.
 */
exports.generateNativeDocument = (0, https_1.onCall)({
    memory: '1GiB',
    timeoutSeconds: 120,
    cors: true,
}, async (request) => {
    const payload = request.data;
    const reqId = payload?.requestId || `req_native_${Date.now()}`;
    try {
        const isAuthDisabled = process.env.AUTH_DISABLED !== 'false';
        // 1. Mandatory Firebase Auth Check
        if (!isAuthDisabled) {
            if (!request.auth) {
                throw new https_1.HttpsError('unauthenticated', 'Firebase authentication required to generate documents.');
            }
            const authenticatedUid = request.auth.uid;
            const authenticatedEmail = request.auth.token?.email || '';
            // Query employees collection by employeeId or email
            let employeeData = null;
            const byIdQuery = await firebaseAdmin_1.adminDb
                .collection('employees')
                .where('employeeId', '==', authenticatedUid)
                .limit(1)
                .get();
            if (!byIdQuery.empty) {
                employeeData = byIdQuery.docs[0].data();
            }
            else if (authenticatedEmail) {
                const byEmailQuery = await firebaseAdmin_1.adminDb
                    .collection('employees')
                    .where('email', '==', authenticatedEmail)
                    .limit(1)
                    .get();
                if (!byEmailQuery.empty) {
                    employeeData = byEmailQuery.docs[0].data();
                }
            }
            if (employeeData) {
                const accountStatus = String(employeeData.accountStatus || employeeData.status || 'Active');
                if (accountStatus === 'Locked' || accountStatus === 'Inactive' || accountStatus === 'Terminated') {
                    throw new https_1.HttpsError('permission-denied', `Account status '${accountStatus}' is not authorized to generate documents.`);
                }
                const roleName = String(employeeData.role || 'Super Admin').trim();
                const isSuper = roleName === 'Super Admin' || roleName === 'admin';
                if (!isSuper) {
                    const rolesQuery = await firebaseAdmin_1.adminDb
                        .collection('admin_roles')
                        .where('name', '==', roleName)
                        .limit(1)
                        .get();
                    if (!rolesQuery.empty) {
                        const roleData = rolesQuery.docs[0].data();
                        const permissions = roleData.permissions || [];
                        const modules = roleData.modules || [];
                        const hasSuperPerm = permissions.includes('*') || permissions.includes('super_admin');
                        const hasRecruitment = modules.includes('recruitment') || permissions.includes('recruitment:generate');
                        const hasDocCreate = permissions.includes('documents:create') || permissions.includes('documents:generate');
                        const isAuthorized = hasSuperPerm || hasRecruitment || hasDocCreate;
                        if (!isAuthorized) {
                            throw new https_1.HttpsError('permission-denied', `Role '${roleName}' is not authorized to generate offer documents.`);
                        }
                    }
                }
            }
        }
        if (!payload || !payload.brandId || !payload.documentType || !payload.entityId) {
            throw new https_1.HttpsError('invalid-argument', 'Required parameters: brandId, documentType, entityId.');
        }
        let result;
        const { NativeDocumentEngine } = await Promise.resolve().then(() => __importStar(require('./nativeDocumentEngine')));
        if (payload.documentType === 'RELIEVING_LETTER') {
            const data = payload.data || {};
            const personNameVal = String(data.employeeName || data.candidateName || data.personName || '').trim();
            const empCodeVal = String(data.employeeCode || data.employeeId || '').trim();
            const relievingRefVal = String(payload.entityId || data.relievingRef || '').trim();
            const issuanceDateVal = String(data.issuanceDate || data.relievingDate || new Date().toISOString().split('T')[0]).trim();
            const joiningDateVal = String(data.joiningDate || '').trim();
            const lastWorkingDateVal = String(data.lastWorkingDate || data.relievingDate || '').trim();
            const tenureDisplayVal = String(data.tenureDisplay || '').trim();
            const designationVal = String(data.designation || '').trim();
            const departmentVal = String(data.department || '').trim();
            const workLocationVal = String(data.workLocation || '').trim();
            const reportingManagerVal = String(data.reportingManager || '').trim();
            if (!personNameVal) {
                throw new https_1.HttpsError('invalid-argument', 'Relieving Letter generation failed: Employee name (PERSON_NAME) is required.');
            }
            if (!relievingRefVal) {
                throw new https_1.HttpsError('invalid-argument', 'Relieving Letter generation failed: Relieving reference number (RELIEVING_REF) is required.');
            }
            if (!lastWorkingDateVal) {
                throw new https_1.HttpsError('invalid-argument', 'Relieving Letter generation failed: Last working date (LAST_WORKING_DATE) is required.');
            }
            const placeholders = {
                LEGAL_NAME: String(data.legalName || data.companyName || ''),
                COMPANY_NAME: String(data.legalName || data.companyName || ''),
                BRAND_NAME: String(data.brandName || ''),
                BRAND_ADDRESS: String(data.brandAddress || data.address || ''),
                ADDRESS: String(data.brandAddress || data.address || ''),
                BRAND_EMAIL: String(data.brandEmail || data.email || ''),
                EMAIL: String(data.brandEmail || data.email || ''),
                BRAND_PHONE: String(data.brandPhone || data.phone || ''),
                PHONE: String(data.brandPhone || data.phone || ''),
                BRAND_WEBSITE: String(data.brandWebsite || data.website || ''),
                WEBSITE: String(data.brandWebsite || data.website || ''),
                PERSON_NAME: personNameVal,
                EMPLOYEE_NAME: personNameVal,
                CANDIDATE_NAME: personNameVal,
                EMPLOYEE_CODE: empCodeVal,
                EMPLOYEE_ID: empCodeVal,
                EMP_CODE: empCodeVal,
                RELIEVING_REF: relievingRefVal,
                RELIEVING_REFERENCE: relievingRefVal,
                REF_NO: relievingRefVal,
                REFERENCE_NO: relievingRefVal,
                ISSUANCE_DATE: issuanceDateVal,
                RELIEVING_DATE: issuanceDateVal,
                DATE: issuanceDateVal,
                JOINING_DATE: joiningDateVal,
                DATE_OF_JOINING: joiningDateVal,
                LAST_WORKING_DATE: lastWorkingDateVal,
                EXIT_DATE: lastWorkingDateVal,
                TENURE_DISPLAY: tenureDisplayVal,
                SERVICE_PERIOD: tenureDisplayVal,
                TENURE: tenureDisplayVal,
                DESIGNATION: designationVal,
                DEPARTMENT: departmentVal,
                WORK_LOCATION: workLocationVal,
                LOCATION: workLocationVal,
                REPORTING_MANAGER: reportingManagerVal,
            };
            result = await NativeDocumentEngine.generateRelievingLetter({
                documentType: payload.documentType,
                brandId: payload.brandId,
                entityId: payload.entityId,
                placeholders,
                generatedBy: 'Super Admin',
            });
        }
        else if (payload.documentType === 'INCREMENT_LETTER') {
            const data = payload.data || {};
            const personNameVal = String(data.employeeName || data.candidateName || data.personName || '').trim();
            const empCodeVal = String(data.employeeCode || data.employeeId || '').trim();
            const incRefVal = String(data.incrementRef || data.referenceNo || payload.entityId || '').trim();
            const issuanceDateVal = String(data.issuanceDate || new Date().toISOString().split('T')[0]).trim();
            const designationVal = String(data.designation || '').trim();
            const departmentVal = String(data.department || '').trim();
            const workLocationVal = String(data.workLocation || data.location || '').trim();
            const prevMonthlyGross = Number(data.currentMonthlyGross || 0);
            const prevAnnualCtc = Number(data.currentAnnualGross || prevMonthlyGross * 12);
            const revMonthlyGross = Number(data.revisedMonthlyGross || 0);
            const revAnnualCtc = Number(data.revisedAnnualGross || revMonthlyGross * 12);
            const incType = String(data.incrementType || 'Percentage');
            const incVal = Number(data.incrementValue || 0);
            const effDate = String(data.effectiveDate || issuanceDateVal);
            const incPct = incType === 'Percentage' ? `${incVal}%` : `${Math.round(((revMonthlyGross - prevMonthlyGross) / (prevMonthlyGross || 1)) * 100)}%`;
            const incAmt = incType === 'Fixed Amount' ? `₹${incVal.toLocaleString('en-IN')}` : `₹${(revMonthlyGross - prevMonthlyGross).toLocaleString('en-IN')}`;
            if (!personNameVal) {
                throw new https_1.HttpsError('invalid-argument', 'Increment Letter Generation Failed: Employee Name (PERSON_NAME) is required.');
            }
            const placeholders = {
                LEGAL_NAME: String(data.legalName || data.companyName || ''),
                COMPANY_NAME: String(data.legalName || data.companyName || ''),
                BRAND_NAME: String(data.brandName || ''),
                BRAND_ADDRESS: String(data.brandAddress || data.address || ''),
                ADDRESS: String(data.brandAddress || data.address || ''),
                BRAND_EMAIL: String(data.brandEmail || data.email || ''),
                EMAIL: String(data.brandEmail || data.email || ''),
                BRAND_PHONE: String(data.brandPhone || data.phone || ''),
                PHONE: String(data.brandPhone || data.phone || ''),
                BRAND_WEBSITE: String(data.brandWebsite || data.website || ''),
                WEBSITE: String(data.brandWebsite || data.website || ''),
                PERSON_NAME: personNameVal,
                EMPLOYEE_NAME: personNameVal,
                EMPLOYEE_CODE: empCodeVal,
                EMPLOYEE_ID: empCodeVal,
                INCREMENT_REF: incRefVal,
                INCREMENT_REFERENCE: incRefVal,
                REF_NO: incRefVal,
                ISSUANCE_DATE: issuanceDateVal,
                PREVIOUS_MONTHLY_GROSS: `₹${prevMonthlyGross.toLocaleString('en-IN')}`,
                PREVIOUS_ANNUAL_CTC: `₹${prevAnnualCtc.toLocaleString('en-IN')}`,
                REVISED_MONTHLY_GROSS: `₹${revMonthlyGross.toLocaleString('en-IN')}`,
                REVISED_ANNUAL_CTC: `₹${revAnnualCtc.toLocaleString('en-IN')}`,
                INCREMENT_TYPE: incType,
                INCREMENT_PERCENTAGE: incPct,
                INCREMENT_AMOUNT: incAmt,
                EFFECTIVE_DATE: effDate,
                DESIGNATION: designationVal,
                DEPARTMENT: departmentVal,
                WORK_LOCATION: workLocationVal,
                LOCATION: workLocationVal,
            };
            result = await NativeDocumentEngine.generateIncrementLetter({
                documentType: payload.documentType,
                brandId: payload.brandId,
                entityId: payload.entityId,
                placeholders,
                generatedBy: 'Super Admin',
            });
        }
        else if (payload.documentType === 'OFFER_LETTER') {
            const placeholders = buildNativeOfferPlaceholders(payload);
            result = await NativeDocumentEngine.generateOfferLetter({
                documentType: payload.documentType,
                brandId: payload.brandId,
                entityId: payload.entityId,
                placeholders,
                generatedBy: 'Super Admin',
            });
        }
        else if (payload.documentType === 'PAYSLIP' || payload.documentType === 'Payslip') {
            const data = payload.data || {};
            const placeholders = {
                LEGAL_NAME: String(data.legalName || data.companyName || ''),
                COMPANY_NAME: String(data.legalName || data.companyName || ''),
                BRAND_NAME: String(data.brandName || ''),
                BRAND_ADDRESS: String(data.brandAddress || data.address || ''),
                ADDRESS: String(data.brandAddress || data.address || ''),
                BRAND_EMAIL: String(data.brandEmail || data.email || ''),
                BRAND_PHONE: String(data.brandPhone || data.phone || ''),
                BRAND_WEBSITE: String(data.brandWebsite || data.website || ''),
                SALARY_MONTH: String(data.salaryMonth || data.month || ''),
                PERSON_NAME: String(data.employeeName || data.personName || ''),
                EMPLOYEE_NAME: String(data.employeeName || data.personName || ''),
                EMPLOYEE_CODE: String(data.employeeCode || data.employeeId || payload.entityId || ''),
                EMPLOYEE_ID: String(data.employeeCode || data.employeeId || payload.entityId || ''),
                DESIGNATION: String(data.designation || ''),
                DEPARTMENT: String(data.department || ''),
                JOINING_DATE: String(data.joiningDate || ''),
                BANK_NAME: String(data.bankName || ''),
                BANK_ACCOUNT_NUMBER: String(data.accountNumber || data.bankAccount || ''),
                ACCOUNT_NUMBER: String(data.accountNumber || data.bankAccount || ''),
                IFSC_CODE: String(data.ifscCode || data.ifsc || ''),
                IFSC: String(data.ifscCode || data.ifsc || ''),
                PAN: String(data.pan || ''),
                WORK_LOCATION: String(data.workLocation || data.location || data.branch || 'Head Office'),
                LOCATION: String(data.workLocation || data.location || data.branch || 'Head Office'),
                PAYSLIP_ID: String(data.payslipId || data.documentId || `PSLIP-${payload.entityId}-${Date.now().toString().slice(-4)}`),
                GENERATED_ON: String(data.generatedOn || data.generatedAt || new Date().toISOString().split('T')[0]),
                BASIC_PAY: String(data.basicPay || '₹0'),
                HRA: String(data.hra || '₹0'),
                CONVEYANCE: String(data.conveyance || '₹0'),
                SPECIAL_ALLOWANCE: String(data.specialAllowance || '₹0'),
                GROSS_EARNINGS: String(data.grossEarnings || '₹0'),
                PF_DEDUCTION: String(data.pfDeduction || '₹0'),
                ESIC_DEDUCTION: String(data.esicDeduction || '₹0'),
                PT_DEDUCTION: String(data.ptDeduction || '₹0'),
                TOTAL_DEDUCTIONS: String(data.totalDeductions || '₹0'),
                NET_PAY: String(data.netPay || '₹0'),
                NET_PAY_WORDS: String(data.netPayWords || ''),
            };
            result = await NativeDocumentEngine.generatePayslip({
                documentType: 'PAYSLIP',
                brandId: payload.brandId,
                entityId: payload.entityId,
                placeholders,
                generatedBy: 'Super Admin',
            });
        }
        else if (payload.documentType === 'INVOICE' || payload.documentType === 'Invoice') {
            const data = payload.data || {};
            const templateType = (data.templateType || 'All');
            const placeholders = {
                LEGAL_NAME: String(data.legalName || data.companyName || ''),
                COMPANY_NAME: String(data.legalName || data.companyName || ''),
                BRAND_NAME: String(data.brandName || 'Hire Huub'),
                BRAND_ADDRESS: String(data.brandAddress || data.address || ''),
                BRAND_PHONE: String(data.brandPhone || data.phone || ''),
                BRAND_EMAIL: String(data.brandEmail || data.email || ''),
                BRAND_WEBSITE: String(data.brandWebsite || data.website || ''),
                INVOICE_NUMBER: String(data.invoiceNumber || payload.entityId || ''),
                INVOICE_DATE: String(data.invoiceDate || ''),
                PO_NUMBER: String(data.poNumber || ''),
                CLIENT_NAME: String(data.clientName || data.clientLegalName || ''),
                CLIENT_ADDRESS: String(data.clientAddress || ''),
                CLIENT_GSTIN: String(data.clientGstin || ''),
                CLIENT_STATE: String(data.clientState || ''),
                BILL_OF_MONTH: String(data.billOfMonth || ''),
                STATION_CODE: String(data.stationCode || ''),
                PLACE_OF_SUPPLY: String(data.placeOfSupply || ''),
                TAXABLE_AMOUNT: String(data.taxableAmount || '0'),
                GST_TYPE: String(data.gstType || ''),
                CGST_AMOUNT: String(data.cgstAmount || '0'),
                SGST_AMOUNT: String(data.sgstAmount || '0'),
                IGST_AMOUNT: String(data.igstAmount || '0'),
                GRAND_TOTAL: String(data.grandTotal || '0'),
                AMOUNT_IN_WORDS: String(data.amountInWords || ''),
                BANK_NAME: String(data.bankName || ''),
                BANK_ACCOUNT: String(data.bankAccount || data.accountNumber || ''),
                IFSC_CODE: String(data.ifscCode || data.ifsc || ''),
                LINE_ITEMS_JSON: String(data.lineItemsJson || JSON.stringify(data.lineItems || [])),
                SIGNATORY_ID: String(data.signatoryId || ''),
                SIGNATORY_NAME: String(data.signatoryName || ''),
                SIGNATORY_DESIGNATION: String(data.signatoryDesignation || ''),
                SIGNATURE_URL: String(data.signatureUrl || ''),
                COMPANY_STAMP_URL: String(data.stampUrl || ''),
            };
            result = await NativeDocumentEngine.generateInvoice({
                documentType: 'INVOICE',
                brandId: payload.brandId,
                entityId: payload.entityId,
                placeholders,
                templateType,
                generatedBy: 'Super Admin',
            });
        }
        else {
            throw new https_1.HttpsError('invalid-argument', `Document Generation Failed: Unsupported documentType '${payload.documentType}'. Supported document types: OFFER_LETTER, RELIEVING_LETTER, INCREMENT_LETTER, PAYSLIP, INVOICE.`);
        }
        return {
            success: true,
            requestId: reqId,
            documentId: result.documentId,
            documentType: result.documentType,
            fileName: result.fileName,
            fileUrl: result.downloadUrl,
            driveFileId: null,
            version: '1.0.0-NATIVE',
            generatedAt: result.generatedAt,
            error: null,
        };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : 'Unknown generation error.';
        const code = err instanceof https_1.HttpsError ? err.code : 'NATIVE_GENERATION_FAILED';
        return {
            success: false,
            requestId: reqId,
            documentId: null,
            documentType: payload?.documentType || 'OFFER_LETTER',
            fileName: null,
            fileUrl: null,
            driveFileId: null,
            version: '1.0.0-NATIVE',
            generatedAt: new Date().toISOString(),
            error: {
                code: String(code),
                message: msg,
            },
        };
    }
});
//# sourceMappingURL=generateNativeDocument.js.map