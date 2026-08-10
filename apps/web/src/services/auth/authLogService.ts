import type { AuthEventType } from '../../types/auth';
import { getDeviceInfo } from './sessionService';
import { authLogRepository } from './repositories/authLogRepository';

export class AuthLogService {
  async logEvent(
    employeeId: string,
    eventType: AuthEventType,
    status: 'success' | 'failure',
    details?: Record<string, string | number | boolean | null>
  ): Promise<string> {
    const deviceInfo = getDeviceInfo();
    const timestamp = new Date().toISOString();

    return authLogRepository.createAuthLog({
      employeeId,
      eventType,
      status,
      timestamp,
      details: {
        device: deviceInfo.device,
        browser: deviceInfo.browser,
        platform: deviceInfo.platform,
        ...details,
      },
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : undefined,
    });
  }
}

export const authLogService = new AuthLogService();
