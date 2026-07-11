import type { Role } from "../../../types/Role";

import type { DataTableColumn } from "../../../ui/DataTable";

import Badge from "../../../ui/Badge";
import Button from "../../../ui/Button";

interface RoleColumnsProps {
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
}

export function getRoleColumns({
  onEdit,
  onDelete,
}: RoleColumnsProps): DataTableColumn<Role>[] {
  return [
    {
      key: "name",
      title: "Role",
      sortable: true,
    },
    {
      key: "code",
      title: "Code",
      sortable: true,
      align: "center",
    },
    {
      key: "description",
      title: "Description",
      render: (value) =>
        value ? String(value) : "-",
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