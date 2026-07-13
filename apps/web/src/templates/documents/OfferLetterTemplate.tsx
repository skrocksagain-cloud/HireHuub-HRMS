import type { Offer } from '../../types/Offer';
import { OFFER_TERMS } from '../../core/constants/offerTerms';
import CompanyFooter from '../components/CompanyFooter';
import CompanyHeader from '../components/CompanyHeader';
import DocumentLayout from '../components/DocumentLayout';
import SignatureBlock from '../components/SignatureBlock';

interface OfferLetterTemplateProps {
  offer: Offer;
}

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

// TODO: Replace with designation-specific responsibilities when the shared constant is available.
const DEFAULT_RESPONSIBILITIES = [
  'Perform the responsibilities assigned to the role with diligence and accountability.',
  'Maintain accurate, timely, and professional communication with all stakeholders.',
  'Meet agreed performance, quality, and compliance expectations.',
  'Collaborate with the reporting manager and team to achieve organisational objectives.',
];

const formatCurrency = (amount: number) => currencyFormatter.format(amount);

export default function OfferLetterTemplate({ offer }: OfferLetterTemplateProps) {
  const salaryRows = [
    ['Basic', offer.basicSalary],
    ['HRA', offer.hra],
    ['Conveyance', offer.conveyanceAllowance],
    ['Mobile', offer.mobileAllowance],
    ['Special Allowance', offer.specialAllowance],
    ['Monthly Gross', offer.monthlyGrossSalary],
    ['Professional Tax', offer.professionalTax],
    ['Net Take Home', offer.netTakeHome],
  ] as const;

  return (
    <DocumentLayout>
      <CompanyHeader />

      <article className="space-y-8 pt-8 text-sm leading-6 text-slate-700 print:space-y-6 print:pt-6 print:text-xs print:leading-5">
        <section className="text-center">
          <h2 className="text-xl font-semibold uppercase tracking-[0.18em] text-slate-950 print:text-lg">
            Offer Letter
          </h2>
        </section>

        <section className="grid gap-x-8 gap-y-2 border-y border-slate-200 py-4 sm:grid-cols-3">
          <p>
            <span className="font-semibold text-slate-900">Offer Number: </span>
            {offer.offerId}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Offer Date: </span>
            {offer.offerDate}
          </p>
          <p>
            <span className="font-semibold text-slate-900">Valid Till: </span>
            {offer.validTill}
          </p>
        </section>

        <section>
          <h3 className="mb-3 border-b border-slate-300 pb-1 text-base font-semibold text-slate-950 print:text-sm">
            Candidate Information
          </h3>
          <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
            <p>
              <span className="font-semibold text-slate-900">Name: </span>
              {offer.fullName}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Email: </span>
              {offer.personalEmail}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Mobile: </span>
              {offer.mobile}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Address: </span>
              {offer.currentAddress}
            </p>
          </div>
        </section>

        <section>
          <h3 className="mb-3 border-b border-slate-300 pb-1 text-base font-semibold text-slate-950 print:text-sm">
            Introduction
          </h3>
          <p>
            Dear {offer.firstName}, we are pleased to offer you the position of{' '}
            <span className="font-semibold text-slate-900">{offer.designationName}</span> at
            Hire Huub People Solution Private Limited. This offer is subject to the terms and
            conditions set out in this letter.
          </p>
        </section>

        <section>
          <h3 className="mb-3 border-b border-slate-300 pb-1 text-base font-semibold text-slate-950 print:text-sm">
            Employment Details
          </h3>
          <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
            <p>
              <span className="font-semibold text-slate-900">Designation: </span>
              {offer.designationName}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Department: </span>
              {offer.departmentName}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Employment Type: </span>
              {offer.employmentType}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Reporting Manager: </span>
              {offer.reportingManager}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Work Location: </span>
              {offer.workLocation}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Joining Date: </span>
              {offer.joiningDate}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Probation: </span>
              {offer.probationPeriod} days
            </p>
          </div>
        </section>

        <section>
          <h3 className="mb-3 border-b border-slate-300 pb-1 text-base font-semibold text-slate-950 print:text-sm">
            Compensation Summary
          </h3>
          <div className="grid gap-x-8 gap-y-2 sm:grid-cols-2">
            <p>
              <span className="font-semibold text-slate-900">Monthly Gross Salary: </span>
              {formatCurrency(offer.monthlyGrossSalary)}
            </p>
            <p>
              <span className="font-semibold text-slate-900">Annual CTC: </span>
              {formatCurrency(offer.annualCTC)}
            </p>
          </div>
        </section>

        <section>
          <h3 className="mb-3 border-b border-slate-300 pb-1 text-base font-semibold text-slate-950 print:text-sm">
            Roles &amp; Responsibilities
          </h3>
          <ol className="list-decimal space-y-1 pl-5">
            {DEFAULT_RESPONSIBILITIES.map((responsibility) => (
              <li key={responsibility}>{responsibility}</li>
            ))}
          </ol>
        </section>

        <section>
          <h3 className="mb-3 border-b border-slate-300 pb-1 text-base font-semibold text-slate-950 print:text-sm">
            Terms &amp; Conditions
          </h3>
          <ol className="list-decimal space-y-2 pl-5">
            {OFFER_TERMS.map((term) => (
              <li key={term.id}>
                <span className="font-semibold text-slate-900">{term.title}: </span>
                {term.description}
              </li>
            ))}
          </ol>
        </section>

        <section>
          <h3 className="mb-3 border-b border-slate-300 pb-1 text-base font-semibold text-slate-950 print:text-sm">
            Acceptance
          </h3>
          <p>
            Please sign and return a copy of this letter as your acceptance of this offer and its
            terms. We look forward to welcoming you to the organisation.
          </p>
        </section>

        <section>
          <h3 className="mb-3 border-b border-slate-300 pb-1 text-base font-semibold text-slate-950 print:text-sm">
            Salary Annexure
          </h3>
          <div className="overflow-hidden border border-slate-300">
            <table className="w-full border-collapse text-left">
              <thead className="bg-slate-100 text-slate-900">
                <tr>
                  <th className="px-3 py-2 font-semibold">Component</th>
                  <th className="px-3 py-2 text-right font-semibold">Monthly</th>
                  <th className="px-3 py-2 text-right font-semibold">Annual</th>
                </tr>
              </thead>
              <tbody>
                {salaryRows.map(([label, monthlyAmount]) => (
                  <tr key={label} className="border-t border-slate-200">
                    <td className="px-3 py-2 font-medium text-slate-800">{label}</td>
                    <td className="px-3 py-2 text-right">{formatCurrency(monthlyAmount)}</td>
                    <td className="px-3 py-2 text-right">
                      {formatCurrency(monthlyAmount * 12)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section>
          <h3 className="mb-3 border-b border-slate-300 pb-1 text-base font-semibold text-slate-950 print:text-sm">
            Important Notes
          </h3>
          <ul className="list-disc space-y-1 pl-5">
            <li>TDS is applicable as per the Income Tax Act.</li>
            <li>Salary structure and compensation information are confidential.</li>
            <li>Future revisions will be governed by Company policy.</li>
            <li>This Offer Letter supersedes previous discussions.</li>
          </ul>
        </section>

        <SignatureBlock />

        <section className="border-y border-slate-200 py-3 text-xs text-slate-500 print:text-[10px]">
          <p>
            <span className="font-semibold text-slate-700">Offer ID: </span>
            {offer.id ?? offer.offerId}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Version: </span>
            1.0
          </p>
          <p>
            <span className="font-semibold text-slate-700">Generated By: </span>
            {offer.createdBy}
          </p>
          <p>
            <span className="font-semibold text-slate-700">Generated On: </span>
            {offer.offerDate}
          </p>
        </section>
      </article>

      <CompanyFooter />
    </DocumentLayout>
  );
}
