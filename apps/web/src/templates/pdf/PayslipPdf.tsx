import { StyleSheet, Text, View } from '@react-pdf/renderer';
import { CompanyFooterPdf } from './components/CompanyFooterPdf';
import { CompanyHeaderPdf } from './components/CompanyHeaderPdf';
import { DocumentLayoutPdf } from './components/DocumentLayoutPdf';
import { SignatureBlockPdf } from './components/SignatureBlockPdf';

interface PayslipPdfProps {
  data: {
    employeeName: string;
    employeeId: string;
    designation: string;
    department: string;
    payPeriod: string;
    basicPay: string;
    hra: string;
    specialAllowance: string;
    grossSalary: string;
    pfDeduction: string;
    taxDeduction: string;
    totalDeductions: string;
    netPay: string;
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
  sectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 3,
    marginBottom: 6,
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
  gridTwoCol: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  col: {
    flex: 1,
  },
  totalBox: {
    marginTop: 10,
    padding: 8,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 4,
    flexDirection: 'row',
    justify: 'space-between',
    alignItems: 'center',
  },
  totalText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#0F172A',
  },
});

export default function PayslipPdf({ data }: PayslipPdfProps) {
  return (
    <DocumentLayoutPdf>
      <CompanyHeaderPdf
        companyName="Hire Huub People Solution Private Limited"
        address="Corporate Office, India"
        contactInformation="+91 00000 00000 | contact@hirehuub.com | www.hirehuub.com"
      />

      <Text style={styles.title}>SALARY PAYSLIP — {data.payPeriod}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Employee Information</Text>
        <View style={styles.row}>
          <Text style={styles.label}>Employee Name:</Text>
          <Text style={styles.value}>{data.employeeName}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Employee ID:</Text>
          <Text style={styles.value}>{data.employeeId}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Designation:</Text>
          <Text style={styles.value}>{data.designation}</Text>
        </View>
        <View style={styles.row}>
          <Text style={styles.label}>Department:</Text>
          <Text style={styles.value}>{data.department}</Text>
        </View>
      </View>

      <View style={styles.gridTwoCol}>
        <View style={styles.col}>
          <Text style={styles.sectionTitle}>Earnings</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Basic Pay:</Text>
            <Text style={styles.value}>{data.basicPay}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>HRA:</Text>
            <Text style={styles.value}>{data.hra}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Special Allowance:</Text>
            <Text style={styles.value}>{data.specialAllowance}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Gross Earnings:</Text>
            <Text style={styles.value}>{data.grossSalary}</Text>
          </View>
        </View>

        <View style={styles.col}>
          <Text style={styles.sectionTitle}>Deductions</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Provident Fund:</Text>
            <Text style={styles.value}>{data.pfDeduction}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Professional Tax:</Text>
            <Text style={styles.value}>{data.taxDeduction}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Total Deductions:</Text>
            <Text style={styles.value}>{data.totalDeductions}</Text>
          </View>
        </View>
      </View>

      <View style={styles.totalBox}>
        <Text style={styles.totalText}>NET SALARY PAYABLE:</Text>
        <Text style={styles.totalText}>{data.netPay}</Text>
      </View>

      <SignatureBlockPdf />
      <CompanyFooterPdf
        confidentialNotice="This is a system generated payslip and requires no physical signature."
        website="www.hirehuub.com"
        copyright="Copyright Hire Huub People Solution Private Limited"
      />
    </DocumentLayoutPdf>
  );
}
