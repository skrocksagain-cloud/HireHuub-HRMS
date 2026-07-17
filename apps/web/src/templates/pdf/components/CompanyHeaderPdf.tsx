import {
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

interface CompanyHeaderPdfProps {
  companyName: string;
  address: string;
  contactInformation: string;
  logoPlaceholder?: string;
}

const styles = StyleSheet.create({
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 12,
    marginBottom: 20,
  },
  logoPlaceholder: {
    fontSize: 8,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 4,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0F172A',
    textAlign: 'center',
  },
  companyDetail: {
    fontSize: 9,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 4,
  },
});

export function CompanyHeaderPdf({
  companyName,
  address,
  contactInformation,
  logoPlaceholder = 'Company Logo',
}: CompanyHeaderPdfProps) {
  return (
    <View style={styles.header}>
      <Text style={styles.logoPlaceholder}>{logoPlaceholder}</Text>
      <Text style={styles.companyName}>{companyName}</Text>
      <Text style={styles.companyDetail}>{address}</Text>
      <Text style={styles.companyDetail}>{contactInformation}</Text>
    </View>
  );
}
