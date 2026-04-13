import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { useLocation } from "wouter";
import { User, setAuthTokenGetter } from "@workspace/api-client-react";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (token: string, refreshToken: string, userData: User) => void;
  logout: () => void;
  checkRole: (roles: User["role"][]) => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    if (token) {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem("user");
        }
      }
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    setAuthTokenGetter(() => localStorage.getItem("accessToken"));
  }, []);

  const login = useCallback((token: string, refreshToken: string, userData: User) => {
    localStorage.setItem("accessToken", token);
    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
    setLocation("/");
  }, [setLocation]);

  const logout = useCallback(() => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    setUser(null);
    setLocation("/login");
  }, [setLocation]);

  const checkRole = useCallback((roles: User["role"][]) => {
    if (!user) return false;
    if (user.role === "super_admin" || user.role === ("platform_admin" as any)) return true;
    return roles.includes(user.role);
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, checkRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
};
