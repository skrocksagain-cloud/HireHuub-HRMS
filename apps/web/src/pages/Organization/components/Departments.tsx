import { useEffect, useState } from "react";
import type { Department } from "../../../types/Department";

import {
  getDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "../../../services/department/departmentService";

import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import Input from "../../../ui/Input";
import Select from "../../../ui/Select";
import Badge from "../../../ui/Badge";
import Loader from "../../../ui/Loader";
import Modal from "../../../ui/Modal";
import ConfirmDialog from "../../../ui/ConfirmDialog";
import PageHeader from "../../../ui/PageHeader";

import {
  DataTable,
  type DataTableColumn,
} from "../../../ui/DataTable";

const DEFAULT_DEPARTMENT: Department = {
  name: "",
  code: "",
  description: "",
  status: "Active",
};

export default function Departments() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<Department | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [department, setDepartment] =
    useState<Department>(DEFAULT_DEPARTMENT);

  useEffect(() => {
    loadDepartments();
  }, []);

  async function loadDepartments() {
    try {
      setLoading(true);

      const data = await getDepartments();

      setDepartments(data);
    } catch (error) {
      console.error(error);
      alert("Unable to load departments.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = e.target;

    setDepartment((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function saveDepartment() {
    try {
      if (!department.name || !department.code) {
        alert("Department Name and Code are required.");
        return;
      }

      if (editing) {
        await updateDepartment(editing.id!, department);
      } else {
        await createDepartment(department);
      }

      setDepartment(DEFAULT_DEPARTMENT);
      setEditing(null);
      setShowForm(false);

      await loadDepartments();

      alert("Department saved successfully.");
    } catch (error) {
      console.error(error);
      alert("Unable to save department.");
    }
  }

  async function removeDepartment(id: string) {
    if (!confirm("Delete this department?")) return;

    try {
      await deleteDepartment(id);

      await loadDepartments();
    } catch (error) {
      console.error(error);
      alert("Unable to delete department.");
    }
  }

  if (loading) {
  return (
    <div className="flex justify-center items-center h-96">
      <p className="text-gray-500">
        Loading departments...
      </p>
    </div>
  );
}
const columns: DataTableColumn<Department>[] = [
  {
    key: "name",
    title: "Department",
    sortable: true,
  },
  {
    key: "code",
    title: "Code",
    sortable: true,
  },
  {
    key: "status",
    title: "Status",
    sortable: true,
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
          onClick={() => {
            setEditing(row);
            setDepartment(row);
            setShowForm(true);
          }}
        >
          Edit
        </Button>

        <Button
          className="bg-red-600 hover:bg-red-700"
          onClick={() =>
            removeDepartment(row.id!)
          }
        >
          Delete
        </Button>
      </div>
    ),
  },
];
  return (
    <div className="space-y-6">

      <PageHeader
  title="Departments"
  description="Manage company departments"
  action={
    <Button
      onClick={() => {
        setEditing(null);
        setDepartment(DEFAULT_DEPARTMENT);
        setShowForm(true);
      }}
    >
      + Add Department
    </Button>
  }
/>

      <Modal
  open={showForm}
  title={
    editing
      ? "Edit Department"
      : "Add Department"
  }
  onClose={() => {
    setShowForm(false);
    setEditing(null);
    setDepartment(DEFAULT_DEPARTMENT);
  }}
  width="lg"

        <Card>

          <h3 className="text-xl font-semibold mb-6">
            {editing ? "Edit Department" : "Add Department"}
          </h3>

          <div className="grid grid-cols-2 gap-4">

            <Input
              name="name"
              placeholder="Department Name"
              value={department.name}
              onChange={handleChange}
            />

            <Input
              name="code"
              placeholder="Department Code"
              value={department.code}
              onChange={handleChange}
            />

            <Input
              name="description"
              placeholder="Description"
              value={department.description}
              onChange={handleChange}
            />

            <Select
  name="status"
  label="Status"
  value={department.status}
  onChange={(e) =>
    setDepartment((prev) => ({
      ...prev,
      status: e.target.value as
        | "Active"
        | "Inactive",
    }))
  }
  options={[
    {
      label: "Active",
      value: "Active",
    },
    {
      label: "Inactive",
      value: "Inactive",
    },
  ]}
>
              <option value="Active">
                Active
              </option>

              <option value="Inactive">
                Inactive
              </option>
            </select>

          </div>

          <div className="flex justify-end gap-4 mt-6">

            <Button
              className="bg-gray-500 hover:bg-gray-600"
              onClick={() => {
                setShowForm(false);
                setEditing(null);
                setDepartment(DEFAULT_DEPARTMENT);
              }}
            >
              Cancel
            </Button>

            <Button onClick={saveDepartment}>
              {editing ? "Update" : "Save"}
            </Button>

          </div>

        </Card>

      )}

      <Card>

        <DataTable
  data={departments}
  columns={columns}
  searchPlaceholder="Search departments..."
  toolbarActions={
    <Button
      onClick={() => {
        setEditing(null);
        setDepartment(DEFAULT_DEPARTMENT);
        setShowForm(true);
      }}
    >
      + Add Department
    </Button>
  }
/>

            {departments.map((item) => (

              <tr
                key={item.id}
                className="border-b"
              >

                <td className="py-3">
                  {item.name}
                </td>

                <td>{item.code}</td>

                <td>{item.status}</td>

                <td>

                  <div className="flex justify-end gap-2">

                    <Button
                      onClick={() => {
                        setEditing(item);
                        setDepartment(item);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </Button>

                    <Button
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() =>
                        removeDepartment(item.id!)
                      }
                    >
                      Delete
                    </Button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </Card>

    </div>
  );
}