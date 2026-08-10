import { attendanceRepository } from '../../pages/Attendance/repositories/attendanceRepository';
import { authRepository } from './repositories/authRepository';
import { authLogService } from './authLogService';

export class AttendanceComplianceService {
  async evaluateCompliance(employeeDocId: string, employeeId: string): Promise<{ isCompliant: boolean; missingSignoutCount: number }> {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
    const todayStr = `${currentYear}-${currentMonth}-${String(now.getDate()).padStart(2, '0')}`;
    const firstDayOfMonth = `${currentYear}-${currentMonth}-01`;

    try {
      const records = await attendanceRepository.getDailyForEmployee(employeeId, firstDayOfMonth, todayStr);

      // Filter past records in the month where loginTime exists but logoutTime is missing
      const unreturnedSignouts = records.filter((r) => {
        if (r.attendanceDate >= todayStr) return false; // Ignore today since shift might be ongoing
        return Boolean(r.loginTime) && !r.logoutTime;
      });

      const missingSignoutCount = unreturnedSignouts.length;

      if (missingSignoutCount >= 3) {
        // Lock account for Attendance Violation
        await authRepository.updateEmployeeAuthData(employeeDocId, {
          accountStatus: 'Locked',
          lockReason: 'Attendance Violation',
          unreturnedSignoutDaysCount: missingSignoutCount,
        });

        await authLogService.logEvent(employeeId, 'Account Locked', 'failure', {
          reason: 'Attendance Violation — 3 missing signouts',
          missingSignoutCount,
        });

        return { isCompliant: false, missingSignoutCount };
      }

      return { isCompliant: true, missingSignoutCount };
    } catch {
      // Return compliant if attendance check fails gracefully
      return { isCompliant: true, missingSignoutCount: 0 };
    }
  }
}

export const attendanceComplianceService = new AttendanceComplianceService();
