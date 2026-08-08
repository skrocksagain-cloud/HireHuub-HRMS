import type {
  AdminAuditEntry,
  BigDayConfig,
  CompanySettings,
  CompanySignature,
  DepartmentItem,
  DesignationItem,
  DocumentTemplateConfig,
  HierarchyNode,
  MasterDataConfig,
  NotificationSettings,
  PasswordResetRequest,
  RoleItem,
  SecuritySettings,
  TemplateHistoryEntry,
  WorkflowRule,
} from '../../types/Admin';
import { adminStorageService } from './adminStorageService';
import { adminRepository } from './repositories/adminRepository';

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

class AdminService {
  // 1. Company Settings & Storage Uploads
  async getCompanySettings(): Promise<CompanySettings> {
    return adminRepository.getCompanySettings();
  }

  async updateCompanySettings(settings: CompanySettings, actorId: string, actorName: string): Promise<void> {
    const old = await adminRepository.getCompanySettings();
    await adminRepository.updateCompanySettings(settings);

    await this.logAudit({
      whoId: actorId,
      whoName: actorName,
      whatAction: 'UPDATE_COMPANY_SETTINGS',
      entityName: 'CompanySettings',
      entityId: settings.id,
      oldValue: JSON.stringify({ companyName: old.companyName, logoUrl: old.logoUrl }),
      newValue: JSON.stringify({ companyName: settings.companyName, logoUrl: settings.logoUrl }),
    });
  }

  async uploadCompanyLogo(file: File, actorId: string, actorName: string): Promise<string> {
    const current = await this.getCompanySettings();
    if (current.logoStoragePath) {
      await adminStorageService.deleteFile(current.logoStoragePath);
    }

    const { url, path } = await adminStorageService.uploadCompanyLogo(file);
    await this.updateCompanySettings(
      {
        ...current,
        logoUrl: url,
        logoStoragePath: path,
      },
      actorId,
      actorName
    );
    return url;
  }

  async uploadOfficialStamp(file: File, actorId: string, actorName: string): Promise<string> {
    const current = await this.getCompanySettings();
    if (current.stampStoragePath) {
      await adminStorageService.deleteFile(current.stampStoragePath);
    }

    const { url, path } = await adminStorageService.uploadOfficialStamp(file);
    await this.updateCompanySettings(
      {
        ...current,
        stampUrl: url,
        stampStoragePath: path,
      },
      actorId,
      actorName
    );
    return url;
  }

  async deleteOfficialStamp(actorId: string, actorName: string): Promise<void> {
    const current = await this.getCompanySettings();
    if (current.stampStoragePath) {
      await adminStorageService.deleteFile(current.stampStoragePath);
    }
    await this.updateCompanySettings(
      {
        ...current,
        stampUrl: '',
        stampStoragePath: '',
      },
      actorId,
      actorName
    );
  }

  async uploadSignatureImage(
    signatoryId: string,
    file: File,
    name: string,
    designation: string,
    actorId: string,
    actorName: string
  ): Promise<CompanySignature> {
    const current = await this.getCompanySettings();
    const existingIndex = current.signatures.findIndex((s) => s.id === signatoryId);

    if (existingIndex >= 0 && current.signatures[existingIndex].storagePath) {
      await adminStorageService.deleteFile(current.signatures[existingIndex].storagePath!);
    }

    const { url, path } = await adminStorageService.uploadSignature(signatoryId, file);

    const newSig: CompanySignature = {
      id: signatoryId,
      name,
      designation,
      signatureUrl: url,
      storagePath: path,
      isActive: true,
    };

    let updatedSignatures: CompanySignature[];
    if (existingIndex >= 0) {
      updatedSignatures = current.signatures.map((s) => (s.id === signatoryId ? newSig : s));
    } else {
      updatedSignatures = [...current.signatures, newSig];
    }

    await this.updateCompanySettings(
      {
        ...current,
        signatures: updatedSignatures,
      },
      actorId,
      actorName
    );

    return newSig;
  }

  async deleteSignature(signatoryId: string, actorId: string, actorName: string): Promise<void> {
    const current = await this.getCompanySettings();
    const target = current.signatures.find((s) => s.id === signatoryId);

    if (target?.storagePath) {
      await adminStorageService.deleteFile(target.storagePath);
    }

    const updatedSignatures = current.signatures.filter((s) => s.id !== signatoryId);
    await this.updateCompanySettings(
      {
        ...current,
        signatures: updatedSignatures,
      },
      actorId,
      actorName
    );
  }

