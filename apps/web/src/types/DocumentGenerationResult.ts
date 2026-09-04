export interface DocumentGenerationResult {
  success: boolean;
  fileName?: string;
  generatedAt?: Date;
  document?: Blob;
  downloadUrl?: string;
  storagePath?: string;
  error?: string;
}
