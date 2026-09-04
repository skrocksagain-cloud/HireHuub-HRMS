import { useCallback, useEffect, useState } from "react";
import type { Document } from "../../types/Document";
import { documentService } from "../../services/document/documentService";
import { useAuth } from "../../context/AuthContext";
import { getAuthorizationScope } from "../../core/authorization/authorizationResolver";

interface DocumentActivity {
  id: string;
  title: string;
  description: string;
  time: string;
}

interface DocumentDistribution {
  label: string;
  count: number;
}

export interface UseDocumentDashboardReturn {
  loading: boolean;

  totalDocuments: number;
  generatedToday: number;
  storageUsed: string;
  totalTemplates: number;

  recentDocuments: Document[];
  activities: DocumentActivity[];
  distribution: DocumentDistribution[];

  refresh: () => Promise<void>;
}

export default function useDocumentDashboard(): UseDocumentDashboardReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [totalDocuments, setTotalDocuments] = useState(0);
  const [generatedToday, setGeneratedToday] = useState(0);
  const [storageUsed, setStorageUsed] = useState("0 MB");
  const [totalTemplates, setTotalTemplates] = useState(4);
  const [recentDocuments, setRecentDocuments] = useState<Document[]>([]);
  const [activities, setActivities] = useState<DocumentActivity[]>([]);
  const [distribution, setDistribution] = useState<DocumentDistribution[]>([]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);

      const canonicalRole = user?.authorization?.role || user?.assignedRole || "";
      const scope = getAuthorizationScope(canonicalRole);
      const userEmpId = user?.employeeId || user?.id || "";

      let allowedDocs: Document[] = [];

      if (scope === 'GLOBAL') {
        allowedDocs = await documentService.getAllGlobally(canonicalRole);
      } else {
        // Fallback for non-GLOBAL canonical roles: strictly bounded query for own documents.
        allowedDocs = await documentService.getByReference(userEmpId);
      }

      setTotalDocuments(allowedDocs.length);
      setGeneratedToday(
        allowedDocs.filter((d) => {
          const created = d.createdAt as { toDate?: () => Date };
          if (created?.toDate) {
            return created.toDate().toDateString() === new Date().toDateString();
          }
          return false;
        }).length
      );
      setStorageUsed(`${Math.round(allowedDocs.reduce((acc, d) => acc + (d.fileSize || 0), 0) / (1024 * 1024))} MB`);
      setTotalTemplates(4);
      setRecentDocuments(allowedDocs.slice(0, 10));

      setActivities(
        allowedDocs.slice(0, 5).map((d) => ({
          id: d.id || d.documentId,
          title: d.documentType || d.title,
          description: `Reference: ${d.referenceId}`,
          time: d.createdAt ? 'Recent' : 'System Recorded',
        }))
      );

      const distMap = new Map<string, number>();
      allowedDocs.forEach((d) => {
        const type = d.documentType || 'Other';
        distMap.set(type, (distMap.get(type) || 0) + 1);
      });

      setDistribution(
        Array.from(distMap.entries()).map(([label, count]) => ({ label, count }))
      );
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return {
    loading,
    totalDocuments,
    generatedToday,
    storageUsed,
    totalTemplates,
    recentDocuments,
    activities,
    distribution,
    refresh,
  };
}