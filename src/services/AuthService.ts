import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthCredentials, RegisterData, AuthResponse, User, AuthProvider } from '../types';
import { AppConfig } from '../config/app';

class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user_data';
  
  private currentUser: User | null = null;
  private authListeners: Array<(user: User | null) => void> = [];

  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      // For demo purposes, we'll simulate an API call
      // In production, this would call your backend API
      
      if (credentials.email === 'demo@itrackhabit.com' && credentials.password === 'password123') {
        const user: User = {
          id: 'user_demo_001',
          name: 'Demo User',
          email: credentials.email,
          subscriptionStatus: 'free',
          authProvider: 'email',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        const response: AuthResponse = {
          user,
          token: this.generateMockToken(),
          refreshToken: this.generateMockToken(),
        };

        await this.storeAuthData(response);
        this.currentUser = user;
        this.notifyAuthListeners(user);

        return response;
      }

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // For other emails, create a user account
      const user: User = {
        id: `user_${Date.now()}`,
        name: credentials.email.split('@')[0],
        email: credentials.email,
        subscriptionStatus: 'trial',
        trialStartDate: new Date().toISOString(),
        authProvider: 'email',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const response: AuthResponse = {
        user,
        token: this.generateMockToken(),
        refreshToken: this.generateMockToken(),
      };

      await this.storeAuthData(response);
      this.currentUser = user;
      this.notifyAuthListeners(user);

      return response;
    } catch (error) {
      throw new Error('Login failed. Please check your credentials.');
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Check if email already exists (mock check)
      if (data.email === 'existing@example.com') {
        throw new Error('An account with this email already exists');
      }

      const user: User = {
        id: `user_${Date.now()}`,
        name: data.name,
        email: data.email,
        subscriptionStatus: 'trial',
        trialStartDate: new Date().toISOString(),
        authProvider: 'email',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const response: AuthResponse = {
        user,
        token: this.generateMockToken(),
        refreshToken: this.generateMockToken(),
      };

      await this.storeAuthData(response);
      this.currentUser = user;
      this.notifyAuthListeners(user);

      return response;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Registration failed. Please try again.');
    }
  }

  async socialLogin(provider: AuthProvider): Promise<AuthResponse> {
    try {
      // Simulate social login delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      const user: User = {
        id: `user_${provider}_${Date.now()}`,
        name: `${provider.charAt(0).toUpperCase() + provider.slice(1)} User`,
        email: `user@${provider}.com`,
        subscriptionStatus: 'trial',
        trialStartDate: new Date().toISOString(),
        authProvider: provider,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const response: AuthResponse = {
        user,
        token: this.generateMockToken(),
        refreshToken: this.generateMockToken(),
      };

      await this.storeAuthData(response);
      this.currentUser = user;
      this.notifyAuthListeners(user);

      return response;
    } catch (error) {
      throw new Error(`${provider} login failed. Please try again.`);
    }
  }

  async logout(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([
        this.TOKEN_KEY,
        this.REFRESH_TOKEN_KEY,
        this.USER_KEY,
      ]);
      
      this.currentUser = null;
      this.notifyAuthListeners(null);
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    try {
      const userData = await AsyncStorage.getItem(this.USER_KEY);
      const token = await AsyncStorage.getItem(this.TOKEN_KEY);

      if (userData && token) {
        const user = JSON.parse(userData);
        this.currentUser = user;
        return user;
      }
    } catch (error) {
      console.error('Error getting current user:', error);
    }

    return null;
  }

  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  async refreshAuthToken(): Promise<string | null> {
    try {
      const refreshToken = await AsyncStorage.getItem(this.REFRESH_TOKEN_KEY);
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      // Simulate refresh API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const newToken = this.generateMockToken();
      await AsyncStorage.setItem(this.TOKEN_KEY, newToken);

      return newToken;
    } catch (error) {
      console.error('Error refreshing token:', error);
      await this.logout();
      return null;
    }
  }

  async upgradeToTrial(): Promise<User> {
    const user = this.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    if (user.subscriptionStatus !== 'free') {
      throw new Error('User already has a trial or premium subscription');
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const updatedUser: User = {
      ...user,
      subscriptionStatus: 'trial',
      trialStartDate: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
    this.currentUser = updatedUser;
    this.notifyAuthListeners(updatedUser);

    return updatedUser;
  }

  async upgradeToPremium(): Promise<User> {
    const user = this.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    const updatedUser: User = {
      ...user,
      subscriptionStatus: 'premium',
      subscriptionEndDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(updatedUser));
    this.currentUser = updatedUser;
    this.notifyAuthListeners(updatedUser);

    return updatedUser;
  }

  isTrialExpired(user: User): boolean {
    if (user.subscriptionStatus !== 'trial' || !user.trialStartDate) {
      return false;
    }

    const trialStart = new Date(user.trialStartDate);
    const trialEnd = new Date(trialStart.getTime() + AppConfig.premium.trialDays * 24 * 60 * 60 * 1000);
    return new Date() > trialEnd;
  }

  getMaxHabitsForUser(user: User): number {
    if (user.subscriptionStatus === 'premium') {
      return Infinity;
    }

    if (user.subscriptionStatus === 'trial' && !this.isTrialExpired(user)) {
      return Infinity;
    }

    return AppConfig.premium.maxFreeHabits;
  }

  addAuthListener(listener: (user: User | null) => void): () => void {
    this.authListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.authListeners.indexOf(listener);
      if (index > -1) {
        this.authListeners.splice(index, 1);
      }
    };
  }

  // Legacy methods for backward compatibility
  async initialize(): Promise<void> {
    await this.getCurrentUser();
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  getAuthHeaders(): Record<string, string> {
    if (!this.currentUser) return {};
    
    return {
      'Authorization': `Bearer ${this.generateMockToken()}`,
      'Content-Type': 'application/json',
    };
  }

  private async storeAuthData(authResponse: AuthResponse): Promise<void> {
    const dataToStore: Array<[string, string]> = [
      [this.TOKEN_KEY, authResponse.token],
      [this.USER_KEY, JSON.stringify(authResponse.user)],
    ];
    
    if (authResponse.refreshToken) {
      dataToStore.push([this.REFRESH_TOKEN_KEY, authResponse.refreshToken]);
    }
    
    await AsyncStorage.multiSet(dataToStore);
  }

  private generateMockToken(): string {
    return `mock_token_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private notifyAuthListeners(user: User | null): void {
    this.authListeners.forEach(listener => listener(user));
  }
}

export const authService = new AuthService();