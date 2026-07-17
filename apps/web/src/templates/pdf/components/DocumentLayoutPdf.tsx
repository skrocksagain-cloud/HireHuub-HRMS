import {
  Document,
  Page,
  StyleSheet,
} from '@react-pdf/renderer';
import type { ReactNode } from 'react';

export type PdfPageOrientation = 'portrait' | 'landscape';

interface DocumentLayoutPdfProps {
  children: ReactNode;
  orientation?: PdfPageOrientation;
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 36,
    paddingHorizontal: 40,
    fontSize: 10,
    fontFamily: 'Helvetica',
    color: '#334155',
    lineHeight: 1.5,
  },
});

export function DocumentLayoutPdf({
  children,
  orientation = 'portrait',
}: DocumentLayoutPdfProps) {
  return (
    <Document>
      <Page size="A4" orientation={orientation} style={styles.page}>
        {children}
      </Page>
    </Document>
  );
}
