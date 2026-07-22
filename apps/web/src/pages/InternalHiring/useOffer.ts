import { useEffect, useState } from "react";

import type { Offer } from "../../types/Offer";
import type { Department } from "../../types/Department";
import type { Designation } from "../../types/Designation";
import type { Employee } from "../Employee/types/Employee";

import { DEFAULT_OFFER } from "../../constants/defaultOffer";

import {
  createOffer,
  updateOffer,
} from "../../services/offer/offerService";

import { getDepartments } from "../../services/department/departmentService";
import { getDesignations } from "../../services/designation/designationService";
import { employeeService } from "../Employee/services/employeeService";

interface UseOfferReturn {
  loading: boolean;

  saving: boolean;

  form: Offer;

  departments: Department[];

  designations: Designation[];

  managers: Employee[];

  updateField: <K extends keyof Offer>(
    field: K,
    value: Offer[K]
  ) => void;

  saveOffer: () => Promise<void>;
}

export default function useOffer(
  offer?: Offer,
  onSuccess?: () => void
): UseOfferReturn {
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<Offer>(
    offer ?? DEFAULT_OFFER
  );

  const [departments, setDepartments] =
    useState<Department[]>([]);

  const [designations, setDesignations] =
    useState<Designation[]>([]);

  const [managers, setManagers] =
    useState<Employee[]>([]);

  useEffect(() => {
    initialize();
  }, []);

  async function initialize() {
    try {
      setLoading(true);

      const [
        departmentData,
        designationData,
        employeeData,
      ] = await Promise.all([
        getDepartments(),
        getDesignations(),
        employeeService.getEmployees(),
      ]);

      setDepartments(departmentData);

      setDesignations(designationData);

      setManagers(
        employeeData.filter(
          (employee) => employee.employmentStatus === "Active"
        )
      );

      if (offer) {
        setForm(offer);
      }
    } catch (error) {
      console.error(error);

      alert("Unable to load Offer.");
    } finally {
      setLoading(false);
    }
  }

  function updateField<K extends keyof Offer>(
    field: K,
    value: Offer[K]
  ) {
    setForm((previous) => ({
      ...previous,

      [field]: value,
    }));
  }

  async function saveOffer() {
    try {
      if (!form.firstName.trim()) {
        alert("First Name is required.");
        return;
      }

      if (!form.mobile.trim()) {
        alert("Mobile Number is required.");
        return;
      }

      if (!form.departmentId) {
        alert("Department is required.");
        return;
      }

      if (!form.designationId) {
        alert("Designation is required.");
        return;
      }

      setSaving(true);

      const payload: Offer = {
        ...form,

        fullName: [
          form.firstName,
          form.middleName,
          form.lastName,
        ]
          .filter(Boolean)
          .join(" "),
      };

      if (offer?.id) {
        await updateOffer(
          offer.id,
          payload
        );
      } else {
        await createOffer(payload);
      }

      onSuccess?.();
    } catch (error) {
      console.error(error);

      alert("Unable to save offer.");
    } finally {
      setSaving(false);
    }
  }

  return {
    loading,

    saving,

    form,

    departments,

    designations,

    managers,

    updateField,

    saveOffer,
  };
}
