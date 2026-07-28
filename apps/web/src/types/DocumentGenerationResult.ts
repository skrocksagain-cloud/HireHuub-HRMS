export interface DocumentGenerationResult {
  success: boolean;
  fileName?: string;
  generatedAt?: Date;
  document?: Blob;
  error?: string;
}
