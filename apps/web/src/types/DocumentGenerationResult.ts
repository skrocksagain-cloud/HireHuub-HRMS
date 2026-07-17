export interface DocumentGenerationResult {
  success: boolean;
  fileName?: string;
  generatedAt?: Date;
  error?: string;
}