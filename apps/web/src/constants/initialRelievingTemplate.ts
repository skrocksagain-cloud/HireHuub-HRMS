import type { DocumentTemplateConfig, OfferLetterBlock } from '../types/Admin';

export const INITIAL_RELIEVING_LETTER_BLOCKS: OfferLetterBlock[] = [
  {
    id: 'rel-block-1',
    type: 'header',
    title: 'Header & Legal Details',
    isProtected: false,
    headerConfig: {
      preset: 'logo-left-details-right',
      showLogo: true,
      logoHeight: 50,
      showBrandName: false,
      showLegalName: true,
      showAddress: true,
      showPhone: true,
      showEmail: true,
      showWebsite: true,
      showCin: true,
      showPan: true,
      showGstin: true,
      legalFontSize: 10,
      legalAlignment: 'right',
    },
    formatting: { alignment: 'left', marginBottom: 16 }
  },
  {
    id: 'rel-block-2',
    type: 'paragraph',
    title: 'Reference & Date',
    isProtected: false,
    content: 'Ref: {{RELIEVING_REF}}\nDate: {{ISSUANCE_DATE}}',
    formatting: { fontSize: 12, lineHeight: 1.5, marginBottom: 16 }
  },
  {
    id: 'rel-block-3',
    type: 'paragraph',
    title: 'Employee Information',
    isProtected: false,
    content: 'To,\n\n{{PERSON_NAME}}\n\nEmployee Code: {{EMPLOYEE_CODE}}\n\nDesignation: {{DESIGNATION}}\n\nDepartment: {{DEPARTMENT}}\n\nWork Location: {{WORK_LOCATION}}',
    formatting: { fontSize: 12, lineHeight: 1.5, marginBottom: 16 }
  },
  {
    id: 'rel-block-4',
    type: 'paragraph',
    title: 'Employment Details',
    isProtected: false,
    content: 'Date of Joining: {{JOINING_DATE}}\n\nLast Working Date: {{LAST_WORKING_DATE}}\n\nService Period: {{TENURE_DISPLAY}}',
    formatting: { fontSize: 12, lineHeight: 1.5, marginBottom: 16 }
  },
  {
    id: 'rel-block-5',
    type: 'paragraph',
    title: 'Relieving Statement',
    isProtected: false,
    content: 'This is to certify that {{PERSON_NAME}} was employed with {{LEGAL_NAME}} under the {{BRAND_NAME}} brand from {{JOINING_DATE}} to {{LAST_WORKING_DATE}} as {{DESIGNATION}} in the {{DEPARTMENT}} department.',
    formatting: { fontSize: 12, lineHeight: 1.6, marginBottom: 16 }
  },
  {
    id: 'rel-block-6',
    type: 'paragraph',
    title: 'Conduct / Performance Statement',
    isProtected: false,
    content: 'During their tenure with the organization, {{PERSON_NAME}} performed their assigned responsibilities satisfactorily.',
    formatting: { fontSize: 12, lineHeight: 1.6, marginBottom: 16 }
  },
  {
    id: 'rel-block-7',
    type: 'paragraph',
    title: 'Handover / Settlement Statement',
    isProtected: false,
    content: 'All applicable company assets, responsibilities and dues have been settled as per organizational records.',
    formatting: { fontSize: 12, lineHeight: 1.6, marginBottom: 16 }
  },
  {
    id: 'rel-block-8',
    type: 'paragraph',
    title: 'Appreciation / Well Wishes',
    isProtected: false,
    content: 'We thank {{PERSON_NAME}} for their contributions and wish them success in their future endeavors.',
    formatting: { fontSize: 12, lineHeight: 1.6, marginBottom: 20 }
  },
  {
    id: 'rel-block-9',
    type: 'paragraph',
    title: 'Company Signatory Line',
    isProtected: false,
    content: 'For {{LEGAL_NAME}}\n({{BRAND_NAME}})',
    formatting: { fontSize: 12, fontWeight: 'bold', marginBottom: 12 }
  },
  {
    id: 'rel-block-10',
    type: 'signature',
    title: 'Authorized Signature',
    isProtected: false,
    signatureSource: 'brandDefault',
    formatting: { marginBottom: 8 }
  },
  {
    id: 'rel-block-11',
    type: 'stamp',
    title: 'Official Stamp',
    isProtected: false,
    formatting: { marginBottom: 16 }
  },
  {
    id: 'rel-block-12',
    type: 'footer',
    title: 'Footer & Confidentiality',
    isProtected: false,
    footerConfig: {
      showConfidentialityNotice: true,
      confidentialityText: '{{BRAND_NAME}} • Confidential Relieving Letter',
      showWebsite: true,
      showEmail: false,
      showPageNumber: true,
      showTotalPages: true,
      layoutPlacement: 'left-right',
      alignment: 'left',
      fontSize: 10,
      marginTop: 16
    }
  }
];

export const createInitialRelievingTemplateConfig = (
  brandId: string,
  brandName: string
): DocumentTemplateConfig => ({
  id: `relieving_letter_${brandId}`,
  templateId: `relieving_letter_${brandId}`,
  templateName: `${brandName} Official Relieving Letter`,
  type: 'RELIEVING_LETTER',
  category: 'HR',
  format: 'PDF',
  brandId,
  brandName,
  version: 1,
  activeVersion: 'v1.0',
  versionNumber: 1,
  status: 'Active',
  lifecycleState: 'Draft',
  isActive: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  previousVersions: [],
  offerSchema: {
    brandId,
    brandName,
    pageSize: 'A4',
    margins: { top: 20, bottom: 20, left: 20, right: 20 },
    blocks: INITIAL_RELIEVING_LETTER_BLOCKS
  }
});
