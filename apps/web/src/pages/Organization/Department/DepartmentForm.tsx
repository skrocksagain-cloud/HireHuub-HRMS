import type { Department } from "../../../types/Department";

import FormInput from "../../../components/forms/FormInput";
import FormSelect from "../../../components/forms/FormSelect";
import FormActions from "../../../components/forms/FormActions";

interface DepartmentFormProps {
  department: Department;

  saving: boolean;

  onChange: (
    field: keyof Department,
    value: Department[keyof Department]
  ) => void;

  onSave: () => void;

  onCancel: () => void;

  
}

export default function DepartmentForm({
  department,
  saving,
  onChange,
  onSave,
  onCancel,
  
}: DepartmentFormProps) {
  return (
    <div className="space-y-6">

      <FormInput
        label="Department Name"
        value={department.name}
        onChange={(e) =>
          onChange("name", e.target.value)
        }
        placeholder="Enter department name"
        required
      />

      <FormInput
        label="Department Code"
        value={department.code}
        onChange={(e) =>
          onChange("code", e.target.value)
        }
        placeholder="Enter department code"
        required
      />

      <FormInput
        label="Description"
        value={department.description}
        onChange={(e) =>
          onChange("description", e.target.value)
        }
        placeholder="Department description"
      />

      <FormSelect
  name="status"
        label="Status"
        value={department.status}
        onChange={(e) =>
          onChange(
            "status",
            e.target.value as Department["status"]
          )
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
      />

      <FormActions
        saving={saving}
        onSave={onSave}
        onCancel={onCancel}
      />

    </div>
  );
}