  // 2. Departments
  async getDepartments(): Promise<DepartmentItem[]> {
    return adminRepository.getDepartments();
  }

  async saveDepartment(dept: DepartmentItem, actorId: string, actorName: string): Promise<void> {
    await adminRepository.saveDepartment(dept);
    await this.logAudit({
      whoId: actorId,
      whoName: actorName,
      whatAction: 'CREATE_DEPARTMENT',
      entityName: 'Department',
      entityId: dept.id || dept.name,
      oldValue: '',
      newValue: JSON.stringify(dept),
    });
  }

  async updateDepartment(
    id: string,
    updates: Partial<DepartmentItem>,
    actorId: string,
    actorName: string
  ): Promise<void> {
    await adminRepository.updateDepartment(id, updates);
    await this.logAudit({
      whoId: actorId,
      whoName: actorName,
      whatAction: 'UPDATE_DEPARTMENT',
      entityName: 'Department',
      entityId: id,
      oldValue: '',
      newValue: JSON.stringify(updates),
    });
  }

  // 3. Designations
  async getDesignations(): Promise<DesignationItem[]> {
    return adminRepository.getDesignations();
  }

  async saveDesignation(desig: DesignationItem, actorId: string, actorName: string): Promise<void> {
    await adminRepository.saveDesignation(desig);
    await this.logAudit({
      whoId: actorId,
      whoName: actorName,
      whatAction: 'CREATE_DESIGNATION',
      entityName: 'Designation',
      entityId: desig.id || desig.name,
      oldValue: '',
      newValue: JSON.stringify(desig),
    });
  }

  async updateDesignation(
    id: string,
    updates: Partial<DesignationItem>,
    actorId: string,
    actorName: string
  ): Promise<void> {
    await adminRepository.updateDesignation(id, updates);
    await this.logAudit({
      whoId: actorId,
      whoName: actorName,
      whatAction: 'UPDATE_DESIGNATION',
      entityName: 'Designation',
      entityId: id,
      oldValue: '',
      newValue: JSON.stringify(updates),
    });
  }

  // 4. Roles
  async getRoles(): Promise<RoleItem[]> {
    return adminRepository.getRoles();
  }

  async saveRole(role: RoleItem, actorId: string, actorName: string): Promise<void> {
    await adminRepository.saveRole(role);
    await this.logAudit({
      whoId: actorId,
      whoName: actorName,
      whatAction: 'CREATE_ROLE',
      entityName: 'Role',
      entityId: role.id || role.name,
      oldValue: '',
      newValue: JSON.stringify(role),
    });
  }

  async updateRole(id: string, updates: Partial<RoleItem>, actorId: string, actorName: string): Promise<void> {
    await adminRepository.updateRole(id, updates);
    await this.logAudit({
      whoId: actorId,
      whoName: actorName,
      whatAction: 'UPDATE_ROLE',
      entityName: 'Role',
      entityId: id,
      oldValue: '',
      newValue: JSON.stringify(updates),
    });
  }

  // 5. Hierarchy
  async getHierarchy(): Promise<HierarchyNode[]> {
    return adminRepository.getHierarchy();
  }

  async saveHierarchyNode(node: HierarchyNode, actorId: string, actorName: string): Promise<void> {
    await adminRepository.saveHierarchyNode(node);
    await this.logAudit({
      whoId: actorId,
      whoName: actorName,
      whatAction: 'UPDATE_HIERARCHY',
      entityName: 'HierarchyNode',
      entityId: node.employeeId,
      oldValue: '',
      newValue: JSON.stringify(node),
    });
  }

  // 6. Workflows
  async getWorkflows(): Promise<WorkflowRule[]> {
    return adminRepository.getWorkflows();
  }

  async saveWorkflow(wf: WorkflowRule, actorId: string, actorName: string): Promise<void> {
    await adminRepository.saveWorkflow(wf);
    await this.logAudit({
      whoId: actorId,
      whoName: actorName,
      whatAction: 'CREATE_WORKFLOW',
      entityName: 'WorkflowRule',
      entityId: wf.id || wf.name,
      oldValue: '',
      newValue: JSON.stringify(wf),
    });
  }

