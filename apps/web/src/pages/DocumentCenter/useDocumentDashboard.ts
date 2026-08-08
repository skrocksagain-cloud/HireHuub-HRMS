import { useCallback, useEffect, useState } from "react";
import type { Document } from "../../types/Document";
import { documentService } from "../../services/document/documentService";
import { useAuth } from "../../context/AuthContext";
import { permissionService } from "../../core/permissions/permissionService";
import { employeeService } from "../Employee/services/employeeService";

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

      const allDocs = await documentService.getAll();
      const allEmps = await employeeService.getEmployees();

      // Filter documents based on PO Role-Based Document Center Permission Model
      let allowedDocs: Document[] = [];
      const userRole = user?.role || "Employee";
      const userEmpId = user?.employeeId || user?.id || "";

      if (permissionService.isSuperAdmin(userRole)) {
        // Super Admin (Founder, Co-Founder, Director, Board Member, Super Admin): Access EVERYTHING
        allowedDocs = allDocs;
      } else if (userRole === "Department Admin") {
        // Department Admin: View own docs & entire department docs
        const deptEmpIds = new Set(
          allEmps
            .filter((e) => e.department === user?.department)
            .map((e) => e.employeeId || e.employeeCode || e.id)
        );
        allowedDocs = allDocs.filter(
          (d) => d.referenceId === userEmpId || deptEmpIds.has(d.referenceId)
        );
      } else if (userRole === "Team Lead" || userRole === "Team Leader" || userRole === "Manager") {
        // Team Lead / Manager: View own docs & docs of employees reporting directly to them
        const teamEmpIds = new Set(
          allEmps
            .filter((e) => e.reportingManager === user?.name || e.reportingManagerId === userEmpId)
            .map((e) => e.employeeId || e.employeeCode || e.id)
        );
        allowedDocs = allDocs.filter(
          (d) => d.referenceId === userEmpId || teamEmpIds.has(d.referenceId)
        );
      } else {
        // Employee: View ONLY own documents (referenceId == user.employeeId / code)
        allowedDocs = allDocs.filter((d) => d.referenceId === userEmpId);
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