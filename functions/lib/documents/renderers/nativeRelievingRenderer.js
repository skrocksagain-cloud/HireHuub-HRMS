"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.compileRelievingLetterHTML = compileRelievingLetterHTML;
function escapeHTML(str) {
    if (!str)
        return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
function replaceTokens(text, dict) {
    if (!text)
        return '';
    return text.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, rawKey) => {
        const key = rawKey.trim();
        const upperKey = key.toUpperCase();
        const lowerKey = key.toLowerCase();
        if (dict[key] !== undefined)
            return dict[key];
        if (dict[upperKey] !== undefined)
            return dict[upperKey];
        if (dict[lowerKey] !== undefined)
            return dict[lowerKey];
        return match;
    });
}
/**
 * Compiles HTML for Relieving Letter documents natively in Firebase Cloud Functions.
 */
function compileRelievingLetterHTML(options) {
    const { blocks, placeholders: p, brandLogoUrl = '', brandStampUrl = '', defaultSignatureUrl = '', specificSignatures = {}, defaultSignatoryName = '', defaultSignatoryDesignation = '', } = options;
    let pagesHTML = '';
    let currentPageHTML = '';
    let currentPageIndex = 1;
    const totalPagesCount = blocks.filter((b) => b.type === 'page_break').length + 1;
    const footerBlock = blocks.find((b) => b.type === 'footer');
    const renderPageFooterHTML = (pageIndex) => {
        if (!footerBlock)
            return '';
        const fCfg = footerBlock.footerConfig || {};
        const showNotice = fCfg.showConfidentialityNotice !== false;
        const rawText = showNotice ? (fCfg.confidentialityText || footerBlock.content || '{{BRAND_NAME}} • Confidential Relieving Letter') : '';
        const noticeText = escapeHTML(replaceTokens(rawText, p));
        const fmt = footerBlock.formatting || {};
        const fSize = fCfg.fontSize || fmt.fontSize || 10;
        const align = fmt.alignment || 'left';
        const color = fmt.color || '#64748b';
        const showWeb = fCfg.showWebsite !== false;
        const webText = showWeb ? escapeHTML(p.BRAND_WEBSITE || p.WEBSITE || '') : '';
        const showPage = fCfg.showPageNumber !== false;
        const showTotal = fCfg.showTotalPages !== false;
        let pageNumStr = '';
        if (showPage) {
            pageNumStr = `Page ${pageIndex}${showTotal ? ` of ${totalPagesCount}` : ''}`;
        }
        const rightBits = [];
        if (webText)
            rightBits.push(`<span>${webText}</span>`);
        if (pageNumStr)
            rightBits.push(`<span>${pageNumStr}</span>`);
        return `<div class="page-footer" style="position: absolute; bottom: 15mm; left: 20mm; right: 20mm; font-size: ${fSize}px; text-align: ${align}; color: ${color}; border-top: 1px solid #e2e8f0; padding-top: 8px; display: flex; justify-content: space-between; font-family: sans-serif; box-sizing: border-box;">
  <div>${noticeText}</div>
  <div style="display: flex; gap: 12px;">${rightBits.join('')}</div>
</div>`;
    };
    const closePage = () => {
        if (currentPageHTML.trim()) {
            const footerHTML = renderPageFooterHTML(currentPageIndex);
            pagesHTML += `<div class="page">${currentPageHTML}${footerHTML}</div>\n`;
            currentPageHTML = '';
        }
    };
    blocks.forEach((block) => {
        if (block.type === 'page_break') {
            closePage();
            currentPageIndex++;
            return;
        }
        if (block.type === 'footer') {
            return;
        }
        const fmt = block.formatting || {};
        const align = fmt.alignment || 'left';
        const fontSize = fmt.fontSize || 12;
        const fontWeight = fmt.fontWeight || 'normal';
        const fontStyle = fmt.fontStyle || 'normal';
        const textDecoration = fmt.textDecoration || 'none';
        const color = fmt.color || '#1e293b';
        const marginBottom = fmt.marginBottom !== undefined ? fmt.marginBottom : 8;
        const marginTop = fmt.marginTop || 0;
        const lineHeight = fmt.lineHeight || 1.5;
        const styleStr = `style="font-size: ${fontSize}px; font-weight: ${fontWeight}; font-style: ${fontStyle}; text-decoration: ${textDecoration}; text-align: ${align}; color: ${color}; margin-top: ${marginTop}px; margin-bottom: ${marginBottom}px; line-height: ${lineHeight};"`;
        if (block.type === 'header' || (block.type === 'logo' && (block.headerConfig || block.title === 'Header & Legal Details'))) {
            const hCfg = block.headerConfig || {};
            const showLogo = hCfg.showLogo !== false;
            const logoH = hCfg.logoHeight || 50;
            const showBName = hCfg.showBrandName === true;
            const showLegalName = hCfg.showLegalName !== false;
            const showAddr = hCfg.showAddress !== false;
            const showPhone = hCfg.showPhone !== false;
            const showEmail = hCfg.showEmail !== false;
            const showWeb = hCfg.showWebsite !== false;
            const showCin = hCfg.showCin !== false;
            const showPan = hCfg.showPan !== false;
            const showGstin = hCfg.showGstin !== false;
            const legalFontSize = hCfg.legalFontSize || 10;
            const legalAlign = hCfg.legalAlignment || 'right';
            let leftHTML = '';
            if (showLogo && brandLogoUrl) {
                leftHTML += `<img src="${brandLogoUrl}" alt="Brand Logo" style="max-height: ${logoH}px; object-fit: contain; display: block;" />`;
            }
            if (showBName) {
                const bName = escapeHTML(p.BRAND_NAME || 'Hire Huub');
                leftHTML += `<div style="font-size: 14px; font-weight: bold; color: #0284c7; margin-top: 4px;">${bName}</div>`;
            }
            const legalLines = [];
            if (showLegalName) {
                const nameVal = p.LEGAL_NAME || 'Hire Huub People Solution Private Limited';
                legalLines.push(`<strong style="font-size: ${legalFontSize + 1}px; color: #0f172a;">${escapeHTML(nameVal)}</strong>`);
            }
            if (showAddr && (p.BRAND_ADDRESS || p.ADDRESS)) {
                legalLines.push(escapeHTML(p.BRAND_ADDRESS || p.ADDRESS || ''));
            }
            const contactBits = [];
            if (showPhone && (p.BRAND_PHONE || p.PHONE))
                contactBits.push(`Ph: ${escapeHTML(p.BRAND_PHONE || p.PHONE || '')}`);
            if (showEmail && (p.BRAND_EMAIL || p.EMAIL))
                contactBits.push(`Email: ${escapeHTML(p.BRAND_EMAIL || p.EMAIL || '')}`);
            if (showWeb && (p.BRAND_WEBSITE || p.WEBSITE))
                contactBits.push(`Web: ${escapeHTML(p.BRAND_WEBSITE || p.WEBSITE || '')}`);
            if (contactBits.length > 0) {
                legalLines.push(contactBits.join(' | '));
            }
            const taxBits = [];
            if (showCin && p.CIN)
                taxBits.push(`CIN: ${escapeHTML(p.CIN)}`);
            if (showPan && p.PAN)
                taxBits.push(`PAN: ${escapeHTML(p.PAN)}`);
            if (showGstin && p.GSTIN)
                taxBits.push(`GSTIN: ${escapeHTML(p.GSTIN)}`);
            if (taxBits.length > 0) {
                legalLines.push(taxBits.join(' | '));
            }
            const rightHTML = `<div style="font-size: ${legalFontSize}px; text-align: ${legalAlign}; color: #475569; line-height: 1.4;">${legalLines.join('<br>')}</div>`;
            currentPageHTML += `<div style="display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #0284c7; padding-bottom: 12px; margin-bottom: ${marginBottom || 20}px;">
  <div style="flex: 1;">${leftHTML}</div>
  <div style="flex: 1.5; text-align: right;">${rightHTML}</div>
</div>\n`;
        }
        else if (block.type === 'heading') {
            const tag = block.headingLevel || 'h2';
            const resolvedContent = escapeHTML(replaceTokens(block.content || '', p));
            currentPageHTML += `<${tag} ${styleStr}>${resolvedContent}</${tag}>\n`;
        }
        else if (block.type === 'paragraph' || block.type === 'text') {
            const rawText = replaceTokens(block.content || '', p);
            const escaped = escapeHTML(rawText).replace(/\n/g, '<br>');
            currentPageHTML += `<div ${styleStr}>${escaped}</div>\n`;
        }
        else if (block.type === 'divider') {
            currentPageHTML += `<hr style="border: 0; border-top: 1px solid ${color || '#cbd5e1'}; margin-top: ${marginTop || 12}px; margin-bottom: ${marginBottom || 12}px;" />\n`;
        }
        else if (block.type === 'signature') {
            let sigUrl = defaultSignatureUrl;
            let sigName = defaultSignatoryName || p.SIGNATORY_NAME || 'Authorized Signatory';
            let sigDesig = defaultSignatoryDesignation || p.SIGNATORY_DESIGNATION || 'Management';
            if (block.signatureSource === 'specific' && block.signatoryId) {
                const spec = specificSignatures[block.signatoryId];
                if (spec) {
                    sigUrl = spec.signatureUrl || sigUrl;
                    sigName = spec.fullName || sigName;
                    sigDesig = spec.designation || sigDesig;
                }
            }
            currentPageHTML += `<div style="text-align: ${align}; margin-top: ${marginTop || 16}px; margin-bottom: ${marginBottom || 16}px;">\n`;
            if (sigUrl) {
                currentPageHTML += `<img src="${sigUrl}" alt="Signature" style="height: 45px; object-fit: contain; margin-bottom: 6px;" /><br>\n`;
            }
            currentPageHTML += `<div style="font-size: 11px; font-weight: bold; color: #334155;">__________________________</div>\n`;
            currentPageHTML += `<div style="font-size: 11px; font-weight: bold; color: #0f172a;">${escapeHTML(sigName)}</div>\n`;
            currentPageHTML += `<div style="font-size: 10px; color: #64748b;">${escapeHTML(sigDesig)}</div>\n`;
            currentPageHTML += `</div>\n`;
        }
        else if (block.type === 'stamp') {
            if (brandStampUrl) {
                currentPageHTML += `<div style="text-align: ${align}; margin-bottom: ${marginBottom}px;"><img src="${brandStampUrl}" alt="Official Stamp" style="max-height: 60px; object-fit: contain;" /></div>\n`;
            }
        }
    });
    closePage();
    return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<style>
  @page {
    size: A4 portrait;
    margin: 0;
  }
  body {
    font-family: 'Helvetica Neue', Arial, sans-serif;
    color: #1e293b;
    margin: 0;
    padding: 0;
    background-color: #ffffff;
    -webkit-print-color-adjust: exact;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    padding: 20mm 20mm 25mm 20mm;
    box-sizing: border-box;
    position: relative;
    page-break-after: always;
  }
  .page:last-child {
    page-break-after: avoid;
  }
</style>
</head>
<body>
${pagesHTML}
</body>
</html>`;
}
//# sourceMappingURL=nativeRelievingRenderer.js.map