  async updateWorkflow(
    id: string,
    updates: Partial<WorkflowRule>,
    actorId: string,
    actorName: string
  ): Promise<void> {
    await adminRepository.updateWorkflow(id, updates);
    await this.logAudit({
      whoId: actorId,
      whoName: actorName,
      whatAction: 'UPDATE_WORKFLOW',
      entityName: 'WorkflowRule',
      entityId: id,
      oldValue: '',
      newValue: JSON.stringify(updates),
    });
  }

  // 7. Document Templates (Single Collection & Versioning)
  async getDocumentTemplates(): Promise<DocumentTemplateConfig[]> {
    return adminRepository.getDocumentTemplates();
  }

  async getDocumentTemplateByType(type: string): Promise<DocumentTemplateConfig | null> {
    return adminRepository.getDocumentTemplateByType(type);
  }

  async uploadTemplateFile(
    documentType: string,
    file: File,
    version: string,
    actorId: string,
    actorName: string
  ): Promise<{ url: string; path: string }> {
    const res = await adminStorageService.uploadTemplateFile(documentType, version, file);
    await this.logAudit({
      whoId: actorId,
      whoName: actorName,
      whatAction: 'UPLOAD_TEMPLATE_FILE',
      entityName: 'DocumentTemplateFile',
      entityId: documentType,
      oldValue: '',
      newValue: res.url,
    });
    return res;
  }

  async saveDocumentTemplate(tmpl: DocumentTemplateConfig, actorId: string, actorName: string): Promise<void> {
    const id = tmpl.id || slugify(tmpl.type);
    const existing = await adminRepository.getDocumentTemplateByType(tmpl.type);

    let updatedVersions = tmpl.previousVersions || [];

    if (existing && existing.templateFileUrl && existing.templateFileUrl !== tmpl.templateFileUrl) {
      const historyItem: TemplateHistoryEntry = {
        version: existing.activeVersion || 'v1.0',
        fileUrl: existing.templateFileUrl,
        fileName: `${existing.type}_${existing.activeVersion || 'v1.0'}`,
        uploadedBy: existing.modifiedBy || actorName,
        uploadedAt: existing.updatedAt || new Date().toISOString(),
        storagePath: existing.templateStoragePath || '',
      };
      updatedVersions = [historyItem, ...updatedVersions];
    }

    const payload: DocumentTemplateConfig = {
      ...tmpl,
      id,
      previousVersions: updatedVersions,
      updatedAt: new Date().toISOString(),
      modifiedBy: actorName,
    };

    await adminRepository.saveDocumentTemplate(payload);
    await this.logAudit({
      whoId: actorId,
      whoName: actorName,
      whatAction: 'SAVE_DOCUMENT_TEMPLATE',
      entityName: 'DocumentTemplateConfig',
      entityId: id,
      oldValue: existing ? existing.activeVersion : '',
      newValue: payload.activeVersion,
    });
  }

  // 8. Big Day Configuration
  async getBigDays(): Promise<BigDayConfig[]> {
    return adminRepository.getBigDays();
  }

  async saveBigDay(config: BigDayConfig, actorId: string, actorName: string): Promise<void> {
    await adminRepository.saveBigDay(config);
    await this.logAudit({
      whoId: actorId,
      whoName: actorName,
      whatAction: 'CREATE_BIG_DAY',
      entityName: 'BigDayConfig',
      entityId: config.id || config.date,
      oldValue: '',
      newValue: JSON.stringify(config),
    });
  }

  async updateBigDay(id: string, updates: Partial<BigDayConfig>, actorId: string, actorName: string): Promise<void> {
    await adminRepository.updateBigDay(id, updates);
    await this.logAudit({
      whoId: actorId,
      whoName: actorName,
      whatAction: 'UPDATE_BIG_DAY',
      entityName: 'BigDayConfig',
      entityId: id,
      oldValue: '',
      newValue: JSON.stringify(updates),
    });
  }

  async calculateRecruiterPoints(
    activationDate: string,
    clientId: string,
    basePoints: number = 1.0
  ): Promise<{ basePoints: number; bigDayBonus: number; totalPoints: number; isBigDay: boolean }> {
    const bigDays = await adminRepository.getBigDays();
    const match = bigDays.find(
      (bd) => bd.date === activationDate && bd.status === 'Active' && bd.clientIds.includes(clientId)
    );

    if (match) {
      const bonus = match.bonus || 0.5;
      return {
        basePoints,
        bigDayBonus: bonus,
        totalPoints: basePoints + bonus,
        isBigDay: true,
      };
    }

    return {
      basePoints,
      bigDayBonus: 0,
      totalPoints: basePoints,
      isBigDay: false,
    };
  }

