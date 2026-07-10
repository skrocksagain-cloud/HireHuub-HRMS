import { useEffect, useState } from "react";
import type { Designation } from "../../../types/Designation";

import {
  getDesignations,
  createDesignation,
  updateDesignation,
  deleteDesignation,
} from "../../../services/designation/designationService";

import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import Input from "../../../ui/Input";

const DEFAULT_DESIGNATION: Designation = {
  name: "",
  code: "",
  description: "",
  status: "Active",
};

export default function Designations() {
  const [designations, setDesignations] = useState<Designation[]>([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState<Designation | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [designation, setDesignation] =
    useState<Designation>(DEFAULT_DESIGNATION);

  useEffect(() => {
    loadDesignations();
  }, []);

  async function loadDesignations() {
    try {
      setLoading(true);

      const data = await getDesignations();

      setDesignations(data);
    } catch (error) {
      console.error(error);
      alert("Unable to load Designations.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const { name, value } = e.target;

    setDesignation((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function saveDesignation() {
    try {
      if (!designation.name || !designation.code) {
        alert("Designation Name and Code are required.");
        return;
      }

      if (editing) {
        await updateDesignation(editing.id!, designation);
      } else {
        await createDesignation(designation);
      }

      setDesignation(DEFAULT_DESIGNATION);
      setEditing(null);
      setShowForm(false);

      await loadDesignations();

      alert("Designation saved successfully.");
    } catch (error) {
      console.error(error);
      alert("Unable to save designation.");
    }
  }

  async function removeDesignation(id: string) {
    if (!confirm("Delete this designation?")) return;

    try {
      await deleteDesignation(id);

      await loadDesignations();
    } catch (error) {
      console.error(error);
      alert("Unable to delete designation.");
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <p className="text-gray-500">
          Loading designations...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">

        <h2 className="text-2xl font-semibold">
          Designations
        </h2>

        <Button
          onClick={() => {
            setEditing(null);
            setDesignation(DEFAULT_DESIGNATION);
            setShowForm(true);
          }}
        >
          + Add Designation
        </Button>

      </div>

      {showForm && (

        <Card>

          <h3 className="text-xl font-semibold mb-6">
            {editing ? "Edit Designation" : "Add Designation"}
          </h3>

          <div className="grid grid-cols-2 gap-4">

            <Input
              name="name"
              placeholder="Designation Name"
              value={designation.name}
              onChange={handleChange}
            />

            <Input
              name="code"
              placeholder="Designation Code"
              value={designation.code}
              onChange={handleChange}
            />

            <Input
              name="description"
              placeholder="Description"
              value={designation.description}
              onChange={handleChange}
            />

            <select
              name="status"
              value={designation.status}
              onChange={(e) =>
                setDesignation((prev) => ({
                  ...prev,
                  status: e.target.value as
                    | "Active"
                    | "Inactive",
                }))
              }
              className="w-full rounded-xl border border-slate-300 px-4 py-3"
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
                setDesignation(DEFAULT_DESIGNATION);
              }}
            >
              Cancel
            </Button>

            <Button onClick={saveDesignation}>
              {editing ? "Update" : "Save"}
            </Button>

          </div>

        </Card>

      )}

      <Card>

        <table className="w-full">

          <thead>

            <tr className="border-b">

              <th className="text-left py-3">
                Name
              </th>

              <th className="text-left py-3">
                Code
              </th>

              <th className="text-left py-3">
                Status
              </th>

              <th className="text-right py-3">
                Actions
              </th>

            </tr>

          </thead>

          <tbody>

            {designations.length === 0 && (

              <tr>

                <td
                  colSpan={4}
                  className="text-center py-8 text-gray-500"
                >
                  No designations found.
                </td>

              </tr>

            )}

            {designations.map((item) => (

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
                        setDesignation(item);
                        setShowForm(true);
                      }}
                    >
                      Edit
                    </Button>

                    <Button
                      className="bg-red-600 hover:bg-red-700"
                      onClick={() =>
                        removeDesignation(item.id!)
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

