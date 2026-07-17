import {
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

interface SignatureBlockPdfProps {
  employerLabel?: string;
  employeeLabel?: string;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
  },
  signature: {
    width: '38%',
    borderTopWidth: 1,
    borderTopColor: '#64748B',
    paddingTop: 6,
  },
  label: {
    fontSize: 9,
    color: '#475569',
  },
});

export function SignatureBlockPdf({
  employerLabel = 'Employer Signature',
  employeeLabel = 'Employee Signature',
}: SignatureBlockPdfProps) {
  return (
    <View style={styles.container}>
      <View style={styles.signature}>
        <Text style={styles.label}>{employerLabel}</Text>
      </View>
      <View style={styles.signature}>
        <Text style={styles.label}>{employeeLabel}</Text>
      </View>
    </View>
  );
}
