/**
 * @deprecated
 * Browser-side Excel template loading is removed in Universal Document Engine v3.0.
 * All master template downloads, placeholder replacements, and document generation
 * now occur on the backend Cloud Functions (`generateDocument`).
 */
export async function fillExcelTemplate(): Promise<never> {
  throw new Error(
    'fillExcelTemplate is deprecated. Master document generation occurs exclusively on backend Cloud Functions.'
  );
}

export async function convertFilledExcelToPdf(): Promise<never> {
  throw new Error(
    'convertFilledExcelToPdf is deprecated. Master document generation occurs exclusively on backend Cloud Functions.'
  );
}
