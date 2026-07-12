import { useCallback, useEffect, useMemo, useState } from "react";

import type { Document } from "../../types/Document";

import {
  archiveDocument,
  deleteDocument,
  getDocuments,
} from "../../services/document/documentService";

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
}

export default function useDocumentTable(): UseDocumentTableReturn {
  const [loading, setLoading] = useState(true);

  const [documents, setDocuments] = useState<Document[]>([]);

  const [search, setSearch] = useState("");

  const [selectedModule, setSelectedModule] =
    useState("");

  const [selectedType, setSelectedType] =
    useState("");

  const [selectedStatus, setSelectedStatus] =
    useState("");

  const refresh = useCallback(async () => {
    try {
      setLoading(true);

      const data = await getDocuments();

      setDocuments(data);
    } catch (error) {
      console.error(error);

      alert("Unable to load documents.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const filteredDocuments = useMemo(() => {
    return documents.filter((document) => {
      const keyword = search.trim().toLowerCase();

      const matchesSearch =
        keyword === "" ||
        document.documentId
          .toLowerCase()
          .includes(keyword) ||
        document.title
          .toLowerCase()
          .includes(keyword) ||
        document.referenceId
          .toLowerCase()
          .includes(keyword);

      const matchesModule =
        selectedModule === "" ||
        document.module === selectedModule;

      const matchesType =
        selectedType === "" ||
        document.documentType === selectedType;

      const matchesStatus =
        selectedStatus === "" ||
        document.status === selectedStatus;

      return (
        matchesSearch &&
        matchesModule &&
        matchesType &&
        matchesStatus
      );
    });
  }, [
    documents,
    search,
    selectedModule,
    selectedType,
    selectedStatus,
  ]);

  async function archive(document: Document) {
    if (!document.id) {
      return;
    }

    if (
      !window.confirm(
        "Archive this document?"
      )
    ) {
      return;
    }

    try {
      await archiveDocument(document.id);

      await refresh();
    } catch (error) {
      console.error(error);

      alert("Unable to archive document.");
    }
  }

  async function remove(document: Document) {
    if (!document.id) {
      return;
    }

    if (
      !window.confirm(
        "Delete this document?"
      )
    ) {
      return;
    }

    try {
      await deleteDocument(document.id);

      await refresh();
    } catch (error) {
      console.error(error);

      alert("Unable to delete document.");
    }
  }

  function download(document: Document) {
    if (!document.downloadUrl) {
      alert("Download URL not available.");
      return;
    }

    window.open(
      document.downloadUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  function view(document: Document) {
    console.log(
      "View Document:",
      document.documentId
    );

    /**
     * Sprint 02
     * Later this will navigate
     * to the Document Profile page.
     */
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
  };
}