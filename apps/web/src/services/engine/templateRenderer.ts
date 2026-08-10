import { adminService } from '../admin/adminService';
import { buildInvoicePlaceholders, buildLineItems } from './invoiceFieldMapper';
import { convertFilledExcelToPdf } from './excelTemplateLoader';
import type { InvoiceSnapshot } from '../../types/Invoice';
import type { DocumentTemplateConfig } from '../../types/Admin';

/**
 * Supported document types for the enterprise TemplateRenderer.
 * Extend this union when adding Payslip, Appointment Letter, etc.
 */
export type TemplateDocumentType =
  | 'Invoice'
  | 'CreditNote'
  | 'Payslip'
  | 'OfferLetter'
  | 'AppointmentLetter'
  | 'IncrementLetter'
  | 'RelievingLetter'
  | 'ExperienceLetter';

export interface TemplateRenderRequest<TPayload = unknown> {
  /** Document type (must match document_templates.type in Firestore). */
  documentType: TemplateDocumentType;
  /** The primary client ID — used to resolve the assigned template. */
  clientId: string;
  /** Template reference key from client.invoiceConfig.templateReference */
  templateReference?: string;
  /** Business payload used to populate the template. */
  payload: TPayload;
}

export interface TemplateRenderResult {
  blob: Blob;
  templateId: string;
  templateVersion: number;
  /** 'excel' when the uploaded XLSX was used, 'react-pdf' when fallback was used. */
  renderedWith: 'excel';
}

/**
 * Enterprise TemplateRenderer — Shared Document Generation Engine.
 *
 * Resolution order for Invoice (extensible to all document types):
 *   1. Resolve the active DocumentTemplateConfig from Firestore `document_templates`
 *      matching the client's assigned templateReference.
 *   2. If the template has a real templateFileUrl (uploaded XLSX/PDF):
 *      → Download template → fill placeholders → convert to PDF Blob.
 *   3. If no valid template exists:
 *      → Fall back to the React-PDF layout (InvoicePdf.tsx, etc.).
 *
 * No hardcoded invoice layouts are used when a real template is assigned.
 */
class TemplateRenderer {
  /**
   * Resolves the best matching DocumentTemplateConfig for a given document type
   * and client template reference.
   */
  private async resolveTemplate(
    documentType: string,
    templateReference: string
  ): Promise<DocumentTemplateConfig | null> {
    try {
      const allTemplates = await adminService.getDocumentTemplatesByType(documentType);
      if (!allTemplates.length) return null;

      // 1. Match by explicit templateId / id (exact key assigned to the client)
      const byId = allTemplates.find(
        (t) =>
          t.isActive &&
          (t.id === templateReference ||
            t.templateId === templateReference)
      );
      if (byId) return byId;

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Renders an Invoice document.
   *
   * Uses the uploaded XLSX template when one is assigned to the client.
   * Falls back to InvoicePdf.tsx React-PDF layout only when no template exists.
   */
  async renderInvoice(
    _clientId: string,
    templateReference: string,
    snapshot: InvoiceSnapshot
  ): Promise<TemplateRenderResult> {
    const templateConfig = await this.resolveTemplate('Invoice', templateReference);

    // ── Excel Template Path ──────────────────────────────────────────────────
    if (
      templateConfig?.isActive &&
      templateConfig.templateFileUrl &&
      templateConfig.templateFileUrl.startsWith('http')
    ) {
      const placeholders = buildInvoicePlaceholders(snapshot);
      const lineItems = buildLineItems(snapshot);

      const blob = await convertFilledExcelToPdf(
        templateConfig.templateFileUrl,
        placeholders,
        lineItems
      );

      return {
        blob,
        templateId: templateConfig.templateId ?? templateConfig.id,
        templateVersion: templateConfig.version ?? 1,
        renderedWith: 'excel',
      };
    }

    // ── React-PDF Fallback ───────────────────────────────────────────────────
    // Only used when no active uploaded template is found.
    throw new Error('Invoice generation requires an active Administration document template assigned to the client, with an uploaded template file.');
  }

  /**
   * Generic render entry point. Routes to the correct module renderer.
   * Extend for Payslip, AppointmentLetter, etc.
   */
  async render(request: TemplateRenderRequest): Promise<TemplateRenderResult> {
    if (!request.templateReference?.trim()) throw new Error('Document generation requires an Administration-assigned template reference.');
    const templateRef = request.templateReference;

    switch (request.documentType) {
      case 'Invoice':
        return this.renderInvoice(
          request.clientId,
          templateRef,
          request.payload as InvoiceSnapshot
        );
      default:
        throw new Error(
          `TemplateRenderer: document type '${request.documentType}' is not yet supported.`
        );
    }
  }
}

/** Singleton enterprise template renderer. */
export const templateRenderer = new TemplateRenderer();
