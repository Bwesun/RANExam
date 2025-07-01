import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthState } from "../types/exam";

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    email: string,
    password: string,
    name: string,
    role: "student" | "instructor",
  ) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    user: null,
    loading: true,
  });

  useEffect(() => {
    // Check for stored auth state
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setAuthState({
        isAuthenticated: true,
        user: JSON.parse(storedUser),
        loading: false,
      });
    } else {
      setAuthState((prev) => ({ ...prev, loading: false }));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // TODO: Replace with actual API call
      const mockUser: User = {
        id: "1",
        email,
        name: email.split("@")[0],
        role: email.includes("instructor") ? "instructor" : "student",
      };

      localStorage.setItem("user", JSON.stringify(mockUser));
      setAuthState({
        isAuthenticated: true,
        user: mockUser,
        loading: false,
      });
      return true;
    } catch (error) {
      console.error("Login failed:", error);
      return false;
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: "student" | "instructor",
  ): Promise<boolean> => {
    try {
      // TODO: Replace with actual API call
      const mockUser: User = {
        id: Date.now().toString(),
        email,
        name,
        role,
      };

      localStorage.setItem("user", JSON.stringify(mockUser));
      setAuthState({
        isAuthenticated: true,
        user: mockUser,
        loading: false,
      });
      return true;
    } catch (error) {
      console.error("Registration failed:", error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem("user");
    setAuthState({
      isAuthenticated: false,
      user: null,
      loading: false,
    });
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
