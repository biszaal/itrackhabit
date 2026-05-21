import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthCredentials, RegisterData, AuthResponse, User, AuthProvider } from '../../types';
import { apiClient } from '../../config/api';

class BackendAuthService {
  private readonly TOKEN_KEY = 'auth_token';
  private readonly USER_KEY = 'user_data';
  
  private currentUser: User | null = null;
  private authListeners: Array<(user: User | null) => void> = [];

  constructor() {
    // Don't call loadStoredAuth here - it will be called in initialize()
    // to avoid race conditions
  }

  // Load stored authentication data on app start
  private async loadStoredAuth() {
    try {
      const token = await AsyncStorage.getItem(this.TOKEN_KEY);
      const userData = await AsyncStorage.getItem(this.USER_KEY);

      console.log('🔍 Loading stored auth...');
      console.log('   Token found:', token ? 'YES' : 'NO');
      console.log('   User data found:', userData ? 'YES' : 'NO');

      if (token && userData) {
        this.currentUser = JSON.parse(userData);
        console.log('✅ Loaded stored auth for user:', this.currentUser?.email);
        this.notifyAuthListeners(this.currentUser);

        // Optionally verify token in background (don't await to avoid blocking)
        // Only clear auth if we get a 401, not on network errors
        this.verifyStoredToken().catch(err => {
          console.log('⚠️ Token verification failed silently:', err.message);
          // Don't clear auth here - let it fail naturally on next API call
        });
      } else {
        console.log('ℹ️ No stored auth found');
      }
    } catch (error) {
      console.error('❌ Failed to load stored auth:', error);
      // Don't clear auth on parse errors - might just be corrupted data
      // User will be prompted to login on next API call
    }
  }

  // Verify stored token is still valid
  private async verifyStoredToken() {
    try {
      console.log('🔍 Verifying stored token...');
      const response = await apiClient.get<User>('/api/auth/me');
      // Update user data if successful
      this.currentUser = response;
      await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(response));
      console.log('✅ Token verified and user data updated');
    } catch (error: any) {
      // IMPORTANT: Don't clear auth in background verification
      // Let the user stay logged in and let API calls handle auth errors
      console.log('⚠️ Token verification failed in background, keeping user logged in');
      console.log('   Error:', error?.message);
      // User stays logged in - if token is truly invalid, the next API call will handle it
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
    console.log('🔐 Storing auth token...');
    // Store token and user data
    await AsyncStorage.setItem(this.TOKEN_KEY, authResponse.token);
    await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(authResponse.user));

    // Verify token was stored
    const storedToken = await AsyncStorage.getItem(this.TOKEN_KEY);
    console.log('✅ Token stored successfully:', storedToken ? 'YES' : 'NO');
    if (storedToken) {
      console.log('🔐 Token preview:', storedToken.substring(0, 30) + '...');
    }

    this.currentUser = authResponse.user;
    console.log('✅ Auth successful for user:', this.currentUser.id);

