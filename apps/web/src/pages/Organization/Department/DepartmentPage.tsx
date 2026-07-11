import Modal from "../../../ui/Modal";
import PageHeader from "../../../ui/PageHeader";
import Loader from "../../../ui/Loader";
import Button from "../../../ui/Button";
import ConfirmDialog from "../../../ui/ConfirmDialog";

import DepartmentForm from "./DepartmentForm";
import DepartmentTable from "./DepartmentTable";
import { useDepartment } from "./useDepartment";

export default function DepartmentPage() {
  const {
    departments,
    loading,
    saving,

    department,
    setDepartment,

    editing,
    showForm,

    openCreate,
    openEdit,
    closeForm,

    save,
    remove,
  } = useDepartment();

  if (loading) {
    return (
      <Loader
        fullScreen
        text="Loading Departments..."
      />
    );
  }

  return (
    <div className="space-y-6">

      <PageHeader
        title="Departments"
        description="Manage company departments"
        action={
          <Button onClick={openCreate}>
            + Add Department
          </Button>
        }
      />

      <DepartmentTable
        departments={departments}
        loading={loading}
        onEdit={openEdit}
        onDelete={(department) =>
          remove(department.id!)
        }
      />

      <Modal
        open={showForm}
        title={
          editing
            ? "Edit Department"
            : "Add Department"
        }
        onClose={closeForm}
        width="lg"
      >
        <DepartmentForm
          department={department}
          saving={saving}
          onChange={(field, value) =>
            setDepartment((prev) => ({
              ...prev,
              [field]: value,
            }))
          }
          onSave={save}
          onCancel={closeForm}
        />
      </Modal>

      {/* ConfirmDialog will be connected in Sprint 7 */}
      <ConfirmDialog
        open={false}
        title="Delete Department"
        message="Are you sure you want to delete this department?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {}}
        onCancel={() => {}}
      />

    </div>
  );
}