  // 9. Master Data
  async getMasterData(): Promise<MasterDataConfig> {
    return adminRepository.getMasterData();
  }

  async updateMasterData(data: MasterDataConfig, actorId: string, actorName: string): Promise<void> {
    const old = await adminRepository.getMasterData();
    await adminRepository.updateMasterData(data);
    await this.logAudit({
      whoId: actorId,
      whoName: actorName,
      whatAction: 'UPDATE_MASTER_DATA',
      entityName: 'MasterDataConfig',
      entityId: 'master_data',
      oldValue: JSON.stringify({ employeePrefix: old.employeePrefix, invoicePrefix: old.invoicePrefix }),
      newValue: JSON.stringify({ employeePrefix: data.employeePrefix, invoicePrefix: data.invoicePrefix }),
    });
  }

  // 10. Notification Settings
  async getNotificationSettings(): Promise<NotificationSettings> {
    return adminRepository.getNotificationSettings();
  }

  async updateNotificationSettings(
    settings: NotificationSettings,
    actorId: string,
    actorName: string
  ): Promise<void> {
    await adminRepository.updateNotificationSettings(settings);
    await this.logAudit({
      whoId: actorId,
      whoName: actorName,
      whatAction: 'UPDATE_NOTIFICATION_SETTINGS',
      entityName: 'NotificationSettings',
      entityId: 'notification_settings',
      oldValue: '',
      newValue: JSON.stringify(settings),
    });
  }

  // 11. Security Settings & Password Reset Requests
  async getSecuritySettings(): Promise<SecuritySettings> {
    return adminRepository.getSecuritySettings();
  }

  async updateSecuritySettings(settings: SecuritySettings, actorId: string, actorName: string): Promise<void> {
    await adminRepository.updateSecuritySettings(settings);
    await this.logAudit({
      whoId: actorId,
      whoName: actorName,
      whatAction: 'UPDATE_SECURITY_SETTINGS',
      entityName: 'SecuritySettings',
      entityId: 'security_settings',
      oldValue: '',
      newValue: JSON.stringify(settings),
    });
  }

  async getPasswordResetRequests(): Promise<PasswordResetRequest[]> {
    return adminRepository.getPasswordResetRequests();
  }

  async createPasswordResetRequest(req: PasswordResetRequest): Promise<void> {
    await adminRepository.createPasswordResetRequest(req);
    await this.logAudit({
      whoId: req.employeeId,
      whoName: req.employeeName,
      whatAction: 'REQUEST_PASSWORD_RESET',
      entityName: 'PasswordResetRequest',
      entityId: req.id || req.employeeId,
      oldValue: '',
      newValue: JSON.stringify(req),
    });
  }

  async approvePasswordReset(
    requestId: string,
    temporaryPassword: string,
    actorId: string,
    actorName: string
  ): Promise<void> {
    await adminRepository.updatePasswordResetRequest(requestId, {
      status: 'Approved',
      newTemporaryPassword: temporaryPassword,
      resolvedBy: actorName,
    });

    await this.logAudit({
      whoId: actorId,
      whoName: actorName,
      whatAction: 'APPROVE_PASSWORD_RESET',
      entityName: 'PasswordResetRequest',
      entityId: requestId,
      oldValue: 'Pending',
      newValue: 'Approved',
    });
  }

  async rejectPasswordReset(requestId: string, actorId: string, actorName: string): Promise<void> {
    await adminRepository.updatePasswordResetRequest(requestId, {
      status: 'Rejected',
      resolvedBy: actorName,
    });

    await this.logAudit({
      whoId: actorId,
      whoName: actorName,
      whatAction: 'REJECT_PASSWORD_RESET',
      entityName: 'PasswordResetRequest',
      entityId: requestId,
      oldValue: 'Pending',
      newValue: 'Rejected',
    });
  }

  // 12. Audit Logs
  async getAuditLogs(): Promise<AdminAuditEntry[]> {
    return adminRepository.getAuditLogs();
  }

  private async logAudit(entry: Omit<AdminAuditEntry, 'id' | 'timestamp'>): Promise<void> {
    const fullEntry: AdminAuditEntry = {
      ...entry,
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
    };
    await adminRepository.logAuditEntry(fullEntry);
  }
}

export const adminService = new AdminService();
