import { StyleSheet, Text, View } from '@react-pdf/renderer';
import { CompanyFooterPdf } from './components/CompanyFooterPdf';
import { CompanyHeaderPdf } from './components/CompanyHeaderPdf';
import { DocumentLayoutPdf } from './components/DocumentLayoutPdf';
import { SignatureBlockPdf } from './components/SignatureBlockPdf';

interface IncrementLetterPdfProps {
  data: {
    fullName: string;
    designation: string;
    effectiveDate: string;
    previousCtc: string;
    revisedCtc: string;
  };
}

const styles = StyleSheet.create({
  title: {
    marginTop: 14,
    marginBottom: 16,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0F172A',
    letterSpacing: 1,
  },
  section: {
    marginBottom: 14,
  },
  bodyText: {
    fontSize: 9,
    color: '#334155',
    lineHeight: 1.4,
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  label: {
    width: 140,
    fontWeight: 'bold',
    fontSize: 9,
    color: '#0F172A',
  },
  value: {
    flex: 1,
    fontSize: 9,
    color: '#475569',
  },
});

export default function IncrementLetterPdf({ data }: IncrementLetterPdfProps) {
  return (
    <DocumentLayoutPdf>
      <CompanyHeaderPdf
        companyName="Hire Huub People Solution Private Limited"
        address="Corporate Office, India"
        contactInformation="+91 00000 00000 | contact@hirehuub.com | www.hirehuub.com"
      />

      <Text style={styles.title}>COMPENSATION REVISION LETTER</Text>

      <View style={styles.section}>
        <Text style={styles.bodyText}>Dear {data.fullName},</Text>
        <Text style={styles.bodyText}>
          Consequent to your performance review, management is pleased to revise your annual compensation effective from {data.effectiveDate}.
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Designation:</Text>
          <Text style={styles.value}>{data.designation}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Effective Date:</Text>
          <Text style={styles.value}>{data.effectiveDate}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Previous Annual CTC:</Text>
          <Text style={styles.value}>{data.previousCtc}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Revised Annual CTC:</Text>
          <Text style={styles.value}>{data.revisedCtc}</Text>
        </View>
      </View>

      <Text style={styles.bodyText}>
        We appreciate your contributions and look forward to your continued success with Hire Huub.
      </Text>

      <SignatureBlockPdf />
      <CompanyFooterPdf
        confidentialNotice="This document contains confidential compensation information."
        website="www.hirehuub.com"
        copyright="Copyright Hire Huub People Solution Private Limited"
      />
    </DocumentLayoutPdf>
  );
}
