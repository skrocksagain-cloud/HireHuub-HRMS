import type { Role } from "../../types/Role";
import { adminService } from "../admin/adminService";

export async function getRoles(): Promise<Role[]> {
  const roles = await adminService.getRoles();
  return roles.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    permissions: r.permissions,
    isActive: r.isActive,
  })) as unknown as Role[];
}

export async function getRoleById(id: string): Promise<Role | null> {
  const roles = await getRoles();
  return roles.find((r) => r.id === id) || null;
}

export async function createRole(role: Role): Promise<void> {
  await adminService.saveRole(
    {
      id: role.id || role.name.toLowerCase().replace(/\s+/g, '-'),
      name: role.name,
      description: role.description || '',
      permissions: role.permissions || [],
      viewScope: 'Organization',
      approvalScope: 'Organization',
      reportingScope: 'DirectReports',
      departmentIds: [],
      teamIds: [],
      employeeIds: [],
      branchIds: [],
      companyIds: [],
      isActive: true,
    },
    'system',
    'System Integration'
  );
}

export async function updateRole(id: string, role: Role): Promise<void> {
  await adminService.updateRole(
    id,
    {
      name: role.name,
      description: role.description,
      permissions: role.permissions,
    },
    'system',
    'System Integration'
  );
}

export async function deleteRole(id: string): Promise<void> {
  await adminService.updateRole(id, { isActive: false }, 'system', 'System Integration');
}