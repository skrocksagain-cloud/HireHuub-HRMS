import Modal from "../../../ui/Modal";
import PageHeader from "../../../ui/PageHeader";
import Loader from "../../../ui/Loader";
import Button from "../../../ui/Button";
import ConfirmDialog from "../../../ui/ConfirmDialog";

import RoleForm from "./RoleForm";
import RoleTable from "./RoleTable";
import { useRole } from "./useRole";

export default function RolePage() {
  const {
    roles,
    loading,
    saving,

    role,
    setRole,

    editing,
    showForm,

    openCreate,
    openEdit,
    closeForm,

    save,
    remove,
  } = useRole();

  if (loading) {
    return (
      <Loader
        fullScreen
        text="Loading Roles..."
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Roles"
        description="Manage company roles"
        action={
          <Button onClick={openCreate}>
            + Add Role
          </Button>
        }
      />

      <RoleTable
        roles={roles}
        loading={loading}
        onEdit={openEdit}
        onDelete={(role) => remove(role.id!)}
      />

      <Modal
        open={showForm}
        title={
          editing
            ? "Edit Role"
            : "Add Role"
        }
        onClose={closeForm}
        width="lg"
      >
        <RoleForm
          role={role}
          saving={saving}
          onChange={(field, value) =>
            setRole((prev) => ({
              ...prev,
              [field]: value,
            }))
          }
          onSave={save}
          onCancel={closeForm}
        />
      </Modal>

      {/* Sprint 7: Connect ConfirmDialog */}
      <ConfirmDialog
        open={false}
        title="Delete Role"
        message="Are you sure you want to delete this role?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {}}
        onCancel={() => {}}
      />
    </div>
  );
}