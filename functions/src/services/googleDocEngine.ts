import { getDriveService, getDocsService } from '../config/googleAuth';

export interface DocumentGenerationOptions {
  templateId: string;
  folderId: string;
  documentType: string;
  entityId: string;
  fileName: string;
  placeholders: Record<string, string>;
  yearStr?: string;
  signatureUrl?: string;
  stampUrl?: string;
  reportingManager?: string;
}

export interface DocumentGenerationResult {
  success: boolean;
  documentId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  driveFileId: string;
  generatedAt: string;
}

/**
 * Resolves or creates a year subfolder inside the target parent Drive folder.
 */
async function getOrCreateYearSubfolder(drive: ReturnType<typeof getDriveService>, parentFolderId: string, yearStr: string): Promise<string> {
  const query = `'${parentFolderId}' in parents and name = '${yearStr}' and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const response = await drive.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id!;
  }

  const folderMetadata = {
    name: yearStr,
    mimeType: 'application/vnd.google-apps.folder',
    parents: [parentFolderId],
  };

  const newFolder = await drive.files.create({
    requestBody: folderMetadata,
    fields: 'id',
  });

  return newFolder.data.id!;
}

/**
 * Core Node.js / TypeScript Document Generation Engine using direct Google Drive & Docs APIs.
 */
export class GoogleDocEngine {
  /**
   * Generates a document PDF from a master Google Doc template.
   */
  static async generateDocumentPDF(options: DocumentGenerationOptions): Promise<DocumentGenerationResult> {
    const drive = getDriveService();
    const docs = getDocsService();

    const {
      templateId,
      folderId,
      documentType,
      entityId,
      fileName,
      placeholders,
      yearStr = new Date().getFullYear().toString(),
    } = options;

    // 1. Resolve Target Year Folder inside Parent Drive Folder
    const targetFolderId = await getOrCreateYearSubfolder(drive, folderId, yearStr);

    // 2. Copy Master Google Doc Template to Target Folder
    const tempDocName = `${fileName}_TEMP_${Date.now()}`;
    const copyResponse = await drive.files.copy({
      fileId: templateId,
      requestBody: {
        name: tempDocName,
        parents: [targetFolderId],
      },
      fields: 'id',
    });

    const workingDocId = copyResponse.data.id;
    if (!workingDocId) {
      throw new Error(`Failed to copy master template ID '${templateId}'.`);
    }

    try {
      // 3. Build Batch Replacement Requests for Placeholders
      const requests: Array<object> = [];

      for (const [key, val] of Object.entries(placeholders)) {
        const token = `{{${key}}}`;
        requests.push({
          replaceAllText: {
            containsText: {
              text: token,
              matchCase: true,
            },
            replaceText: val !== undefined && val !== null ? String(val) : '',
          },
        });
      }

      // Execute batchUpdate on Google Doc
      if (requests.length > 0) {
        await docs.documents.batchUpdate({
          documentId: workingDocId,
          requestBody: {
            requests,
          },
        });
      }

      // 4. Export Working Google Doc as PDF Stream/Buffer
      const exportResponse = await drive.files.export(
        {
          fileId: workingDocId,
          mimeType: 'application/pdf',
        },
        { responseType: 'arraybuffer' }
      );

      const pdfBuffer = Buffer.from(exportResponse.data as ArrayBuffer);

      // 5. Save PDF File directly into Target Folder in Google Drive
      const pdfFileMetadata = {
        name: fileName.endsWith('.pdf') ? fileName : `${fileName}.pdf`,
        parents: [targetFolderId],
      };

      const pdfCreateResponse = await drive.files.create({
        requestBody: pdfFileMetadata,
        media: {
          mimeType: 'application/pdf',
          body: require('stream').Readable.from(pdfBuffer),
        },
        fields: 'id, name, webViewLink',
      });

      const pdfDriveFileId = pdfCreateResponse.data.id!;
      const webViewLink = pdfCreateResponse.data.webViewLink || '';

      // 6. Delete Temporary Working Google Doc Copy
      try {
        await drive.files.delete({ fileId: workingDocId });
      } catch (_delErr) {
        // Non-fatal if temporary copy deletion fails
      }

      // 7. Return Result
      const docRecordId = `doc_${entityId.replace(/[\/\\:*?"<>|]/g, '_')}_${Date.now()}`;
      return {
        success: true,
        documentId: docRecordId,
        documentType,
        fileName: pdfFileMetadata.name,
        fileUrl: webViewLink,
        driveFileId: pdfDriveFileId,
        generatedAt: new Date().toISOString(),
      };
    } catch (err: unknown) {
      // Clean up temporary doc if error occurs
      try {
        await drive.files.delete({ fileId: workingDocId });
      } catch (_trashErr) {
        // Ignore
      }
      throw err;
    }
  }
}
