import { useState } from 'react';
import DashboardLayout from '../../../../layouts/DashboardLayout';
import SectionHeader from '../../../../ui/SectionHeader';
import PayrollPayoutTab from '../components/PayrollPayoutTab';
import OtsBillingTab from '../components/OtsBillingTab';
import { useAuth } from '../../../../context/AuthContext';
import { canReadFinanceGlobally } from '../../../../core/authorization/financeAuthorization';

export default function PayoutPage() {
  const [activeTab, setActiveTab] = useState<'Payroll' | 'OTS'>('Payroll');
  const { user } = useAuth();
  
  const isFinanceOrAdmin = canReadFinanceGlobally({ role: user?.authorization?.role || user?.assignedRole });

  if (!isFinanceOrAdmin) {
    return (
      <DashboardLayout>
        <div className="p-8 text-center text-rose-600 font-bold">
          You do not have permission to view this module.
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <SectionHeader 
        title="Payout & Billing" 
        subtitle="Manage Payroll bank exports and OTS billing events"
      />

      <div className="flex border-b border-slate-200 mb-6 mt-4">
        <button
          onClick={() => setActiveTab('Payroll')}
          className={`px-4 py-2 font-medium text-sm transition ${
            activeTab === 'Payroll'
              ? 'border-b-2 border-emerald-600 text-emerald-700'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Payroll Payouts
        </button>
        <button
          onClick={() => setActiveTab('OTS')}
          className={`px-4 py-2 font-medium text-sm transition ${
            activeTab === 'OTS'
              ? 'border-b-2 border-emerald-600 text-emerald-700'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          OTS Billing
        </button>
      </div>

      {activeTab === 'Payroll' ? <PayrollPayoutTab /> : <OtsBillingTab />}
    </DashboardLayout>
  );
}
