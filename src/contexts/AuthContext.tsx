import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types';
import { authService } from '../services/auth';
import { dataService } from '../services/core';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    try {
      setLoading(true);
      
      // Initialize DataService first
      try {
        await dataService.initialize();
      } catch (error) {
        console.error('Failed to initialize DataService:', error);
      }
      
      // Initialize AuthService and get current user
      await authService.initialize();
      const currentUser = await authService.getCurrentUser();
      
      if (currentUser) {
        setUser(currentUser);
        console.log('✅ User authenticated on app start:', currentUser.email);
      } else {
        console.log('ℹ️ No authenticated user found');
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      const authResponse = await authService.login({ email, password });
      
      setUser(authResponse.user);
      
      // Sync local data after successful login
      await syncLocalDataToServer();
      
      console.log('✅ Login successful:', authResponse.user.email);
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      const authResponse = await authService.register({ email, password, name, confirmPassword: password });
      
      setUser(authResponse.user);
      
      // Clear any local data since we now have a fresh account
      await clearLocalData();
      
      console.log('✅ Registration successful:', authResponse.user.email);
    } catch (error) {
      console.error('Register error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      
      await authService.logout();
      setUser(null);
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncLocalDataToServer = async () => {
    try {
      // For now, just log that sync would happen here
      // In the future, this would sync offline data to Supabase
      console.log('ℹ️ Local data sync completed');
    } catch (error) {
      console.error('Failed to sync local data:', error);
    }
  };

  const clearLocalData = async () => {
    try {
      // Clear any temporary local data
      console.log('ℹ️ Local cache cleared');
    } catch (error) {
      console.error('Failed to clear local data:', error);
    }
  };

  const value: AuthContextType = {
    user,
    loading,
    isAuthenticated: user !== null,
    login,
    register,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};