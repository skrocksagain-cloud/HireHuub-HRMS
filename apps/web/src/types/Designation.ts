export interface Designation {
  id?: string;

  // Basic Information
  name: string;
  code: string;
  description: string;

  // Status
  status: "Active" | "Inactive";

  // Audit
  createdAt?: unknown;
  updatedAt?: unknown;
}