const fs = require('fs');

let permissionService = fs.readFileSync('apps/web/src/core/permissions/permissionService.ts', 'utf8');

const newCanEdit = `  canEdit(role: RoleItem | string, moduleKey: string, recordDeptId?: string, recordOwnerId?: string, currentUserId?: string): boolean {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active)) return true;
    const val = this.getMatrixValue(active, moduleKey, 'Edit').toLowerCase();
    if (val === 'restricted' || val === 'none' || val === 'view') return false;
    if ((val === 'own' || val.includes('apply')) && recordOwnerId && currentUserId) return recordOwnerId === currentUserId;
    if (val === 'department' && recordDeptId) return recordDeptId === (active.description || '');
    return true;
  }`;

const newCanUpload = `  canUpload(role: RoleItem | string, moduleKey: string, recordDeptId?: string, recordOwnerId?: string, currentUserId?: string): boolean {
    const active = this.getEffectiveRole(role);
    if (this.isSuperAdmin(active)) return true;
    const val = this.getMatrixValue(active, moduleKey, 'Upload').toLowerCase();
    if (val === 'restricted' || val === 'none' || val === 'view') return false;
    if ((val === 'own' || val.includes('apply')) && recordOwnerId && currentUserId) return recordOwnerId === currentUserId;
    if (val === 'department' && recordDeptId) return recordDeptId === (active.description || '');
    return true;
  }`;

permissionService = permissionService.replace(/  canEdit\(role: RoleItem \| string, moduleKey: string, recordDeptId\?: string, recordOwnerId\?: string, currentUserId\?: string\): boolean \{[\s\S]*?return true;\s*\}/, newCanEdit);
permissionService = permissionService.replace(/  canUpload\(role: RoleItem \| string, moduleKey: string, recordDeptId\?: string, recordOwnerId\?: string, currentUserId\?: string\): boolean \{[\s\S]*?return true;\s*\}/, newCanUpload);

fs.writeFileSync('apps/web/src/core/permissions/permissionService.ts', permissionService);

console.log("Updated canEdit and canUpload for 'apply / mark' cases");
