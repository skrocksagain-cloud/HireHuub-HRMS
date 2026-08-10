import { StyleSheet, Text, View } from '@react-pdf/renderer';
import { CompanyFooterPdf } from './components/CompanyFooterPdf';
import { CompanyHeaderPdf } from './components/CompanyHeaderPdf';
import { DocumentLayoutPdf } from './components/DocumentLayoutPdf';
import { SignatureBlockPdf } from './components/SignatureBlockPdf';

interface ExperienceLetterPdfProps {
  data: {
    fullName: string;
    designation: string;
    department: string;
    joiningDate: string;
    relievingDate: string;
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

export default function ExperienceLetterPdf({ data }: ExperienceLetterPdfProps) {
  return (
    <DocumentLayoutPdf>
      <CompanyHeaderPdf
        companyName="Hire Huub People Solution Private Limited"
        address="Corporate Office, India"
        contactInformation="+91 00000 00000 | contact@hirehuub.com | www.hirehuub.com"
      />

      <Text style={styles.title}>EXPERIENCE CERTIFICATE</Text>

      <View style={styles.section}>
        <Text style={styles.bodyText}>To Whomsoever It May Concern,</Text>
        <Text style={styles.bodyText}>
          This is to certify that {data.fullName} was associated with Hire Huub People Solution Private Limited from {data.joiningDate} to {data.relievingDate} as {data.designation} in the {data.department} department.
        </Text>
        <Text style={styles.bodyText}>
          During their tenure with us, {data.fullName} demonstrated excellent professional skills, dedication, and conduct in executing their duties.
        </Text>
      </View>

      <View style={styles.section}>
        <View style={styles.row}>
          <Text style={styles.label}>Employee Name:</Text>
          <Text style={styles.value}>{data.fullName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Designation:</Text>
          <Text style={styles.value}>{data.designation}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Tenure:</Text>
          <Text style={styles.value}>{data.joiningDate} to {data.relievingDate}</Text>
        </View>
      </View>

      <Text style={styles.bodyText}>
        We wish {data.fullName} all success and bright prospects in future career endeavors.
      </Text>

      <SignatureBlockPdf />
      <CompanyFooterPdf
        confidentialNotice="This is an official experience certificate issued by Hire Huub."
        website="www.hirehuub.com"
        copyright="Copyright Hire Huub People Solution Private Limited"
      />
    </DocumentLayoutPdf>
  );
}
