import { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/auth/authService';

export interface Employee {
  employeeId: string;
  id?: string;
  name: string;
  designation: string;
  role: string;
  department?: string;
  email?: string;
  mobileNumber?: string;
  accountStatus?: string;
}

interface AuthContextType {
  user: Employee | null;
  setUser: (user: Employee | null) => void;
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  logout: () => Promise<void>;
}

const AUTH_STORAGE_KEY = 'hirehuub_active_user';
const SESSION_STORAGE_KEY = 'hirehuub_active_session';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<Employee | null>(() => {
    try {
      const stored = localStorage.getItem(AUTH_STORAGE_KEY) || sessionStorage.getItem(AUTH_STORAGE_KEY);
      return stored ? (JSON.parse(stored) as Employee) : null;
    } catch {
      return null;
    }
  });

  const [sessionId, setSessionIdState] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SESSION_STORAGE_KEY) || sessionStorage.getItem(SESSION_STORAGE_KEY) || null;
    } catch {
      return null;
    }
  });

  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  const setUser = (newUser: Employee | null) => {
    setUserState(newUser);
    if (newUser) {
      localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(newUser));
    } else {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      sessionStorage.removeItem(AUTH_STORAGE_KEY);
    }
  };

  const setSessionId = (newSessionId: string | null) => {
    setSessionIdState(newSessionId);
    if (newSessionId) {
      localStorage.setItem(SESSION_STORAGE_KEY, newSessionId);
    } else {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
    }
  };

  const logout = async () => {
    if (sessionId && user?.employeeId) {
      try {
        await authService.logout(sessionId, user.employeeId);
      } catch {
        // ignore log errors on force logout
      }
    }
    setUser(null);
    setSessionId(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        sessionId,
        setSessionId,
        theme,
        setTheme,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}