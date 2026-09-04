import { useRef, useState } from 'react';
import type { DocumentGenerationRequest } from '../../../types/DocumentGenerationRequest';
import type { DocumentGenerationResult } from '../../../types/DocumentGenerationResult';
import { DocumentGenerationService } from '../../../services/documentGeneration/DocumentGenerationService';

interface UseDocumentGenerationResult {
  loading: boolean;
  error: string | null;
  generateDocument: (
    request: DocumentGenerationRequest,
  ) => Promise<DocumentGenerationResult>;
  reset: () => void;
}

function validateRequest(request: DocumentGenerationRequest): string | null {
  if (!request.documentType.trim()) {
    return 'Document type is required.';
  }

  if (!request.referenceId.trim()) {
    return 'Reference ID is required.';
  }

  return null;
}

export function useDocumentGeneration(): UseDocumentGenerationResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setLoading(false);
    setError(null);
  };

  const generateDocument = async (
    request: DocumentGenerationRequest,
  ): Promise<DocumentGenerationResult> => {
    reset();

    const validationError = validateRequest(request);
    if (validationError) {
      setError(validationError);
      return { success: false, error: validationError };
    }

    setLoading(true);
    abortControllerRef.current = new AbortController();

    try {
      const res = await DocumentGenerationService.generate(request);
      return res;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload document error';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setLoading(false);
    }
  };

  return { loading, error, generateDocument, reset };
}
