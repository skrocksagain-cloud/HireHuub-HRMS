import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { GuestSession } from '../services/guest/guestAuthService';

const GUEST_SESSION_KEY = 'hirehuub_guest_session';

interface GuestAuthContextType {
  guestSession: GuestSession | null;
  setGuestSession: (session: GuestSession | null) => void;
  logoutGuest: () => void;
}

const GuestAuthContext = createContext<GuestAuthContextType | undefined>(undefined);

export function GuestAuthProvider({ children }: { children: ReactNode }) {
  const [guestSession, setGuestSessionState] = useState<GuestSession | null>(() => {
    try {
      const stored = sessionStorage.getItem(GUEST_SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const setGuestSession = useCallback((session: GuestSession | null) => {
    setGuestSessionState(session);
    if (session) {
      sessionStorage.setItem(GUEST_SESSION_KEY, JSON.stringify(session));
    } else {
      sessionStorage.removeItem(GUEST_SESSION_KEY);
    }
  }, []);

  const logoutGuest = useCallback(() => {
    setGuestSession(null);
  }, [setGuestSession]);

  return (
    <GuestAuthContext.Provider value={{ guestSession, setGuestSession, logoutGuest }}>
      {children}
    </GuestAuthContext.Provider>
  );
}

export function useGuestAuth() {
  const context = useContext(GuestAuthContext);
  if (!context) {
    throw new Error('useGuestAuth must be used inside GuestAuthProvider');
  }
  return context;
}
