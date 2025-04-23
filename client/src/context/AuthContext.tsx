import React, { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "@/lib/queryClient";

// Updated to match MongoDB response structure
interface User {
  _id?: string;  // MongoDB id
  id?: number;   // For backwards compatibility
  username: string;
  email: string;
  fullName: string;
  role: string;
  faculty?: string;
  studentId?: string;
  major?: string;
  createdAt?: string;
  __v?: number;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (userData: any) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Check for existing session on mount
  useEffect(() => {
    async function loadUser() {
      try {
        console.log("Attempting to load user");
        const response = await fetch('/api/auth/me', {
          credentials: 'include'
        });
        
        console.log("Load user response status:", response.status);
        
        if (response.ok) {
          const userData = await response.json();
          console.log("User data loaded:", userData);
          setUser(userData);
        } else {
          console.log("Not authenticated, status:", response.status);
        }
      } catch (error) {
        console.error("Failed to load user:", error);
      } finally {
        setLoading(false);
      }
    }
    
    loadUser();
  }, []);

  async function login(username: string, password: string): Promise<User> {
    try {
      console.log("Attempting login with:", { username, password });
      const response = await apiRequest('POST', '/api/auth/login', { username, password });
      const userData = await response.json();
      console.log("Login response:", userData);
      setUser(userData);
      return userData;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  async function register(userData: any): Promise<User> {
    try {
      const response = await apiRequest('POST', '/api/auth/register', userData);
      const newUser = await response.json();
      return newUser;
    } catch (error) {
      console.error("Registration failed:", error);
      throw error;
    }
  }

  async function logout(): Promise<void> {
    try {
      await apiRequest('POST', '/api/auth/logout');
      setUser(null);
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  }

  async function updateProfile(userData: Partial<User>): Promise<User> {
    if (!user) {
      throw new Error("Not authenticated");
    }
    
    try {
      // Use _id for MongoDB or fallback to id for backward compatibility
      const userId = user._id || user.id;
      const response = await apiRequest('PUT', `/api/users/${userId}`, userData);
      const updatedUser = await response.json();
      setUser(updatedUser);
      return updatedUser;
    } catch (error) {
      console.error("Profile update failed:", error);
      throw error;
    }
  }

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
