import { useNavigate } from "react-router-dom";

import PageHeader from "../../ui/PageHeader";
import Button from "../../ui/Button";
import Loader from "../../ui/Loader";
import ConfirmDialog from "../../ui/ConfirmDialog";

import EmployeeTable from "./EmployeeTable";
import { useEmployee } from "./useEmployee";

export default function EmployeePage() {
  const navigate = useNavigate();

  const {
    employees,
    loading,

    search,
    setSearch,

    deleteDialogOpen,
    closeDeleteDialog,
    confirmDelete,

    selectedEmployee,

    removeEmployee,
  } = useEmployee();

  if (loading) {
    return (
      <Loader
        fullScreen
        text="Loading Employees..."
      />
    );
  }

  return (
    <div className="space-y-6">

      <PageHeader
        title="Employees"
        description="Manage employee records"
        action={
          <Button
            onClick={() =>
              navigate("/employees/create")
            }
          >
            + New Employee
          </Button>
        }
      />

      <EmployeeTable
        employees={employees}
        search={search}
        setSearch={setSearch}
        onEdit={(employee) =>
          navigate(`/employees/edit/${employee.id}`)
        }
        onView={(employee) =>
          navigate(`/employees/profile/${employee.id}`)
        }
        onDelete={confirmDelete}
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Employee"
        message={`Are you sure you want to delete ${
          selectedEmployee?.firstName ?? ""
        } ${
          selectedEmployee?.lastName ?? ""
        }?`}
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={removeEmployee}
        onCancel={closeDeleteDialog}
      />

    </div>
  );
}