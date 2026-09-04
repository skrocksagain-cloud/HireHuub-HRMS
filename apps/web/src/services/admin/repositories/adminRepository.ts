import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  setDoc,
  updateDoc,
} from 'firebase/firestore';

import { db } from '../../../firebase/firebase';
import type {
  AdminAuditEntry,
  BigDayConfig,
  CompanySettings,
  DepartmentItem,
  DesignationItem,
  DocumentTemplateConfig,
  HierarchyNode,
  MasterDataConfig,
  NotificationSettings,
  PasswordResetRequest,
  RoleItem,
  SecuritySettings,
  WorkflowRule,
} from '../../../types/Admin';

const COMPANY_DOC_ID = 'hirehuub_company_settings';
const MASTER_DATA_DOC_ID = 'hirehuub_master_data';
const NOTIFICATION_SETTINGS_DOC_ID = 'hirehuub_notification_settings';
const SECURITY_SETTINGS_DOC_ID = 'hirehuub_security_settings';

export function sanitizePayload<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizePayload) as unknown as T;
  }
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj as Record<string, any>)) {
    if (value !== undefined) {
      result[key] = sanitizePayload(value);
    }
  }
  return result as T;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

export interface AdminRepository {
  getCompanySettings(): Promise<CompanySettings | null>;
  updateCompanySettings(settings: CompanySettings): Promise<void>;

  getDepartments(): Promise<DepartmentItem[]>;
  saveDepartment(dept: DepartmentItem): Promise<void>;
  updateDepartment(id: string, updates: Partial<DepartmentItem>): Promise<void>;

  getDesignations(): Promise<DesignationItem[]>;
  saveDesignation(desig: DesignationItem): Promise<void>;
  updateDesignation(id: string, updates: Partial<DesignationItem>): Promise<void>;

  getRoles(): Promise<RoleItem[]>;
  saveRole(role: RoleItem): Promise<void>;
  updateRole(id: string, updates: Partial<RoleItem>): Promise<void>;

  getHierarchy(): Promise<HierarchyNode[]>;
  saveHierarchyNode(node: HierarchyNode): Promise<void>;

  getWorkflows(): Promise<WorkflowRule[]>;
  saveWorkflow(workflow: WorkflowRule): Promise<void>;
  updateWorkflow(id: string, updates: Partial<WorkflowRule>): Promise<void>;

  getDocumentTemplates(): Promise<DocumentTemplateConfig[]>;
  getDocumentTemplateByType(type: string): Promise<DocumentTemplateConfig | null>;
  getDocumentTemplatesByType(type: string): Promise<DocumentTemplateConfig[]>;
  saveDocumentTemplate(template: DocumentTemplateConfig): Promise<void>;
  updateDocumentTemplate(id: string, updates: Partial<DocumentTemplateConfig>): Promise<void>;
  deleteDocumentTemplate(id: string): Promise<void>;

  getBigDays(): Promise<BigDayConfig[]>;
  saveBigDay(config: BigDayConfig): Promise<void>;
  updateBigDay(id: string, updates: Partial<BigDayConfig>): Promise<void>;

  getMasterData(): Promise<MasterDataConfig | null>;
  updateMasterData(data: MasterDataConfig): Promise<void>;

  getNotificationSettings(): Promise<NotificationSettings | null>;
  updateNotificationSettings(settings: NotificationSettings): Promise<void>;

  getSecuritySettings(): Promise<SecuritySettings | null>;
  updateSecuritySettings(settings: SecuritySettings): Promise<void>;

  getPasswordResetRequests(): Promise<PasswordResetRequest[]>;
  createPasswordResetRequest(req: PasswordResetRequest): Promise<void>;
  updatePasswordResetRequest(id: string, updates: Partial<PasswordResetRequest>): Promise<void>;

  getAuditLogs(): Promise<AdminAuditEntry[]>;
  logAuditEntry(entry: AdminAuditEntry): Promise<void>;
}

class FirestoreAdminRepository implements AdminRepository {
  async getCompanySettings(): Promise<CompanySettings | null> {
    const docRef = doc(db, 'admin_company', COMPANY_DOC_ID);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return snap.data() as CompanySettings;
    }

