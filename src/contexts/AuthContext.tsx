import React, { createContext, useContext, useState, useEffect } from "react";
import { User, AuthState } from "../types/exam";
import { authAPI } from "../services/api";

interface AuthContextType extends AuthState {
  login: (
    email: string,
    password: string,
    rememberMe?: boolean,
  ) => Promise<{ success: boolean; message?: string }>;
  register: (
    email: string,
    password: string,
    name: string,
    role: "student" | "instructor",
    department?: string,
    phoneNumber?: string,
  ) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;
  updateProfile: (data: any) => Promise<{ success: boolean; message?: string }>;
  refreshUser: () => Promise<void>;
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
    checkAuthState();
  }, []);

  const checkAuthState = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        // Verify token with backend
        const response = await authAPI.getProfile();
        if (response.success && response.user) {
          const user: User = {
            id: response.user.id || response.user._id,
            email: response.user.email,
            name: response.user.name,
            role: response.user.role,
            profileImage: response.user.profileImage,
          };

          setAuthState({
            isAuthenticated: true,
            user,
            loading: false,
          });
        } else {
          // Invalid token
          localStorage.removeItem("token");
          localStorage.removeItem("user");
          setAuthState({
            isAuthenticated: false,
            user: null,
            loading: false,
          });
        }
      } else {
        setAuthState({
          isAuthenticated: false,
          user: null,
          loading: false,
        });
      }
    } catch (error) {
      console.error("Auth check failed:", error);
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
      });
    }
  };

  const login = async (
    email: string,
    password: string,
    rememberMe?: boolean,
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await authAPI.login({ email, password, rememberMe });

      if (response.success && response.token && response.user) {
        // Store token and user data
        localStorage.setItem("token", response.token);

        const user: User = {
          id: response.user.id || response.user._id,
          email: response.user.email,
          name: response.user.name,
          role: response.user.role,
          profileImage: response.user.profileImage,
        };

        localStorage.setItem("user", JSON.stringify(user));

        setAuthState({
          isAuthenticated: true,
          user,
          loading: false,
        });

        return { success: true, message: response.message };
      } else {
        return { success: false, message: response.message || "Login failed" };
      }
    } catch (error: any) {
      console.error("Login failed:", error);
      const message =
        error.response?.data?.message || error.message || "Login failed";
      return { success: false, message };
    }
  };

  const register = async (
    email: string,
    password: string,
    name: string,
    role: "student" | "instructor",
    department?: string,
    phoneNumber?: string,
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await authAPI.register({
        email,
        password,
        name,
        role,
        department,
        phoneNumber,
      });

      if (response.success && response.token && response.user) {
        // Store token and user data
        localStorage.setItem("token", response.token);

        const user: User = {
          id: response.user.id || response.user._id,
          email: response.user.email,
          name: response.user.name,
          role: response.user.role,
          profileImage: response.user.profileImage,
        };

        localStorage.setItem("user", JSON.stringify(user));

        setAuthState({
          isAuthenticated: true,
          user,
          loading: false,
        });

        return { success: true, message: response.message };
      } else {
        return {
          success: false,
          message: response.message || "Registration failed",
        };
      }
    } catch (error: any) {
      console.error("Registration failed:", error);
      const message =
        error.response?.data?.message || error.message || "Registration failed";
      return { success: false, message };
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error("Logout API call failed:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setAuthState({
        isAuthenticated: false,
        user: null,
        loading: false,
      });
    }
  };

  const updateProfile = async (
    data: any,
  ): Promise<{ success: boolean; message?: string }> => {
    try {
      const response = await authAPI.updateProfile(data);

      if (response.success && response.user) {
        const user: User = {
          id: response.user.id || response.user._id,
          email: response.user.email,
          name: response.user.name,
          role: response.user.role,
          profileImage: response.user.profileImage,
        };

        localStorage.setItem("user", JSON.stringify(user));
        setAuthState((prev) => ({
          ...prev,
          user,
        }));

        return { success: true, message: response.message };
      } else {
        return {
          success: false,
          message: response.message || "Profile update failed",
        };
      }
    } catch (error: any) {
      console.error("Profile update failed:", error);
      const message =
        error.response?.data?.message ||
        error.message ||
        "Profile update failed";
      return { success: false, message };
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      const response = await authAPI.getProfile();
      if (response.success && response.user) {
        const user: User = {
          id: response.user.id || response.user._id,
          email: response.user.email,
          name: response.user.name,
          role: response.user.role,
          profileImage: response.user.profileImage,
        };

        localStorage.setItem("user", JSON.stringify(user));
        setAuthState((prev) => ({
          ...prev,
          user,
        }));
      }
    } catch (error) {
      console.error("Failed to refresh user:", error);
    }
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
