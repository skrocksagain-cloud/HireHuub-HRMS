import type { Employee } from "../../types/Employee";
import Button from "../../ui/Button";
import Input from "../../ui/Input";

interface EmployeeTableProps {
  employees: Employee[];

  search: string;
  setSearch: (value: string) => void;

  onEdit: (employee: Employee) => void;
  onDelete: (id: string) => void;
  onView: (employee: Employee) => void;
}

export default function EmployeeTable({
  employees,
  search,
  setSearch,
  onEdit,
  onDelete,
  onView,
}: EmployeeTableProps) {
  const filteredEmployees = employees.filter((employee) => {
    const keyword = search.toLowerCase();

    return (
      employee.employeeId.toLowerCase().includes(keyword) ||
      `${employee.firstName} ${employee.lastName}`
        .toLowerCase()
        .includes(keyword) ||
      employee.departmentName.toLowerCase().includes(keyword) ||
      employee.designationName.toLowerCase().includes(keyword)
    );
  });

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">

        <Input
          placeholder="Search Employee..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

      </div>

      <div className="overflow-x-auto rounded-xl border border-slate-200">

        <table className="min-w-full">

          <thead className="bg-slate-100">

            <tr>

              <th className="px-4 py-3 text-left">
                Employee ID
              </th>

              <th className="px-4 py-3 text-left">
                Name
              </th>

              <th className="px-4 py-3 text-left">
                Department
              </th>

              <th className="px-4 py-3 text-left">
                Designation
              </th>

              <th className="px-4 py-3 text-left">
                Mobile
              </th>

              <th className="px-4 py-3 text-left">
                Status
              </th>

              <th className="px-4 py-3 text-right">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {filteredEmployees.length === 0 && (

              <tr>

                <td
                  colSpan={7}
                  className="text-center py-10 text-gray-500"
                >
                  No employees found.
                </td>

              </tr>

            )}

            {filteredEmployees.map((employee) => (

              <tr
                key={employee.id}
                className="border-t hover:bg-slate-50"
              >

                <td className="px-4 py-4 font-medium">
                  {employee.employeeId}
                </td>

                <td className="px-4">
                  {employee.firstName} {employee.lastName}
                </td>

                <td className="px-4">
                  {employee.departmentName}
                </td>

                <td className="px-4">
                  {employee.designationName}
                </td>

                <td className="px-4">
                  {employee.mobile}
                </td>

                <td className="px-4">

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      employee.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : employee.status === "Inactive"
                        ? "bg-yellow-100 text-yellow-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {employee.status}
                  </span>

                </td>

                <td className="px-4">

                  <div className="flex justify-end gap-2">

                    <Button
                      onClick={() => onView(employee)}
                    >
                      View
                    </Button>

                    <Button
                      onClick={() => onEdit(employee)}
                    >
                      Edit
                    </Button>

                    <Button
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() => onDelete(employee.id!)}
                    >
                      Delete
                    </Button>

                  </div>

                </td>

              </tr>

            ))}

          </tbody>

        </table>

      </div>

    </div>
  );
}