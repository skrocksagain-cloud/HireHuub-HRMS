import Button from '../../ui/Button';
import Card from '../../ui/Card';
import EmployeeDetails from './components/EmployeeDetails';
import EmployeeFilterPanel from './components/EmployeeFilterPanel';
import EmployeeForm from './components/EmployeeForm';
import EmployeeList from './components/EmployeeList';
import EmployeeSearchBar from './components/EmployeeSearchBar';
import { useEmployees } from './hooks/useEmployees';

export default function EmployeePage() {
  const {
    filteredEmployees, filter, departments, designations, summary, isLoading, isSaving, error, selectedEmployee, activePanel, setFilter, openCreate, openEdit, openDetails, closePanel, saveEmployee,
  } = useEmployees();

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><h1 className="text-3xl font-bold text-slate-800">Employees</h1><p className="mt-2 text-slate-500">Manage employee records and their employment lifecycle.</p></div><Button onClick={openCreate}>+ New Employee</Button></div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">{[['Total Employees', summary.total], ['Active Employees', summary.active], ['Other Statuses', summary.inactive]].map(([label, value]) => <Card key={String(label)} className="p-5"><p className="text-sm text-slate-500">{label}</p><p className="mt-2 text-3xl font-bold text-slate-800">{value}</p></Card>)}</div>
      {activePanel === 'details' && selectedEmployee ? <EmployeeDetails employee={selectedEmployee} onClose={closePanel} onEdit={openEdit} /> : null}
      {activePanel === 'create' || activePanel === 'edit' ? <EmployeeForm employee={selectedEmployee} isSaving={isSaving} onSave={saveEmployee} onCancel={closePanel} /> : null}
      <Card><div className="space-y-4"><EmployeeSearchBar value={filter.search} onChange={(search) => setFilter({ ...filter, search })} /><EmployeeFilterPanel filter={filter} departments={departments} designations={designations} onChange={setFilter} /></div></Card>
      <EmployeeList employees={filteredEmployees} isLoading={isLoading} error={error} onView={openDetails} onEdit={openEdit} onCreate={openCreate} />
    </div>
  );
}
