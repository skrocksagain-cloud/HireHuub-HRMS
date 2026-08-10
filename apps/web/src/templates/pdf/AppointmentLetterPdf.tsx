import { StyleSheet, Text, View } from '@react-pdf/renderer';
import { CompanyFooterPdf } from './components/CompanyFooterPdf';
import { CompanyHeaderPdf } from './components/CompanyHeaderPdf';
import { DocumentLayoutPdf } from './components/DocumentLayoutPdf';
import { SignatureBlockPdf } from './components/SignatureBlockPdf';

interface AppointmentLetterPdfProps {
  data: {
    fullName: string;
    designation: string;
    department: string;
    joiningDate: string;
    ctc: string;
    workLocation: string;
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

export default function AppointmentLetterPdf({ data }: AppointmentLetterPdfProps) {
  return (
    <DocumentLayoutPdf>
      <CompanyHeaderPdf
        companyName="Hire Huub People Solution Private Limited"
        address="Corporate Office, India"
        contactInformation="+91 00000 00000 | contact@hirehuub.com | www.hirehuub.com"
      />

      <Text style={styles.title}>LETTER OF APPOINTMENT</Text>

      <View style={styles.section}>
        <Text style={styles.bodyText}>Dear {data.fullName},</Text>
        <Text style={styles.bodyText}>
          We are pleased to appoint you as {data.designation} in the {data.department} department at Hire Huub People Solution Private Limited with effect from {data.joiningDate}.
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Designation:</Text>
          <Text style={styles.value}>{data.designation}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Department:</Text>
          <Text style={styles.value}>{data.department}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Date of Joining:</Text>
          <Text style={styles.value}>{data.joiningDate}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Work Location:</Text>
          <Text style={styles.value}>{data.workLocation}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Annual CTC:</Text>
          <Text style={styles.value}>{data.ctc}</Text>
        </View>
      </View>

      <Text style={styles.bodyText}>
        We welcome you to Hire Huub and wish you a successful career ahead.
      </Text>

      <SignatureBlockPdf />
      <CompanyFooterPdf
        confidentialNotice="This document contains confidential appointment information."
        website="www.hirehuub.com"
        copyright="Copyright Hire Huub People Solution Private Limited"
      />
    </DocumentLayoutPdf>
  );
}
