import type { Designation } from "../../../types/Designation";

import FormInput from "../../../components/forms/FormInput";
import FormSelect from "../../../components/forms/FormSelect";
import FormActions from "../../../components/forms/FormActions";

interface DesignationFormProps {
  designation: Designation;

  saving: boolean;

  onChange: (
    field: keyof Designation,
    value: Designation[keyof Designation]
  ) => void;

  onSave: () => void;

  onCancel: () => void;
}

export default function DesignationForm({
  designation,
  saving,
  onChange,
  onSave,
  onCancel,
}: DesignationFormProps) {
  return (
    <div className="space-y-6">

      <FormInput
        label="Designation Name"
        name="name"
        value={designation.name}
        onChange={(e) =>
          onChange("name", e.target.value)
        }
        placeholder="Enter designation name"
        required
      />

      <FormInput
        label="Designation Code"
        name="code"
        value={designation.code}
        onChange={(e) =>
          onChange("code", e.target.value)
        }
        placeholder="Enter designation code"
        required
      />

      <FormInput
        label="Description"
        name="description"
        value={designation.description}
        onChange={(e) =>
          onChange("description", e.target.value)
        }
        placeholder="Designation description"
      />

      <FormSelect
        label="Status"
        name="status"
        value={designation.status}
        onChange={(e) =>
          onChange(
            "status",
            e.target.value as Designation["status"]
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