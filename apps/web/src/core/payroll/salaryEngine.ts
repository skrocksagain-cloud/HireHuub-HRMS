export interface SalaryBreakupOptions {
  isPfApplicable: boolean;
  isEsicApplicable: boolean;
  state?: string;
}

export interface SalaryBreakupResult {
  monthlyGross: number;
  basicPay: number;
  hra: number;
  specialAllowance: number;
  employeePf: number;
  employerPf: number;
  employeeEsic: number;
  employerEsic: number;
  isEsicEligible: boolean;
  professionalTax: number;
  totalEmployeeDeductions: number;
  employerContribution: number;
  netSalary: number;
  annualCtc: number;
}

export class SalaryCalculator {
  static calculateBasicPay(monthlyGross: number): number {
    if (monthlyGross <= 0) return 0;
    return Math.round(monthlyGross * 0.5);
  }

  static calculateHRA(monthlyGross: number): number {
    if (monthlyGross <= 0) return 0;
    return Math.round(monthlyGross * 0.2);
  }

  static calculateSpecialAllowance(monthlyGross: number, basicPay?: number, hra?: number): number {
    if (monthlyGross <= 0) return 0;
    const basic = basicPay ?? this.calculateBasicPay(monthlyGross);
    const hraVal = hra ?? this.calculateHRA(monthlyGross);
    const remaining = monthlyGross - (basic + hraVal);
    return Math.max(0, Math.round(remaining));
  }

  static calculatePF(basicPay: number, isApplicable: boolean): { employeePF: number; employerPF: number } {
    if (!isApplicable || basicPay <= 0) {
      return { employeePF: 0, employerPF: 0 };
    }
    // Statutory PF cap: 12% of Basic up to ₹15,000 basic (₹1,800/mo) or 12% of Basic
    const pfBase = Math.min(basicPay, 15000);
    const pfAmount = Math.round(pfBase * 0.12);
    return {
      employeePF: pfAmount,
      employerPF: pfAmount,
    };
  }

  static calculateESIC(monthlyGross: number, isApplicable: boolean): { employeeESIC: number; employerESIC: number; isEligible: boolean } {
    // ESIC eligibility limit in India is Monthly Gross Salary <= ₹21,000
    const isEligible = isApplicable && monthlyGross > 0 && monthlyGross <= 21000;
    if (!isEligible) {
      return { employeeESIC: 0, employerESIC: 0, isEligible: false };
    }
    return {
      employeeESIC: Math.ceil(monthlyGross * 0.0075), // 0.75% Employee ESIC
      employerESIC: Math.ceil(monthlyGross * 0.0325), // 3.25% Employer ESIC
      isEligible: true,
    };
  }

  static calculateProfessionalTax(monthlyGross: number, state = 'West Bengal'): number {
    if (monthlyGross <= 0) return 0;

    const normalizedState = state.trim().toLowerCase();

    if (normalizedState.includes('maharashtra')) {
      if (monthlyGross <= 7500) return 0;
      if (monthlyGross <= 10000) return 175;
      return 200;
    }

    if (normalizedState.includes('karnataka')) {
      if (monthlyGross <= 25000) return 0;
      return 200;
    }

    if (normalizedState.includes('tamil nadu')) {
      if (monthlyGross <= 21000) return 0;
      if (monthlyGross <= 30000) return 100;
      if (monthlyGross <= 45000) return 235;
      return 310;
    }

    // Default Statutory Slabs (West Bengal / Standard)
    if (monthlyGross <= 10000) return 0;
    if (monthlyGross <= 15000) return 110;
    if (monthlyGross <= 25000) return 130;
    if (monthlyGross <= 40000) return 150;
    return 200;
  }

  static calculateEmployerContribution(employerPF: number, employerESIC: number): number {
    return Math.round(employerPF + employerESIC);
  }

  static calculateNetSalary(
    monthlyGross: number,
    employeePF: number,
    employeeESIC: number,
    professionalTax: number
  ): number {
    if (monthlyGross <= 0) return 0;
    const totalDeductions = employeePF + employeeESIC + professionalTax;
    return Math.max(0, Math.round(monthlyGross - totalDeductions));
  }

  static calculateCTC(monthlyGross: number, employerContribution: number): number {
    if (monthlyGross <= 0) return 0;
    return Math.round((monthlyGross + employerContribution) * 12);
  }

  static calculateSalaryStructure(
    monthlyGross: number,
    options: SalaryBreakupOptions
  ): SalaryBreakupResult {
    if (!monthlyGross || monthlyGross <= 0) {
      return {
        monthlyGross: 0,
        basicPay: 0,
        hra: 0,
        specialAllowance: 0,
        employeePf: 0,
        employerPf: 0,
        employeeEsic: 0,
        employerEsic: 0,
        isEsicEligible: false,
        professionalTax: 0,
        totalEmployeeDeductions: 0,
        employerContribution: 0,
        netSalary: 0,
        annualCtc: 0,
      };
    }

    const basicPay = this.calculateBasicPay(monthlyGross);
    const hra = this.calculateHRA(monthlyGross);
    const specialAllowance = this.calculateSpecialAllowance(monthlyGross, basicPay, hra);

    const pf = this.calculatePF(basicPay, options.isPfApplicable);
    const esic = this.calculateESIC(monthlyGross, options.isEsicApplicable);
    const professionalTax = this.calculateProfessionalTax(monthlyGross, options.state);

    const totalEmployeeDeductions = pf.employeePF + esic.employeeESIC + professionalTax;
    const employerContribution = this.calculateEmployerContribution(pf.employerPF, esic.employerESIC);
    const netSalary = this.calculateNetSalary(monthlyGross, pf.employeePF, esic.employeeESIC, professionalTax);
    const annualCtc = this.calculateCTC(monthlyGross, employerContribution);

    return {
      monthlyGross,
      basicPay,
      hra,
      specialAllowance,
      employeePf: pf.employeePF,
      employerPf: pf.employerPF,
      employeeEsic: esic.employeeESIC,
      employerEsic: esic.employerESIC,
      isEsicEligible: esic.isEligible,
      professionalTax,
      totalEmployeeDeductions,
      employerContribution,
      netSalary,
      annualCtc,
    };
  }
}
