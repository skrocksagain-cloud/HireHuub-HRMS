import { announcementRepository } from './repositories/announcementRepository';
import { announcementStorageRepository } from './repositories/announcementStorageRepository';
import { announcementVersionRepository } from './repositories/announcementVersionRepository';
import { adminAuditLogRepository } from '../auth/repositories/adminAuditLogRepository';

import type {
  AnnouncementItem,
  AnnouncementReadRecord,
  AnnouncementVersion,
  CircularFileMetadata,
} from '../../types/Announcement';

import { resolveAudienceEmployeeIds } from '../audience/audienceService';

export class AnnouncementService {
  /**
   * Fetch Announcements filtered by Role, Audience Scope & Status
   */
  async getAnnouncements(_role?: any | string, _userId?: string): Promise<AnnouncementItem[]> {
    const list = await announcementRepository.getAnnouncements();
    const todayStr = new Date().toISOString().slice(0, 10);

    return list.filter((ann) => {
      // Expiry Auto-Hide check
      if (ann.expiryDate && ann.expiryDate < todayStr && ann.status !== 'Expired') {
        ann.status = 'Expired';
      }

      // With AUTHORIZATION_ENABLED = false, return all items
      return true;
    }).sort((a, b) => {
      // Critical announcements stay pinned at the top
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createdAt.localeCompare(a.createdAt);
    });
  }

  /**
   * Upload Circular File
   */
  async uploadCircularFile(file: File, uploadedBy: string, uploadedByName?: string): Promise<CircularFileMetadata> {
    return announcementStorageRepository.uploadCircularFile(file, uploadedBy, uploadedByName);
  }

  /**
   * Save, Submit, or Publish Announcement
   */
  async saveAnnouncement(
    annData: Partial<AnnouncementItem> & { title: string; summary: string },
    actorId = 'admin',
    actorName = 'Super Admin',
    _actorRole?: any | string
  ): Promise<AnnouncementItem> {
    // Authorization enforcement is disabled. When enabled, add role-based restrictions here.
    const isSuper = true; // Bypass mode - authorization enforcement disabled
    const now = new Date().toISOString();
    const todayStr = now.slice(0, 10);

    let status: AnnouncementItem['status'] = annData.status || 'Published';
    if (annData.publishDate && annData.publishDate > todayStr) {
      status = 'Scheduled';
    }

    const versionNumber = annData.version || '1.0';

    // If updating existing announcement, record version snapshot before update
    if (annData.id) {
      const existingList = await announcementRepository.getAnnouncements();
      const existing = existingList.find((a) => a.id === annData.id);
      if (existing) {
        const nextVersion = (parseFloat(existing.version || '1.0') + 0.1).toFixed(1);
        await announcementVersionRepository.saveVersion({
          announcementId: existing.id,
          versionNumber: existing.version || '1.0',
          title: existing.title,
          summary: existing.summary,
          category: existing.category,
          priority: existing.priority,
          editedBy: actorId,
          editedByName: actorName,
          editedAt: now,
          changeSummary: `Updated content to version ${nextVersion}`,
          previousAttachment: existing.circularMetadata,
        });
        annData.version = nextVersion;
      }
    }

    const targetEmployeeIds = await resolveAudienceEmployeeIds({
      visibility: annData.visibility || 'Organization',
      departmentIds: annData.departmentIds,
      teamIds: annData.teamIds,
      selectedEmployeeIds: annData.employeeIds,
    });

    const payload: Omit<AnnouncementItem, 'id'> = {
      title: annData.title.trim(),
      summary: annData.summary.trim(),
      category: annData.category || 'General',
      priority: annData.priority || 'Medium',
      status,
      visibility: annData.visibility || 'Organization',
      companyIds: annData.companyIds || [],
      departmentIds: annData.departmentIds || [],
      teamIds: annData.teamIds || [],
      employeeIds: targetEmployeeIds,
      circularMetadata: annData.circularMetadata || null,
      requireAcknowledgement: Boolean(annData.requireAcknowledgement),
      isPinned: annData.priority === 'Critical' ? true : Boolean(annData.isPinned),
      version: annData.version || versionNumber,
      publishDate: annData.publishDate || todayStr,
      expiryDate: annData.expiryDate || undefined,
      isArchived: status === 'Archived',
      publishedBy: actorId,
      publishedByName: actorName,
      submittedBy: status === 'Submitted for Approval' ? actorId : annData.submittedBy,
      submittedByName: status === 'Submitted for Approval' ? actorName : annData.submittedByName,
      approvedBy: isSuper && status === 'Published' ? actorId : annData.approvedBy,
      approvedByName: isSuper && status === 'Published' ? actorName : annData.approvedByName,
      approvedAt: isSuper && status === 'Published' ? now : annData.approvedAt,
      createdAt: annData.createdAt || now,
      updatedAt: now,
    };

    const saved = await announcementRepository.saveAnnouncement({ ...payload, id: annData.id });

    // Create notifications if published
    if (saved.status === 'Published') {
      const targetEmployees = saved.employeeIds || ['ALL'];
      await announcementRepository.createNotifications(
        targetEmployees.map((empId) => ({
          announcementId: saved.id,
          targetEmployeeId: empId,
          title: saved.title,
          summary: saved.summary,
          category: saved.category,
          priority: saved.priority,
          createdAt: now,
          isRead: false,
        }))
      );
    }

    // Write Audit Log
    await adminAuditLogRepository.createAdminAuditLog({
      actorId,
      actorName,
      action: annData.id ? 'UNLOCK_OVERRIDE' : 'UNLOCK_APPROVE',
      targetEmployeeId: saved.id,
      targetEmployeeName: saved.title,
      reason: `Announcement ${saved.status}: ${saved.title}`,
      status: 'EXECUTED',
      timestamp: now,
    });

    return saved;
  }

