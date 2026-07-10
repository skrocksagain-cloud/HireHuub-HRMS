import { useEffect, useState } from "react";

import type { Employee } from "../../types/Employee";
import type { Department } from "../../types/Department";
import type { Designation } from "../../types/Designation";
import type { Role } from "../../types/Role";

import { DEFAULT_EMPLOYEE } from "../../constants/defaultEmployee";

import {
  createEmployee,
  updateEmployee,
} from "../../services/employee/employeeService";

import { getDepartments } from "../../services/department/departmentService";
import { getDesignations } from "../../services/designation/designationService";
import { getRoles } from "../../services/role/roleService";

import Card from "../../ui/Card";
import FormActions from "../../components/forms/FormActions";

import PersonalSection from "./components/PersonalSection";
import EmploymentSection from "./components/EmploymentSection";
import ContactSection from "./components/ContactSection";
import AddressSection from "./components/AddressSection";
import GovernmentSection from "./components/GovernmentSection";
import BankSection from "./components/BankSection";
import SalarySection from "./components/SalarySection";
import EmergencySection from "./components/EmergencySection";

interface EmployeeFormProps {
  employee?: Employee;
  onSuccess?: () => void;
}

export default function EmployeeForm({
  employee,
  onSuccess,
}: EmployeeFormProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [departments, setDepartments] = useState<Department[]>([]);
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);

  const [form, setForm] = useState<Employee>(
    employee ?? DEFAULT_EMPLOYEE
  );

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    try {
      setLoading(true);

      const [
        deptData,
        designationData,
        roleData,
      ] = await Promise.all([
        getDepartments(),
        getDesignations(),
        getRoles(),
      ]);

      setDepartments(deptData);
      setDesignations(designationData);
      setRoles(roleData);

      if (employee) {
        setForm(employee);
      }
    } catch (error) {
      console.error(error);
      alert("Unable to load employee form.");
    } finally {
      setLoading(false);
    }
  }

  function updateField(
    field: keyof Employee,
    value: Employee[keyof Employee]
  ) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }));
  }

  async function save() {
    try {
      if (!form.firstName.trim()) {
        alert("First Name is required.");
        return;
      }

      if (!form.departmentId) {
        alert("Department is required.");
        return;
      }

      if (!form.designationId) {
        alert("Designation is required.");
        return;
      }

      if (!form.roleId) {
        alert("Role is required.");
        return;
      }

      setSaving(true);

      if (employee?.id) {
        await updateEmployee(employee.id, form);

        alert("Employee updated successfully.");
      } else {
        const employeeId = await createEmployee(form);

        alert(
          `Employee ${employeeId} created successfully.`
        );
      }

      onSuccess?.();
    } catch (error) {
      console.error(error);
      alert("Unable to save employee.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        Loading Employee Form...
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <Card>
        <PersonalSection
          employee={form}
          updateField={updateField}
        />
      </Card>

      <Card>
        <EmploymentSection
          employee={form}
          departments={departments}
          designations={designations}
          roles={roles}
          updateField={updateField}
        />
      </Card>

      <Card>
        <ContactSection
          employee={form}
          updateField={updateField}
        />
      </Card>

      <Card>
        <AddressSection
          employee={form}
          updateField={updateField}
        />
      </Card>

      <Card>
        <GovernmentSection
          employee={form}
          updateField={updateField}
        />
      </Card>

      <Card>
        <BankSection
          employee={form}
          updateField={updateField}
        />
      </Card>

      <Card>
        <SalarySection
          employee={form}
          updateField={updateField}
        />
      </Card>

      <Card>
        <EmergencySection
          employee={form}
          updateField={updateField}
        />
      </Card>

      <FormActions
  saving={saving}
  onSave={save}
  onCancel={() => {
    if (window.confirm("Discard changes?")) {
      onSuccess?.();
    }
  }}
/>

    </div>
  );
}