import type { DocumentGenerationRequest } from "../../types/DocumentGenerationRequest";
import type { DocumentGenerationResult } from "../../types/DocumentGenerationResult";
import { pdfService } from '../document/pdfService';

export class DocumentGenerationService {
  static async generate(
    request: DocumentGenerationRequest
  ): Promise<DocumentGenerationResult> {
    try {
      const document = await pdfService.generate(request.template);
      return { success: true, fileName: request.fileName, generatedAt: new Date(), document };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Unable to generate document.' };
    }
  }
}
