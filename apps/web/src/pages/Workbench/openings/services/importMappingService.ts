import type { Opening, RawOpeningImportData, OpeningStatus, OpeningPriority, SalaryType, GenderPreference } from '../../../../types/Opening';
import { getIndianStates, getCitiesForState, isValidCityForState } from '../../../../core/location/indiaLocationMaster';

export interface IImportMappingService {
  mapToOpeningModel(rawData: RawOpeningImportData): Partial<Opening>;
}

export class ImportMappingService implements IImportMappingService {
  mapToOpeningModel(rawData: RawOpeningImportData): Partial<Opening> {
    const fields = Object.fromEntries(
      Object.entries(rawData.rawFields).map(([key, value]) => [
        key.trim().toLowerCase().replace(/[ _-]+/g, ''),
        value ? String(value).trim() : '',
      ])
    );

    const parseNum = (key: string) => {
      const val = fields[key];
      if (!val) return undefined;
      const num = parseInt(val.replace(/[^\d]/g, ''), 10);
      return Number.isNaN(num) ? undefined : num;
    };

    const parseBool = (key: string) => {
      const val = (fields[key] || '').toLowerCase();
      return val === 'yes' || val === 'true' || val === '1' || val === 'outsourced';
    };

    const title = fields.title || fields.role || fields.position || fields.jobtitle || fields.job;
    const clientName = fields.client || fields.clientname || fields.company;
    const location = fields.location || fields.address || fields.site;
    const rawState = fields.state || fields.region || 'Maharashtra';
    const rawCity = fields.city || fields.town || '';

    // Validate State against India Location Master
    const validStates = getIndianStates();
    const matchedState = validStates.find((s) => s.stateName.toLowerCase() === rawState.toLowerCase());
    const state = matchedState ? matchedState.stateName : 'Maharashtra';

    // Validate City against selected State
    let city = '';
    if (rawCity) {
      const validCities = getCitiesForState(state);
      const matchedCity = validCities.find((c) => c.toLowerCase() === rawCity.toLowerCase());
      if (matchedCity) {
        city = matchedCity;
      } else if (isValidCityForState(state, rawCity)) {
        city = rawCity;
      }
    }

    const openPositions = parseNum('openpositions') ?? parseNum('positions') ?? parseNum('vacancies') ?? parseNum('count') ?? 1;

    const minExp = parseNum('minexperience') ?? parseNum('minexp') ?? parseNum('experience') ?? 0;
    const maxExp = parseNum('maxexperience') ?? parseNum('maxexp') ?? (minExp ? minExp + 3 : 3);
    const qualification = fields.qualification || fields.education || fields.degree;
    
    let genderPref: GenderPreference = 'Any';
    if (fields.genderpreference || fields.gender) {
      const g = (fields.genderpreference || fields.gender).toLowerCase();
      if (g.includes('male') && !g.includes('female')) genderPref = 'Male';
      else if (g.includes('female')) genderPref = 'Female';
    }

    const ageLimit = parseNum('agelimit') ?? parseNum('maxage') ?? 35;
    const minSalary = parseNum('minsalary') ?? parseNum('salary') ?? parseNum('pay') ?? 15000;
    const maxSalary = parseNum('maxsalary') ?? (minSalary ? minSalary + 10000 : 25000);

    let salaryType: SalaryType = 'Monthly';
    if (fields.salarytype || fields.period) {
      const s = (fields.salarytype || fields.period).toLowerCase();
      if (s.includes('annual') || s.includes('year') || s.includes('lpa')) salaryType = 'Annual';
      else if (s.includes('daily') || s.includes('day')) salaryType = 'Daily';
      else if (s.includes('hourly') || s.includes('hour')) salaryType = 'Hourly';
    }

    let status: OpeningStatus = 'Active';
    if (fields.status) {
      const st = fields.status.toLowerCase();
      if (st.includes('hold')) status = 'OnHold';
      else if (st.includes('close')) status = 'Closed';
      else if (st.includes('draft')) status = 'Draft';
      else if (st.includes('cancel')) status = 'Cancelled';
    }

    let priority: OpeningPriority = 'Medium';
    if (fields.priority) {
      const pr = fields.priority.toLowerCase();
      if (pr.includes('high')) priority = 'High';
      else if (pr.includes('urgent')) priority = 'Urgent';
      else if (pr.includes('low')) priority = 'Low';
    }

    const isOutsourced = parseBool('isoutsourced') || parseBool('outsourced');
    const outsourcedVendor = fields.outsourcedvendor || fields.vendor || fields.subvendor || (isOutsourced ? 'Outsourced Partner' : undefined);

    const skills = fields.skills ? fields.skills.split(/[,;|]/).map((s) => s.trim()).filter(Boolean) : [];

    return {
      title,
      clientName,
      location,
      city,
      state,
      openPositions,
      minExperience: minExp,
      maxExperience: maxExp,
      qualification,
      genderPreference: genderPref,
      ageLimit,
      skills,
      minSalary,
      maxSalary,
      salaryType,
      status,
      priority,
      isOutsourced,
      outsourcedVendor,
    };
  }
}

export const importMappingService = new ImportMappingService();


