import type {
  UTBReusableComponent,
  UTBClause,
  UTBSnippet,
  UTBCategory,
  UTBTag,
  ContentKind,
  ContentDependencyGraph,
} from '../../types/Admin';
import { adminService } from './adminService';

// Default Preset Categories
const DEFAULT_CATEGORIES: UTBCategory[] = [
  { id: 'cat-general', name: 'General Information', description: 'Welcome blocks, company intros, employment details', type: 'general', order: 1 },
  { id: 'cat-compensation', name: 'Compensation & Benefits', description: 'Salary breakdown, allowances, CTC summary', type: 'component', order: 2 },
  { id: 'cat-legal', name: 'Legal & Compliance', description: 'NDA, confidentiality, probation, notice period', type: 'clause', order: 3 },
  { id: 'cat-closing', name: 'Closing & Signatures', description: 'Acceptance blocks, signatory blocks, disclaimers', type: 'component', order: 4 },
];

// Default Preset Tags
const DEFAULT_TAGS: UTBTag[] = [
  { id: 'tag-offer', name: 'Offer Letter', color: 'sky', usageCount: 14 },
  { id: 'tag-increment', name: 'Increment Letter', color: 'emerald', usageCount: 8 },
  { id: 'tag-relieving', name: 'Relieving Letter', color: 'amber', usageCount: 6 },
  { id: 'tag-legal', name: 'Legal', color: 'rose', usageCount: 12 },
  { id: 'tag-executive', name: 'Management', color: 'purple', usageCount: 5 },
];

