import { getFunctions, httpsCallable } from "firebase/functions";
import app from "../../firebase/firebase";


export interface AutomationDocumentRequest {
  brandId: string;
  documentType: string;
  entityId: string;
  requestId?: string;
  template?: {
    templateId: string;
    templateVersion?: string;
  };
  folderId?: string;
  data?: Record<string, unknown>;
  editableData?: Record<string, unknown>;
}

export interface AutomationDocumentResponse {
  success: boolean;
  requestId: string;
  documentId: string | null;
  documentType: string | null;
  fileName: string | null;
  fileUrl: string | null;
  driveFileId: string | null;
  version: string;
  generatedAt: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Reusable Frontend ERP Automation Service
 *
 * Communicates strictly via Firebase Cloud Functions callable endpoint `requestAutomationDocument`.
 * NO secret tokens or direct GAS Web App URLs are exposed to the client.
 */
export class AutomationService {
  /**
   * Requests document generation from the Automation Hub.
   *
   * @param request - Generic request parameters.
   * @returns Standardized Automation Hub response contract.
   */
  static async requestDocumentGeneration(
    request: AutomationDocumentRequest
  ): Promise<AutomationDocumentResponse> {
    try {
      const functions = getFunctions(app, "us-central1");
      const callable = httpsCallable<AutomationDocumentRequest, AutomationDocumentResponse>(
        functions,
        "generateNativeDocument"
      );

      const result = await callable(request);
      return result.data;
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Unknown communication error.";
      
      return {
        success: false,
        requestId: request.requestId || `req_err_${Date.now()}`,
        documentId: null,
        documentType: request.documentType,
        fileName: null,
        fileUrl: null,
        driveFileId: null,
        version: "1.0.0",
        generatedAt: new Date().toISOString(),
        error: {
          code: "CLIENT_COMMUNICATION_ERROR",
          message: errorMsg,
        },
      };
    }
  }
}
