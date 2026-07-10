import { useEffect, useState } from "react";
import type { Company as CompanyType } from "../../../types/Company";
import { DEFAULT_COMPANY } from "../../../constants/defaultCompany";
import {
  getCompany,
  updateCompany,
} from "../../../services/company/companyService";

import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import Input from "../../../ui/Input";

export default function Company() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [company, setCompany] =
    useState<CompanyType>(DEFAULT_COMPANY);

  useEffect(() => {
    loadCompany();
  }, []);

  async function loadCompany() {
    try {
      setLoading(true);

      const data = await getCompany();

      if (data) {
        setCompany(data);
      }
    } catch (error) {
      console.error("Failed to load company:", error);
      alert("Failed to load company details.");
    } finally {
      setLoading(false);
    }
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target;

    setCompany((prev) => ({
      ...prev,
      [name]: [
        "currentEmployeeNumber",
        "probationDays",
        "noticePeriod",
        "defaultGST",
      ].includes(name)
        ? Number(value)
        : value,
    }));
  }

  async function saveCompany() {
    try {
      setSaving(true);

      await updateCompany(company);

      console.log("Company updated successfully.");
      alert("Company updated successfully.");
    } catch (error) {
      console.error("Save Error:", error);
      alert("Unable to save company.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-lg text-gray-500">
          Loading company details...
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Company Information */}
      <Card>
        <h2 className="text-xl font-semibold mb-6">
          Company Information
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <Input
            name="companyName"
            placeholder="Company Name"
            value={company.companyName}
            onChange={handleChange}
          />

          <Input
            name="shortName"
            placeholder="Short Name"
            value={company.shortName}
            onChange={handleChange}
          />

          <Input
            name="legalName"
            placeholder="Legal Name"
            value={company.legalName}
            onChange={handleChange}
          />

          <Input
            name="gstin"
            placeholder="GSTIN"
            value={company.gstin}
            onChange={handleChange}
          />

          <Input
            name="pan"
            placeholder="PAN"
            value={company.pan}
            onChange={handleChange}
          />

          <Input
            name="cin"
            placeholder="CIN"
            value={company.cin}
            onChange={handleChange}
          />
        </div>
      </Card>

      {/* Contact */}
      <Card>
        <h2 className="text-xl font-semibold mb-6">
          Contact
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <Input
            name="email"
            placeholder="Email"
            value={company.email}
            onChange={handleChange}
          />

          <Input
            name="phone"
            placeholder="Phone"
            value={company.phone}
            onChange={handleChange}
          />

          <Input
            name="website"
            placeholder="Website"
            value={company.website}
            onChange={handleChange}
          />
        </div>
      </Card>

      {/* Address */}
      <Card>
        <h2 className="text-xl font-semibold mb-6">
          Address
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <Input
            name="address"
            placeholder="Address"
            value={company.address}
            onChange={handleChange}
          />

          <Input
            name="city"
            placeholder="City"
            value={company.city}
            onChange={handleChange}
          />

          <Input
            name="state"
            placeholder="State"
            value={company.state}
            onChange={handleChange}
          />

          <Input
            name="pinCode"
            placeholder="PIN Code"
            value={company.pinCode}
            onChange={handleChange}
          />

          <Input
            name="country"
            placeholder="Country"
            value={company.country}
            onChange={handleChange}
          />
        </div>
      </Card>

      {/* HR Settings */}
      <Card>
        <h2 className="text-xl font-semibold mb-6">
          HR Settings
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <Input
            name="employeePrefix"
            placeholder="Employee Prefix"
            value={company.employeePrefix}
            onChange={handleChange}
          />

          <Input
            name="currentEmployeeNumber"
            type="number"
            value={company.currentEmployeeNumber}
            onChange={handleChange}
          />

          <Input
            name="probationDays"
            type="number"
            value={company.probationDays}
            onChange={handleChange}
          />

          <Input
            name="noticePeriod"
            type="number"
            value={company.noticePeriod}
            onChange={handleChange}
          />
        </div>
      </Card>

      {/* Finance Settings */}
      <Card>
        <h2 className="text-xl font-semibold mb-6">
          Finance Settings
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <Input
            name="defaultGST"
            type="number"
            value={company.defaultGST}
            onChange={handleChange}
          />

          <Input
            name="currency"
            placeholder="Currency"
            value={company.currency}
            onChange={handleChange}
          />
        </div>
      </Card>

      <div className="flex justify-end gap-4">
        <Button
          onClick={loadCompany}
          disabled={saving}
          className="bg-gray-500 hover:bg-gray-600"
        >
          Cancel
        </Button>

        <Button
          onClick={saveCompany}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save Changes"}
        </Button>
      </div>
    </div>
  );
}