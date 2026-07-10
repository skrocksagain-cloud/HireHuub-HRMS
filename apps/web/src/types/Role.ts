export interface Role {
  id?: string;

  // Basic Information
  name: string;
  code: string;
  description: string;

  // Permissions
  permissions: string[];

  // Status
  status: "Active" | "Inactive";

  // Audit
  createdAt?: unknown;
  updatedAt?: unknown;
}