import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { employeeService } from '../services/employeeService';
import type { Employee, EmployeeFilter, EmployeeFormData } from '../types/Employee';

const EMPTY_FILTER: EmployeeFilter = {
  search: '',
  department: '',
  designation: '',
  employmentStatus: '',
  employmentType: '',
  sortBy: 'newest',
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
  isDeleting: boolean;
  error: string | null;
  successMessage: string | null;
  selectedEmployee: Employee | null;
  employeePendingDeletion: Employee | null;
  activePanel: EmployeePanel;
  setFilter: (filter: EmployeeFilter) => void;
  refresh: () => Promise<void>;
  openCreate: () => void;
  openEdit: (employee: Employee) => void;
  openDetails: (employee: Employee) => void;
  closePanel: () => void;
  saveEmployee: (formData: EmployeeFormData) => Promise<void>;
  requestDelete: (employee: Employee) => void;
  cancelDelete: () => void;
  removeEmployee: () => Promise<void>;
}

const getErrorMessage = (error: unknown, fallbackMessage: string): string => (
  error instanceof Error ? error.message : fallbackMessage
);

export const useEmployees = (): UseEmployeesResult => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filter, setFilter] = useState<EmployeeFilter>(EMPTY_FILTER);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [employeePendingDeletion, setEmployeePendingDeletion] = useState<Employee | null>(null);
  const [activePanel, setActivePanel] = useState<EmployeePanel>(null);
  const savingInProgress = useRef(false);
  const deletingInProgress = useRef(false);

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

    const matchingEmployees = employees.filter((employee) => {
      const matchesSearch = searchTerm === '' || [
        employee.fullName,
        employee.employeeId,
        employee.employeeCode,
        employee.email,
        employee.mobileNumber,
      ].some((value) => value.toLowerCase().includes(searchTerm));

      return matchesSearch
        && (filter.department === '' || employee.department === filter.department)
        && (filter.designation === '' || employee.designation === filter.designation)
        && (filter.employmentStatus === '' || employee.employmentStatus === filter.employmentStatus)
        && (filter.employmentType === '' || employee.employmentType === filter.employmentType);
    });

    return [...matchingEmployees].sort((firstEmployee, secondEmployee) => {
      if (filter.sortBy === 'name') {
        return firstEmployee.fullName.localeCompare(secondEmployee.fullName);
      }
      if (filter.sortBy === 'employeeCode') {
        return firstEmployee.employeeCode.localeCompare(secondEmployee.employeeCode);
      }

      const firstTimestamp = firstEmployee.createdAt?.toMillis() ?? 0;
      const secondTimestamp = secondEmployee.createdAt?.toMillis() ?? 0;
      return filter.sortBy === 'newest'
        ? secondTimestamp - firstTimestamp
        : firstTimestamp - secondTimestamp;
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
    setError(null);
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
    if (savingInProgress.current) {
      return;
    }

    try {
      savingInProgress.current = true;
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);

      if (activePanel === 'edit' && selectedEmployee?.id) {
        await employeeService.updateEmployee(selectedEmployee.id, formData);
        setSuccessMessage('Employee updated successfully.');
      } else {
        await employeeService.createEmployee(formData);
        setSuccessMessage('Employee created successfully.');
      }

      closePanel();
      await refresh();
    } catch (saveError: unknown) {
      setError(getErrorMessage(saveError, 'Unable to save employee.'));
    } finally {
      savingInProgress.current = false;
      setIsSaving(false);
    }
  };

  const requestDelete = (employee: Employee): void => {
    setError(null);
    setSuccessMessage(null);
    setEmployeePendingDeletion(employee);
  };

  const cancelDelete = (): void => {
    if (!deletingInProgress.current) {
      setEmployeePendingDeletion(null);
    }
  };

  const removeEmployee = async (): Promise<void> => {
    if (!employeePendingDeletion?.id || deletingInProgress.current) {
      return;
    }

    try {
      deletingInProgress.current = true;
      setIsDeleting(true);
      setError(null);
      setSuccessMessage(null);
      await employeeService.deleteEmployee(employeePendingDeletion.id);
      setSuccessMessage('Employee deleted successfully.');
      setEmployeePendingDeletion(null);
      closePanel();
      await refresh();
    } catch (deleteError: unknown) {
      setError(getErrorMessage(deleteError, 'Unable to delete employee.'));
    }
    finally {
      deletingInProgress.current = false;
      setIsDeleting(false);
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
    isDeleting,
    error,
    successMessage,
    selectedEmployee,
    employeePendingDeletion,
    activePanel,
    setFilter,
    refresh,
    openCreate,
    openEdit,
    openDetails,
    closePanel,
    saveEmployee,
    requestDelete,
    cancelDelete,
    removeEmployee,
  };
};