    return null;
  }

  async updateCompanySettings(settings: CompanySettings): Promise<void> {
    const docRef = doc(db, 'admin_company', COMPANY_DOC_ID);
    await setDoc(docRef, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
  }

  async getDepartments(): Promise<DepartmentItem[]> {
    const snap = await getDocs(query(collection(db, 'admin_departments'), orderBy('name')));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DepartmentItem, 'id'>) }));
  }

  async saveDepartment(dept: DepartmentItem): Promise<void> {
    const docRef = doc(db, 'admin_departments', dept.id || slugify(dept.name));
    await setDoc(docRef, { ...dept, id: docRef.id, createdAt: new Date().toISOString() });
  }

  async updateDepartment(id: string, updates: Partial<DepartmentItem>): Promise<void> {
    await updateDoc(doc(db, 'admin_departments', id), { ...updates, updatedAt: new Date().toISOString() });
  }

  async getDesignations(): Promise<DesignationItem[]> {
    const snap = await getDocs(query(collection(db, 'admin_designations'), orderBy('name')));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DesignationItem, 'id'>) }));
  }

  async saveDesignation(desig: DesignationItem): Promise<void> {
    const docRef = doc(db, 'admin_designations', desig.id || slugify(desig.name));
    await setDoc(docRef, { ...desig, id: docRef.id, createdAt: new Date().toISOString() });
  }

  async updateDesignation(id: string, updates: Partial<DesignationItem>): Promise<void> {
    await updateDoc(doc(db, 'admin_designations', id), { ...updates, updatedAt: new Date().toISOString() });
  }

  async getRoles(): Promise<RoleItem[]> {
    const snap = await getDocs(query(collection(db, 'admin_roles'), orderBy('name')));
    return snap.docs.map((d) => {
      const data = d.data() as Omit<RoleItem, 'id'>;
      return {
        id: d.id,
        ...data,
        viewScope: data.viewScope || 'Organization',
        approvalScope: data.approvalScope || 'Organization',
        reportingScope: data.reportingScope || 'DirectReports',
        departmentIds: data.departmentIds || [],
        teamIds: data.teamIds || [],
        employeeIds: data.employeeIds || [],
        branchIds: data.branchIds || [],
        companyIds: data.companyIds || [],
      };
    });
  }

  async saveRole(role: RoleItem): Promise<void> {
    const docRef = doc(db, 'admin_roles', role.id || slugify(role.name));
    await setDoc(docRef, { ...role, id: docRef.id, createdAt: new Date().toISOString() });
  }

  async updateRole(id: string, updates: Partial<RoleItem>): Promise<void> {
    await updateDoc(doc(db, 'admin_roles', id), { ...updates, updatedAt: new Date().toISOString() });
  }

  async getHierarchy(): Promise<HierarchyNode[]> {
    const snap = await getDocs(collection(db, 'admin_hierarchy'));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<HierarchyNode, 'id'>) }));
  }

  async saveHierarchyNode(node: HierarchyNode): Promise<void> {
    const docRef = doc(db, 'admin_hierarchy', node.id || node.employeeId);
    await setDoc(docRef, { ...node, id: docRef.id, updatedAt: new Date().toISOString() });
  }

  async getWorkflows(): Promise<WorkflowRule[]> {
    const snap = await getDocs(collection(db, 'admin_workflows'));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<WorkflowRule, 'id'>) }));
  }

  async saveWorkflow(workflow: WorkflowRule): Promise<void> {
    const docRef = doc(db, 'admin_workflows', workflow.id || `wf-${Date.now()}`);
    await setDoc(docRef, { ...workflow, id: docRef.id, createdAt: new Date().toISOString() });
  }

  async updateWorkflow(id: string, updates: Partial<WorkflowRule>): Promise<void> {
    await updateDoc(doc(db, 'admin_workflows', id), { ...updates, updatedAt: new Date().toISOString() });
  }

  async getDocumentTemplates(): Promise<DocumentTemplateConfig[]> {
    try {
      const snap = await getDocs(collection(db, 'document_templates'));
      return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<DocumentTemplateConfig, 'id'>) }));
    } catch {
      return [];
    }
  }

  async getDocumentTemplateByType(type: string): Promise<DocumentTemplateConfig | null> {
    try {
      const list = await this.getDocumentTemplatesByType(type);
      if (list.length > 0) return list[0];
      const docRef = doc(db, 'document_templates', slugify(type));
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...(snap.data() as Omit<DocumentTemplateConfig, 'id'>) };
      }
      return null;
    } catch {
      return null;
    }
  }

  async getDocumentTemplatesByType(type: string): Promise<DocumentTemplateConfig[]> {
    try {
      const list = await this.getDocumentTemplates();
      return list.filter(
        (t) => (t.type || (t as { documentType?: string }).documentType)?.toLowerCase() === type.toLowerCase()
      );
    } catch {
      return [];
    }
  }

  async saveDocumentTemplate(template: DocumentTemplateConfig): Promise<void> {
    const id = template.id || slugify(`${template.type}-${template.templateName || Date.now()}`);
    const docRef = doc(db, 'document_templates', id);
    const rawPayload = { ...template, id, createdAt: new Date().toISOString() };
    const cleanPayload = sanitizePayload(rawPayload);
    await setDoc(docRef, cleanPayload);
  }

  async updateDocumentTemplate(id: string, updates: Partial<DocumentTemplateConfig>): Promise<void> {
    const rawPayload = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    const cleanPayload = sanitizePayload(rawPayload);
    await updateDoc(doc(db, 'document_templates', id), cleanPayload);
  }

  async deleteDocumentTemplate(id: string): Promise<void> {
    await deleteDoc(doc(db, 'document_templates', id));
  }

  async getBigDays(): Promise<BigDayConfig[]> {
    const snap = await getDocs(query(collection(db, 'admin_big_day'), orderBy('date', 'desc')));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<BigDayConfig, 'id'>) }));
  }

  async saveBigDay(config: BigDayConfig): Promise<void> {
    const docRef = doc(db, 'admin_big_day', config.id || `bigday-${Date.now()}`);
    await setDoc(docRef, { ...config, id: docRef.id, createdAt: new Date().toISOString() });
  }

  async updateBigDay(id: string, updates: Partial<BigDayConfig>): Promise<void> {
    await updateDoc(doc(db, 'admin_big_day', id), { ...updates, updatedAt: new Date().toISOString() });
  }

  async getMasterData(): Promise<MasterDataConfig | null> {
    const docRef = doc(db, 'admin_master_data', MASTER_DATA_DOC_ID);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return snap.data() as MasterDataConfig;
    }

    return null;
  }

  async updateMasterData(data: MasterDataConfig): Promise<void> {
    const docRef = doc(db, 'admin_master_data', MASTER_DATA_DOC_ID);
    await setDoc(docRef, { ...data, updatedAt: new Date().toISOString() }, { merge: true });
  }

  async getNotificationSettings(): Promise<NotificationSettings | null> {
    const docRef = doc(db, 'admin_notification_settings', NOTIFICATION_SETTINGS_DOC_ID);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return snap.data() as NotificationSettings;
    }

    return null;
  }

  async updateNotificationSettings(settings: NotificationSettings): Promise<void> {
    const docRef = doc(db, 'admin_notification_settings', NOTIFICATION_SETTINGS_DOC_ID);
    await setDoc(docRef, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
  }

  async getSecuritySettings(): Promise<SecuritySettings | null> {
    const docRef = doc(db, 'admin_security_settings', SECURITY_SETTINGS_DOC_ID);
    const snap = await getDoc(docRef);

    if (snap.exists()) {
      return snap.data() as SecuritySettings;
    }

    return null;
  }

  async updateSecuritySettings(settings: SecuritySettings): Promise<void> {
    const docRef = doc(db, 'admin_security_settings', SECURITY_SETTINGS_DOC_ID);
    await setDoc(docRef, { ...settings, updatedAt: new Date().toISOString() }, { merge: true });
  }

  async getPasswordResetRequests(): Promise<PasswordResetRequest[]> {
    const snap = await getDocs(query(collection(db, 'admin_password_reset_requests'), orderBy('requestedAt', 'desc')));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<PasswordResetRequest, 'id'>) }));
  }

  async createPasswordResetRequest(req: PasswordResetRequest): Promise<void> {
    const docRef = doc(db, 'admin_password_reset_requests', req.id || `reset-${Date.now()}`);
    await setDoc(docRef, { ...req, id: docRef.id, requestedAt: new Date().toISOString() });
  }

  async updatePasswordResetRequest(id: string, updates: Partial<PasswordResetRequest>): Promise<void> {
    await updateDoc(doc(db, 'admin_password_reset_requests', id), {
      ...updates,
      resolvedAt: new Date().toISOString(),
    });
  }

  async getAuditLogs(): Promise<AdminAuditEntry[]> {
    const snap = await getDocs(query(collection(db, 'admin_audit_logs'), orderBy('timestamp', 'desc')));
    return snap.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<AdminAuditEntry, 'id'>) }));
  }

  async logAuditEntry(entry: AdminAuditEntry): Promise<void> {
    await addDoc(collection(db, 'admin_audit_logs'), {
      ...entry,
      timestamp: new Date().toISOString(),
    });
  }
}

export const adminRepository: AdminRepository = new FirestoreAdminRepository();
