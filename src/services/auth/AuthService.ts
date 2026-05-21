import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthCredentials, RegisterData, AuthResponse, User, AuthProvider } from '../../types';
import { apiClient } from '../../config/api';
import { LOCAL_ONLY } from '../../config/runtime';

// Deterministic local user id from email so re-login on the same device
// returns the same identity (and the same SQLite habits).
const localIdFor = (email: string): string => {
  const norm = (email || '').trim().toLowerCase();
  let h = 5381;
  for (let i = 0; i < norm.length; i++) h = ((h << 5) + h + norm.charCodeAt(i)) >>> 0;
  return `local_${h.toString(36)}`;
};

class AuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'user_data';
  
  private currentUser: User | null = null;
  private authListeners: Array<(user: User | null) => void> = [];
  private supabase: any = null;

  constructor() {
    this.loadStoredAuth();
  }

  // Load stored authentication data on app start
  private async loadStoredAuth() {
    try {
      const token = await AsyncStorage.getItem(this.TOKEN_KEY);
      const userData = await AsyncStorage.getItem(this.USER_KEY);
      
      if (token && userData) {
        this.currentUser = JSON.parse(userData);
        console.log('🔐 Loaded stored auth for user:', this.currentUser?.id);
        this.notifyAuthListeners(this.currentUser);
        
        // Verify token is still valid by calling /me endpoint
        this.verifyStoredToken();
      }
    } catch (error) {
      console.error('❌ Failed to load stored auth:', error);
      await this.clearStoredAuth();
    }
  }

  // Verify stored token is still valid
  private async verifyStoredToken() {
    // In local-only mode there's no backend to validate against — trust
    // whatever we have in AsyncStorage so the user stays signed in.
    if (LOCAL_ONLY) return;
    try {
      const response = await apiClient.get<User>('/api/auth/me');
      this.currentUser = response;
      await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(response));
    } catch (error) {
      console.log('🔄 Stored token expired, clearing auth');
      await this.clearStoredAuth();
    }
  }

  // Clear stored authentication data
  private async clearStoredAuth() {
    await AsyncStorage.removeItem(this.TOKEN_KEY);
    await AsyncStorage.removeItem(this.USER_KEY);
    this.currentUser = null;
    this.notifyAuthListeners(null);
  }

  // Handle successful authentication response from backend
  private async handleAuthResponse(authResponse: { user: User; token: string }): Promise<void> {
    // Store token and user data
    await AsyncStorage.setItem(this.TOKEN_KEY, authResponse.token);
    await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(authResponse.user));
    
    this.currentUser = authResponse.user;
    console.log('✅ Auth successful for user:', this.currentUser.id);
    
    this.notifyAuthListeners(this.currentUser);
  }

  // Handle Supabase auth user
  private async handleAuthUser(supabaseUser: any): Promise<void> {
    if (!supabaseUser) {
      this.currentUser = null;
      this.notifyAuthListeners(null);
      return;
    }

    // Convert Supabase user to app User format
    const user: User = {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.user_metadata?.name || supabaseUser.email,
      subscriptionStatus: 'free',
      createdAt: supabaseUser.created_at || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.currentUser = user;
    await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.notifyAuthListeners(this.currentUser);
  }

  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      if (this.supabase) {
        console.log('🔐 Using Supabase authentication...');
        
        const { data, error } = await this.supabase.auth.signInWithPassword({
          email: credentials.email,
          password: credentials.password,
        });

        if (error) {
          throw new Error(error.message);
        }

        if (!data.user) {
          throw new Error('Authentication failed');
        }

        console.log('✅ Supabase login successful, user ID:', data.user.id);
        
        // Manually set the current user immediately
        await this.handleAuthUser(data.user);
        
        console.log('🔍 AuthService currentUser after handleAuthUser:', this.currentUser?.id);
        
        const authResponse: AuthResponse = {
          user: this.currentUser!,
          token: data.session?.access_token || '',
          refreshToken: data.session?.refresh_token || '',
        };

        await this.storeAuthData(authResponse);
        
        // Store the Supabase token for API calls
        if (data.session?.access_token) {
          await AsyncStorage.setItem('auth_token', data.session.access_token);
        }
        console.log('✅ Auth data stored, isAuthenticated():', this.isAuthenticated());
        
        return authResponse;
      } else {
        // Local-only / no Supabase: accept any non-empty credentials and
        // derive a stable user id from the email so habits persist across
        // sessions on the same device.
        if (!credentials.email?.trim() || !credentials.password?.trim()) {
          throw new Error('Enter an email and password.');
        }

        const user: User = {
          id: localIdFor(credentials.email),
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
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Login failed. Please check your credentials.');
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      // Local-only registration: stable id derived from email so the
      // account survives logout/login on the same device.
      const user: User = {
        id: localIdFor(data.email),
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
      // Sign out from Supabase if configured
      if (this.supabase) {
        await this.supabase.auth.signOut();
      }

      await AsyncStorage.multiRemove([
        this.TOKEN_KEY,
        this.REFRESH_TOKEN_KEY,
        this.USER_KEY,
        'auth_token', // Remove the API auth token too
      ]);
      
      this.currentUser = null;
      this.notifyAuthListeners(null);
      console.log('✅ Logout successful');
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

  async downgradeToFree(): Promise<User> {
    const user = this.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));

    const updatedUser: User = {
      ...user,
      subscriptionStatus: 'free',
      subscriptionEndDate: undefined,
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
    const trialEnd = new Date(trialStart.getTime() + 7 * 24 * 60 * 60 * 1000);
    return new Date() > trialEnd;
  }

  getMaxHabitsForUser(user: User): number {
    if (user.subscriptionStatus === 'premium') {
      return Infinity;
    }

    if (user.subscriptionStatus === 'trial' && !this.isTrialExpired(user)) {
      return Infinity;
    }

    return 3;
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