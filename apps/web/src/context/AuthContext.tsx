import { createContext, useContext, useState, ReactNode } from "react";

export interface Employee {
  employeeId: string;
  name: string;
  designation: string;
  role: string;
}

interface AuthContextType {
  user: Employee | null;
  setUser: (user: Employee | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Employee | null>(null);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}