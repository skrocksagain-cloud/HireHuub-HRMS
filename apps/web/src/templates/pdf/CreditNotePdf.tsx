import { StyleSheet, Text, View } from '@react-pdf/renderer';

import type { CreditNoteSnapshot } from '../../types/CreditNote';
import { DocumentLayoutPdf } from './components/DocumentLayoutPdf';

interface CreditNotePdfProps {
  creditNote: CreditNoteSnapshot;
}

const styles = StyleSheet.create({
  header: { marginBottom: 18, borderBottomWidth: 1, borderBottomColor: '#CBD5E1', paddingBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#991B1B', textAlign: 'right' },
  companyName: { fontSize: 13, fontWeight: 'bold', color: '#0F172A' },
  text: { fontSize: 9, color: '#475569', lineHeight: 1.45 },
  section: { marginBottom: 14 },
  label: { fontSize: 9, fontWeight: 'bold', color: '#0F172A', marginBottom: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#7F1D1D', padding: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#FECACA', padding: 6 },
  tableHeaderText: { color: '#FFFFFF', fontSize: 8, fontWeight: 'bold' },
  cell: { fontSize: 8, color: '#334155' },
  description: { width: '40%' },
  quantity: { width: '12%', textAlign: 'right' },
  amount: { width: '16%', textAlign: 'right' },
  totals: { marginLeft: '55%', marginTop: 12 },
  total: { fontSize: 11, fontWeight: 'bold', color: '#7F1D1D', marginTop: 4 },
  footer: { marginTop: 24, borderTopWidth: 1, borderTopColor: '#CBD5E1', paddingTop: 10 },
});

const formatAddress = (address: CreditNoteSnapshot['originalInvoiceSnapshot']['company']['registeredAddress']): string => [address.line1, address.line2, address.city, address.state, address.postalCode, address.country].filter(Boolean).join(', ');
const formatCurrency = (value: number): string => `₹${value.toFixed(2)}`;

export default function CreditNotePdf({ creditNote }: CreditNotePdfProps) {
  const invoice = creditNote.originalInvoiceSnapshot;

  return (
    <DocumentLayoutPdf>
      <View style={styles.header}>
        <Text style={styles.companyName}>{invoice.company.legalName}</Text>
        <Text style={styles.text}>{formatAddress(invoice.company.registeredAddress)}</Text>
        <Text style={styles.text}>GSTIN: {invoice.company.gstin} | PAN: {invoice.company.pan}</Text>
        <Text style={styles.title}>CREDIT NOTE</Text>
        <Text style={styles.text}>Credit Note No: {creditNote.creditNoteNumber} | Date: {creditNote.creditDate}</Text>
        <Text style={styles.text}>Original Invoice: {creditNote.originalInvoiceNumber}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Credit To</Text>
        <Text style={styles.text}>{invoice.client.clientName}</Text>
        <Text style={styles.text}>{formatAddress(invoice.client.billingAddress)}</Text>
        <Text style={styles.text}>Reason: {creditNote.reason}</Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, styles.description]}>Description</Text>
        <Text style={[styles.tableHeaderText, styles.quantity]}>Qty</Text>
        <Text style={[styles.tableHeaderText, styles.amount]}>Taxable</Text>
        <Text style={[styles.tableHeaderText, styles.amount]}>GST</Text>
        <Text style={[styles.tableHeaderText, styles.amount]}>Credit</Text>
      </View>
      {creditNote.lineItems.map((item) => (
        <View key={item.invoiceLineIndex} style={styles.tableRow}>
          <Text style={[styles.cell, styles.description]}>{item.description}</Text>
          <Text style={[styles.cell, styles.quantity]}>{item.creditedQuantity}</Text>
          <Text style={[styles.cell, styles.amount]}>{formatCurrency(item.taxableAmount)}</Text>
          <Text style={[styles.cell, styles.amount]}>{formatCurrency(item.gstAmount)}</Text>
          <Text style={[styles.cell, styles.amount]}>{formatCurrency(item.totalAmount)}</Text>
        </View>
      ))}

      <View style={styles.totals}>
        <View style={styles.row}><Text style={styles.text}>Taxable Amount</Text><Text style={styles.text}>{formatCurrency(creditNote.taxableAmount)}</Text></View>
        {creditNote.gst.type === 'CGST_SGST' ? <><View style={styles.row}><Text style={styles.text}>CGST</Text><Text style={styles.text}>{formatCurrency(creditNote.gst.cgstAmount)}</Text></View><View style={styles.row}><Text style={styles.text}>SGST</Text><Text style={styles.text}>{formatCurrency(creditNote.gst.sgstAmount)}</Text></View></> : <View style={styles.row}><Text style={styles.text}>IGST</Text><Text style={styles.text}>{formatCurrency(creditNote.gst.igstAmount)}</Text></View>}
        <View style={styles.row}><Text style={styles.total}>Credit Total</Text><Text style={styles.total}>{formatCurrency(creditNote.grandTotal)}</Text></View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.text}>This credit note references the original invoice and does not alter it.</Text>
        <Text style={styles.text}>Authorized Signatory: {invoice.company.authorizedSignatory}</Text>
      </View>
    </DocumentLayoutPdf>
  );
}
