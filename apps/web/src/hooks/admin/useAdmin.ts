import { useCallback, useEffect, useState } from 'react';

import { adminService } from '../../services/admin/adminService';
import type {
  BigDayConfig,
  CompanySettings,
  DepartmentItem,
  DesignationItem,
  DocumentTemplateConfig,
  HierarchyNode,
  MasterDataConfig,
  NotificationSettings,
  PasswordResetRequest,
  RoleItem,
  SecuritySettings,
  WorkflowRule,
  AdminAuditEntry,
} from '../../types/Admin';

export function useAdminCompany() {
  const [company, setCompany] = useState<CompanySettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCompany = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await adminService.getCompanySettings();
      setCompany(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch company settings');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompany();
  }, [fetchCompany]);

  const updateCompany = async (settings: CompanySettings, actorId = 'admin', actorName = 'Super Admin') => {
    await adminService.updateCompanySettings(settings, actorId, actorName);
    setCompany(settings);
  };

  const uploadLogo = async (file: File, actorId = 'admin', actorName = 'Super Admin') => {
    const url = await adminService.uploadCompanyLogo(file, actorId, actorName);
    await fetchCompany();
    return url;
  };

  const uploadStamp = async (file: File, actorId = 'admin', actorName = 'Super Admin') => {
    const url = await adminService.uploadOfficialStamp(file, actorId, actorName);
    await fetchCompany();
    return url;
  };

  const deleteStamp = async (actorId = 'admin', actorName = 'Super Admin') => {
    await adminService.deleteOfficialStamp(actorId, actorName);
    await fetchCompany();
  };

  const uploadSignature = async (
    signatoryId: string,
    file: File,
    name: string,
    designation: string,
    actorId = 'admin',
    actorName = 'Super Admin'
  ) => {
    const sig = await adminService.uploadSignatureImage(signatoryId, file, name, designation, actorId, actorName);
    await fetchCompany();
    return sig;
  };

  const deleteSignature = async (signatoryId: string, actorId = 'admin', actorName = 'Super Admin') => {
    await adminService.deleteSignature(signatoryId, actorId, actorName);
    await fetchCompany();
  };

  return {
    company,
    isLoading,
    error,
    refresh: fetchCompany,
    updateCompany,
    uploadLogo,
    uploadStamp,
    deleteStamp,
    uploadSignature,
    deleteSignature,
  };
}

export function useAdminDepartments() {
  const [departments, setDepartments] = useState<DepartmentItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getDepartments();
      setDepartments(data);
    } catch {
      setDepartments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const saveDepartment = async (dept: DepartmentItem, actorId = 'admin', actorName = 'Super Admin') => {
    await adminService.saveDepartment(dept, actorId, actorName);
    await fetchDepartments();
  };

  const updateDepartment = async (
    id: string,
    updates: Partial<DepartmentItem>,
    actorId = 'admin',
    actorName = 'Super Admin'
  ) => {
    await adminService.updateDepartment(id, updates, actorId, actorName);
    await fetchDepartments();
  };

  return { departments, isLoading, refresh: fetchDepartments, saveDepartment, updateDepartment };
}

export function useAdminDesignations() {
  const [designations, setDesignations] = useState<DesignationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchDesignations = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getDesignations();
      setDesignations(data);
    } catch {
      setDesignations([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDesignations();
  }, [fetchDesignations]);

  const saveDesignation = async (desig: DesignationItem, actorId = 'admin', actorName = 'Super Admin') => {
    await adminService.saveDesignation(desig, actorId, actorName);
    await fetchDesignations();
  };

  const updateDesignation = async (
    id: string,
    updates: Partial<DesignationItem>,
    actorId = 'admin',
    actorName = 'Super Admin'
  ) => {
    await adminService.updateDesignation(id, updates, actorId, actorName);
    await fetchDesignations();
  };

  return { designations, isLoading, refresh: fetchDesignations, saveDesignation, updateDesignation };
}

export function useAdminRoles() {
  const [roles, setRoles] = useState<RoleItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchRoles = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getRoles();
      setRoles(data);
    } catch {
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const saveRole = async (role: RoleItem, actorId = 'admin', actorName = 'Super Admin') => {
    await adminService.saveRole(role, actorId, actorName);
    await fetchRoles();
  };

  const updateRole = async (
    id: string,
    updates: Partial<RoleItem>,
    actorId = 'admin',
    actorName = 'Super Admin'
  ) => {
    await adminService.updateRole(id, updates, actorId, actorName);
    await fetchRoles();
  };

  return { roles, isLoading, refresh: fetchRoles, saveRole, updateRole };
}

