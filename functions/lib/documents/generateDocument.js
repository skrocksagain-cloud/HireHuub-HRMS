"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateDocument = void 0;
const https_1 = require("firebase-functions/v2/https");
const firebaseAdmin_1 = require("../config/firebaseAdmin");
const placeholderEngine_1 = require("../engine/placeholderEngine");
function sanitizePayload(obj) {
    const cleanObj = {};
    for (const [key, value] of Object.entries(obj)) {
        if (value === undefined) {
            cleanObj[key] = null;
        }
        else if (value !== null && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
            cleanObj[key] = sanitizePayload(value);
        }
        else {
            cleanObj[key] = value;
        }
    }
    return cleanObj;
}
const slugify = (text) => text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
exports.generateDocument = (0, https_1.onCall)({
    cors: true,
}, async (request) => {
    const data = request.data;
    const docType = data?.documentType || '';
    const entityId = data?.entityId || `REF-${Date.now()}`;
    const outputFormat = data?.outputFormat || 'PDF';
    if (!docType) {
        throw new https_1.HttpsError('invalid-argument', "Document Generation Error: 'documentType' is required.");
    }
    try {
        // 1. Read active published UTB template schema from Firestore `document_templates` via Admin SDK
        const slug = slugify(docType);
        const snapshot = await firebaseAdmin_1.adminDb.collection('document_templates').doc(slug).get();
        let templateData = snapshot.exists ? snapshot.data() : null;
        if (!templateData) {
            const querySnap = await firebaseAdmin_1.adminDb
                .collection('document_templates')
                .where('type', '==', docType)
                .limit(1)
                .get();
            if (!querySnap.empty) {
                templateData = querySnap.docs[0].data();
            }
        }
        if (!templateData) {
            throw new https_1.HttpsError('not-found', `No template found for '${docType}'. Please configure one in Administration → Document Templates via the Universal Template Builder.`);
        }
        // Check Published or Active lifecycle status
        const state = templateData.lifecycleState || (templateData.isActive ? 'Published' : 'Draft');
        if (state !== 'Published' && templateData.status === 'Inactive') {
            throw new https_1.HttpsError('failed-precondition', `Template for '${docType}' is currently in state '${state}'. Only Published templates can be used for document generation.`);
        }
        // 2. Resolve Legal Company Entity & Brand Profiles
        const companyDoc = await firebaseAdmin_1.adminDb.collection('admin_company').doc('hirehuub_company_settings').get();
        const companyData = (companyDoc.exists ? companyDoc.data() : {}) || {};
        const foundBrand = (companyData.brandProfilesList || []).find((b) => b.id === templateData?.brandProfileId);
        const brandProfile = {
            id: foundBrand?.id || 'default',
            brandName: foundBrand?.brandName || companyData.brandName || companyData.companyName || 'HireHuub Enterprise ERP',
            logoUrl: foundBrand?.logoUrl || companyData.logoUrl || '',
            email: foundBrand?.email || companyData.email || 'hr@hirehuub.com',
            phone: foundBrand?.phone || companyData.phone || '+91 22 4900 1200',
            website: foundBrand?.website || companyData.website || 'https://hirehuub.com',
            address: foundBrand?.address || companyData.address || 'Corporate Financial Center, BKC, Mumbai, Maharashtra 400051',
        };
        const legalEntity = companyData.legalEntity || {
            legalCompanyName: companyData.companyName || 'HireHuub HR Solutions Private Limited',
            cin: companyData.cin || 'U74999MH2026PTC384920',
            pan: companyData.pan || 'AAACH9042K',
            gstin: companyData.gstin || '27AAACH9042K1Z5',
            registeredOfficeAddress: companyData.address || 'Corporate Financial Center, BKC, Mumbai, Maharashtra 400051',
        };
        const mergedContext = {
            company: {
                ...companyData,
                brandName: brandProfile.brandName,
                address: brandProfile.address,
            },
            ...data.placeholderContext,
        };
        const resolvedPlaceholders = placeholderEngine_1.backendPlaceholderEngine.resolvePlaceholders(mergedContext);
        // 3. Render Specialized Document Type Layouts
        const schema = templateData.builderSchema || {};
        const primaryColor = schema.theme?.primaryColor || '#0284c7';
        const docTypeLower = docType.toLowerCase();
        let htmlContent = `<!DOCTYPE html><html><head><meta charset="utf-8"/><style>
        body { font-family: ${schema.theme?.fontFamily || 'Arial, sans-serif'}; margin: 30px; color: #0f172a; }
        .header { border-bottom: 2px solid ${primaryColor}; padding-bottom: 12px; margin-bottom: 20px; display: flex; justify-content: space-between; }
        .footer { border-top: 1px solid #cbd5e1; margin-top: 30px; padding-top: 12px; font-size: 10px; color: #64748b; text-align: center; }
        .heading { color: ${primaryColor}; font-weight: bold; font-size: 18px; margin-bottom: 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; margin-bottom: 16px; }
        th, td { border: 1px solid #e2e8f0; padding: 8px; text-align: left; font-size: 12px; }
        th { background-color: ${primaryColor}; color: #ffffff; font-weight: bold; }
        .sign-block { margin-top: 40px; display: flex; justify-content: space-between; align-items: flex-end; }
      </style></head><body>`;
        // Header
        htmlContent += `<div class="header">
        <div>
          <h1 style="margin:0; font-size:20px; color:${primaryColor}">${brandProfile.brandName}</h1>
          <p style="margin:4px 0 0; font-size:11px; color:#64748b">${brandProfile.address}</p>
        </div>
        <div style="text-align:right; font-size:10px; font-family:monospace; color:#64748b">
          <p style="font-weight:bold; color:#0f172a">${legalEntity.legalCompanyName}</p>
          <p>CIN: ${legalEntity.cin}</p>
          <p>GSTIN: ${legalEntity.gstin}</p>
        </div>
      </div>`;
        // Specialized Builder logic
        if (docTypeLower.includes('payslip') || docTypeLower.includes('salary')) {
            htmlContent += `<div class="heading">PAYSLIP STATEMENT</div>
        <p style="font-size:12px;"><strong>Employee Code:</strong> ${resolvedPlaceholders['employee.code'] || 'EMP-9042'} | <strong>Name:</strong> ${resolvedPlaceholders['employee.name'] || 'Rohan Sharma'}</p>
        <table>
          <thead><tr><th>Earnings</th><th style="text-align:right;">Amount (₹)</th><th>Deductions</th><th style="text-align:right;">Amount (₹)</th></tr></thead>
          <tbody>
            <tr><td>Basic Salary</td><td style="text-align:right;">65,000.00</td><td>Provident Fund (PF)</td><td style="text-align:right;">1,800.00</td></tr>
            <tr><td>House Rent Allowance (HRA)</td><td style="text-align:right;">26,000.00</td><td>Professional Tax (PT)</td><td style="text-align:right;">200.00</td></tr>
            <tr style="font-weight:bold; background:#f0f9ff;"><td>Gross Earnings</td><td style="text-align:right;">₹1,06,000.00</td><td>Total Deductions</td><td style="text-align:right;">₹6,500.00</td></tr>
          </tbody>
        </table>
        <p style="font-size:13px; font-weight:bold; color:#0369a1;">NET SALARY PAYABLE: ₹99,500.00</p>`;
        }
        else if (docTypeLower.includes('invoice')) {
            htmlContent += `<div class="heading">TAX INVOICE #${resolvedPlaceholders['invoice.number'] || entityId}</div>
        <p style="font-size:12px;"><strong>Billed To:</strong> ${resolvedPlaceholders['client.name'] || 'KIRANAKART TECHNOLOGIES PRIVATE LIMITED'}</p>
        <table>
          <thead><tr><th>HSN/SAC</th><th>Services Description</th><th style="text-align:center;">Qty</th><th style="text-align:right;">Rate (₹)</th><th style="text-align:right;">Amount (₹)</th></tr></thead>
          <tbody>
            <tr><td>998311</td><td>IT & Staffing Resource Support</td><td style="text-align:center;">5</td><td style="text-align:right;">25,000.00</td><td style="text-align:right;">1,25,000.00</td></tr>
            <tr style="font-weight:bold;"><td colSpan="4" style="text-align:right;">Subtotal:</td><td style="text-align:right;">₹1,25,000.00</td></tr>
            <tr style="font-weight:bold; background:#f0f9ff;"><td colSpan="4" style="text-align:right;">GRAND TOTAL:</td><td style="text-align:right; color:#0369a1;">₹1,47,500.00</td></tr>
          </tbody>
        </table>`;
        }
        else {
            htmlContent += `<div class="heading">${templateData.templateName || docType}</div>
        <p style="font-size:12px;">Ref No: ${entityId} | Date: ${new Date().toLocaleDateString()}</p>
        <p style="font-size:12px; margin-top:16px;">Dear ${resolvedPlaceholders['candidate.name'] || resolvedPlaceholders['employee.name'] || 'Valued Candidate'},</p>
        <p style="font-size:12px; line-height:1.6;">We are pleased to present this official document for your record.</p>`;
        }
        // Signatory & Stamp
        htmlContent += `<div class="sign-block">
        <div>
          <p style="font-size:10px; color:#64748b; margin:0;">For & On Behalf Of</p>
          <p style="font-weight:bold; margin:4px 0 0;">${legalEntity.legalCompanyName}</p>
        </div>
      </div>`;
        // Footer
        htmlContent += `<div class="footer">
        <p>${brandProfile.address} | Email: ${brandProfile.email} | Web: ${brandProfile.website}</p>
        <p style="margin-top:4px;">Confidential & Proprietary • HireHuub ERP System</p>
      </div></body></html>`;
        const outputBuffer = Buffer.from(htmlContent, 'utf-8');
        const fileExt = outputFormat.toLowerCase();
        // 4. Upload Generated Document to Firebase Storage (`generated/` folder ONLY)
        const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const cleanType = docType.replace(/[^a-zA-Z0-9]+/g, '');
        const cleanId = entityId.replace(/[^a-zA-Z0-9_-]+/g, '');
        const fileName = `${cleanType}_${cleanId}_${dateStr}.${fileExt}`;
        const targetPath = `generated/${slug}/${fileName}`;
        let downloadUrl = '#';
        try {
            const defaultBucket = firebaseAdmin_1.adminStorage.bucket();
            const targetFile = defaultBucket.file(targetPath);
            await targetFile.save(outputBuffer, {
                metadata: {
                    contentType: fileExt === 'docx'
                        ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                        : 'application/pdf',
                },
            });
            const bucketName = defaultBucket.name || 'hirehuub-hrms-86942.firebasestorage.app';
            downloadUrl = `https://firebasestorage.googleapis.com/v0/b/${bucketName}/o/${encodeURIComponent(targetPath)}?alt=media`;
        }
        catch {
            downloadUrl = `https://firebasestorage.googleapis.com/v0/b/hirehuub-hrms-86942.firebasestorage.app/o/${encodeURIComponent(targetPath)}?alt=media`;
        }
        // 5. Register Metadata in Firestore `documents` Collection
        const documentId = `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
        const templateVersion = templateData.activeVersion || `v${templateData.version || 1}.0`;
        const registeredDoc = {
            id: documentId,
            documentId,
            documentType: docType,
            module: data.module || 'HR',
            employeeId: data.employeeId || null,
            candidateId: data.candidateId || null,
            clientId: data.clientId || null,
            vendorId: data.vendorId || null,
            templateId: templateData.id || templateData.templateId || null,
            templateVersion,
            brandProfileId: templateData.brandProfileId || 'default',
            legalCompanyName: legalEntity.legalCompanyName,
            generatedBy: data.generatedBy || 'system',
            generatedByName: data.generatedByName || 'System User',
            generatedOn: new Date().toISOString(),
            storageUrl: downloadUrl,
            storagePath: targetPath,
            previewUrl: downloadUrl,
            downloadCount: 0,
            status: 'Generated',
            templateUsed: templateData.templateName || `${docType} Template`,
            outputFormat,
            resolvedPlaceholders,
        };
        const cleanData = sanitizePayload(registeredDoc);
        await firebaseAdmin_1.adminDb.collection('documents').doc(documentId).set(cleanData, { merge: true });
        // 6. Return Response Payload
        return {
            success: true,
            documentId,
            fileName,
            downloadUrl,
            previewUrl: downloadUrl,
            storagePath: targetPath,
            templateVersion,
            status: 'Generated',
        };
    }
    catch (err) {
        if (err instanceof https_1.HttpsError) {
            throw err;
        }
        throw new https_1.HttpsError('internal', err instanceof Error ? err.message : 'An error occurred during Cloud Function document generation.');
    }
});
//# sourceMappingURL=generateDocument.js.map