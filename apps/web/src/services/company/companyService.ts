import type { Company } from "../../types/Company";
import { adminService } from "../admin/adminService";

export async function getCompany(): Promise<Company | null> {
  try {
    const adminCompany = await adminService.getCompanySettings();
    if (!adminCompany) return null;
    return {
      companyName: adminCompany.companyName,
      legalName: adminCompany.companyName,
      shortName: adminCompany.brandName,
      gstin: adminCompany.gstin,
      pan: adminCompany.pan,
      cin: adminCompany.cin,
      address: adminCompany.address,
      website: adminCompany.website,
      email: adminCompany.email,
      phone: adminCompany.phone,
      logoUrl: adminCompany.logoUrl,
      stampUrl: adminCompany.stampUrl,
    } as unknown as Company;
  } catch {
    return null;
  }
}

export async function updateCompany(company: Company): Promise<void> {
  const current = (await adminService.getCompanySettings()) || {
    id: 'hirehuub_company_settings',
    companyName: '',
    brandName: '',
    gstin: '',
    pan: '',
    cin: '',
    address: '',
    bankDetails: { bankName: '', accountNumber: '', ifscCode: '', branchName: '' },
    website: '',
    email: '',
    phone: '',
    logoUrl: '',
    stampUrl: '',
    signatures: [],
  };
  await adminService.updateCompanySettings(
    {
      ...current,
      companyName: company.companyName || current.companyName,
      gstin: company.gstin || current.gstin,
      pan: company.pan || current.pan,
      cin: company.cin || current.cin,
      address: company.address || current.address,
      website: company.website || current.website,
      email: company.email || current.email,
      phone: company.phone || current.phone,
      logoUrl: company.logoUrl || current.logoUrl,
    },
    'system',
    'System Integration'
  );
}

export async function createCompany(company: Company): Promise<void> {
  await updateCompany(company);
}