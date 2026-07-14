import { useState } from "react";

import type { DocumentGenerationRequest } from "../../../types/DocumentGenerationRequest";
import type { DocumentGenerationResult } from "../../../types/DocumentGenerationResult";
import { DocumentGenerationService } from "../../../services/documentGeneration/DocumentGenerationService";

interface UseDocumentGenerationResult {
  loading: boolean;
  error: string | null;
  generateDocument: (
    request: DocumentGenerationRequest
  ) => Promise<DocumentGenerationResult>;
}

export function useDocumentGeneration(): UseDocumentGenerationResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generateDocument(
    request: DocumentGenerationRequest
  ): Promise<DocumentGenerationResult> {
    setLoading(true);
    setError(null);

    try {
      const result = await DocumentGenerationService.generate(request);

      if (!result.success && result.error) {
        setError(result.error);
      }

      return result;
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    error,
    generateDocument,
  };
}