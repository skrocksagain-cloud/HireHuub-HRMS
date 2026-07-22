import { APPROVER_ROLES, MINIMUM_HALF_DAY_WORK_MINUTES } from '../constants/attendance';
import { attendanceRepository } from '../repositories/attendanceRepository';
import { validateAttendanceRequest } from '../validation/attendanceValidation';
import { getAttendanceStatusForLogin, getLocalAttendanceDate } from '../utils/attendance';
import type { AttendanceDashboardData, AttendanceEmployee, AttendanceRequestType, DeviceDetails } from '../types/attendance';

const getMonthBounds = (): { start: string; end: string } => {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), 1);
  const end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
  return { start: getLocalAttendanceDate(start), end: getLocalAttendanceDate(end) };
};

class AttendanceService {
  async getDashboard(employeeId: string): Promise<AttendanceDashboardData> {
    const today = getLocalAttendanceDate();
    const month = getMonthBounds();
    const [daily, openSession, monthlyDays, pendingRequests] = await Promise.all([
      attendanceRepository.getDaily(employeeId, today), attendanceRepository.getOpenSession(employeeId), attendanceRepository.getMonthlyDaily(employeeId, month.start, month.end), attendanceRepository.getPendingRequests(employeeId),
    ]);
    return { today: daily, openSession, monthlyDays, pendingRequests };
  }

  async startSession(employee: AttendanceEmployee, device: DeviceDetails): Promise<void> {
    const openSession = await attendanceRepository.getOpenSession(employee.employeeId);
    if (openSession) throw new Error('An attendance session is already active.');
    const loginTime = new Date();
    const existing = await attendanceRepository.getDaily(employee.employeeId, getLocalAttendanceDate(loginTime));
    if (existing?.isLocked) throw new Error('Attendance for this date is locked.');
    const status = existing?.status === 'Late' ? 'Late' : getAttendanceStatusForLogin(loginTime);
    await attendanceRepository.createSession(employee.employeeId, device);
    await attendanceRepository.saveDaily({ employeeId: employee.employeeId, attendanceDate: getLocalAttendanceDate(loginTime), status, totalWorkMinutes: existing?.totalWorkMinutes ?? 0, totalBreakMinutes: existing?.totalBreakMinutes ?? 0, sessionCount: (existing?.sessionCount ?? 0) + 1, firstLoginTime: existing?.firstLoginTime ?? null, lastLogoutTime: existing?.lastLogoutTime ?? null, isLocked: false });
  }

  async endSession(employeeId: string): Promise<void> {
    const session = await attendanceRepository.getOpenSession(employeeId);
    if (!session) throw new Error('There is no active attendance session to log out.');
    const daily = await attendanceRepository.getDaily(employeeId, getLocalAttendanceDate());
    if (!daily || daily.isLocked) throw new Error('Attendance for this date is locked.');
    const workMinutes = Math.max(0, Math.floor((Date.now() - session.loginTime.toMillis()) / 60_000));
    const totalWorkMinutes = daily.totalWorkMinutes + workMinutes;
    await attendanceRepository.closeSession(session.id);
    await attendanceRepository.saveDaily({ ...daily, status: totalWorkMinutes < MINIMUM_HALF_DAY_WORK_MINUTES && daily.status !== 'Late' ? 'Half Day' : daily.status, totalWorkMinutes, lastLogoutTime: null });
  }

  async request(employee: AttendanceEmployee, type: AttendanceRequestType, attendanceDate: string, reason: string): Promise<void> {
    validateAttendanceRequest(type, attendanceDate, reason);
    const approverRole = APPROVER_ROLES[type];
    await attendanceRepository.createRequest({ employeeId: employee.employeeId, type, attendanceDate, reason: reason.trim(), approverRole });
  }
}

export const attendanceService = new AttendanceService();
