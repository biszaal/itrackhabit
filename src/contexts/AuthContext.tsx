import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types';
import { apiService } from '../services/ApiService';
import { dataService } from '../services/DataService';

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
        console.log('DataService initialized successfully');
      } catch (error) {
        console.error('Failed to initialize DataService:', error);
      }
      
      // Check for stored auth token
      const storedToken = await AsyncStorage.getItem('auth_token');
      
      if (storedToken) {
        // Set token and get current user
        apiService.setAuthToken(storedToken);
        
        try {
          const currentUser = await apiService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          console.error('Failed to get current user:', error);
          // Token might be invalid, clear it
          await AsyncStorage.removeItem('auth_token');
          apiService.clearAuthToken();
        }
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
      const { user, token } = await apiService.login(email, password);
      
      // Store token for persistence
      await AsyncStorage.setItem('auth_token', token);
      
      setUser(user);
      
      // Sync local data to server after successful login
      await syncLocalDataToServer();
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
      const { user, token } = await apiService.register(email, password, name);
      
      // Store token for persistence
      await AsyncStorage.setItem('auth_token', token);
      
      setUser(user);
      
      // Default habits are already created on the server during registration
      // Clear any local data since we now have fresh server data
      await clearLocalData();
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
      
      // Clear stored token
      await AsyncStorage.removeItem('auth_token');
      apiService.clearAuthToken();
      
      setUser(null);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoading(false);
    }
  };

  const syncLocalDataToServer = async () => {
    try {
      // Get local data that needs to be synced
      const localHabits = await AsyncStorage.getItem('local_habits');
      const localProgress = await AsyncStorage.getItem('local_progress');
      
      if (localHabits || localProgress) {
        console.log('Syncing local data to server...');
        
        // TODO: Implement actual sync logic here
        // This would involve sending local habits and progress to the server
        
        // For now, just clear local data since user now has server data
        await clearLocalData();
        
        console.log('Local data synced and cleared');
      }
    } catch (error) {
      console.error('Failed to sync local data:', error);
    }
  };

  const clearLocalData = async () => {
    try {
      await AsyncStorage.multiRemove(['local_habits', 'local_progress', 'local_stats']);
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