import { doc, getDoc, setDoc, collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import type { DocumentTemplateConfig } from '../../types/Admin';
import { createInitialOfferTemplateConfig } from '../../constants/initialOfferTemplate';
import { createInitialRelievingTemplateConfig } from '../../constants/initialRelievingTemplate';
import { createInitialIncrementTemplateConfig } from '../../constants/initialIncrementTemplate';

export interface TemplateVersionRecord {
  versionNumber: number;
  versionLabel: string;
  lifecycleState: 'Draft' | 'Published';
  publishedAt?: string;
  publishedBy?: string;
  savedAt: string;
  config: DocumentTemplateConfig;
}

class OfferTemplateService {
  /**
   * Generates document ID for brand offer letter template
   */
  getTemplateDocId(brandId: string, docType: string = 'OFFER_LETTER'): string {
    const cleanBrandId = brandId.toLowerCase().replace(/[^a-z0-9_-]/g, '');
    if (docType === 'RELIEVING_LETTER') {
      return `relieving_letter_${cleanBrandId}`;
    }
    if (docType === 'INCREMENT_LETTER') {
      return `increment_letter_${cleanBrandId}`;
    }
    return `offer_letter_${cleanBrandId}`;
  }

  /**
   * Fetches the current template document for a specific brand.
   * If none exists in Firestore, initializes default seed configuration.
   */
  async getOfferTemplateByBrand(brandId: string, brandName: string, docType: string = 'OFFER_LETTER'): Promise<DocumentTemplateConfig> {
    const docId = this.getTemplateDocId(brandId, docType);
    const docRef = doc(db, 'document_templates', docId);

    try {
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        const data = snap.data() as DocumentTemplateConfig;
        return {
          ...data,
          brandId,
          brandName: brandName || data.brandName || 'Hire Huub',
        };
      }
    } catch {
      // Fallback to initial seed if network error or uninitialized
    }

    if (docType === 'RELIEVING_LETTER') {
      return createInitialRelievingTemplateConfig(brandId, brandName);
    }
    if (docType === 'INCREMENT_LETTER') {
      return createInitialIncrementTemplateConfig(brandId, brandName);
    }
    const initialConfig = createInitialOfferTemplateConfig(brandId, brandName);
    return initialConfig;
  }

  /**
   * Saves a template in DRAFT state.
   */
  async saveDraftTemplate(template: DocumentTemplateConfig): Promise<DocumentTemplateConfig> {
    const brandId = template.brandId || 'brand-hirehuub';
    const docType = template.type || 'OFFER_LETTER';
    const docId = this.getTemplateDocId(brandId, docType);
    const docRef = doc(db, 'document_templates', docId);

    const currentVersionNum = template.versionNumber || template.version || 1;

    const draftPayload: DocumentTemplateConfig = {
      ...template,
      id: docId,
      templateId: docId,
      type: docType,
      category: 'HR',
      format: 'PDF',
      lifecycleState: 'Draft',
      version: currentVersionNum,
      versionNumber: currentVersionNum,
      activeVersion: `v${currentVersionNum}.0 (Draft)`,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(docRef, draftPayload, { merge: true });
    return draftPayload;
  }

  /**
   * Validates template content before publishing.
   */
  validateTemplate(template: DocumentTemplateConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!template.brandId) {
      errors.push('Select a valid Brand for this template.');
    }

    const blocks = template.offerSchema?.blocks || [];
    if (blocks.length === 0) {
      errors.push('Template cannot be empty. Please add at least one content block.');
    }

    const invalidPlaceholders: string[] = [];
    const placeholderRegex = /\{\{\s*([A-Z0-9_]+)\s*\}\}/g;

    blocks.forEach((block) => {
      if (block.content) {
        let match;
        while ((match = placeholderRegex.exec(block.content)) !== null) {
          const key = match[1];
          if (!key) {
            invalidPlaceholders.push('Empty placeholder token');
          }
        }
      }
    });

    if (invalidPlaceholders.length > 0) {
      errors.push(`Invalid placeholders detected: ${invalidPlaceholders.join(', ')}`);
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Publishes the template as an immutable version.
   * Stores copy into subcollection `document_templates/{docId}/versions/v{version}`
   * and updates main document as PUBLISHED.
   */
  async publishTemplate(template: DocumentTemplateConfig, publishedBy: string = 'Super Admin'): Promise<DocumentTemplateConfig> {
    const validation = this.validateTemplate(template);
    if (!validation.valid) {
      throw new Error(validation.errors.join(' '));
    }

    const brandId = template.brandId || 'brand-hirehuub';
    const docType = template.type || 'OFFER_LETTER';
    const docId = this.getTemplateDocId(brandId, docType);
    const mainDocRef = doc(db, 'document_templates', docId);

    const currentVersionNum = (template.versionNumber || template.version || 1);
    const publishedTimestamp = new Date().toISOString();

    const publishedPayload: DocumentTemplateConfig = {
      ...template,
      id: docId,
      templateId: docId,
      type: docType,
      category: 'HR',
      format: 'PDF',
      status: 'Active',
      lifecycleState: 'Published',
      version: currentVersionNum,
      versionNumber: currentVersionNum,
      activeVersion: `v${currentVersionNum}.0`,
      publishedAt: publishedTimestamp,
      publishedBy,
      updatedAt: publishedTimestamp,
    };

    // 1. Save immutable snapshot into subcollection `/versions/v{currentVersionNum}`
    const versionDocId = `v${currentVersionNum}`;
    const versionDocRef = doc(db, 'document_templates', docId, 'versions', versionDocId);
    const versionRecord: TemplateVersionRecord = {
      versionNumber: currentVersionNum,
      versionLabel: `v${currentVersionNum}.0`,
      lifecycleState: 'Published',
      publishedAt: publishedTimestamp,
      publishedBy,
      savedAt: publishedTimestamp,
      config: publishedPayload,
    };

    await setDoc(versionDocRef, versionRecord);

    // 2. Update main template document in `document_templates`
    await setDoc(mainDocRef, publishedPayload, { merge: true });

    return publishedPayload;
  }

  /**
   * Creates a new Draft version based on current Published template.
   * Published template remains immutable while new draft version is edited.
   */
  async createNewVersion(template: DocumentTemplateConfig): Promise<DocumentTemplateConfig> {
    const nextVersionNum = (template.versionNumber || template.version || 1) + 1;
    const brandId = template.brandId || 'brand-hirehuub';
    const docType = template.type || 'OFFER_LETTER';
    const docId = this.getTemplateDocId(brandId, docType);
    const mainDocRef = doc(db, 'document_templates', docId);

    const newDraftPayload: DocumentTemplateConfig = {
      ...template,
      id: docId,
      templateId: docId,
      type: docType,
      lifecycleState: 'Draft',
      version: nextVersionNum,
      versionNumber: nextVersionNum,
      activeVersion: `v${nextVersionNum}.0 (Draft)`,
      updatedAt: new Date().toISOString(),
    };

    await setDoc(mainDocRef, newDraftPayload, { merge: true });
    return newDraftPayload;
  }

  /**
   * Fetches published version history from subcollection.
   */
  async getTemplateVersions(brandId: string, docType: string = 'OFFER_LETTER'): Promise<TemplateVersionRecord[]> {
    const docId = this.getTemplateDocId(brandId, docType);
    const versionsRef = collection(db, 'document_templates', docId, 'versions');

    try {
      const q = query(versionsRef, orderBy('versionNumber', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map((d) => d.data() as TemplateVersionRecord);
    } catch {
      return [];
    }
  }
}

export const offerTemplateService = new OfferTemplateService();
