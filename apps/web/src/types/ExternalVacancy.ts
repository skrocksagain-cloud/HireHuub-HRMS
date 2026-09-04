export interface ExternalVacancy {
  id: string;
  openingId: string;
  clientName: string;
  title: string;
  city: string;
  state: string;
  openPositions: number;
  experienceRange: string;
  minExperience?: number;
  maxExperience?: number;
  qualification: string;
  salaryRange: string;
  minSalary?: number;
  maxSalary?: number;
  salaryPeriod: string;
  employmentType: string;
  shift: string;
  jobDescription: string;
  skillsRequired: string[];
  lastUpdated: string;
}
