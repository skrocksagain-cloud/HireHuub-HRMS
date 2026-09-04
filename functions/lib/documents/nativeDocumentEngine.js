"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NativeDocumentEngine = void 0;
const puppeteer_core_1 = __importDefault(require("puppeteer-core"));
const chromium_1 = __importDefault(require("@sparticuz/chromium"));
const firebaseAdmin_1 = require("../config/firebaseAdmin");
const nativeOfferRenderer_1 = require("./renderers/nativeOfferRenderer");
const nativeRelievingRenderer_1 = require("./renderers/nativeRelievingRenderer");
const nativeIncrementRenderer_1 = require("./renderers/nativeIncrementRenderer");
const nativePayslipRenderer_1 = require("./renderers/nativePayslipRenderer");
const nativeInvoiceRenderer_1 = require("./renderers/nativeInvoiceRenderer");
const offerLetterTemplate_1 = require("./templates/offerLetterTemplate");
/**
 * Native ERP Document Engine.
 * Generates documents natively within Firebase Cloud Functions by rendering published ERP designer blocks.
 * Compiles PDF, uploads to private Firebase Storage, and writes metadata into Firestore documents collection.
 */
class NativeDocumentEngine {
    static async generateOfferLetter(options) {
        const { documentType, brandId, entityId, placeholders, generatedBy = 'Super Admin' } = options;
        const cleanBrandId = (brandId || 'brand-hirehuub').toLowerCase().replace(/[^a-z0-9_-]/g, '');
        const templateDocId = `offer_letter_${cleanBrandId}`;
        // 1. Load Published Template from Firestore `document_templates`
        const templateRef = firebaseAdmin_1.adminDb.collection('document_templates').doc(templateDocId);
        const templateSnap = await templateRef.get();
        let blocksToRender = null;
        let versionNum = 1;
        if (templateSnap.exists) {
            const mainData = templateSnap.data() || {};
            const isPublished = mainData.lifecycleState === 'Published' || mainData.status === 'Active';
            if (!isPublished) {
                throw new Error(`Offer Letter generation rejected: Template for brand '${brandId}' is in DRAFT state. Only published templates can be generated.`);
            }
            versionNum = mainData.versionNumber || mainData.version || 1;
            // 2. Load Immutable Version Snapshot from `document_templates/{docId}/versions/v{versionNum}`
            const versionSnap = await templateRef.collection('versions').doc(`v${versionNum}`).get();
            if (versionSnap.exists) {
                const verData = versionSnap.data() || {};
                const verConfig = verData.config || verData;
                blocksToRender = (verConfig.offerSchema?.blocks || verData.offerSchema?.blocks);
            }
            else if (mainData.offerSchema?.blocks) {
                blocksToRender = mainData.offerSchema.blocks;
            }
        }
        // Strict Rule: Draft templates must NEVER be generated. If no published template exists, reject.
        if (!blocksToRender || blocksToRender.length === 0) {
            throw new Error(`Offer Letter generation failed: No published Offer Letter template or version snapshot found for brand '${brandId}'. Please publish a template in the ERP Designer first.`);
        }
        // 3. Resolve Company & Brand Settings (Logos, Stamps, Signatories)
        let brandLogoUrl = '';
        let brandStampUrl = '';
        let defaultSignatureUrl = '';
        let defaultSignatoryName = '';
        let defaultSignatoryDesignation = '';
        const specificSignatures = {};
        try {
            const companySnap = await firebaseAdmin_1.adminDb.collection('admin_company').doc('hirehuub_company_settings').get();
            if (companySnap.exists) {
                const compData = companySnap.data() || {};
                const brandList = (compData.brandProfilesList || []);
                const matchedBrand = brandList.find((b) => b.id === brandId) || brandList[0];
                if (matchedBrand) {
                    brandLogoUrl = matchedBrand.logoUrl || compData.logoUrl || '';
                    brandStampUrl = matchedBrand.stampUrl || compData.stampUrl || '';
                }
                const signatories = (compData.signatoriesV2 || compData.signatures || []);
                const defaultSig = signatories.find((s) => s.isDefault) || signatories[0];
                if (defaultSig) {
                    defaultSignatureUrl = defaultSig.signatureUrl || '';
                    defaultSignatoryName = defaultSig.fullName || '';
                    defaultSignatoryDesignation = defaultSig.designation || '';
                }
                signatories.forEach((s, idx) => {
                    const sigKey = s.id || s.signatoryId || `sig-${idx}`;
                    const sigData = {
                        signatureUrl: s.signatureUrl || s.url || '',
                        fullName: s.fullName || s.name || '',
                        designation: s.designation || '',
                    };
                    specificSignatures[sigKey] = sigData;
                    if (s.id)
                        specificSignatures[s.id] = sigData;
                    if (s.signatoryId)
                        specificSignatures[s.signatoryId] = sigData;
                });
            }
        }
        catch {
            // Fallback gracefully if company settings read fails
        }
        // 4. Render Published Schema Blocks to HTML
        let htmlContent = '';
        try {
            htmlContent = (0, nativeOfferRenderer_1.compileOfferLetterHTML)({
                blocks: blocksToRender,
                placeholders,
                brandLogoUrl,
                brandStampUrl,
                defaultSignatureUrl,
                defaultSignatoryName,
                defaultSignatoryDesignation,
                specificSignatures,
            });
        }
        catch (err) {
            // Fallback reference if renderer encounters unexpected error
            htmlContent = (0, offerLetterTemplate_1.getOfferLetterHTML)(placeholders);
        }
        // 5. Convert HTML to binary PDF buffer via Puppeteer / Headless Chromium
        let pdfBuffer;
        let browser;
        try {
            let executablePath;
            if (process.platform === 'win32') {
                executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
            }
            else {
                executablePath = await chromium_1.default.executablePath();
            }
            browser = await puppeteer_core_1.default.launch({
                args: chromium_1.default.args,
                defaultViewport: chromium_1.default.defaultViewport,
                executablePath,
                headless: chromium_1.default.headless,
            });
            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
            const pdfArray = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
            });
            pdfBuffer = Buffer.from(pdfArray);
        }
        finally {
            if (browser) {
                await browser.close().catch(() => null);
            }
        }
        // 5b. Validate generated PDF buffer
        const firstBytes = pdfBuffer.slice(0, 5).toString('utf-8');
        const eofMarker = pdfBuffer.slice(-1024).toString('utf-8');
        if (!firstBytes.startsWith('%PDF-') || !eofMarker.includes('%%EOF')) {
            throw new Error('PDF Generation Validation Failed: Output byte stream is not a valid binary PDF document.');
        }
        // 6. Prepare File Names & Storage Paths
        const personName = placeholders.PERSON_NAME || 'Candidate';
        const sanitizedRef = entityId.replace(/[\/\\:*?"<>|]/g, '_');
        const sanitizedName = personName.trim().replace(/[\/\\:*?"<>|]/g, '_');
        const fileName = `Offer_Letter_${sanitizedRef}_${sanitizedName}.pdf`;
        const storagePath = `hr/offer-letters/${sanitizedRef}.pdf`;
        // 7. Upload PDF directly to Private Firebase Storage
        const bucket = firebaseAdmin_1.adminStorage.bucket();
        const file = bucket.file(storagePath);
        await file.save(pdfBuffer, {
            metadata: {
                contentType: 'application/pdf',
                metadata: {
                    brandId,
                    entityId,
                    generatedBy,
                    version: `v${versionNum}.0`,
                },
            },
            private: true,
        });
        // 8. Create Document Metadata Record in Firestore (`documents` collection)
        const docRecordId = `doc-offer-${Date.now()}`;
        const generatedAt = new Date().toISOString();
        const documentRecord = {
            id: docRecordId,
            documentId: entityId,
            companyId: brandId,
            branchId: '',
            category: 'HR',
            module: 'Offer',
            documentType: 'Offer Letter',
            referenceId: entityId,
            title: `Offer Letter - ${personName} (${entityId})`,
            fileName,
            version: versionNum,
            status: 'Generated',
            storagePath,
            downloadUrl: storagePath,
            fileUrl: storagePath,
            fileSize: pdfBuffer.length,
            mimeType: 'application/pdf',
            requiresSignature: true,
            isSigned: false,
            signedBy: '',
            qrCodeUrl: '',
            isLocked: true,
            generatedBy,
            generatedAt,
            emailed: false,
            emailedTo: placeholders.PERSON_EMAIL || '',
            downloadCount: 0,
            archived: false,
            remarks: `Generated natively from Published ERP Offer Template v${versionNum}.0`,
            createdBy: generatedBy,
            updatedBy: generatedBy,
            tags: ['OfferLetter', 'PersonBeingOffered', placeholders.DESIGNATION || ''],
        };
        await firebaseAdmin_1.adminDb.collection('documents').doc(docRecordId).set(documentRecord);
        return {
            success: true,
            documentId: docRecordId,
            documentType,
            fileName,
            storagePath,
            downloadUrl: storagePath,
            generatedAt,
        };
    }
    static async generateRelievingLetter(options) {
        const { documentType, brandId, entityId, placeholders, generatedBy = 'Super Admin' } = options;
        const cleanBrandId = (brandId || 'brand-hirehuub').toLowerCase().replace(/[^a-z0-9_-]/g, '');
        const templateDocId = `relieving_letter_${cleanBrandId}`;
        // 1. Load Published Template from Firestore `document_templates`
        const templateRef = firebaseAdmin_1.adminDb.collection('document_templates').doc(templateDocId);
        const templateSnap = await templateRef.get();
        let blocksToRender = null;
        let versionNum = 1;
        if (templateSnap.exists) {
            const mainData = templateSnap.data() || {};
            const isPublished = mainData.lifecycleState === 'Published' || mainData.status === 'Active';
            if (!isPublished) {
                throw new Error(`Relieving Letter generation rejected: Template for brand '${brandId}' is in DRAFT state. Only published templates can be generated.`);
            }
            versionNum = mainData.versionNumber || mainData.version || 1;
            // 2. Load Immutable Version Snapshot from `document_templates/{docId}/versions/v{versionNum}`
            const versionSnap = await templateRef.collection('versions').doc(`v${versionNum}`).get();
            if (versionSnap.exists) {
                const verData = versionSnap.data() || {};
                const verConfig = verData.config || verData;
                blocksToRender = (verConfig.offerSchema?.blocks || verData.offerSchema?.blocks);
            }
            else if (mainData.offerSchema?.blocks) {
                blocksToRender = mainData.offerSchema.blocks;
            }
        }
        if (!blocksToRender || blocksToRender.length === 0) {
            throw new Error(`Relieving Letter generation failed: No published Relieving Letter template or version snapshot found for brand '${brandId}'. Please publish a template in the ERP Designer first.`);
        }
        // 3. Resolve Company & Brand Settings (Logos, Stamps, Signatories)
        let brandLogoUrl = '';
        let brandStampUrl = '';
        let defaultSignatureUrl = '';
        let defaultSignatoryName = '';
        let defaultSignatoryDesignation = '';
        const specificSignatures = {};
        try {
            const companySnap = await firebaseAdmin_1.adminDb.collection('admin_company').doc('hirehuub_company_settings').get();
            if (companySnap.exists) {
                const compData = companySnap.data() || {};
                const brandList = (compData.brandProfilesList || []);
                const matchedBrand = brandList.find((b) => b.id === brandId) || brandList[0];
                if (matchedBrand) {
                    brandLogoUrl = matchedBrand.logoUrl || compData.logoUrl || '';
                    brandStampUrl = matchedBrand.stampUrl || compData.stampUrl || '';
                    if (!placeholders.BRAND_NAME)
                        placeholders.BRAND_NAME = matchedBrand.brandName || '';
                }
                if (!placeholders.LEGAL_NAME)
                    placeholders.LEGAL_NAME = compData.legalName || compData.companyName || matchedBrand?.brandName || '';
                if (!placeholders.COMPANY_NAME)
                    placeholders.COMPANY_NAME = placeholders.LEGAL_NAME;
                if (!placeholders.BRAND_ADDRESS)
                    placeholders.BRAND_ADDRESS = matchedBrand?.address || compData.address || '';
                if (!placeholders.ADDRESS)
                    placeholders.ADDRESS = placeholders.BRAND_ADDRESS;
                if (!placeholders.BRAND_EMAIL)
                    placeholders.BRAND_EMAIL = matchedBrand?.email || compData.email || '';
                if (!placeholders.EMAIL)
                    placeholders.EMAIL = placeholders.BRAND_EMAIL;
                if (!placeholders.BRAND_PHONE)
                    placeholders.BRAND_PHONE = matchedBrand?.phone || compData.phone || '';
                if (!placeholders.PHONE)
                    placeholders.PHONE = placeholders.BRAND_PHONE;
                if (!placeholders.BRAND_WEBSITE)
                    placeholders.BRAND_WEBSITE = matchedBrand?.website || compData.website || '';
                if (!placeholders.WEBSITE)
                    placeholders.WEBSITE = placeholders.BRAND_WEBSITE;
                if (!placeholders.CIN)
                    placeholders.CIN = compData.cin || '';
                if (!placeholders.PAN)
                    placeholders.PAN = compData.pan || '';
                if (!placeholders.GSTIN)
                    placeholders.GSTIN = compData.gstin || '';
                const signatories = (compData.signatoriesV2 || compData.signatures || []);
                const defaultSig = signatories.find((s) => s.isDefault) || signatories[0];
                if (defaultSig) {
                    defaultSignatureUrl = defaultSig.signatureUrl || '';
                    defaultSignatoryName = defaultSig.fullName || '';
                    defaultSignatoryDesignation = defaultSig.designation || '';
                }
                signatories.forEach((s, idx) => {
                    const sigKey = s.id || s.signatoryId || `sig-${idx}`;
                    const sigData = {
                        signatureUrl: s.signatureUrl || s.url || '',
                        fullName: s.fullName || s.name || '',
                        designation: s.designation || '',
                    };
                    specificSignatures[sigKey] = sigData;
                    if (s.id)
                        specificSignatures[s.id] = sigData;
                    if (s.signatoryId)
                        specificSignatures[s.signatoryId] = sigData;
                });
            }
        }
        catch {
            // Fallback gracefully
        }
        // 4. Render Published Schema Blocks to HTML
        const htmlContent = (0, nativeRelievingRenderer_1.compileRelievingLetterHTML)({
            blocks: blocksToRender,
            placeholders,
            brandLogoUrl,
            brandStampUrl,
            defaultSignatureUrl,
            defaultSignatoryName,
            defaultSignatoryDesignation,
            specificSignatures,
        });
        const unresolvedMatches = htmlContent.match(/\{\{\s*[a-zA-Z0-9_.]+\s*\}\}/g);
        if (unresolvedMatches && unresolvedMatches.length > 0) {
            const uniqueTokens = Array.from(new Set(unresolvedMatches)).join(', ');
            throw new Error(`Relieving Letter Generation Failed: Unresolved placeholders remaining in template: [${uniqueTokens}]`);
        }
        // 5. Convert HTML to binary PDF buffer via Puppeteer / Headless Chromium
        let pdfBuffer;
        let browser;
        try {
            let executablePath;
            if (process.platform === 'win32') {
                executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
            }
            else {
                executablePath = await chromium_1.default.executablePath();
            }
            browser = await puppeteer_core_1.default.launch({
                args: chromium_1.default.args,
                defaultViewport: chromium_1.default.defaultViewport,
                executablePath,
                headless: chromium_1.default.headless,
            });
            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
            const pdfArray = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
            });
            pdfBuffer = Buffer.from(pdfArray);
        }
        finally {
            if (browser) {
                await browser.close();
            }
        }
        // 6. Upload PDF Buffer to Firebase Storage
        const fileName = `Relieving_Letter_${entityId.replace(/\//g, '_')}_${(placeholders.PERSON_NAME || 'Employee').replace(/[\/\\:*?"<>|]/g, '_')}.pdf`;
        const storagePath = `hr/relieving-letters/${fileName}`;
        const generatedAt = new Date().toISOString();
        const bucket = firebaseAdmin_1.adminStorage.bucket();
        const file = bucket.file(storagePath);
        await file.save(pdfBuffer, {
            metadata: {
                contentType: 'application/pdf',
                metadata: {
                    generatedBy,
                    generatedAt,
                    entityId,
                    documentType,
                    brandId,
                },
            },
        });
        // 7. Write Document Metadata Record into Firestore `documents` collection
        const docRecordId = `doc-relieving-${Date.now()}`;
        const documentRecord = {
            id: docRecordId,
            documentId: entityId,
            companyId: brandId,
            branchId: '',
            category: 'HR',
            module: 'Relieving',
            documentType: 'Relieving Letter',
            referenceId: entityId,
            title: `Relieving Letter - ${placeholders.PERSON_NAME || ''} (${entityId})`,
            fileName,
            version: versionNum,
            status: 'Generated',
            storagePath,
            downloadUrl: storagePath,
            fileUrl: storagePath,
            fileSize: pdfBuffer.length,
            mimeType: 'application/pdf',
            requiresSignature: true,
            isSigned: false,
            signedBy: '',
            qrCodeUrl: '',
            isLocked: true,
            generatedBy,
            generatedAt,
            emailed: false,
            emailedTo: placeholders.PERSON_EMAIL || '',
            downloadCount: 0,
            archived: false,
            remarks: `Generated natively from Published ERP Relieving Template v${versionNum}.0`,
            createdBy: generatedBy,
            updatedBy: generatedBy,
            tags: ['RelievingLetter', 'ExitedEmployee', placeholders.DESIGNATION || ''],
        };
        await firebaseAdmin_1.adminDb.collection('documents').doc(docRecordId).set(documentRecord);
        return {
            success: true,
            documentId: docRecordId,
            documentType,
            fileName,
            storagePath,
            downloadUrl: storagePath,
            generatedAt,
        };
    }
    /**
     * Generates a native binary PDF for INCREMENT_LETTER documents.
     */
    static async generateIncrementLetter(options) {
        const { brandId, entityId, documentType, placeholders, generatedBy = 'Super Admin' } = options;
        const cleanBrandId = brandId.replace(/[^a-zA-Z0-9_-]/g, '_');
        const templateDocId = `increment_letter_${cleanBrandId}`;
        let blocksToRender = [];
        let versionNum = 1;
        try {
            const tmplSnap = await firebaseAdmin_1.adminDb.collection('document_templates').doc(templateDocId).get();
            if (tmplSnap.exists) {
                const tmplData = tmplSnap.data();
                if (tmplData) {
                    const blocks = (tmplData.offerSchema && Array.isArray(tmplData.offerSchema.blocks) && tmplData.offerSchema.blocks.length > 0)
                        ? tmplData.offerSchema.blocks
                        : (Array.isArray(tmplData.sections) ? tmplData.sections : []);
                    if (blocks.length > 0) {
                        blocksToRender = blocks;
                        versionNum = tmplData.versionNumber || tmplData.currentVersionNumber || tmplData.version || 1;
                    }
                }
            }
        }
        catch {
            // Fallback
        }
        if (!blocksToRender || blocksToRender.length === 0) {
            throw new Error(`Increment Letter template for brand '${brandId}' not found or has no sections.`);
        }
        let brandLogoUrl = '';
        let brandStampUrl = '';
        let defaultSignatureUrl = '';
        let defaultSignatoryName = '';
        let defaultSignatoryDesignation = '';
        const specificSignatures = {};
        try {
            const companySnap = await firebaseAdmin_1.adminDb.collection('admin_company').doc('hirehuub_company_settings').get();
            if (companySnap.exists) {
                const cData = companySnap.data() || {};
                const brandProfiles = cData.brandProfilesList || [];
                const matchedBrand = brandProfiles.find((b) => b.id === brandId || b.brandId === brandId);
                if (matchedBrand) {
                    brandLogoUrl = matchedBrand.logoUrl || cData.logoUrl || '';
                    brandStampUrl = matchedBrand.stampUrl || cData.stampUrl || '';
                }
                else {
                    brandLogoUrl = cData.logoUrl || '';
                    brandStampUrl = cData.stampUrl || '';
                }
                const signatories = cData.signatoriesV2 || [];
                const activeSignatories = signatories.filter((s) => s.isActive !== false);
                const primarySig = activeSignatories.find((s) => s.isPrimary) || activeSignatories[0] || signatories.find((s) => s.isPrimary) || signatories[0];
                if (primarySig) {
                    defaultSignatureUrl = primarySig.signatureUrl || primarySig.url || '';
                    defaultSignatoryName = primarySig.fullName || primarySig.name || '';
                    defaultSignatoryDesignation = primarySig.designation || '';
                }
                signatories.forEach((s, idx) => {
                    const sigKey = s.id || s.signatoryId || `sig-${idx}`;
                    const sigData = {
                        signatureUrl: s.signatureUrl || s.url || '',
                        fullName: s.fullName || s.name || '',
                        designation: s.designation || '',
                    };
                    specificSignatures[sigKey] = sigData;
                    if (s.id)
                        specificSignatures[s.id] = sigData;
                    if (s.signatoryId)
                        specificSignatures[s.signatoryId] = sigData;
                });
                const legalName = cData.companyName || cData.legalName || '';
                const brandName = matchedBrand?.brandName || cData.brandName || matchedBrand?.name || '';
                const brandAddress = matchedBrand?.address || cData.address || '';
                const brandEmail = matchedBrand?.email || cData.email || '';
                const brandPhone = matchedBrand?.phone || cData.phone || '';
                const brandWebsite = matchedBrand?.website || cData.website || '';
                const cin = cData.cin || '';
                const pan = cData.pan || '';
                const gstin = cData.gstin || '';
                if (!placeholders.LEGAL_NAME)
                    placeholders.LEGAL_NAME = legalName;
                if (!placeholders.COMPANY_NAME)
                    placeholders.COMPANY_NAME = legalName;
                if (!placeholders.BRAND_NAME)
                    placeholders.BRAND_NAME = brandName;
                if (!placeholders.BRAND_ADDRESS)
                    placeholders.BRAND_ADDRESS = brandAddress;
                if (!placeholders.ADDRESS)
                    placeholders.ADDRESS = brandAddress;
                if (!placeholders.BRAND_EMAIL)
                    placeholders.BRAND_EMAIL = brandEmail;
                if (!placeholders.EMAIL)
                    placeholders.EMAIL = brandEmail;
                if (!placeholders.BRAND_PHONE)
                    placeholders.BRAND_PHONE = brandPhone;
                if (!placeholders.PHONE)
                    placeholders.PHONE = brandPhone;
                if (!placeholders.BRAND_WEBSITE)
                    placeholders.BRAND_WEBSITE = brandWebsite;
                if (!placeholders.WEBSITE)
                    placeholders.WEBSITE = brandWebsite;
                if (!placeholders.CIN)
                    placeholders.CIN = cin;
                if (!placeholders.PAN)
                    placeholders.PAN = pan;
                if (!placeholders.GSTIN)
                    placeholders.GSTIN = gstin;
            }
        }
        catch {
            // Fallback
        }
        const htmlContent = (0, nativeIncrementRenderer_1.compileIncrementLetterHTML)({
            blocks: blocksToRender,
            placeholders,
            brandLogoUrl,
            brandStampUrl,
            defaultSignatureUrl,
            defaultSignatoryName,
            defaultSignatoryDesignation,
            specificSignatures,
        });
        const unresolvedMatches = htmlContent.match(/\{\{\s*[a-zA-Z0-9_.]+\s*\}\}/g);
        if (unresolvedMatches && unresolvedMatches.length > 0) {
            const uniqueTokens = Array.from(new Set(unresolvedMatches)).join(', ');
            throw new Error(`Increment Letter Generation Failed: Unresolved placeholders remaining in template: [${uniqueTokens}]`);
        }
        let pdfBuffer;
        let browser;
        try {
            let executablePath;
            if (process.platform === 'win32') {
                executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
            }
            else {
                executablePath = await chromium_1.default.executablePath();
            }
            browser = await puppeteer_core_1.default.launch({
                args: chromium_1.default.args,
                defaultViewport: chromium_1.default.defaultViewport,
                executablePath,
                headless: chromium_1.default.headless,
            });
            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
            const pdfArray = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
            });
            pdfBuffer = Buffer.from(pdfArray);
        }
        finally {
            if (browser) {
                await browser.close();
            }
        }
        const fileName = `Increment_Letter_${entityId.replace(/\//g, '_')}_${(placeholders.PERSON_NAME || 'Employee').replace(/[\/\\:*?"<>|]/g, '_')}.pdf`;
        const storagePath = `hr/increment-letters/${fileName}`;
        const generatedAt = new Date().toISOString();
        const bucket = firebaseAdmin_1.adminStorage.bucket();
        const file = bucket.file(storagePath);
        await file.save(pdfBuffer, {
            metadata: {
                contentType: 'application/pdf',
                metadata: {
                    generatedBy,
                    generatedAt,
                    entityId,
                    documentType,
                    brandId,
                },
            },
        });
        const docRecordId = `doc-increment-${Date.now()}`;
        const documentRecord = {
            id: docRecordId,
            documentId: entityId,
            companyId: brandId,
            branchId: '',
            category: 'HR',
            module: 'Appraisal',
            documentType: 'Increment Letter',
            referenceId: entityId,
            title: `Increment Letter - ${placeholders.PERSON_NAME || ''} (${entityId})`,
            fileName,
            version: versionNum,
            status: 'Generated',
            storagePath,
            downloadUrl: storagePath,
            fileUrl: storagePath,
            fileSize: pdfBuffer.length,
            mimeType: 'application/pdf',
            requiresSignature: true,
            isSigned: false,
            signedBy: '',
            qrCodeUrl: '',
            isLocked: true,
            generatedBy,
            generatedAt,
            emailed: false,
            emailedTo: placeholders.PERSON_EMAIL || '',
            downloadCount: 0,
            archived: false,
            remarks: `Generated natively from Published ERP Increment Template v${versionNum}.0`,
            createdBy: generatedBy,
            updatedBy: generatedBy,
            tags: ['IncrementLetter', 'Appraisal', placeholders.DESIGNATION || ''],
        };
        await firebaseAdmin_1.adminDb.collection('documents').doc(docRecordId).set(documentRecord);
        return {
            success: true,
            documentId: docRecordId,
            documentType,
            fileName,
            storagePath,
            downloadUrl: storagePath,
            generatedAt,
        };
    }
    /**
     * Generates a Payslip document natively using Puppeteer and stores in hr/payslips/
     */
    static async generatePayslip(options) {
        const { brandId, entityId, placeholders, generatedBy = 'Super Admin' } = options;
        let brandLogoUrl = '';
        let defaultSignatureUrl = '';
        let defaultSignatoryName = '';
        let defaultSignatoryDesignation = '';
        try {
            const companySnap = await firebaseAdmin_1.adminDb.collection('admin_company').doc('hirehuub_company_settings').get();
            if (companySnap.exists) {
                const cData = companySnap.data() || {};
                const brandProfiles = cData.brandProfilesList || [];
                const matchedBrand = brandProfiles.find((b) => b.id === brandId || b.brandId === brandId);
                if (matchedBrand) {
                    brandLogoUrl = matchedBrand.logoUrl || cData.logoUrl || '';
                }
                else {
                    brandLogoUrl = cData.logoUrl || '';
                }
                const signatories = cData.signatoriesV2 || [];
                const activeSignatories = signatories.filter((s) => s.isActive !== false);
                const primarySig = activeSignatories.find((s) => s.isPrimary) || activeSignatories[0];
                if (primarySig) {
                    defaultSignatureUrl = primarySig.signatureUrl || primarySig.url || '';
                    defaultSignatoryName = primarySig.fullName || primarySig.name || '';
                    defaultSignatoryDesignation = primarySig.designation || '';
                }
                const legalName = cData.companyName || cData.legalName || '';
                const brandName = matchedBrand?.brandName || cData.brandName || matchedBrand?.name || '';
                if (!placeholders.LEGAL_NAME)
                    placeholders.LEGAL_NAME = legalName;
                if (!placeholders.COMPANY_NAME)
                    placeholders.COMPANY_NAME = legalName;
                if (!placeholders.BRAND_NAME)
                    placeholders.BRAND_NAME = brandName;
                if (!placeholders.BRAND_ADDRESS)
                    placeholders.BRAND_ADDRESS = matchedBrand?.address || cData.address || '';
                if (!placeholders.BRAND_PHONE)
                    placeholders.BRAND_PHONE = matchedBrand?.phone || cData.phone || '';
                if (!placeholders.BRAND_EMAIL)
                    placeholders.BRAND_EMAIL = matchedBrand?.email || cData.email || '';
                if (!placeholders.BRAND_WEBSITE)
                    placeholders.BRAND_WEBSITE = matchedBrand?.website || cData.website || '';
            }
        }
        catch {
            // Fallback
        }
        const htmlContent = (0, nativePayslipRenderer_1.compilePayslipHTML)({
            blocks: [],
            placeholders,
            brandLogoUrl,
            defaultSignatureUrl,
            defaultSignatoryName,
            defaultSignatoryDesignation,
        });
        let pdfBuffer;
        let browser;
        try {
            let executablePath;
            if (process.platform === 'win32') {
                executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
            }
            else {
                executablePath = await chromium_1.default.executablePath();
            }
            browser = await puppeteer_core_1.default.launch({
                args: chromium_1.default.args,
                defaultViewport: chromium_1.default.defaultViewport,
                executablePath,
                headless: chromium_1.default.headless,
            });
            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
            const pdfArray = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
            });
            pdfBuffer = Buffer.from(pdfArray);
        }
        finally {
            if (browser) {
                await browser.close();
            }
        }
        const empCodeName = (placeholders.PERSON_NAME || 'Employee').replace(/[\/\\:*?"<>|]/g, '_');
        const monthTag = (placeholders.SALARY_MONTH || 'Payslip').replace(/[\/\\:*?"<>|\s]/g, '_');
        const fileName = `Payslip_${entityId.replace(/\//g, '_')}_${empCodeName}_${monthTag}.pdf`;
        const storagePath = `hr/payslips/${fileName}`;
        const generatedAt = new Date().toISOString();
        const bucket = firebaseAdmin_1.adminStorage.bucket();
        const file = bucket.file(storagePath);
        await file.save(pdfBuffer, {
            metadata: {
                contentType: 'application/pdf',
                metadata: {
                    generatedBy,
                    generatedAt,
                    entityId,
                    documentType: 'Payslip',
                    brandId,
                },
            },
        });
        const docRecordId = `doc-payslip-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const documentRecord = {
            id: docRecordId,
            documentId: entityId,
            companyId: brandId,
            branchId: '',
            category: 'HR',
            module: 'Payroll',
            documentType: 'Payslip',
            referenceId: entityId,
            title: `Payslip - ${placeholders.PERSON_NAME || ''} (${placeholders.SALARY_MONTH || ''})`,
            fileName,
            version: 1,
            status: 'Generated',
            storagePath,
            downloadUrl: storagePath,
            fileUrl: storagePath,
            fileSize: pdfBuffer.length,
            mimeType: 'application/pdf',
            requiresSignature: false,
            isSigned: true,
            signedBy: defaultSignatoryName,
            qrCodeUrl: '',
            isLocked: true,
            generatedBy,
            generatedAt,
            emailed: false,
            emailedTo: placeholders.PERSON_EMAIL || '',
            downloadCount: 0,
            archived: false,
            remarks: `Generated for released payroll period ${placeholders.SALARY_MONTH || ''}`,
            createdBy: generatedBy,
            updatedBy: generatedBy,
            tags: ['Payslip', 'Payroll', placeholders.SALARY_MONTH || ''],
        };
        await firebaseAdmin_1.adminDb.collection('documents').doc(docRecordId).set(documentRecord);
        // Persist exact generated storagePath and documentId to generated_payslips collection if entityId exists
        if (entityId) {
            await firebaseAdmin_1.adminDb.collection('generated_payslips').doc(entityId).set({
                storagePath,
                documentId: docRecordId,
                updatedAt: generatedAt,
            }, { merge: true }).catch(() => null);
        }
        return {
            success: true,
            documentId: docRecordId,
            documentType: 'Payslip',
            fileName,
            storagePath,
            downloadUrl: storagePath,
            generatedAt,
        };
    }
    /**
     * Generates a Tax Invoice document natively using Puppeteer and stores in finance/invoices/
     */
    static async generateInvoice(options) {
        const { brandId, entityId, placeholders, templateType = 'All', generatedBy = 'Super Admin' } = options;
        let brandLogoUrl = '';
        let defaultSignatoryName = '';
        try {
            const companySnap = await firebaseAdmin_1.adminDb.collection('admin_company').doc('hirehuub_company_settings').get();
            if (companySnap.exists) {
                const cData = companySnap.data() || {};
                brandLogoUrl = cData.logoUrl || '';
                if (!placeholders.COMPANY_STAMP_URL)
                    placeholders.COMPANY_STAMP_URL = cData.stampUrl || '';
                const signatories = cData.signatoriesV2 || [];
                const activeSignatories = signatories.filter((s) => s.isActive !== false);
                let matchedSig = null;
                if (placeholders.SIGNATORY_ID) {
                    matchedSig = activeSignatories.find((s) => s.id === placeholders.SIGNATORY_ID);
                }
                if (!matchedSig && placeholders.SIGNATORY_NAME) {
                    matchedSig = activeSignatories.find((s) => (s.fullName || s.name || '').trim().toLowerCase() === placeholders.SIGNATORY_NAME.trim().toLowerCase());
                }
                if (!matchedSig) {
                    matchedSig = activeSignatories.find((s) => s.isPrimary) || activeSignatories[0];
                }
                if (matchedSig) {
                    defaultSignatoryName = matchedSig.fullName || matchedSig.name || '';
                    if (!placeholders.SIGNATORY_NAME)
                        placeholders.SIGNATORY_NAME = defaultSignatoryName;
                    if (!placeholders.SIGNATORY_DESIGNATION)
                        placeholders.SIGNATORY_DESIGNATION = matchedSig.designation || '';
                    if (!placeholders.SIGNATURE_URL)
                        placeholders.SIGNATURE_URL = matchedSig.signatureUrl || '';
                }
                const legalName = cData.companyName || cData.legalName || '';
                if (!placeholders.LEGAL_NAME)
                    placeholders.LEGAL_NAME = legalName;
                if (!placeholders.COMPANY_NAME)
                    placeholders.COMPANY_NAME = legalName;
                if (!placeholders.BRAND_NAME)
                    placeholders.BRAND_NAME = cData.brandName || 'Hire Huub';
                if (!placeholders.BRAND_ADDRESS)
                    placeholders.BRAND_ADDRESS = cData.address || '';
                if (!placeholders.BRAND_PHONE)
                    placeholders.BRAND_PHONE = cData.phone || '';
                if (!placeholders.BRAND_EMAIL)
                    placeholders.BRAND_EMAIL = cData.email || '';
                if (!placeholders.BRAND_WEBSITE)
                    placeholders.BRAND_WEBSITE = cData.website || '';
                if (!placeholders.COMPANY_GSTIN)
                    placeholders.COMPANY_GSTIN = cData.gstin || '';
                if (!placeholders.COMPANY_PAN)
                    placeholders.COMPANY_PAN = cData.pan || '';
                if (!placeholders.REGISTERED_STATE)
                    placeholders.REGISTERED_STATE = cData.registeredState || 'West Bengal';
                if (cData.bankDetails) {
                    if (!placeholders.BANK_NAME)
                        placeholders.BANK_NAME = cData.bankDetails.bankName || '';
                    if (!placeholders.BANK_ACCOUNT)
                        placeholders.BANK_ACCOUNT = cData.bankDetails.accountNumber || '';
                    if (!placeholders.IFSC_CODE)
                        placeholders.IFSC_CODE = cData.bankDetails.ifscCode || '';
                }
            }
        }
        catch {
            // Fallback
        }
        if (!placeholders.SIGNATORY_NAME)
            placeholders.SIGNATORY_NAME = defaultSignatoryName || 'Authorized Signatory';
        const htmlContent = (0, nativeInvoiceRenderer_1.compileInvoiceHTML)({
            blocks: [],
            placeholders,
            brandLogoUrl,
            templateType,
        });
        let pdfBuffer;
        let browser;
        try {
            let executablePath;
            if (process.platform === 'win32') {
                executablePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
            }
            else {
                executablePath = await chromium_1.default.executablePath();
            }
            browser = await puppeteer_core_1.default.launch({
                args: chromium_1.default.args,
                defaultViewport: chromium_1.default.defaultViewport,
                executablePath,
                headless: chromium_1.default.headless,
            });
            const page = await browser.newPage();
            await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
            const pdfArray = await page.pdf({
                format: 'A4',
                printBackground: true,
                margin: { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
            });
            pdfBuffer = Buffer.from(pdfArray);
        }
        finally {
            if (browser) {
                await browser.close();
            }
        }
        const safeInvNum = (placeholders.INVOICE_NUMBER || entityId).replace(/[\/\\:*?"<>|]/g, '_');
        const fileName = `Invoice_${safeInvNum}.pdf`;
        const storagePath = `finance/invoices/${safeInvNum}/${fileName}`;
        const generatedAt = new Date().toISOString();
        const bucket = firebaseAdmin_1.adminStorage.bucket();
        const file = bucket.file(storagePath);
        await file.save(pdfBuffer, {
            metadata: {
                contentType: 'application/pdf',
                metadata: {
                    generatedBy,
                    generatedAt,
                    entityId,
                    documentType: 'Invoice',
                    brandId,
                    templateType,
                },
            },
        });
        const docRecordId = `doc-invoice-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        const documentRecord = {
            id: docRecordId,
            documentId: placeholders.INVOICE_NUMBER || entityId,
            companyId: brandId,
            branchId: '',
            category: 'Finance',
            module: 'Finance',
            documentType: 'Invoice',
            referenceId: entityId,
            title: `Invoice ${placeholders.INVOICE_NUMBER || entityId} - ${placeholders.CLIENT_NAME || ''}`,
            fileName,
            version: 1,
            status: 'Generated',
            storagePath,
            downloadUrl: storagePath,
            fileUrl: storagePath,
            fileSize: pdfBuffer.length,
            mimeType: 'application/pdf',
            requiresSignature: false,
            isSigned: true,
            signedBy: placeholders.SIGNATORY_NAME || defaultSignatoryName,
            qrCodeUrl: '',
            isLocked: false,
            generatedBy,
            generatedAt,
            emailed: false,
            emailedTo: placeholders.CLIENT_EMAIL || '',
            downloadCount: 0,
            archived: false,
            remarks: `Generated Hire Huub Invoice Template (${templateType})`,
            createdBy: generatedBy,
            updatedBy: generatedBy,
            tags: ['Invoice', 'Finance', templateType],
        };
        await firebaseAdmin_1.adminDb.collection('documents').doc(docRecordId).set(documentRecord);
        return {
            success: true,
            documentId: docRecordId,
            documentType: 'Invoice',
            fileName,
            storagePath,
            downloadUrl: storagePath,
            generatedAt,
        };
    }
}
exports.NativeDocumentEngine = NativeDocumentEngine;
//# sourceMappingURL=nativeDocumentEngine.js.map