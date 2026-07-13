export interface PdfGenerator<TDocument = unknown> {
  generate(document: TDocument): Promise<Blob>;
  download(document: TDocument, fileName: string): Promise<void>;
  print(document: TDocument): Promise<void>;
}

export interface PdfEngine<TDocument = unknown> {
  generate(document: TDocument): Promise<Blob>;
  download(pdf: Blob, fileName: string): Promise<void>;
  print(pdf: Blob): Promise<void>;
}

export function createPdfGenerator<TDocument>(engine: PdfEngine<TDocument>): PdfGenerator<TDocument> {
  return {
    generate: (document) => engine.generate(document),
    async download(document, fileName) {
      const pdf = await engine.generate(document);
      await engine.download(pdf, fileName);
    },
    async print(document) {
      const pdf = await engine.generate(document);
      await engine.print(pdf);
    },
  };
}

export const unsupportedPdfEngine: PdfEngine = {
  async generate() {
    throw new Error('PDF generation is not configured. Provide a PdfEngine implementation.');
  },
  async download() {
    throw new Error('PDF download is not configured. Provide a PdfEngine implementation.');
  },
  async print() {
    throw new Error('PDF printing is not configured. Provide a PdfEngine implementation.');
  },
};