// Default Preset Snippets
const DEFAULT_SNIPPETS: UTBSnippet[] = [
  {
    id: 'snip-greeting',
    title: 'Formal Greeting',
    content: 'Dear [candidate.name],',
    category: 'General Information',
    tags: ['Offer Letter', 'General'],
    scope: 'Global',
    version: 1.0,
    lifecycleState: 'Published',
    usageCount: 42,
    isFavorite: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'snip-hr-contact',
    title: 'HR Operations Contact',
    content: 'For any queries regarding your onboarding or document verification, please contact HR Operations at hr@company.com or Tel: +91 80 4567 8900.',
    category: 'General Information',
    tags: ['HR', 'Contact'],
    scope: 'Global',
    version: 1.0,
    lifecycleState: 'Published',
    usageCount: 28,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'snip-disclaimer',
    title: 'Confidentiality Footer Statement',
    content: 'Confidential & Proprietary Document. This document contains sensitive communication intended solely for the addressee.',
    category: 'Legal & Compliance',
    tags: ['Legal', 'Disclaimer'],
    scope: 'Global',
    version: 1.0,
    lifecycleState: 'Published',
    usageCount: 35,
    isFavorite: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Default Preset Clauses
const DEFAULT_CLAUSES: UTBClause[] = [
  {
    id: 'clause-confidentiality-v1',
    title: 'Non-Disclosure & Confidentiality Clause',
    category: 'Legal & Compliance',
    tags: ['Legal', 'NDA', 'Confidentiality'],
    content: 'During your employment and thereafter, you shall maintain strict confidentiality regarding all trade secrets, business processes, client data, technical architecture, and proprietary software belonging to [company.name]. Any unauthorized disclosure shall result in immediate legal action and summary termination.',
    scope: 'Global',
    version: 1.0,
    lifecycleState: 'Published',
    isMaster: true,
    isFavorite: true,
    usedInComponents: [],
    usedInTemplates: ['Offer Letter', 'Appointment Letter'],
    usedInGeneratedDocumentsCount: 128,
    aiMetadata: {
      purpose: 'Protect trade secrets and intellectual property',
      keywords: ['confidentiality', 'trade secrets', 'proprietary'],
      tone: 'Legal',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'clause-probation-v1',
    title: 'Standard Probationary Period Clause',
    category: 'Legal & Compliance',
    tags: ['Probation', 'Employment'],
    content: 'You will be on a probationary period of six (6) months from your date of joining. Upon successful evaluation of your performance and conduct, your services will be confirmed in writing. During probation, either party may terminate employment by giving 15 days written notice.',
    scope: 'Global',
    version: 1.0,
    lifecycleState: 'Published',
    isMaster: true,
    isFavorite: true,
    usedInComponents: [],
    usedInTemplates: ['Offer Letter'],
    usedInGeneratedDocumentsCount: 94,
    aiMetadata: {
      purpose: 'Define initial employment evaluation terms',
      keywords: ['probation', 'confirmation', 'notice period'],
      tone: 'Formal',
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Default Preset Components
const DEFAULT_COMPONENTS: UTBReusableComponent[] = [
  {
    id: 'comp-welcome-v1',
    name: 'Executive Welcome & Offer Block',
    category: 'General Information',
    tags: ['Welcome', 'Offer Letter'],
    description: 'Formal congratulations paragraph introducing job title, department, and company welcome',
    components: [
      {
        id: 'comp-welc-para',
        type: 'paragraph',
        content: 'We are pleased to offer you the position of [employee.designation] in the [employee.department] department at [company.name]. We were highly impressed with your professional achievements and believe your talents will contribute significantly to our organizational growth.',
      },
    ],
    scope: 'Global',
    version: 1.0,
    lifecycleState: 'Published',
    isFavorite: true,
    usedInTemplates: ['Offer Letter'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'comp-signature-v1',
    name: 'Authorized Signatory & Acceptance Block',
    category: 'Closing & Signatures',
    tags: ['Signatory', 'Acceptance', 'Closing'],
    description: 'Authorized signatory block with company stamp and candidate acceptance confirmation',
    components: [
      {
        id: 'comp-sig-main',
        type: 'signatory',
        content: 'Authorized Signatory Block',
      },
    ],
    scope: 'Global',
    version: 1.0,
    lifecycleState: 'Published',
    isFavorite: true,
    usedInTemplates: ['Offer Letter', 'Increment Letter', 'Relieving Letter'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

class ContentHubService {
  private components: UTBReusableComponent[] = [...DEFAULT_COMPONENTS];
  private clauses: UTBClause[] = [...DEFAULT_CLAUSES];
  private snippets: UTBSnippet[] = [...DEFAULT_SNIPPETS];
  private categories: UTBCategory[] = [...DEFAULT_CATEGORIES];
  private tags: UTBTag[] = [...DEFAULT_TAGS];

  // 1. Component Operations
  async getComponents(filter?: { category?: string; brandId?: string; search?: string }): Promise<UTBReusableComponent[]> {
    let list = this.components.filter((c) => !c.isArchived);
    if (filter?.category && filter.category !== 'All') {
      list = list.filter((c) => c.category === filter.category);
    }
    if (filter?.brandId) {
      list = list.filter((c) => c.scope === 'Global' || c.brandProfileId === filter.brandId);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((c) => c.name.toLowerCase().includes(q) || c.tags?.some((t) => t.toLowerCase().includes(q)));
    }
    return list;
  }

  async saveComponent(comp: UTBReusableComponent): Promise<UTBReusableComponent> {
    const idx = this.components.findIndex((c) => c.id === comp.id);
    const updated = { ...comp, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      this.components[idx] = updated;
    } else {
      this.components.push(updated);
    }
    await adminService.logAuditEntry({
      whoId: 'admin',
      whoName: 'System Admin',
      whatAction: idx >= 0 ? 'UPDATE_COMPONENT' : 'CREATE_COMPONENT',
      entityName: 'DocumentComponent',
      entityId: comp.id,
      oldValue: idx >= 0 ? `v${comp.version}` : 'None',
      newValue: `v${comp.version} (${comp.lifecycleState})`,
    });
    return updated;
  }

  // 2. Clause Operations
  async getClauses(filter?: { category?: string; brandId?: string; search?: string }): Promise<UTBClause[]> {
    let list = this.clauses.filter((c) => !c.isArchived);
    if (filter?.category && filter.category !== 'All') {
      list = list.filter((c) => c.category === filter.category);
    }
    if (filter?.brandId) {
      list = list.filter((c) => c.scope === 'Global' || c.brandProfileId === filter.brandId);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((c) => c.title.toLowerCase().includes(q) || c.content.toLowerCase().includes(q));
    }
    return list;
  }

  async saveClause(clause: UTBClause): Promise<UTBClause> {
    const idx = this.clauses.findIndex((c) => c.id === clause.id);
    const updated = { ...clause, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      this.clauses[idx] = updated;
    } else {
      this.clauses.push(updated);
    }
    await adminService.logAuditEntry({
      whoId: 'admin',
      whoName: 'System Admin',
      whatAction: idx >= 0 ? 'UPDATE_CLAUSE' : 'CREATE_CLAUSE',
      entityName: 'DocumentClause',
      entityId: clause.id,
      oldValue: idx >= 0 ? `v${clause.version}` : 'None',
      newValue: `v${clause.version} (${clause.lifecycleState})`,
    });
    return updated;
  }

  // 3. Snippet Operations
  async getSnippets(filter?: { category?: string; search?: string }): Promise<UTBSnippet[]> {
    let list = this.snippets.filter((s) => !s.isArchived);
    if (filter?.category && filter.category !== 'All') {
      list = list.filter((s) => s.category === filter.category);
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter((s) => s.title.toLowerCase().includes(q) || s.content.toLowerCase().includes(q));
    }
    return list;
  }

  async saveSnippet(snippet: UTBSnippet): Promise<UTBSnippet> {
    const idx = this.snippets.findIndex((s) => s.id === snippet.id);
    const updated = { ...snippet, updatedAt: new Date().toISOString() };
    if (idx >= 0) {
      this.snippets[idx] = updated;
    } else {
      this.snippets.push(updated);
    }
    return updated;
  }

  // 4. Categories & Tags Operations
  async getCategories(): Promise<UTBCategory[]> {
    return this.categories.filter((c) => !c.isArchived).sort((a, b) => a.order - b.order);
  }

  async saveCategory(cat: UTBCategory): Promise<UTBCategory> {
    const idx = this.categories.findIndex((c) => c.id === cat.id);
    if (idx >= 0) this.categories[idx] = cat;
    else this.categories.push(cat);
    return cat;
  }

  async getTags(): Promise<UTBTag[]> {
    return this.tags.filter((t) => !t.isArchived);
  }

  // 5. Smart Recommendations Engine
  async getSmartRecommendations(docType: string, brandId?: string): Promise<{
    recommendedComponents: UTBReusableComponent[];
    recommendedClauses: UTBClause[];
    recommendedSnippets: UTBSnippet[];
  }> {
    const compList = await this.getComponents({ brandId });
    const clauseList = await this.getClauses({ brandId });
    const snippetList = await this.getSnippets();

    const dtLower = docType.toLowerCase();

    return {
      recommendedComponents: compList.filter((c) => c.isFavorite || c.tags?.some((t) => dtLower.includes(t.toLowerCase()))),
      recommendedClauses: clauseList.filter((c) => c.isFavorite || c.usedInTemplates?.some((t) => dtLower.includes(t.toLowerCase()))),
      recommendedSnippets: snippetList.filter((s) => s.isFavorite || s.tags?.some((t) => dtLower.includes(t.toLowerCase()))),
    };
  }

  // 6. Dependency Graph Resolution
  async getDependencyGraph(itemId: string, kind: ContentKind): Promise<ContentDependencyGraph> {
    if (kind === 'Clause') {
      const cl = this.clauses.find((c) => c.id === itemId);
      return {
        itemId,
        itemKind: 'Clause',
        references: [],
        dependencies: [],
        consumers: (cl?.usedInTemplates || []).map((tName) => ({ id: tName, title: tName, kind: 'Template' })),
      };
    }

    if (kind === 'Component') {
      const comp = this.components.find((c) => c.id === itemId);
      return {
        itemId,
        itemKind: 'Component',
        references: (comp?.usedClauseIds || []).map((cId) => ({ id: cId, title: `Clause #${cId}`, kind: 'Clause' })),
        dependencies: [],
        consumers: (comp?.usedInTemplates || []).map((tName) => ({ id: tName, title: tName, kind: 'Template' })),
      };
    }

    return {
      itemId,
      itemKind: kind,
      references: [],
      dependencies: [],
      consumers: [],
    };
  }

  // 7. Automated Content Validation Guard
  validateContentItem(item: { title?: string; name?: string; category?: string; content?: string }): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const nameOrTitle = item.title || item.name;
    if (!nameOrTitle || nameOrTitle.trim() === '') {
      errors.push('Title/Name is required.');
    }
    if (!item.category || item.category.trim() === '') {
      errors.push('Category must be assigned.');
    }
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

export const contentHubService = new ContentHubService();
