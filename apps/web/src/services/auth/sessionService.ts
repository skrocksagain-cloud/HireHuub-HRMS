import type { DeviceInfo, UserSession } from '../../types/auth';
import { userSessionRepository } from './repositories/userSessionRepository';

export function getDeviceInfo(): DeviceInfo {
  const ua = typeof window !== 'undefined' ? window.navigator.userAgent : '';

  let browser = 'Unknown Browser';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('SamsungBrowser')) browser = 'Samsung Internet';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  else if (ua.includes('Trident')) browser = 'Internet Explorer';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else if (ua.includes('Safari')) browser = 'Safari';

  let platform = 'Unknown OS';
  if (ua.includes('Win')) platform = 'Windows';
  else if (ua.includes('Mac')) platform = 'macOS';
  else if (ua.includes('Linux')) platform = 'Linux';
  else if (ua.includes('Android')) platform = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iPod')) platform = 'iOS';

  let device = 'Desktop';
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    device = /iPad|tablet/i.test(ua) ? 'Tablet' : 'Mobile';
  }

  return { device, browser, platform };
}

export class SessionService {
  async createSingleUserSession(employeeId: string): Promise<{ sessionId: string; terminatedCount: number }> {
    // Single Active Session Rule: terminate any pre-existing active sessions
    const terminatedCount = await userSessionRepository.terminateActiveSessions(employeeId);

    const deviceInfo = getDeviceInfo();
    const secureRandomId = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function'
      ? crypto.randomUUID()
      : Array.from(crypto.getRandomValues(new Uint8Array(16)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
    const sessionId = `sess_${secureRandomId}`;
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();

    const sessionData: Omit<UserSession, 'id'> = {
      sessionId,
      employeeId,
      userId: employeeId,
      loginAt: now.toISOString(),
      logoutAt: null,
      lastActivity: now.toISOString(),
      expiresAt,
      device: deviceInfo.device,
      browser: deviceInfo.browser,
      platform: deviceInfo.platform,
      sessionStatus: 'active',
    };

    await userSessionRepository.createSession(sessionData);

    return { sessionId, terminatedCount };
  }

  async terminateSession(sessionId: string): Promise<void> {
    if (!sessionId) return;
    await userSessionRepository.endSession(sessionId, 'logged_out');
  }

  async updateSessionActivity(sessionId: string): Promise<void> {
    if (!sessionId) return;
    await userSessionRepository.updateSessionActivity(sessionId);
  }
}

export const sessionService = new SessionService();
