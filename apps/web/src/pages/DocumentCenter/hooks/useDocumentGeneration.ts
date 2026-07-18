import { useRef, useState } from 'react';

import { pdfService } from '../../../services/document/pdfService';
import type { DocumentGenerationRequest } from '../../../types/DocumentGenerationRequest';
import type { DocumentGenerationResult } from '../../../types/DocumentGenerationResult';

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
    return 'Document reference ID is required.';
  }

  if (!request.fileName.trim()) {
    return 'File name is required.';
  }

  if (!request.generatedBy.trim()) {
    return 'Generated-by user is required.';
  }

  if (!Number.isInteger(request.version) || request.version < 1) {
    return 'Document version must be a positive integer.';
  }

  if (!request.template) {
    return 'Document template is required.';
  }

  return null;
}

export function useDocumentGeneration(): UseDocumentGenerationResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isGeneratingReference = useRef(false);

  const reset = (): void => {
    setLoading(false);
    setError(null);
  };

  const generateDocument = async (
    request: DocumentGenerationRequest,
  ): Promise<DocumentGenerationResult> => {
    if (isGeneratingReference.current) {
      const duplicateRequestError = 'Document generation is already in progress.';

      setError(duplicateRequestError);

      return {
        success: false,
        error: duplicateRequestError,
      };
    }

    const validationError = validateRequest(request);

    if (validationError) {
      setError(validationError);
      return {
        success: false,
        error: validationError,
      };
    }

    isGeneratingReference.current = true;
    setLoading(true);
    setError(null);

    try {
      await pdfService.download(request.template, request.fileName);

      return {
        success: true,
        fileName: request.fileName.endsWith('.pdf')
          ? request.fileName
          : `${request.fileName}.pdf`,
        generatedAt: new Date(),
      };
    } catch (downloadError: unknown) {
      const message = downloadError instanceof Error
        ? downloadError.message
        : 'Unable to generate the document.';

      setError(message);

      return {
        success: false,
        error: message,
      };
    } finally {
      isGeneratingReference.current = false;
      setLoading(false);
    }
  };

  return {
    loading,
    error,
    generateDocument,
    reset,
  };
}
