import {
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

interface CompanyFooterPdfProps {
  confidentialNotice: string;
  website: string;
  copyright: string;
}

const styles = StyleSheet.create({
  footer: {
    borderTopWidth: 1,
    borderTopColor: '#CBD5E1',
    paddingTop: 8,
    marginTop: 20,
  },
  text: {
    fontSize: 8,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 2,
  },
});

export function CompanyFooterPdf({
  confidentialNotice,
  website,
  copyright,
}: CompanyFooterPdfProps) {
  return (
    <View style={styles.footer}>
      <Text style={styles.text}>{confidentialNotice}</Text>
      <Text style={styles.text}>{website}</Text>
      <Text style={styles.text}>{copyright}</Text>
    </View>
  );
}
