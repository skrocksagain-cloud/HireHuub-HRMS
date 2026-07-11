import Modal from "../../../ui/Modal";
import PageHeader from "../../../ui/PageHeader";
import Loader from "../../../ui/Loader";
import Button from "../../../ui/Button";
import ConfirmDialog from "../../../ui/ConfirmDialog";

import DesignationForm from "./DesignationForm";
import DesignationTable from "./DesignationTable";
import { useDesignation } from "./useDesignation";

export default function DesignationPage() {
  const {
    designations,
    loading,
    saving,

    designation,
    setDesignation,

    editing,
    showForm,

    openCreate,
    openEdit,
    closeForm,

    save,
    remove,
  } = useDesignation();

  if (loading) {
    return (
      <Loader
        fullScreen
        text="Loading Designations..."
      />
    );
  }

  return (
    <div className="space-y-6">

      <PageHeader
        title="Designations"
        description="Manage company designations"
        action={
          <Button onClick={openCreate}>
            + Add Designation
          </Button>
        }
      />

      <DesignationTable
        designations={designations}
        loading={loading}
        onEdit={openEdit}
        onDelete={(designation) =>
          remove(designation.id!)
        }
      />

      <Modal
        open={showForm}
        title={
          editing
            ? "Edit Designation"
            : "Add Designation"
        }
        onClose={closeForm}
        width="lg"
      >
        <DesignationForm
          designation={designation}
          saving={saving}
          onChange={(field, value) =>
            setDesignation((prev) => ({
              ...prev,
              [field]: value,
            }))
          }
          onSave={save}
          onCancel={closeForm}
        />
      </Modal>

      {/* Sprint 7: Connect delete workflow */}
      <ConfirmDialog
        open={false}
        title="Delete Designation"
        message="Are you sure you want to delete this designation?"
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={() => {}}
        onCancel={() => {}}
      />

    </div>
  );
}