import { useCallback, useEffect, useMemo, useState } from 'react';

import { employeeService } from '../services/employeeService';
import type { Employee, EmployeeFilter, EmployeeFormData } from '../types/Employee';

const EMPTY_FILTER: EmployeeFilter = {
  search: '',
  department: '',
  designation: '',
  employmentStatus: '',
};

type EmployeePanel = 'create' | 'edit' | 'details' | null;

interface EmployeeSummary {
  total: number;
  active: number;
  inactive: number;
}

interface UseEmployeesResult {
  employees: Employee[];
  filteredEmployees: Employee[];
  filter: EmployeeFilter;
  departments: string[];
  designations: string[];
  summary: EmployeeSummary;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  selectedEmployee: Employee | null;
  activePanel: EmployeePanel;
  setFilter: (filter: EmployeeFilter) => void;
  refresh: () => Promise<void>;
  openCreate: () => void;
  openEdit: (employee: Employee) => void;
  openDetails: (employee: Employee) => void;
  closePanel: () => void;
  saveEmployee: (formData: EmployeeFormData) => Promise<void>;
  removeEmployee: (employeeId: string) => Promise<void>;
}

const getErrorMessage = (error: unknown, fallbackMessage: string): string => (
  error instanceof Error ? error.message : fallbackMessage
);

export const useEmployees = (): UseEmployeesResult => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filter, setFilter] = useState<EmployeeFilter>(EMPTY_FILTER);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [activePanel, setActivePanel] = useState<EmployeePanel>(null);

  const refresh = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      setEmployees(await employeeService.getEmployees());
    } catch (loadError: unknown) {
      setError(getErrorMessage(loadError, 'Unable to load employees.'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const refreshTimer = window.setTimeout(() => {
      void refresh();
    });

    return () => window.clearTimeout(refreshTimer);
  }, [refresh]);

  const filteredEmployees = useMemo(() => {
    const searchTerm = filter.search.trim().toLowerCase();

    return employees.filter((employee) => {
      const matchesSearch = searchTerm === '' || [
        employee.fullName,
        employee.employeeId,
        employee.employeeCode,
        employee.email,
      ].some((value) => value.toLowerCase().includes(searchTerm));

      return matchesSearch
        && (filter.department === '' || employee.department === filter.department)
        && (filter.designation === '' || employee.designation === filter.designation)
        && (filter.employmentStatus === '' || employee.employmentStatus === filter.employmentStatus);
    });
  }, [employees, filter]);

  const departments = useMemo(() => [...new Set(employees.map(({ department }) => department).filter(Boolean))], [employees]);
  const designations = useMemo(() => [...new Set(employees.map(({ designation }) => designation).filter(Boolean))], [employees]);
  const summary = useMemo<EmployeeSummary>(() => ({
    total: employees.length,
    active: employees.filter(({ employmentStatus }) => employmentStatus === 'Active').length,
    inactive: employees.filter(({ employmentStatus }) => employmentStatus !== 'Active').length,
  }), [employees]);

  const closePanel = (): void => {
    setSelectedEmployee(null);
    setActivePanel(null);
  };

  const openCreate = (): void => {
    setSelectedEmployee(null);
    setActivePanel('create');
  };

  const openEdit = (employee: Employee): void => {
    setSelectedEmployee(employee);
    setActivePanel('edit');
  };

  const openDetails = (employee: Employee): void => {
    setSelectedEmployee(employee);
    setActivePanel('details');
  };

  const saveEmployee = async (formData: EmployeeFormData): Promise<void> => {
    try {
      setIsSaving(true);
      setError(null);

      if (activePanel === 'edit' && selectedEmployee?.id) {
        await employeeService.updateEmployee(selectedEmployee.id, formData);
      } else {
        await employeeService.createEmployee(formData);
      }

      closePanel();
      await refresh();
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, 'Unable to save employee.'));
    } finally {
      setIsSaving(false);
    }
  };

  const removeEmployee = async (employeeId: string): Promise<void> => {
    try {
      setError(null);
      await employeeService.deleteEmployee(employeeId);
      await refresh();
    } catch (deleteError: unknown) {
      setError(getErrorMessage(deleteError, 'Unable to delete employee.'));
    }
  };

  return {
    employees,
    filteredEmployees,
    filter,
    departments,
    designations,
    summary,
    isLoading,
    isSaving,
    error,
    selectedEmployee,
    activePanel,
    setFilter,
    refresh,
    openCreate,
    openEdit,
    openDetails,
    closePanel,
    saveEmployee,
    removeEmployee,
  };
};
