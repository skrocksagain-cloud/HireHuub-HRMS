import { useState } from "react";
import Card from "../../../ui/Card";
import Button from "../../../ui/Button";
import Input from "../../../ui/Input";

export default function Company() {
  const [company, setCompany] = useState({
    companyName: "",
    shortName: "",
    legalName: "",
    gstin: "",
    pan: "",
    cin: "",

    email: "",
    phone: "",
    website: "",

    address: "",
    city: "",
    state: "",
    pinCode: "",
    country: "India",

    employeePrefix: "HH",
    currentEmployeeNumber: 14,
    probationDays: 180,
    noticePeriod: 30,

    defaultGST: 18,
    currency: "INR",
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    setCompany({
      ...company,
      [e.target.name]: e.target.value,
    });
  }

  return (
    <div className="space-y-6">

      {/* Company Information */}
      <Card>
        <h2 className="text-xl font-semibold mb-6">
          Company Information
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <Input name="companyName" placeholder="Company Name" value={company.companyName} onChange={handleChange} />
          <Input name="shortName" placeholder="Short Name" value={company.shortName} onChange={handleChange} />
          <Input name="legalName" placeholder="Legal Name" value={company.legalName} onChange={handleChange} />
          <Input name="gstin" placeholder="GSTIN" value={company.gstin} onChange={handleChange} />
          <Input name="pan" placeholder="PAN" value={company.pan} onChange={handleChange} />
          <Input name="cin" placeholder="CIN" value={company.cin} onChange={handleChange} />
        </div>
      </Card>

      {/* Contact */}
      <Card>
        <h2 className="text-xl font-semibold mb-6">
          Contact
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <Input name="email" placeholder="Email" value={company.email} onChange={handleChange} />
          <Input name="phone" placeholder="Phone" value={company.phone} onChange={handleChange} />
          <Input name="website" placeholder="Website" value={company.website} onChange={handleChange} />
        </div>
      </Card>

      {/* Address */}
      <Card>
        <h2 className="text-xl font-semibold mb-6">
          Address
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <Input name="address" placeholder="Address" value={company.address} onChange={handleChange} />
          <Input name="city" placeholder="City" value={company.city} onChange={handleChange} />
          <Input name="state" placeholder="State" value={company.state} onChange={handleChange} />
          <Input name="pinCode" placeholder="PIN Code" value={company.pinCode} onChange={handleChange} />
          <Input name="country" placeholder="Country" value={company.country} onChange={handleChange} />
        </div>
      </Card>

      {/* HR Settings */}
      <Card>
        <h2 className="text-xl font-semibold mb-6">
          HR Settings
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <Input name="employeePrefix" placeholder="Employee Prefix" value={company.employeePrefix} onChange={handleChange} />
          <Input name="currentEmployeeNumber" type="number" value={company.currentEmployeeNumber} onChange={handleChange} />
          <Input name="probationDays" type="number" value={company.probationDays} onChange={handleChange} />
          <Input name="noticePeriod" type="number" value={company.noticePeriod} onChange={handleChange} />
        </div>
      </Card>

      {/* Finance Settings */}
      <Card>
        <h2 className="text-xl font-semibold mb-6">
          Finance Settings
        </h2>

        <div className="grid grid-cols-2 gap-4">
          <Input name="defaultGST" type="number" value={company.defaultGST} onChange={handleChange} />
          <Input name="currency" placeholder="Currency" value={company.currency} onChange={handleChange} />
        </div>
      </Card>

      <div className="flex justify-end gap-4">
        <Button className="bg-gray-500 hover:bg-gray-600">
          Cancel
        </Button>

        <Button>
          Save Changes
        </Button>
      </div>

    </div>
  );
}