import { useState, useEffect } from 'react';
import Drawer from '../../../ui/Drawer';
import { employeeService } from '../../Employee/services/employeeService';
import type { Employee } from '../../Employee/types/Employee';
import documentEngine, { type DocumentResult } from '../../../core/engine/documentEngine';
import { useAuth } from '../../../context/AuthContext';

interface DocumentDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (result: DocumentResult) => void;
}

export function PayslipDrawer({ isOpen, onClose, onSuccess }: DocumentDrawerProps) {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [payPeriod, setPayPeriod] = useState<string>('August 2026');
  const [basicPay, setBasicPay] = useState<string>('40,000');
  const [hra, setHra] = useState<string>('16,000');
  const [specialAllowance, setSpecialAllowance] = useState<string>('16,000');
  const [grossSalary, setGrossSalary] = useState<string>('72,000');
  const [netPay, setNetPay] = useState<string>('70,000');
  const [generating, setGenerating] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      employeeService.getEmployees().then(setEmployees).catch(() => setEmployees([]));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const selectedEmp = employees.find(e => e.id === selectedEmpId);
      const res = await documentEngine.generate({
        module: 'Payroll',
        type: 'Payslip',
        identifier: `PAY-${Date.now()}`,
        employeeId: selectedEmpId || 'EMP-001',
        generatedBy: user?.id || 'usr-admin',
        generatedByName: user?.name || 'HR Admin',
        customPlaceholders: {
          employee_name: selectedEmp?.fullName || 'Employee Name',
          payPeriod,
          basicPay,
          hra,
          specialAllowance,
          grossSalary,
          netPay,
        },
      });

      if (res.downloadUrl) {
        const a = document.createElement('a');
        a.href = res.downloadUrl;
        a.download = res.fileName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      onSuccess(res);
      onClose();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Generate Employee Payslip" subtitle="HR & Payroll Single Document Engine">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Select Employee *</label>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            required
          >
            <option value="">-- Choose Active Employee --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeId || emp.id})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Pay Period *</label>
          <input
            type="text"
            value={payPeriod}
            onChange={(e) => setPayPeriod(e.target.value)}
            placeholder="August 2026"
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Basic Pay (₹)</label>
            <input
              type="text"
              value={basicPay}
              onChange={(e) => setBasicPay(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">HRA (₹)</label>
            <input
              type="text"
              value={hra}
              onChange={(e) => setHra(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Special Allowance (₹)</label>
            <input
              type="text"
              value={specialAllowance}
              onChange={(e) => setSpecialAllowance(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Gross Salary (₹)</label>
            <input
              type="text"
              value={grossSalary}
              onChange={(e) => setGrossSalary(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Net Payable (₹)</label>
          <input
            type="text"
            value={netPay}
            onChange={(e) => setNetPay(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
          />
        </div>

        <button
          type="submit"
          disabled={generating}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition shadow-xs text-xs disabled:opacity-50"
        >
          {generating ? 'Generating Payslip PDF…' : 'Generate & Download Payslip PDF'}
        </button>
      </form>
    </Drawer>
  );
}

export function IncrementLetterDrawer({ isOpen, onClose, onSuccess }: DocumentDrawerProps) {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [previousCtc, setPreviousCtc] = useState<string>('6,00,000 LPA');
  const [revisedCtc, setRevisedCtc] = useState<string>('7,50,000 LPA');
  const [generating, setGenerating] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      employeeService.getEmployees().then(setEmployees).catch(() => setEmployees([]));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const selectedEmp = employees.find(e => e.id === selectedEmpId);
      const res = await documentEngine.generate({
        module: 'HR',
        type: 'Increment Letter',
        identifier: `INC-${Date.now()}`,
        employeeId: selectedEmpId || 'EMP-001',
        generatedBy: user?.id || 'usr-admin',
        generatedByName: user?.name || 'HR Admin',
        customPlaceholders: {
          employee_name: selectedEmp?.fullName || 'Employee Name',
          effectiveDate,
          previousCtc,
          revisedCtc,
        },
      });

      if (res.downloadUrl) {
        const a = document.createElement('a');
        a.href = res.downloadUrl;
        a.download = res.fileName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      onSuccess(res);
      onClose();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Generate Increment Letter" subtitle="Compensation Revision Engine">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Select Employee *</label>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            required
          >
            <option value="">-- Choose Employee --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeId || emp.id})</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-slate-700 mb-1">Effective Date *</label>
          <input
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Previous CTC</label>
            <input
              type="text"
              value={previousCtc}
              onChange={(e) => setPreviousCtc(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Revised CTC</label>
            <input
              type="text"
              value={revisedCtc}
              onChange={(e) => setRevisedCtc(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={generating}
          className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition shadow-xs text-xs disabled:opacity-50"
        >
          {generating ? 'Generating Increment Letter…' : 'Generate & Download Increment Letter PDF'}
        </button>
      </form>
    </Drawer>
  );
}

export function RelievingLetterDrawer({ isOpen, onClose, onSuccess }: DocumentDrawerProps) {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [joiningDate, setJoiningDate] = useState<string>('2024-01-15');
  const [relievingDate, setRelievingDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [generating, setGenerating] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      employeeService.getEmployees().then(setEmployees).catch(() => setEmployees([]));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const selectedEmp = employees.find(e => e.id === selectedEmpId);
      const res = await documentEngine.generate({
        module: 'HR',
        type: 'Relieving Letter',
        identifier: `REL-${Date.now()}`,
        employeeId: selectedEmpId || 'EMP-001',
        generatedBy: user?.id || 'usr-admin',
        generatedByName: user?.name || 'HR Admin',
        customPlaceholders: {
          employee_name: selectedEmp?.fullName || 'Employee Name',
          joiningDate,
          relievingDate,
        },
      });

      if (res.downloadUrl) {
        const a = document.createElement('a');
        a.href = res.downloadUrl;
        a.download = res.fileName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      onSuccess(res);
      onClose();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Generate Relieving Letter" subtitle="Offboarding Document Engine">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Select Employee *</label>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            required
          >
            <option value="">-- Choose Employee --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeId || emp.id})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Joining Date</label>
            <input
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Relieving Date</label>
            <input
              type="date"
              value={relievingDate}
              onChange={(e) => setRelievingDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={generating}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition shadow-xs text-xs disabled:opacity-50"
        >
          {generating ? 'Generating Relieving Letter…' : 'Generate & Download Relieving Letter PDF'}
        </button>
      </form>
    </Drawer>
  );
}

export function ExperienceLetterDrawer({ isOpen, onClose, onSuccess }: DocumentDrawerProps) {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedEmpId, setSelectedEmpId] = useState<string>('');
  const [joiningDate, setJoiningDate] = useState<string>('2024-01-15');
  const [relievingDate, setRelievingDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [generating, setGenerating] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      employeeService.getEmployees().then(setEmployees).catch(() => setEmployees([]));
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setGenerating(true);
    try {
      const selectedEmp = employees.find(e => e.id === selectedEmpId);
      const res = await documentEngine.generate({
        module: 'HR',
        type: 'Experience Letter',
        identifier: `EXP-${Date.now()}`,
        employeeId: selectedEmpId || 'EMP-001',
        generatedBy: user?.id || 'usr-admin',
        generatedByName: user?.name || 'HR Admin',
        customPlaceholders: {
          employee_name: selectedEmp?.fullName || 'Employee Name',
          joiningDate,
          relievingDate,
        },
      });

      if (res.downloadUrl) {
        const a = document.createElement('a');
        a.href = res.downloadUrl;
        a.download = res.fileName;
        a.target = '_blank';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }

      onSuccess(res);
      onClose();
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Drawer isOpen={isOpen} onClose={onClose} title="Generate Experience Certificate" subtitle="Service Certification Engine">
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        <div>
          <label className="block font-semibold text-slate-700 mb-1">Select Employee *</label>
          <select
            value={selectedEmpId}
            onChange={(e) => setSelectedEmpId(e.target.value)}
            className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            required
          >
            <option value="">-- Choose Employee --</option>
            {employees.map(emp => (
              <option key={emp.id} value={emp.id}>{emp.fullName} ({emp.employeeId || emp.id})</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Joining Date</label>
            <input
              type="date"
              value={joiningDate}
              onChange={(e) => setJoiningDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-700 mb-1">Relieving Date</label>
            <input
              type="date"
              value={relievingDate}
              onChange={(e) => setRelievingDate(e.target.value)}
              className="w-full p-2.5 bg-slate-50 border border-slate-300 rounded-xl font-medium"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={generating}
          className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl transition shadow-xs text-xs disabled:opacity-50"
        >
          {generating ? 'Generating Experience Certificate…' : 'Generate & Download Experience Certificate PDF'}
        </button>
      </form>
    </Drawer>
  );
}
