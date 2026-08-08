export interface Designation {
  id?: string;

  // Basic Information
  name: string;
  code: string;
  description: string;
  departmentId?: string;
  departmentName?: string;

  // Status
  status: "Active" | "Inactive";

  // Audit
  createdAt?: unknown;
  updatedAt?: unknown;
}