    this.notifyAuthListeners(this.currentUser);
  }

  // Notify all auth listeners of user state change
  private notifyAuthListeners(user: User | null) {
    console.log('📢 Notifying', this.authListeners.length, 'auth listeners');
    this.authListeners.forEach(listener => listener(user));
  }

  // LOGIN - Use backend API
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 Logging in via backend API...');
      
      const response = await apiClient.post<{ user: User; token: string }>(
        '/api/auth/login',
        {
          email: credentials.email,
          password: credentials.password,
        },
        false // Don't include auth header for login
      );

      await this.handleAuthResponse(response);

      return {
        user: response.user,
        token: response.token,
        refreshToken: '', // Backend doesn't return refresh token yet
      };
    } catch (error: unknown) {
      console.error('❌ Login failed:', error);
      const message = error instanceof Error ? error.message : 'Login failed';
      throw new Error(message);
    }
  }

  // REGISTER - Use backend API  
  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      console.log('🔐 Registering via backend API...');
      
      const response = await apiClient.post<{ user: User; token: string }>(
        '/api/auth/register',
        {
          email: data.email,
          password: data.password,
          name: data.name,
        },
        false // Don't include auth header for register
      );

      await this.handleAuthResponse(response);

      return {
        user: response.user,
        token: response.token,
        refreshToken: '',
      };
    } catch (error: unknown) {
      console.error('❌ Registration failed:', error);
      const message = error instanceof Error ? error.message : 'Registration failed';
      throw new Error(message);
    }
  }

  // LOGOUT - Clear local data and call backend
  async logout(): Promise<void> {
    try {
      // Call backend logout endpoint (optional)
      try {
        await apiClient.post('/api/auth/logout');
      } catch (error) {
        console.warn('⚠️ Backend logout failed:', error);
      }
      
      // Clear local storage
      await this.clearStoredAuth();
      console.log('✅ Logged out successfully');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      // Clear local data anyway
      await this.clearStoredAuth();
    }
  }

  // GET CURRENT USER
  async getCurrentUser(): Promise<User | null> {
    return this.currentUser;
  }

  // CHECK AUTHENTICATION STATUS
  isAuthenticated(): boolean {
    return !!this.currentUser;
  }

  // AUTH LISTENERS
  addAuthListener(listener: (user: User | null) => void): () => void {
    this.authListeners.push(listener);
    // Immediately call with current user
    listener(this.currentUser);
    
    // Return unsubscribe function
    return () => {
      const index = this.authListeners.indexOf(listener);
      if (index > -1) {
        this.authListeners.splice(index, 1);
      }
    };
  }

  removeAuthListener(listener: (user: User | null) => void): () => void {
    const index = this.authListeners.indexOf(listener);
    if (index > -1) {
      this.authListeners.splice(index, 1);
    }
    
    // Return empty cleanup function for compatibility
    return () => {};
  }

  // REFRESH USER DATA
  async refreshUserData(): Promise<User | null> {
    if (!this.isAuthenticated()) {
      return null;
    }

    try {
      const response = await apiClient.get<User>('/api/auth/me');
      this.currentUser = response;
      await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(response));
      this.notifyAuthListeners(this.currentUser);
      return this.currentUser;
    } catch (error) {
      console.error('❌ Failed to refresh user data:', error);
      await this.clearStoredAuth();
      return null;
    }
  }

  // UPDATE PROFILE
  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put<User>('/api/auth/profile', updates);
      this.currentUser = response;
      await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(response));
      this.notifyAuthListeners(this.currentUser);
      return this.currentUser;
    } catch (error: unknown) {
      console.error('❌ Failed to update profile:', error);
      const message = error instanceof Error ? error.message : 'Failed to update profile';
      throw new Error(message);
    }
  }

  // INITIALIZE - Load stored authentication on startup
  async initialize(): Promise<void> {
    console.log('🚀 BackendAuthService.initialize() called');
    await this.loadStoredAuth();
    console.log('✅ BackendAuthService initialization complete');
  }

  // Get auth token
  async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(this.TOKEN_KEY);
    } catch (error) {
      console.error('Error getting auth token:', error);
      return null;
    }
  }

  // Trial and Premium methods (stub implementations for backend service)
  async upgradeToTrial(): Promise<User> {
    const user = this.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await apiClient.post<User>('/api/auth/upgrade-trial');
      this.currentUser = response;
      await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(response));
      this.notifyAuthListeners(this.currentUser);
      return this.currentUser;
    } catch (error: unknown) {
      console.error('Failed to upgrade to trial:', error);
      const message = error instanceof Error ? error.message : 'Failed to upgrade to trial';
      throw new Error(message);
    }
  }

  async upgradeToPremium(): Promise<User> {
    const user = this.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await apiClient.post<User>('/api/auth/upgrade-premium');
      this.currentUser = response;
      await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(response));
      this.notifyAuthListeners(this.currentUser);
      return this.currentUser;
    } catch (error: unknown) {
      console.error('Failed to upgrade to premium:', error);
      const message = error instanceof Error ? error.message : 'Failed to upgrade to premium';
      throw new Error(message);
    }
  }

  async downgradeToFree(): Promise<User> {
    const user = this.currentUser;
    if (!user) {
      throw new Error('User not authenticated');
    }

    try {
      const response = await apiClient.post<User>('/api/auth/downgrade');
      this.currentUser = response;
      await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(response));
      this.notifyAuthListeners(this.currentUser);
      return this.currentUser;
    } catch (error: unknown) {
      console.error('Failed to downgrade to free:', error);
      const message = error instanceof Error ? error.message : 'Failed to downgrade to free';
      throw new Error(message);
    }
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
}

export const backendAuthService = new BackendAuthService();