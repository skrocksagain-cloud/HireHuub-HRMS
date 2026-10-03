export interface CompOffGrantInput { attendanceDate: string; }

class CompOffService {
  async grantCompOffIfWorked(input: CompOffGrantInput): Promise<boolean> {
    const { httpsCallable } = await import('firebase/functions');
    const { functions } = await import('../../../firebase/firebase');
    const result = await httpsCallable(functions, 'grantCompOffIfWorked')({ attendanceDate: input.attendanceDate });
    return Boolean((result.data as { granted?: boolean }).granted);
  }
}

export const compOffService = new CompOffService();
