import { StyleSheet, Text, View } from '@react-pdf/renderer';

import type { InvoiceSnapshot } from '../../types/Invoice';
import { DocumentLayoutPdf } from './components/DocumentLayoutPdf';

interface InvoicePdfProps {
  invoice: InvoiceSnapshot;
}

const styles = StyleSheet.create({
  header: { marginBottom: 18, borderBottomWidth: 1, borderBottomColor: '#CBD5E1', paddingBottom: 10 },
  title: { fontSize: 18, fontWeight: 'bold', color: '#0F172A', textAlign: 'right' },
  companyName: { fontSize: 13, fontWeight: 'bold', color: '#0F172A' },
  text: { fontSize: 9, color: '#475569', lineHeight: 1.45 },
  section: { marginBottom: 14 },
  label: { fontSize: 9, fontWeight: 'bold', color: '#0F172A', marginBottom: 3 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#0F172A', padding: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#E2E8F0', padding: 6 },
  tableHeaderText: { color: '#FFFFFF', fontSize: 8, fontWeight: 'bold' },
  cell: { fontSize: 8, color: '#334155' },
  description: { width: '40%' },
  quantity: { width: '12%', textAlign: 'right' },
  amount: { width: '16%', textAlign: 'right' },
  totals: { marginLeft: '55%', marginTop: 12 },
  total: { fontSize: 11, fontWeight: 'bold', color: '#0F172A', marginTop: 4 },
  footer: { marginTop: 24, borderTopWidth: 1, borderTopColor: '#CBD5E1', paddingTop: 10 },
});

const formatAddress = (address: InvoiceSnapshot['company']['registeredAddress']): string => [address.line1, address.line2, address.city, address.state, address.postalCode, address.country].filter(Boolean).join(', ');
const formatCurrency = (value: number): string => `₹${value.toFixed(2)}`;

export default function InvoicePdf({ invoice }: InvoicePdfProps) {
  const clientAddress = formatAddress(invoice.client.billingAddress);
  const companyAddress = formatAddress(invoice.company.registeredAddress);

  return (
    <DocumentLayoutPdf>
      <View style={styles.header}>
        <Text style={styles.companyName}>{invoice.company.legalName}</Text>
        <Text style={styles.text}>{companyAddress}</Text>
        <Text style={styles.text}>GSTIN: {invoice.company.gstin} | PAN: {invoice.company.pan}</Text>
        <Text style={styles.title}>TAX INVOICE</Text>
        <Text style={styles.text}>Invoice No: {invoice.invoiceNumber} | Date: {invoice.invoiceDate}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Bill To</Text>
        <Text style={styles.text}>{invoice.client.clientName}</Text>
        <Text style={styles.text}>{clientAddress}</Text>
        <Text style={styles.text}>GSTIN: {invoice.client.gstin || 'Unregistered'} | State: {invoice.client.billingState}</Text>
      </View>

      <View style={styles.tableHeader}>
        <Text style={[styles.tableHeaderText, styles.description]}>Description</Text>
        <Text style={[styles.tableHeaderText, styles.quantity]}>Qty</Text>
        <Text style={[styles.tableHeaderText, styles.amount]}>Taxable</Text>
        <Text style={[styles.tableHeaderText, styles.amount]}>GST</Text>
        <Text style={[styles.tableHeaderText, styles.amount]}>Total</Text>
      </View>
      {invoice.lineItems.map((item, index) => (
        <View key={`${item.description}-${index}`} style={styles.tableRow}>
          <Text style={[styles.cell, styles.description]}>{item.description}</Text>
          <Text style={[styles.cell, styles.quantity]}>{item.quantity}</Text>
          <Text style={[styles.cell, styles.amount]}>{formatCurrency(item.taxableAmount)}</Text>
          <Text style={[styles.cell, styles.amount]}>{formatCurrency(item.gstAmount)}</Text>
          <Text style={[styles.cell, styles.amount]}>{formatCurrency(item.totalAmount)}</Text>
        </View>
      ))}

      <View style={styles.totals}>
        <View style={styles.row}><Text style={styles.text}>Taxable Amount</Text><Text style={styles.text}>{formatCurrency(invoice.taxableAmount)}</Text></View>
        {invoice.gst.type === 'CGST_SGST' ? <><View style={styles.row}><Text style={styles.text}>CGST</Text><Text style={styles.text}>{formatCurrency(invoice.gst.cgstAmount)}</Text></View><View style={styles.row}><Text style={styles.text}>SGST</Text><Text style={styles.text}>{formatCurrency(invoice.gst.sgstAmount)}</Text></View></> : <View style={styles.row}><Text style={styles.text}>IGST</Text><Text style={styles.text}>{formatCurrency(invoice.gst.igstAmount)}</Text></View>}
        <View style={styles.row}><Text style={styles.total}>Grand Total</Text><Text style={styles.total}>{formatCurrency(invoice.grandTotal)}</Text></View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.label}>Bank Details</Text>
        <Text style={styles.text}>{invoice.company.bankDetails.accountHolderName} | {invoice.company.bankDetails.bankName}</Text>
        <Text style={styles.text}>A/C: {invoice.company.bankDetails.accountNumber} | IFSC: {invoice.company.bankDetails.ifscCode}</Text>
        <Text style={styles.text}>Authorized Signatory: {invoice.company.authorizedSignatory}</Text>
      </View>
    </DocumentLayoutPdf>
  );
}
