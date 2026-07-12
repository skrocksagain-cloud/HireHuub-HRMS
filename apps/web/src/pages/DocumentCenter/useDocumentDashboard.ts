import { useCallback, useEffect, useState } from "react";

import type { Document } from "../../types/Document";

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
  const [loading, setLoading] = useState(true);

  const [totalDocuments, setTotalDocuments] = useState(0);

  const [generatedToday, setGeneratedToday] = useState(0);

  const [storageUsed, setStorageUsed] =
    useState("0 MB");

  const [totalTemplates, setTotalTemplates] =
    useState(4);

  const [recentDocuments, setRecentDocuments] =
    useState<Document[]>([]);

  const [activities, setActivities] =
    useState<DocumentActivity[]>([]);

  const [distribution, setDistribution] =
    useState<DocumentDistribution[]>([]);

  const refresh = useCallback(async () => {
    try {
      setLoading(true);

      /**
       * ======================================================
       * Sprint 02
       *
       * Temporary Mock Data
       *
       * This will be replaced by documentService.ts
       * after Firebase integration.
       * ======================================================
       */

      setTotalDocuments(148);

      setGeneratedToday(12);

      setStorageUsed("284 MB");

      setTotalTemplates(4);

      setRecentDocuments([]);

      setActivities([
        {
          id: "1",
          title: "Offer Letter Generated",
          description: "Rahul Sharma",
          time: "10 minutes ago",
        },
        {
          id: "2",
          title: "Payslip Downloaded",
          description: "June 2026",
          time: "35 minutes ago",
        },
        {
          id: "3",
          title: "Increment Letter Generated",
          description: "Neha Das",
          time: "Yesterday",
        },
      ]);

      setDistribution([
        {
          label: "Offer Letter",
          count: 42,
        },
        {
          label: "Payslip",
          count: 78,
        },
        {
          label: "Increment",
          count: 18,
        },
        {
          label: "Relieving",
          count: 10,
        },
      ]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
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