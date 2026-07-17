import { pdf } from '@react-pdf/renderer';
import type { DocumentProps } from '@react-pdf/renderer';
import type { ReactElement } from 'react';

export interface PdfGenerator {
  generate(document: ReactElement): Promise<Blob>;
  download(document: ReactElement, fileName: string): Promise<void>;
  print(document: ReactElement): Promise<void>;
}

export interface PdfEngine {
  generate(document: ReactElement): Promise<Blob>;
  download(pdfBlob: Blob, fileName: string): Promise<void>;
  print(pdfBlob: Blob): Promise<void>;
}

export function createPdfGenerator(engine: PdfEngine): PdfGenerator {
  return {
    generate: (document) => engine.generate(document),

    async download(document, fileName) {
      const pdfBlob = await engine.generate(document);
      await engine.download(pdfBlob, fileName);
    },

    async print(document) {
      const pdfBlob = await engine.generate(document);
      await engine.print(pdfBlob);
    },
  };
}

export const reactPdfEngine: PdfEngine = {
  async generate(document) {
    return await pdf(document as ReactElement<DocumentProps>).toBlob();
  },

  async download(pdfBlob, fileName) {
    const url = URL.createObjectURL(pdfBlob);

    try {
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName.endsWith('.pdf')
        ? fileName
        : `${fileName}.pdf`;

      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    } finally {
      URL.revokeObjectURL(url);
    }
  },

  async print(pdfBlob) {
    const url = URL.createObjectURL(pdfBlob);

    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  },
};

export const pdfService = createPdfGenerator(reactPdfEngine);

export default pdfService;
