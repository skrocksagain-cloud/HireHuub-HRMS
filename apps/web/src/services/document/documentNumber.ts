import { documentCenterRepository } from './repositories/documentCenterRepository';

export async function generateDocumentNumber(): Promise<{ documentId: string; sequence: number }> {
  const documentId = await documentCenterRepository.getNextDocumentNumber();
  return { documentId, sequence: 1 };
}