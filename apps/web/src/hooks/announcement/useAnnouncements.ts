import { useCallback, useEffect, useState } from 'react';
import { announcementService } from '../../services/announcement/announcementService';
import type {
  AnnouncementItem,
  AnnouncementReadRecord,
  AnnouncementVersion,
  CircularFileMetadata,
} from '../../types/Announcement';
import { usePermissions } from '../usePermissions';

export type AnnouncementSubView =
  | 'published'
  | 'pending'
  | 'draft'
  | 'scheduled'
  | 'archived'
  | 'expired'
  | 'analytics';

export function useAnnouncements(currentUserId = 'HH0001', currentUserName = 'Somnath') {
  const { activeRole } = usePermissions();

  const [announcements, setAnnouncements] = useState<AnnouncementItem[]>([]);
  const [activeSubView, setActiveSubView] = useState<AnnouncementSubView>('published');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [statusMsg, setStatusMsg] = useState<string>('');
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const fetchAnnouncements = useCallback(async () => {
    setIsLoading(true);
    try {
      const list = await announcementService.getAnnouncements(activeRole, currentUserId);
      setAnnouncements(list);
    } catch {
      setAnnouncements([]);
    } finally {
      setIsLoading(false);
    }
  }, [activeRole.name, currentUserId]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const uploadCircular = async (file: File): Promise<CircularFileMetadata> => {
    setIsUploading(true);
    try {
      const meta = await announcementService.uploadCircularFile(file, currentUserId, currentUserName);
      setIsUploading(false);
      return meta;
    } catch (error) {
      setIsUploading(false);
      throw error;
    }
  };

  const saveAnnouncement = async (
    annData: Partial<AnnouncementItem> & { title: string; summary: string }
  ) => {
    const saved = await announcementService.saveAnnouncement(
      annData,
      currentUserId,
      currentUserName,
      activeRole
    );
    await fetchAnnouncements();
    setStatusMsg(`Announcement '${saved.title}' saved (${saved.status})!`);
    setTimeout(() => setStatusMsg(''), 4000);
    return saved;
  };

  const approveAnnouncement = async (annId: string) => {
    await announcementService.approveAnnouncement(annId, currentUserId, currentUserName);
    await fetchAnnouncements();
    setStatusMsg(`Announcement approved and published!`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const archiveAnnouncement = async (annId: string) => {
    await announcementService.archiveAnnouncement(annId, currentUserId, currentUserName);
    await fetchAnnouncements();
    setStatusMsg(`Announcement archived.`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const deleteAnnouncement = async (annId: string) => {
    await announcementService.deleteAnnouncement(annId, currentUserId, currentUserName);
    await fetchAnnouncements();
    setStatusMsg(`Announcement deleted.`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const getVersionHistory = async (annId: string): Promise<AnnouncementVersion[]> => {
    return announcementService.getVersionHistory(annId);
  };

  const trackRead = async (annId: string, department?: string) => {
    await announcementService.recordView(annId, currentUserId, currentUserName, department);
  };

  const trackDownload = async (annId: string, department?: string) => {
    await announcementService.recordDownload(annId, currentUserId, currentUserName, department);
  };

  const trackAcknowledgement = async (annId: string, department?: string) => {
    await announcementService.recordAcknowledgement(annId, currentUserId, currentUserName, department);
    setStatusMsg(`Announcement acknowledged.`);
    setTimeout(() => setStatusMsg(''), 3000);
  };

  const getReadRecords = async (annId: string): Promise<AnnouncementReadRecord[]> => {
    return announcementService.getReadRecords(annId);
  };

  return {
    announcements,
    activeSubView,
    setActiveSubView,
    isLoading,
    isUploading,
    statusMsg,
    refresh: fetchAnnouncements,
    uploadCircular,
    saveAnnouncement,
    approveAnnouncement,
    archiveAnnouncement,
    deleteAnnouncement,
    getVersionHistory,
    trackRead,
    trackDownload,
    trackAcknowledgement,
    getReadRecords,
  };
}
