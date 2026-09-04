import { useAdminCompany } from '../../../hooks/admin/useAdmin';
import Card from '../../../ui/Card';

export default function Company() {
  const { company, isLoading } = useAdminCompany();

  if (isLoading) return <div className="flex items-center justify-center h-96 text-gray-500">Loading company details…</div>;
  if (!company) return <div className="flex items-center justify-center h-96 text-gray-500">Company Settings have not been configured in Administration.</div>;

  return (
    <Card>
      <h2 className="text-xl font-semibold mb-2">Company Information</h2>
      <p className="text-sm text-gray-500 mb-6">Managed exclusively in Administration → Company Settings.</p>
      <dl className="grid grid-cols-2 gap-4 text-sm">
        <div><dt className="text-gray-500">Legal name</dt><dd>{company.companyName || 'Not configured'}</dd></div>
        <div><dt className="text-gray-500">GSTIN</dt><dd>{company.gstin || 'Not configured'}</dd></div>
        <div><dt className="text-gray-500">Address</dt><dd>{company.address || 'Not configured'}</dd></div>
        <div><dt className="text-gray-500">Email</dt><dd>{company.email || 'Not configured'}</dd></div>
      </dl>
    </Card>
  );
}
