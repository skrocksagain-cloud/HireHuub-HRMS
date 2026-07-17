import {
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';

import type { Offer } from '../../types/Offer';
import { CompanyFooterPdf } from './components/CompanyFooterPdf';
import { CompanyHeaderPdf } from './components/CompanyHeaderPdf';
import { DocumentLayoutPdf } from './components/DocumentLayoutPdf';
import { SignatureBlockPdf } from './components/SignatureBlockPdf';

interface OfferLetterPdfProps {
  offer: Offer;
}

interface OfferDetailRowProps {
  label: string;
  value: string;
}

const styles = StyleSheet.create({
  title: {
    marginTop: 16,
    marginBottom: 20,
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#0F172A',
    letterSpacing: 1,
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0F172A',
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
    paddingBottom: 4,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 5,
  },
  label: {
    width: 140,
    fontWeight: 'bold',
    color: '#0F172A',
  },
  value: {
    flex: 1,
    color: '#475569',
  },
});

function OfferDetailRow({ label, value }: OfferDetailRowProps) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

export default function OfferLetterPdf({ offer }: OfferLetterPdfProps) {
  return (
    <DocumentLayoutPdf>
      <CompanyHeaderPdf
        companyName="Hire Huub People Solution Private Limited"
        address="Corporate Office, India"
        contactInformation="+91 00000 00000 | contact@hirehuub.com | www.hirehuub.com"
      />

      <Text style={styles.title}>OFFER LETTER</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Candidate Information</Text>
        <OfferDetailRow label="Name" value={offer.fullName} />
        <OfferDetailRow label="Email" value={offer.personalEmail} />
        <OfferDetailRow label="Mobile" value={offer.mobile} />
        <OfferDetailRow label="Address" value={offer.currentAddress} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Employment Details</Text>
        <OfferDetailRow label="Designation" value={offer.designationName} />
        <OfferDetailRow label="Department" value={offer.departmentName} />
        <OfferDetailRow label="Employment Type" value={offer.employmentType} />
        <OfferDetailRow label="Reporting Manager" value={offer.reportingManager} />
        <OfferDetailRow label="Work Location" value={offer.workLocation} />
        <OfferDetailRow label="Joining Date" value={offer.joiningDate} />
        <OfferDetailRow
          label="Probation"
          value={`${offer.probationPeriod} Days`}
        />
      </View>

      <SignatureBlockPdf />
      <CompanyFooterPdf
        confidentialNotice="This document contains confidential information."
        website="www.hirehuub.com"
        copyright="Copyright Hire Huub People Solution Private Limited"
      />
    </DocumentLayoutPdf>
  );
}
