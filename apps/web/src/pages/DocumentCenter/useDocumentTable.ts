import { useCallback, useEffect, useMemo, useState } from "react";
import type { Document } from "../../types/Document";
import {
  archiveDocument,
  assignDocument,
  deleteDocument,
  getDocuments,
} from "../../services/document/documentService";
import { useAuth } from "../../context/AuthContext";
import { permissionService } from "../../core/permissions/permissionService";
import { employeeService } from "../Employee/services/employeeService";

export interface UseDocumentTableReturn {
  loading: boolean;
  documents: Document[];
  filteredDocuments: Document[];

  search: string;
  setSearch: React.Dispatch<React.SetStateAction<string>>;

  selectedModule: string;
  setSelectedModule: React.Dispatch<React.SetStateAction<string>>;

  selectedType: string;
  setSelectedType: React.Dispatch<React.SetStateAction<string>>;

  selectedStatus: string;
  setSelectedStatus: React.Dispatch<React.SetStateAction<string>>;

  refresh: () => Promise<void>;
  view: (document: Document) => void;
  download: (document: Document) => void;
  archive: (document: Document) => Promise<void>;
  remove: (document: Document) => Promise<void>;
  assign: (document: Document, newTargetId: string, newSharedWith: string) => Promise<void>;

  canArchive: boolean;
  canDelete: boolean;
}

export default function useDocumentTable(): UseDocumentTableReturn {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);

  const [search, setSearch] = useState("");
  const [selectedModule, setSelectedModule] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  const userRole = user?.role || "Employee";
  const userEmpId = user?.employeeId || user?.id || "";

  const canArchive = permissionService.canArchiveDocument(userRole);
  const canDelete = permissionService.canDeleteDocument(userRole);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);
      const allDocs = await getDocuments();
      const allEmps = await employeeService.getEmployees();

      // Role-Based Document Filtering (Sprint 02.9.5 Spec)
      let allowedDocs: Document[] = [];

      if (permissionService.isSuperAdmin(userRole) || userRole === "Admin") {
        allowedDocs = allDocs;
      } else if (userRole === "Department Admin") {
        const deptEmpIds = new Set(
          allEmps
            .filter((e) => e.department === user?.department)
            .map((e) => e.employeeId || e.employeeCode || e.id)
        );
        allowedDocs = allDocs.filter(
          (d) =>
            d.referenceId === userEmpId ||
            deptEmpIds.has(d.referenceId) ||
            d.sharedWith?.includes(user?.department || "")
        );
      } else if (userRole === "Team Lead" || userRole === "Team Leader" || userRole === "Manager") {
        const teamEmpIds = new Set(
          allEmps
            .filter((e) => e.reportingManager === user?.name || e.reportingManagerId === userEmpId)
            .map((e) => e.employeeId || e.employeeCode || e.id)
        );
        allowedDocs = allDocs.filter(
          (d) => d.referenceId === userEmpId || teamEmpIds.has(d.referenceId)
        );
      } else {
        allowedDocs = allDocs.filter(
          (d) => d.referenceId === userEmpId || d.sharedWith?.includes(userEmpId)
        );
      }

      setDocuments(allowedDocs);
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, [userRole, userEmpId, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      const keyword = search.trim().toLowerCase();

      const matchesSearch =
        keyword === "" ||
        document.documentId.toLowerCase().includes(keyword) ||
        document.title.toLowerCase().includes(keyword) ||
        document.referenceId.toLowerCase().includes(keyword) ||
        (document.sharedWith && document.sharedWith.toLowerCase().includes(keyword)) ||
        (document.tags && document.tags.some((t) => t.toLowerCase().includes(keyword)));

      const matchesModule = selectedModule === "" || document.module === selectedModule;
      const matchesType = selectedType === "" || document.documentType === selectedType;
      const matchesStatus = selectedStatus === "" || document.status === selectedStatus;

      return matchesSearch && matchesModule && matchesType && matchesStatus;
    });
  }, [documents, search, selectedModule, selectedType, selectedStatus]);

  async function archive(doc: Document) {
    if (!doc.id || !canArchive) return;
    try {
      await archiveDocument(doc.id);
      await refresh();
    } catch {
      // Error handling without alert()
    }
  }

  async function remove(doc: Document) {
    if (!doc.id || !canDelete) return;
    try {
      await deleteDocument(doc.id);
      await refresh();
    } catch {
      // Error handling without alert()
    }
  }

  async function assign(doc: Document, newTargetId: string, newSharedWith: string) {
    if (!doc.id) return;
    try {
      await assignDocument(doc.id, newTargetId, newSharedWith);
      await refresh();
    } catch {
      // Error handling without alert()
    }
  }

  function download(doc: Document) {
    if (doc.downloadUrl) {
      window.open(doc.downloadUrl, "_blank", "noopener,noreferrer");
    }
  }

  function view(doc: Document) {
    if (doc.downloadUrl) {
      window.open(doc.downloadUrl, "_blank", "noopener,noreferrer");
    }
  }

  return {
    loading,
    documents,
    filteredDocuments,
    search,
    setSearch,
    selectedModule,
    setSelectedModule,
    selectedType,
    setSelectedType,
    selectedStatus,
    setSelectedStatus,
    refresh,
    view,
    download,
    archive,
    remove,
    assign,
    canArchive,
    canDelete,
  };
}