export function useAdminHierarchy() {
  const [hierarchy, setHierarchy] = useState<HierarchyNode[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchHierarchy = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getHierarchy();
      setHierarchy(data);
    } catch {
      setHierarchy([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHierarchy();
  }, [fetchHierarchy]);

  const saveHierarchyNode = async (node: HierarchyNode, actorId = 'admin', actorName = 'Super Admin') => {
    await adminService.saveHierarchyNode(node, actorId, actorName);
    await fetchHierarchy();
  };

  return { hierarchy, isLoading, refresh: fetchHierarchy, saveHierarchyNode };
}

export function useAdminWorkflows() {
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchWorkflows = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getWorkflows();
      setWorkflows(data);
    } catch {
      setWorkflows([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  const saveWorkflow = async (wf: WorkflowRule, actorId = 'admin', actorName = 'Super Admin') => {
    await adminService.saveWorkflow(wf, actorId, actorName);
    await fetchWorkflows();
  };

  const updateWorkflow = async (
    id: string,
    updates: Partial<WorkflowRule>,
    actorId = 'admin',
    actorName = 'Super Admin'
  ) => {
    await adminService.updateWorkflow(id, updates, actorId, actorName);
    await fetchWorkflows();
  };

  return { workflows, isLoading, refresh: fetchWorkflows, saveWorkflow, updateWorkflow };
}

export function useAdminDocumentTemplates() {
  const [templates, setTemplates] = useState<DocumentTemplateConfig[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchTemplates = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getDocumentTemplates();
      setTemplates(data);
    } catch {
      setTemplates([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const saveTemplate = async (tmpl: DocumentTemplateConfig, actorId = 'admin', actorName = 'Super Admin') => {
    await adminService.saveDocumentTemplate(tmpl, actorId, actorName);
    await fetchTemplates();
  };

  const deleteTemplate = async (id: string, actorId = 'admin', actorName = 'Super Admin') => {
    await adminService.deleteDocumentTemplate(id, actorId, actorName);
    await fetchTemplates();
  };

  return { templates, isLoading, refresh: fetchTemplates, saveTemplate, deleteTemplate };
}

export function useAdminBigDay() {
  const [bigDays, setBigDays] = useState<BigDayConfig[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchBigDays = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getBigDays();
      setBigDays(data);
    } catch {
      setBigDays([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBigDays();
  }, [fetchBigDays]);

  const saveBigDay = async (config: BigDayConfig, actorId = 'admin', actorName = 'Super Admin') => {
    await adminService.saveBigDay(config, actorId, actorName);
    await fetchBigDays();
  };

  const updateBigDay = async (
    id: string,
    updates: Partial<BigDayConfig>,
    actorId = 'admin',
    actorName = 'Super Admin'
  ) => {
    await adminService.updateBigDay(id, updates, actorId, actorName);
    await fetchBigDays();
  };

  return { bigDays, isLoading, refresh: fetchBigDays, saveBigDay, updateBigDay };
}

export function useAdminMasterData() {
  const [masterData, setMasterData] = useState<MasterDataConfig | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchMasterData = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getMasterData();
      setMasterData(data);
    } catch {
      setMasterData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchMasterData();
  }, [fetchMasterData]);

  const updateMasterData = async (data: MasterDataConfig, actorId = 'admin', actorName = 'Super Admin') => {
    await adminService.updateMasterData(data, actorId, actorName);
    setMasterData(data);
  };

  return { masterData, isLoading, refresh: fetchMasterData, updateMasterData };
}

export function useAdminNotificationSettings() {
  const [notifications, setNotifications] = useState<NotificationSettings | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getNotificationSettings();
      setNotifications(data);
    } catch {
      setNotifications(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const updateNotifications = async (
    settings: NotificationSettings,
    actorId = 'admin',
    actorName = 'Super Admin'
  ) => {
    await adminService.updateNotificationSettings(settings, actorId, actorName);
    setNotifications(settings);
  };

  return { notifications, isLoading, refresh: fetchNotifications, updateNotifications };
}

export function useAdminSecurity() {
  const [security, setSecurity] = useState<SecuritySettings | null>(null);
  const [resetRequests, setResetRequests] = useState<PasswordResetRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchSecurityData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [secData, reqData] = await Promise.all([
        adminService.getSecuritySettings(),
        adminService.getPasswordResetRequests(),
      ]);
      setSecurity(secData);
      setResetRequests(reqData);
    } catch {
      setSecurity(null);
      setResetRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSecurityData();
  }, [fetchSecurityData]);

  const updateSecurity = async (settings: SecuritySettings, actorId = 'admin', actorName = 'Super Admin') => {
    await adminService.updateSecuritySettings(settings, actorId, actorName);
    setSecurity(settings);
  };

  const approveReset = async (
    requestId: string,
    tempPassword: string,
    actorId = 'admin',
    actorName = 'Super Admin'
  ) => {
    await adminService.approvePasswordReset(requestId, tempPassword, actorId, actorName);
    await fetchSecurityData();
  };

  const rejectReset = async (requestId: string, actorId = 'admin', actorName = 'Super Admin') => {
    await adminService.rejectPasswordReset(requestId, actorId, actorName);
    await fetchSecurityData();
  };

  return {
    security,
    resetRequests,
    isLoading,
    refresh: fetchSecurityData,
    updateSecurity,
    approveReset,
    rejectReset,
  };
}

export function useAdminAuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AdminAuditEntry[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchAuditLogs = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await adminService.getAuditLogs();
      setAuditLogs(data);
    } catch {
      setAuditLogs([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAuditLogs();
  }, [fetchAuditLogs]);

  return { auditLogs, isLoading, refresh: fetchAuditLogs };
}
