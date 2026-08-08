import type { Designation } from "../../types/Designation";
import { adminService } from "../admin/adminService";

export async function getDesignations(): Promise<Designation[]> {
  const desigs = await adminService.getDesignations();
  return desigs.map((d) => ({
    id: d.id,
    name: d.name,
    departmentId: d.departmentId,
    departmentName: d.departmentName,
    isActive: d.isActive,
  })) as unknown as Designation[];
}

export async function createDesignation(designation: Designation): Promise<void> {
  await adminService.saveDesignation(
    {
      id: designation.id || designation.name.toLowerCase().replace(/\s+/g, '-'),
      name: designation.name,
      departmentId: designation.departmentId || '',
      departmentName: designation.departmentName || '',
      isActive: true,
    },
    'system',
    'System Integration'
  );
}

export async function updateDesignation(id: string, designation: Designation): Promise<void> {
  await adminService.updateDesignation(
    id,
    {
      name: designation.name,
      departmentId: designation.departmentId,
      departmentName: designation.departmentName,
    },
    'system',
    'System Integration'
  );
}

export async function deleteDesignation(id: string): Promise<void> {
  await adminService.updateDesignation(id, { isActive: false }, 'system', 'System Integration');
}