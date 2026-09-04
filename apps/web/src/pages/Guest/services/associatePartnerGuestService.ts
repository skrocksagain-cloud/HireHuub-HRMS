import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../firebase/firebase';
import type { ExternalVacancy } from '../../../types/ExternalVacancy';
import { openingRepository } from '../../Workbench/openings/repositories/openingRepository';

export class AssociatePartnerGuestService {
  async getVacancies(partnerId: string): Promise<ExternalVacancy[]> {
    try {
      const snapshot = await getDocs(collection(db, 'external_vacancies'));
      if (!snapshot.empty) {
        // Fallback filter if using external_vacancies collection (assuming it has vendor info)
        const docs = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            openingId: data.openingId || doc.id,
            clientName: data.clientName || 'Hire Huub Client',
            title: data.title || '',
            city: data.city || '',
            state: data.state || '',
            openPositions: Number(data.openPositions || 1),
            experienceRange: data.experienceRange || '0 - 3 Yrs',
            minExperience: data.minExperience,
            maxExperience: data.maxExperience,
            qualification: data.qualification || '',
            salaryRange: data.salaryRange || '₹15,000 - ₹25,000',
            minSalary: data.minSalary,
            maxSalary: data.maxSalary,
            salaryPeriod: data.salaryPeriod || 'Monthly',
            employmentType: data.employmentType || 'Outsourced Staffing',
            shift: data.shift || 'Rotational / Fixed',
            jobDescription: data.jobDescription || '',
            skillsRequired: Array.isArray(data.skillsRequired) ? data.skillsRequired : [],
            lastUpdated: data.lastUpdated || new Date().toISOString().split('T')[0],
            outsourcedVendor: data.outsourcedVendor || '',
          };
        });
        return docs.filter(v => v.outsourcedVendor === partnerId);
      }
    } catch {
      // Fallback query if projection is being generated
    }

    // Direct fallback filter from openings (Active + Outsourced Yes ONLY)
    const allOpenings = await openingRepository.getOpenings();
    const eligible = allOpenings.filter((o) => 
      o.status === 'Active' && 
      o.isOutsourced === true && 
      o.outsourcedVendor === partnerId
    );

    return eligible.map((o) => {
      const minExp = o.minExperience ?? 0;
      const maxExp = o.maxExperience ?? 3;
      const minSal = o.minSalary ? `₹${o.minSalary.toLocaleString()}` : '';
      const maxSal = o.maxSalary ? `₹${o.maxSalary.toLocaleString()}` : '';

      return {
        id: o.id,
        openingId: o.id,
        clientName: o.clientName || 'Hire Huub Client',
        title: o.title || '',
        city: o.city || '',
        state: o.state || '',
        openPositions: o.openPositions || 1,
        experienceRange: `${minExp} - ${maxExp} Yrs`,
        minExperience: minExp,
        maxExperience: maxExp,
        qualification: o.qualification || '',
        salaryRange: minSal && maxSal ? `${minSal} - ${maxSal}` : minSal || maxSal || '',
        minSalary: o.minSalary,
        maxSalary: o.maxSalary,
        salaryPeriod: o.salaryType || 'Monthly',
        employmentType: 'Outsourced Staffing',
        shift: 'Rotational / Fixed',
        jobDescription: o.description || '',
        skillsRequired: o.skills || [],
        lastUpdated: o.updatedAt ? new Date(o.updatedAt).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      };
    });
  }
}

export const associatePartnerGuestService = new AssociatePartnerGuestService();
