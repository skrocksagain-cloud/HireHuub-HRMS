import type { Offer } from '../../types/Offer';

interface OfferLetterRequiredField {
  value: string;
  message: string;
}

export const validateOfferLetter = (offer: Offer): string | null => {
  const requiredFields: OfferLetterRequiredField[] = [
    { value: offer.offerId, message: 'Offer reference ID is required.' },
    { value: offer.fullName, message: 'Candidate name is required.' },
    { value: offer.personalEmail, message: 'Candidate email is required.' },
    { value: offer.mobile, message: 'Candidate mobile number is required.' },
    { value: offer.currentAddress, message: 'Candidate address is required.' },
    { value: offer.designationName, message: 'Designation is required.' },
    { value: offer.departmentName, message: 'Department is required.' },
    { value: offer.reportingManager, message: 'Reporting manager is required.' },
    { value: offer.workLocation, message: 'Work location is required.' },
    { value: offer.joiningDate, message: 'Joining date is required.' },
    { value: offer.createdBy, message: 'Generated-by user is required.' },
  ];

  const missingField = requiredFields.find(({ value }) => !value.trim());

  if (missingField) {
    return missingField.message;
  }

  if (!Number.isInteger(offer.probationPeriod) || offer.probationPeriod < 1) {
    return 'Probation period must be a positive whole number.';
  }

  return null;
};
