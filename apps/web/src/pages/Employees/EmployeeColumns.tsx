import type { Employee } from "../../types/Employee";
import type { DataTableColumn } from "../../ui/DataTable";

import Badge from "../../ui/Badge";
import Button from "../../ui/Button";

interface EmployeeColumnsProps {
  onView: (employee: Employee) => void;
  onEdit: (employee: Employee) => void;
  onDelete: (employee: Employee) => void;
}

export function getEmployeeColumns({
  onView,
  onEdit,
  onDelete,
}: EmployeeColumnsProps): DataTableColumn<Employee>[] {
  return [
    {
      key: "employeeId",
      title: "Employee ID",
      sortable: true,
    },

    {
      key: "firstName",
      title: "Employee",
      sortable: true,
      render: (_, row) => (
        <div>
          <div className="font-medium text-slate-800">
            {row.firstName} {row.lastName}
          </div>

          <div className="text-xs text-slate-500">
            {row.officialEmail}
          </div>
        </div>
      ),
    },

    {
      key: "departmentName",
      title: "Department",
      sortable: true,
    },

    {
      key: "designationName",
      title: "Designation",
      sortable: true,
    },

    {
      key: "mobile",
      title: "Mobile",
      sortable: true,
    },

    {
      key: "status",
      title: "Status",
      sortable: true,
      align: "center",
      render: (value) => (
        <Badge
          variant={
            value === "Active"
              ? "success"
              : "danger"
          }
        >
          {String(value)}
        </Badge>
      ),
    },

    {
      key: "actions",
      title: "Actions",
      align: "right",
      render: (_, row) => (
        <div className="flex justify-end gap-2">

          <Button
            onClick={() => onView(row)}
          >
            View
          </Button>

          <Button
            onClick={() => onEdit(row)}
          >
            Edit
          </Button>

          <Button
            className="bg-red-600 hover:bg-red-700"
            onClick={() => onDelete(row)}
          >
            Delete
          </Button>

        </div>
      ),
    },
  ];
}