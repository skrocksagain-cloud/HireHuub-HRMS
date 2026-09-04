"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateResolver = void 0;
const firebaseAdmin_1 = require("../config/firebaseAdmin");
/**
 * Validates whether a candidate string is a valid Google Drive/Docs file ID.
 * Standard Google Drive file IDs are alphanumeric strings of at least 25 characters
 * and do NOT start with local prefixes like "tmpl-", "doc-", "offer-", or contain local file extensions.
 */
function isValidGoogleFileId(id) {
    if (!id || typeof id !== 'string')
        return false;
    const trimmed = id.trim();
    if (trimmed.length < 25)
        return false;
    if (trimmed.startsWith('tmpl-') || trimmed.startsWith('doc-') || trimmed.startsWith('offer-') || trimmed.startsWith('tpl-'))
        return false;
    if (trimmed.includes('/') || trimmed.includes('.') || trimmed.includes(':'))
        return false;
    return /^[a-zA-Z0-9_-]{25,}$/.test(trimmed);
}
/**
 * Extracts clean Google File ID from raw string or Google Docs/Drive URL.
 * Strictly rejects local Firestore document IDs, slugs, and invalid strings.
 */
function extractGoogleFileId(val) {
    if (!val || typeof val !== 'string')
        return '';
    const trimmed = val.trim();
    if (!trimmed)
        return '';
    // Extract ID from Google Doc URL format: /d/FILE_ID/edit
    const match = trimmed.match(/\/d\/([a-zA-Z0-9_-]{25,})/);
    if (match && match[1]) {
        return match[1];
    }
    // Extract from URL parameter id=FILE_ID
    const paramMatch = trimmed.match(/id=([a-zA-Z0-9_-]{25,})/);
    if (paramMatch && paramMatch[1]) {
        return paramMatch[1];
    }
    // Check if string itself is a valid clean Google File ID
    if (isValidGoogleFileId(trimmed)) {
        return trimmed;
    }
    return '';
}
/**
 * Helper to extract template ID from a template record object across supported fields.
 * Only accepts valid Google Docs/Drive File IDs.
 */
function extractTemplateIdFromRecord(data) {
    if (!data)
        return '';
    const builderSchema = data.builderSchema;
    const candidateFields = [
        data.googleDocTemplateId,
        builderSchema?.googleDocTemplateId,
        data.templateFileUrl,
        data.templateStoragePath,
        data.templateId,
    ];
    for (const candidate of candidateFields) {
        if (candidate) {
            const extracted = extractGoogleFileId(String(candidate));
            if (extracted) {
                return extracted;
            }
        }
    }
    return '';
}
/**
 * Resolves template and storage folder configuration based on V3 document rules.
 */
class TemplateResolver {
    /**
     * Resolves template ID & target Drive folder ID for a given document type and context.
     */
    static async resolveTemplate(documentType, brandId, clientId) {
        // Fetch Company Settings / Brand Profiles
        const companyDoc = await firebaseAdmin_1.adminDb.collection('admin_company').doc('hirehuub_company_settings').get();
        const companyData = companyDoc.exists ? companyDoc.data() || {} : {};
        const brandProfilesList = (companyData.brandProfilesList || []);
        const brand = brandProfilesList.find((b) => b.id === brandId) || brandProfilesList[0];
        const folderId = brand?.documentStorage?.[documentType]?.folderId || '';
        if (!folderId) {
            throw new Error(`Google Drive storage folder is not configured for brand '${brandId}' and document type '${documentType}'.`);
        }
        let templateId = '';
        switch (documentType) {
            case 'OFFER_LETTER': {
                // Priority 1 — Selected Brand
                const rawBrandDocTmpl = brand?.documentTemplates?.OFFER_LETTER?.templateId;
                const rawBrandDocStorageTmpl = brand?.documentStorage?.OFFER_LETTER?.templateId;
                templateId = extractGoogleFileId(rawBrandDocTmpl || rawBrandDocStorageTmpl);
                // 1c. Check document_templates collection for templates explicitly linked to this selected Brand
                if (!templateId) {
                    const brandTemplatesSnap = await firebaseAdmin_1.adminDb
                        .collection('document_templates')
                        .where('brandProfileId', '==', brandId)
                        .get();
                    for (const docSnap of brandTemplatesSnap.docs) {
                        const data = docSnap.data();
                        const rawType = (data.type || data.documentType || data.templateName || '').toString().toLowerCase();
                        if (rawType.includes('offer')) {
                            const extracted = extractTemplateIdFromRecord(data);
                            if (extracted) {
                                templateId = extracted;
                                break;
                            }
                        }
                    }
                }
                // Priority 2 — Explicitly designated default/global template (Only if selected Brand has no template)
                if (!templateId) {
                    const defaultTemplatesSnap = await firebaseAdmin_1.adminDb
                        .collection('document_templates')
                        .where('isDefaultBrandTemplate', '==', true)
                        .get();
                    for (const docSnap of defaultTemplatesSnap.docs) {
                        const data = docSnap.data();
                        const rawType = (data.type || data.documentType || data.templateName || '').toString().toLowerCase();
                        if (rawType.includes('offer')) {
                            const extracted = extractTemplateIdFromRecord(data);
                            if (extracted) {
                                templateId = extracted;
                                break;
                            }
                        }
                    }
                }
                // Priority 3 — Global fallback if marked as global/system template
                if (!templateId) {
                    const allTemplatesSnap = await firebaseAdmin_1.adminDb.collection('document_templates').get();
                    for (const docSnap of allTemplatesSnap.docs) {
                        const data = docSnap.data();
                        const rawType = (data.type || data.documentType || data.templateName || '').toString().toLowerCase();
                        const isGlobal = data.isGlobal === true || data.brandProfileId === 'global' || !data.brandProfileId;
                        if (rawType.includes('offer') && isGlobal) {
                            const extracted = extractTemplateIdFromRecord(data);
                            if (extracted) {
                                templateId = extracted;
                                break;
                            }
                        }
                    }
                }
                break;
            }
            case 'RELIEVING_LETTER':
            case 'APPRAISAL_LETTER':
            case 'PAYSLIP': {
                const rawBrandTmpl = brand?.documentTemplates?.[documentType]?.templateId ||
                    brand?.documentStorage?.[documentType]?.templateId;
                templateId = extractGoogleFileId(rawBrandTmpl);
                break;
            }
            case 'INVOICE': {
                if (clientId) {
                    const clientDoc = await firebaseAdmin_1.adminDb.collection('clients').doc(clientId).get();
                    if (clientDoc.exists) {
                        const clientData = clientDoc.data() || {};
                        const rawClientTmpl = clientData?.documentTemplates?.INVOICE?.templateId;
                        templateId = extractGoogleFileId(rawClientTmpl);
                    }
                }
                if (!templateId) {
                    const rawBrandInvoice = brand?.documentTemplates?.INVOICE?.templateId ||
                        brand?.documentStorage?.INVOICE?.templateId;
                    templateId = extractGoogleFileId(rawBrandInvoice);
                }
                break;
            }
            default:
                throw new Error(`Unsupported document type '${documentType}'.`);
        }
        if (!templateId) {
            throw new Error(`Master Google Doc template ID is not configured for brand '${brandId}' and document type '${documentType}'.`);
        }
        return {
            templateId,
            folderId,
            documentType,
        };
    }
}
exports.TemplateResolver = TemplateResolver;
//# sourceMappingURL=templateResolver.js.map