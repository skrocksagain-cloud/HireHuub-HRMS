import { useState } from "react";

import type { DocumentGenerationRequest } from "../../../types/DocumentGenerationRequest";
import type { DocumentGenerationResult } from "../../../types/DocumentGenerationResult";

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
    _request: DocumentGenerationRequest
  ): Promise<DocumentGenerationResult> {
    setLoading(true);
    setError(null);

    const message = "Document generation service is not implemented.";

    setError(message);

    setLoading(false);

    return {
      success: false,
      error: message,
    };
  }

  return {
    loading,
    error,
    generateDocument,
  };
}