  /**
   * Approve Pending Announcement (Super Admin)
   */
  async approveAnnouncement(annId: string, actorId: string, actorName: string): Promise<void> {
    const list = await announcementRepository.getAnnouncements();
    const existing = list.find((a) => a.id === annId);
    if (!existing) throw new Error('Announcement not found.');

    const now = new Date().toISOString();
    await announcementRepository.saveAnnouncement({
      ...existing,
      status: 'Published',
      approvedBy: actorId,
      approvedByName: actorName,
      approvedAt: now,
      updatedAt: now,
    });

    await adminAuditLogRepository.createAdminAuditLog({
      actorId,
      actorName,
      action: 'UNLOCK_APPROVE',
      targetEmployeeId: annId,
      targetEmployeeName: existing.title,
      reason: 'Approved announcement for organization publishing.',
      status: 'APPROVED',
      timestamp: now,
    });
  }

  /**
   * Archive Announcement
   */
  async archiveAnnouncement(annId: string, actorId = 'admin', actorName = 'Super Admin'): Promise<void> {
    await announcementRepository.archiveAnnouncement(annId);
    await adminAuditLogRepository.createAdminAuditLog({
      actorId,
      actorName,
      action: 'UNLOCK_REJECT',
      targetEmployeeId: annId,
      targetEmployeeName: 'Announcement Archive',
      reason: 'Archived announcement',
      status: 'EXECUTED',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Delete Announcement
   */
  async deleteAnnouncement(annId: string, actorId = 'admin', actorName = 'Super Admin'): Promise<void> {
    await announcementRepository.deleteAnnouncement(annId);
    await adminAuditLogRepository.createAdminAuditLog({
      actorId,
      actorName,
      action: 'UNLOCK_REJECT',
      targetEmployeeId: annId,
      targetEmployeeName: 'Delete Announcement',
      reason: 'Permanently deleted announcement record.',
      status: 'EXECUTED',
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Fetch Version History for Announcement
   */
  async getVersionHistory(announcementId: string): Promise<AnnouncementVersion[]> {
    return announcementVersionRepository.getVersions(announcementId);
  }

  /**
   * Record View
   */
  async recordView(announcementId: string, employeeId: string, employeeName: string, department?: string): Promise<void> {
    const now = new Date().toISOString();
    await announcementRepository.recordReadStatus({
      announcementId,
      employeeId,
      employeeName,
      department,
      device: typeof window !== 'undefined' ? window.navigator.platform : 'Desktop',
      deliveredAt: now,
      viewedAt: now,
    });
  }

  /**
   * Record Download
   */
  async recordDownload(announcementId: string, employeeId: string, employeeName: string, department?: string): Promise<void> {
    const now = new Date().toISOString();
    await announcementRepository.recordReadStatus({
      announcementId,
      employeeId,
      employeeName,
      department,
      device: typeof window !== 'undefined' ? window.navigator.platform : 'Desktop',
      deliveredAt: now,
      viewedAt: now,
      downloadedAt: now,
    });
  }

  /**
   * Record Acknowledgement
   */
  async recordAcknowledgement(announcementId: string, employeeId: string, employeeName: string, department?: string): Promise<void> {
    const now = new Date().toISOString();
    await announcementRepository.recordReadStatus({
      announcementId,
      employeeId,
      employeeName,
      department,
      device: typeof window !== 'undefined' ? window.navigator.platform : 'Desktop',
      deliveredAt: now,
      viewedAt: now,
      acknowledgedAt: now,
    });
  }

  /**
   * Fetch Read Tracking Records for Announcement
   */
  async getReadRecords(announcementId: string): Promise<AnnouncementReadRecord[]> {
    return announcementRepository.getReadRecords(announcementId);
  }
}

export const announcementService = new AnnouncementService();
