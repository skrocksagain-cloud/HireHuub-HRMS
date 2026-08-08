import type { Department } from "../../types/Department";
import { adminService } from "../admin/adminService";

export async function getDepartments(): Promise<Department[]> {
  const depts = await adminService.getDepartments();
  return depts.map((d) => ({
    id: d.id,
    name: d.name,
    code: d.code,
    description: d.description,
    isActive: d.isActive,
  })) as unknown as Department[];
}

export async function createDepartment(department: Department): Promise<void> {
  await adminService.saveDepartment(
    {
      id: department.id || department.name.toLowerCase().replace(/\s+/g, '-'),
      name: department.name,
      code: department.code || department.name.substring(0, 3).toUpperCase(),
      description: department.description || '',
      isActive: true,
    },
    'system',
    'System Integration'
  );
}

export async function updateDepartment(id: string, department: Department): Promise<void> {
  await adminService.updateDepartment(
    id,
    {
      name: department.name,
      code: department.code,
      description: department.description,
    },
    'system',
    'System Integration'
  );
}

export async function deleteDepartment(id: string): Promise<void> {
  await adminService.updateDepartment(id, { isActive: false }, 'system', 'System Integration');
}