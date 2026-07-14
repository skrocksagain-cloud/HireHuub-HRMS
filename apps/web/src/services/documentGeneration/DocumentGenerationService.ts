import type { DocumentGenerationRequest } from "../../types/DocumentGenerationRequest";
import type { DocumentGenerationResult } from "../../types/DocumentGenerationResult";

export class DocumentGenerationService {
  static async generate(
    _request: DocumentGenerationRequest
  ): Promise<DocumentGenerationResult> {
    return {
      success: false,
      error: "Document generation engine is not implemented.",
    };
  }
}