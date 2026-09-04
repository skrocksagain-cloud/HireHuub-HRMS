import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { authRepository } from '../services/auth/repositories/authRepository';
import type { CanonicalAuthorizationIdentity } from '../core/authorization/authorizationResolver';

export interface Employee {
  employeeId: string;
  id?: string;
  name: string;
  designation: string;
  role: string;
  assignedRole?: string;
  departmentId?: string;
  department?: string;
  teamId?: string;
  teamName?: string;
  reportingManagerId?: string;
  email?: string;
  mobileNumber?: string;
  accountStatus?: string;
  mustChangePassword?: boolean;
  authorization?: CanonicalAuthorizationIdentity;
}

interface AuthContextType {
  user: Employee | null;
  setUser: (user: Employee | null) => void;
  sessionId: string | null;
  setSessionId: (id: string | null) => void;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUserState] = useState<Employee | null>(null);
  const [sessionId, setSessionIdState] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function initializeAuth() {
      const { onIdTokenChanged } = await import('firebase/auth');
      const { auth } = await import('../firebase/firebase');
      const { adminService } = await import('../services/admin/adminService');
      const { permissionService } = await import('../core/permissions/permissionService');

      const unsubscribe = onIdTokenChanged(auth, async (firebaseUser) => {
        if (!isMounted) return;
        
        if (firebaseUser) {
          try {
            // Verify required claims for ERP readiness
            const tokenResult = await firebaseUser.getIdTokenResult();
            const { role, employeeId } = tokenResult.claims;
            
            if (!role || !employeeId) {
              console.log('[AuthContext] Required custom claims missing. Waiting for token refresh.');
              setUserState(null);
              setIsLoading(false);
              return;
            }

            // We have valid claims. Ensure the app shows a loading state while fetching profile.
            // This prevents ProtectedRoute from prematurely redirecting if navigate() is called before this finishes.
            setIsLoading(true);

            // Find employee by their firebaseUid
            console.log('[AuthContext] Searching for firebaseUid:', firebaseUser.uid);
            const [employeeData, masterRoles] = await Promise.all([
              authRepository.getEmployeeByFirebaseUid(firebaseUser.uid),
              adminService.getRoles().catch(() => [])
            ]);
            true;
            console.log('[AuthContext] Found employeeData:', employeeData);
            
            if (employeeData) {
              const { resolveAuthorizationIdentity } = await import('../core/authorization/authorizationResolver');
              const authIdentity = resolveAuthorizationIdentity(employeeData, firebaseUser.uid);
              
              const emp: Employee = {
                id: employeeData.id,
                employeeId: employeeData.employeeId,
                name: employeeData.name,
                role: employeeData.role,
                assignedRole: employeeData.assignedRole,
                departmentId: employeeData.departmentId,
                department: employeeData.department,
                teamId: employeeData.teamId,
                teamName: employeeData.teamName,
                reportingManagerId: employeeData.reportingManagerId,
                designation: employeeData.designation,
                email: employeeData.email,
                mobileNumber: employeeData.mobileNumber,
                accountStatus: employeeData.accountStatus,
                mustChangePassword: employeeData.accountStatus === 'Pending Activation' || !employeeData.firstLoginCompleted,
                authorization: authIdentity,
              };
              setUserState(emp);
            } else {
              // Not found, maybe they are not an employee
              setUserState(null);
            }
          } catch (error) {
            setUserState(null);
          }
        } else {
          setUserState(null);
        }
        setIsLoading(false);
      });

      return unsubscribe;
    }

    const initPromise = initializeAuth();
    return () => {
      isMounted = false;
      initPromise.then(unsub => unsub && unsub());
    };
  }, []);

  const setUser = (newUser: Employee | null) => {
    setUserState(newUser);
  };

  const setSessionId = (newSessionId: string | null) => {
    setSessionIdState(newSessionId);
  };

  const logout = async () => {
    try {
      const { signOut } = await import('firebase/auth');
      const { auth } = await import('../firebase/firebase');
      await signOut(auth);
    } catch {
      // ignore signOut errors
    }
    setUserState(null);
    setSessionIdState(null);
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
        isLoading,
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