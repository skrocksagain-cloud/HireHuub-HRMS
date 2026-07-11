import type { Role } from "../../../types/Role";

import FormInput from "../../../components/forms/FormInput";
import FormSelect from "../../../components/forms/FormSelect";
import FormActions from "../../../components/forms/FormActions";

interface RoleFormProps {
  role: Role;

  saving: boolean;

  onChange: (
    field: keyof Role,
    value: Role[keyof Role]
  ) => void;

  onSave: () => void;

  onCancel: () => void;
}

export default function RoleForm({
  role,
  saving,
  onChange,
  onSave,
  onCancel,
}: RoleFormProps) {
  return (
    <div className="space-y-6">

      <FormInput
        label="Role Name"
        name="name"
        value={role.name}
        onChange={(e) =>
          onChange("name", e.target.value)
        }
        placeholder="Enter role name"
        required
      />

      <FormInput
        label="Role Code"
        name="code"
        value={role.code}
        onChange={(e) =>
          onChange("code", e.target.value)
        }
        placeholder="Enter role code"
        required
      />

      <FormInput
        label="Description"
        name="description"
        value={role.description}
        onChange={(e) =>
          onChange("description", e.target.value)
        }
        placeholder="Role description"
      />

      <FormSelect
        label="Status"
        name="status"
        value={role.status}
        onChange={(e) =>
          onChange(
            "status",
            e.target.value as Role["status"]
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