import { StyleSheet, Text, View } from '@react-pdf/renderer';

import type { FinanceReportExportPayload } from '../../types/FinanceReport';
import { DocumentLayoutPdf } from './components/DocumentLayoutPdf';

interface FinanceReportPdfProps {
  report: FinanceReportExportPayload;
}

const styles = StyleSheet.create({
  header: { marginBottom: 16, borderBottomWidth: 1, borderBottomColor: '#CBD5E1', paddingBottom: 10 },
  title: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  meta: { fontSize: 9, color: '#64748B', marginTop: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#0F172A', padding: 6, marginTop: 12 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', padding: 6 },
  headerText: { color: '#FFFFFF', fontSize: 8, fontWeight: 'bold', flex: 1 },
  cellText: { fontSize: 8, color: '#334155', flex: 1 },
});

export default function FinanceReportPdf({ report }: FinanceReportPdfProps) {
  const columnWidth = `${100 / Math.max(report.columns.length, 1)}%`;

  return (
    <DocumentLayoutPdf orientation={report.columns.length > 5 ? 'landscape' : 'portrait'}>
      <View style={styles.header}>
        <Text style={styles.title}>{report.title}</Text>
        <Text style={styles.meta}>Generated: {new Date(report.generatedAt).toLocaleString('en-IN')}</Text>
      </View>

      <View style={styles.tableHeader}>
        {report.columns.map((column) => (
          <Text key={column} style={[styles.headerText, { width: columnWidth }]}>{column}</Text>
        ))}
      </View>

      {report.rows.map((row, index) => (
        <View key={`${report.reportType}-${index}`} style={styles.tableRow}>
          {row.map((cell, cellIndex) => (
            <Text key={`${index}-${cellIndex}`} style={[styles.cellText, { width: columnWidth }]}>{cell}</Text>
          ))}
        </View>
      ))}
    </DocumentLayoutPdf>
  );
}
