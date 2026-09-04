import { adminService } from '../../../../services/admin/adminService';
import { storageService } from '../../../../services/document/storageService';
import { auditService } from '../../../../core/audit/auditService';
import type { InvoiceTemplate, InvoiceTemplateStatus } from '../../../../types/InvoiceTemplate';
import type { DocumentTemplateConfig } from '../../../../types/Admin';

const mapConfigToInvoiceTemplate = (config: DocumentTemplateConfig): InvoiceTemplate => {
  const uploadedAtStr = typeof config.uploadedAt === 'string'
    ? config.uploadedAt
    : (typeof config.createdAt === 'string' ? config.createdAt : new Date().toISOString());

  return {
    id: config.id,
    templateId: config.templateId || config.id,
    templateName: config.templateName,
    companyName: config.clientName || config.companyName || '',
    version: config.version || 1,
    uploadedAt: uploadedAtStr,
    uploadedBy: config.uploadedBy || config.modifiedBy || '',
    status: (config.status || (config.isActive ? 'Active' : 'Inactive')) as InvoiceTemplateStatus,
    fileUrl: config.templateFileUrl || '',
    storagePath: config.templateStoragePath || '',
    fileName: config.fileName || `${config.templateName}.xlsx`,
    fileSize: config.fileSize || 0,
    mimeType: config.mimeType || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    remarks: config.remarks || '',
    createdAt: config.createdAt || new Date().toISOString(),
    updatedAt: config.updatedAt || new Date().toISOString(),
  };
};

class InvoiceTemplateService {
  async getTemplates(): Promise<InvoiceTemplate[]> {
    const list = await adminService.getDocumentTemplatesByType('Invoice');
    return list.map(mapConfigToInvoiceTemplate);
  }

  async getActiveTemplates(): Promise<InvoiceTemplate[]> {
    const list = await this.getTemplates();
    return list.filter((t) => t.status === 'Active');
  }

  async getTemplate(id: string): Promise<InvoiceTemplate | null> {
    const list = await this.getTemplates();
    return list.find((t) => t.id === id || t.templateId === id) || null;
  }

  /**
   * Resolves the assigned InvoiceTemplate for a specific client.
   *
   * Requirement:
   * Strict exact match on templateId or id from Administration → Document Templates.
   */
  async resolveTemplateForClient(
    templateReference: string
  ): Promise<InvoiceTemplate | null> {
    if (!templateReference.trim()) return null;
    const allTemplates = await this.getActiveTemplates();
    if (!allTemplates.length) return null;

    // 1. Exact match by id / templateId
    const byId = allTemplates.find(
      (t) => t.id === templateReference || t.templateId === templateReference
    );
    if (byId) return byId;

    return null;
  }

  async uploadTemplateFile(
    file: File,
    metadata: {
      templateName: string;
      companyName: string;
      uploadedBy: string;
      remarks?: string;
    }
  ): Promise<string> {
    if (!metadata.templateName.trim() || !metadata.companyName.trim()) {
      throw new Error('Template Name and Company Name are required.');
    }

    const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, '_');
    const storagePath = `templates/invoices/${Date.now()}_${safeName}`;
    let fileUrl: string;

    try {
      const uploadRes = await storageService.upload(file, storagePath);
      fileUrl = uploadRes.downloadUrl;
    } catch { throw new Error('Template upload failed. The template was not saved.'); }

