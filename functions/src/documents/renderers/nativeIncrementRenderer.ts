import {
  OfferBlockHeaderConfig,
  RenderOfferOptions
} from './nativeOfferRenderer';

function escapeHTML(str: string): string {
  if (!str) return '';
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function replaceTokens(text: string, dict: Record<string, string>): string {
  if (!text) return '';
  return text.replace(/\{\{\s*([a-zA-Z0-9_.]+)\s*\}\}/g, (match, rawKey) => {
    const key = rawKey.trim();
    const upperKey = key.toUpperCase();
    const lowerKey = key.toLowerCase();

    if (dict[key] !== undefined) return dict[key];
    if (dict[upperKey] !== undefined) return dict[upperKey];
    if (dict[lowerKey] !== undefined) return dict[lowerKey];
    return match;
  });
}

/**
 * Compiles HTML for Increment Letter documents natively in Firebase Cloud Functions.
 */
export function compileIncrementLetterHTML(options: RenderOfferOptions): string {
  const {
    blocks,
    placeholders: p,
    brandLogoUrl = '',
    brandStampUrl = '',
    defaultSignatureUrl = '',
    specificSignatures = {},
    defaultSignatoryName = '',
    defaultSignatoryDesignation = '',
  } = options;

  let pagesHTML = '';
  let currentPageHTML = '';
  let currentPageIndex = 1;
  const totalPagesCount = blocks.filter((b) => b.type === 'page_break').length + 1;

  const footerBlock = blocks.find((b) => b.type === 'footer');

  const renderFooter = (pageIdx: number): string => {
    if (!footerBlock) return '';
    const fConfig = footerBlock.footerConfig;
    const align = footerBlock.formatting?.alignment || 'center';

    const confText = fConfig?.confidentialityText
      ? replaceTokens(fConfig.confidentialityText, p)
      : 'Confidential Increment Letter';

    return `
      <div className="pdf-footer" style="
        position: absolute;
        bottom: 0.3in;
        left: 0.5in;
        right: 0.5in;
        border-top: 1px solid #e2e8f0;
        padding-top: 6px;
        display: flex;
        justify-content: space-between;
        align-items: center;
        font-size: 8pt;
        color: #64748b;
        text-align: ${align};
      ">
        <div>${escapeHTML(confText)}</div>
        <div>Page ${pageIdx} of ${totalPagesCount}</div>
      </div>
    `;
  };

  const closePage = (pageIdx: number) => {
    pagesHTML += `
      <div class="pdf-page" style="
        width: 8.27in;
        height: 11.69in;
        padding: 0.45in 0.5in 0.6in 0.5in;
        box-sizing: border-box;
        position: relative;
        background: #ffffff;
        page-break-after: always;
        page-break-inside: avoid;
        overflow: hidden;
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;
        color: #1e293b;
      ">
        <div class="pdf-page-content" style="position: relative; z-index: 1;">
          ${currentPageHTML}
        </div>
        ${renderFooter(pageIdx)}
      </div>
    `;
    currentPageHTML = '';
  };

  for (const block of blocks) {
    if (block.type === 'page_break') {
      closePage(currentPageIndex);
      currentPageIndex++;
      continue;
    }

    if (block.type === 'footer') continue;

    const align = block.formatting?.alignment || 'left';
    const mb = block.formatting?.marginBottom !== undefined ? Math.min(block.formatting.marginBottom, 10) : 8;
    const fontSize = block.formatting?.fontSize ? Math.min(block.formatting.fontSize, 11) : 10.5;

    if (block.type === 'header') {
      const h: OfferBlockHeaderConfig = block.headerConfig || {};
      const logoVisible = h.showLogo !== false && brandLogoUrl;

      const legalNameVal = h.showLegalName !== false ? (p.LEGAL_NAME || '') : '';
      const brandNameVal = h.showBrandName !== false ? (p.BRAND_NAME || '') : '';
      const addressVal = h.showAddress !== false ? (p.BRAND_ADDRESS || p.ADDRESS || '') : '';
      const phoneVal = h.showPhone !== false ? (p.BRAND_PHONE || p.PHONE || '') : '';
      const emailVal = h.showEmail !== false ? (p.BRAND_EMAIL || p.EMAIL || '') : '';
      const websiteVal = h.showWebsite !== false ? (p.BRAND_WEBSITE || p.WEBSITE || '') : '';
      const cinVal = h.showCin !== false ? (p.CIN || '') : '';
      const panVal = h.showPan !== false ? (p.PAN || '') : '';
      const gstinVal = h.showGstin !== false ? (p.GSTIN || '') : '';

      currentPageHTML += `
        <div style="margin-bottom: ${mb}px; border-bottom: 2px solid #e2e8f0; padding-bottom: 12px; display: flex; justify-content: space-between; align-items: flex-start;">
          <div style="flex: 1;">
            ${logoVisible ? `<img src="${brandLogoUrl}" style="height: ${h.logoHeight || 50}px; object-fit: contain; display: block;" />` : ''}
            ${brandNameVal ? `<div style="font-weight: bold; font-size: 10pt; color: #047857; margin-top: 4px;">${escapeHTML(brandNameVal)}</div>` : ''}
          </div>
          <div style="text-align: right; font-size: ${h.legalFontSize || 9}pt; color: #475569; line-height: 1.4;">
            ${legalNameVal ? `<div style="font-weight: bold; font-size: 11pt; color: #0f172a;">${escapeHTML(legalNameVal)}</div>` : ''}
            ${addressVal ? `<div>${escapeHTML(addressVal)}</div>` : ''}
            ${phoneVal || emailVal ? `<div>${phoneVal ? `Tel: ${escapeHTML(phoneVal)}` : ''}${phoneVal && emailVal ? ' | ' : ''}${emailVal ? `Email: ${escapeHTML(emailVal)}` : ''}</div>` : ''}
            ${websiteVal ? `<div>${escapeHTML(websiteVal)}</div>` : ''}
            ${cinVal || panVal || gstinVal ? `<div style="font-size: 8pt; color: #64748b; margin-top: 2px;">${cinVal ? `CIN: ${escapeHTML(cinVal)} ` : ''}${panVal ? `PAN: ${escapeHTML(panVal)} ` : ''}${gstinVal ? `GSTIN: ${escapeHTML(gstinVal)}` : ''}</div>` : ''}
          </div>
        </div>
      `;
    } else if (block.type === 'paragraph' || block.type === 'heading' || block.type === 'text') {
      const rawText = block.content || '';
      const tokenized = replaceTokens(rawText, p);
      const lines = tokenized.split('\n').map((line) => escapeHTML(line)).join('<br/>');

      currentPageHTML += `
        <div style="
          margin-bottom: ${mb}px;
          text-align: ${align};
          font-size: ${fontSize}pt;
          line-height: ${block.formatting?.lineHeight || 1.5};
          font-weight: ${block.formatting?.fontWeight || 'normal'};
          color: #1e293b;
        ">
          ${lines}
        </div>
      `;
    } else if (block.type === 'signature') {
      const sigSrc = block.signatureSource;
      let sigUrl = defaultSignatureUrl;
      let sigName = defaultSignatoryName;
      let sigDesig = defaultSignatoryDesignation;

      if (sigSrc && specificSignatures[sigSrc]) {
        const sigObj = specificSignatures[sigSrc];
        sigUrl = sigObj.signatureUrl || (sigObj as any).url || defaultSignatureUrl;
        sigName = sigObj.fullName || (sigObj as any).name || defaultSignatoryName;
        sigDesig = sigObj.designation || defaultSignatoryDesignation;
      }

      if (sigName || sigUrl) {
        currentPageHTML += `
          <div style="margin-bottom: ${mb}px; text-align: ${align}; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif;">
            ${sigUrl ? `<img src="${sigUrl}" style="height: 48px; object-fit: contain; margin-bottom: 4px;" />` : ''}
            ${sigName ? `<div style="font-weight: bold; font-size: 10pt; color: #0f172a;">${escapeHTML(sigName)}</div>` : ''}
            ${sigDesig ? `<div style="font-size: 9pt; color: #475569;">${escapeHTML(sigDesig)}</div>` : ''}
          </div>
        `;
      } else {
        currentPageHTML += `
          <div style="margin-bottom: ${mb}px; text-align: ${align}; color: #94a3b8; font-style: italic; font-size: 9pt;">
            [No active signatory configured in Company Settings]
          </div>
        `;
      }
    } else if (block.type === 'stamp') {
      currentPageHTML += `
        <div style="margin-bottom: ${mb}px; text-align: ${align};">
          ${brandStampUrl ? `<img src="${brandStampUrl}" style="height: 80px; width: 80px; object-fit: contain;" />` : ''}
        </div>
      `;
    }
  }

  closePage(currentPageIndex);

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>Increment Letter</title>
        <style>
          @page { size: A4; margin: 0; }
          body { margin: 0; padding: 0; background: #ffffff; -webkit-print-color-adjust: exact; }
          * { box-sizing: border-box; }
        </style>
      </head>
      <body>
        ${pagesHTML}
      </body>
    </html>
  `;
}