    const templateId = `tmpl-${metadata.templateName.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;

    const config: DocumentTemplateConfig = {
      id: templateId,
      templateId,
      templateName: metadata.templateName.trim(),
      type: 'Invoice',
      clientName: metadata.companyName.trim(),
      companyName: metadata.companyName.trim(),
      category: 'Finance',
      format: file.name.endsWith('.pdf') ? 'PDF' : 'XLSX',
      activeVersion: 'v1.0',
      version: 1,
      status: 'Active',
      isActive: true,
      templateFileUrl: fileUrl,
      templateStoragePath: storagePath,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      uploadedBy: metadata.uploadedBy,
      uploadedAt: new Date().toISOString(),
      remarks: metadata.remarks || '',
      defaultSignatureId: '',
      includeStamp: true,
      previousVersions: [],
      placeholders: [],
    };

    await adminService.saveDocumentTemplate(config, metadata.uploadedBy, metadata.uploadedBy);

    await auditService.record({
      module: 'Finance',
      action: 'Upload Invoice Template',
      recordId: templateId,
      performedBy: metadata.uploadedBy,
      role: 'Finance',
      newValue: { templateId, templateName: metadata.templateName, fileName: file.name },
      remarks: `Uploaded template '${metadata.templateName}' v1 to central document_templates collection.`,
    });

    return templateId;
  }

  async uploadNewTemplateVersion(
    existingTemplateId: string,
    file: File,
    uploadedBy: string,
    remarks?: string
  ): Promise<string> {
    const existing = await this.getTemplate(existingTemplateId);
    if (!existing) throw new Error('Existing template record was not found.');

    const newVersion = existing.version + 1;
    const safeName = file.name.replace(/[^A-Za-z0-9._-]/g, '_');
    const storagePath = `templates/invoices/v${newVersion}_${Date.now()}_${safeName}`;
    let fileUrl: string;

    try {
      const uploadRes = await storageService.upload(file, storagePath);
      fileUrl = uploadRes.downloadUrl;
    } catch { throw new Error('Template upload failed. The template version was not saved.'); }

    const newTemplateId = `${existing.templateId}-v${newVersion}`;

    const config: DocumentTemplateConfig = {
      id: newTemplateId,
      templateId: existing.templateId,
      templateName: existing.templateName,
      type: 'Invoice',
      clientName: existing.companyName,
      companyName: existing.companyName,
      category: 'Finance',
      format: file.name.endsWith('.pdf') ? 'PDF' : 'XLSX',
      activeVersion: `v${newVersion}.0`,
      version: newVersion,
      status: 'Active',
      isActive: true,
      templateFileUrl: fileUrl,
      templateStoragePath: storagePath,
      fileName: file.name,
      fileSize: file.size,
      mimeType: file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      uploadedBy,
      uploadedAt: new Date().toISOString(),
      remarks: remarks || `Version ${newVersion} update`,
      defaultSignatureId: '',
      includeStamp: true,
      previousVersions: [
        {
          version: `v${existing.version}.0`,
          fileUrl: existing.fileUrl,
          fileName: existing.fileName,
          uploadedBy: existing.uploadedBy,
          uploadedAt: typeof existing.uploadedAt === 'string' ? existing.uploadedAt : new Date().toISOString(),
          storagePath: existing.storagePath,
        },
      ],
      placeholders: [],
    };

    await adminService.saveDocumentTemplate(config, uploadedBy, uploadedBy);

    await auditService.record({
      module: 'Finance',
      action: 'Upload Template Version',
      recordId: newTemplateId,
      performedBy: uploadedBy,
      role: 'Finance',
      newValue: { templateId: existing.templateId, version: newVersion, fileName: file.name },
      remarks: `Uploaded version ${newVersion} for template '${existing.templateName}'.`,
    });

    return newTemplateId;
  }

  async toggleTemplateStatus(id: string, updatedBy: string): Promise<void> {
    const template = await this.getTemplate(id);
    if (!template) throw new Error('Template not found.');

    const newStatus: InvoiceTemplateStatus = template.status === 'Active' ? 'Inactive' : 'Active';
    await adminService.saveDocumentTemplate(
      {
        id,
        templateId: template.templateId,
        templateName: template.templateName,
        type: 'Invoice',
        clientName: template.companyName,
        category: 'Finance',
        format: 'XLSX',
        activeVersion: `v${template.version}.0`,
        version: template.version,
        status: newStatus,
        isActive: newStatus === 'Active',
        templateFileUrl: template.fileUrl,
        templateStoragePath: template.storagePath,
        fileName: template.fileName,
        fileSize: template.fileSize,
        mimeType: template.mimeType,
        uploadedBy: template.uploadedBy,
        uploadedAt: typeof template.uploadedAt === 'string' ? template.uploadedAt : new Date().toISOString(),
        defaultSignatureId: '',
        includeStamp: true,
        previousVersions: [],
        placeholders: [],
      },
      updatedBy,
      updatedBy
    );

    await auditService.record({
      module: 'Finance',
      action: 'Toggle Template Status',
      recordId: id,
      performedBy: updatedBy,
      role: 'Finance',
      newValue: { status: newStatus },
      remarks: `Template '${template.templateName}' status set to ${newStatus}.`,
    });
  }

  async deleteTemplate(id: string, deletedBy: string): Promise<void> {
    const template = await this.getTemplate(id);
    if (!template) throw new Error('Template not found.');

    await adminService.deleteDocumentTemplate(id, 'admin', deletedBy);

    await auditService.record({
      module: 'Finance',
      action: 'Delete Invoice Template',
      recordId: id,
      performedBy: deletedBy,
      role: 'Finance',
      remarks: `Template '${template.templateName}' (ID: ${id}) deleted from central document_templates collection.`,
    });
  }
}

export const invoiceTemplateService = new InvoiceTemplateService();
