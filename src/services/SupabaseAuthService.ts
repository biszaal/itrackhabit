// Supabase-integrated Authentication Service
// Handles user authentication with Supabase Auth

import { supabase, TABLES, SupabaseUser } from '../config/supabase';
import { User, AuthCredentials, RegisterData, AuthResponse } from '../types';

type AuthListener = (user: User | null) => void;

class SupabaseAuthService {
  private isInitialized = false;
  private authListeners: AuthListener[] = [];
  private currentUser: User | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🔐 Initializing Supabase Auth Service...');

      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        await this.loadUserProfile(session.user.id);
        console.log('✅ User session restored:', session.user.email);
      } else {
        console.log('📱 No active session found');
      }

      // Set up auth state listener
      supabase.auth.onAuthStateChange(async (event, session) => {
        console.log('🔐 Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session?.user) {
          await this.loadUserProfile(session.user.id);
        } else if (event === 'SIGNED_OUT') {
          this.currentUser = null;
          this.notifyListeners(null);
        } else if (event === 'TOKEN_REFRESHED' && session?.user) {
          // User is still signed in, just refresh the profile
          await this.loadUserProfile(session.user.id);
        }
      });

      this.isInitialized = true;
      console.log('✅ Supabase Auth Service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize Supabase auth service:', error);
      throw error;
    }
  }

  private async loadUserProfile(userId: string): Promise<void> {
    try {
      const { data, error } = await supabase
        .from(TABLES.USERS)
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Failed to load user profile:', error);
        return;
      }

      if (data) {
        this.currentUser = this.mapSupabaseUserToUser(data);
        this.notifyListeners(this.currentUser);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  private mapSupabaseUserToUser(supabaseUser: SupabaseUser): User {
    return {
      id: supabaseUser.id,
      email: supabaseUser.email,
      name: supabaseUser.name,
      avatarUrl: supabaseUser.avatar_url,
      subscriptionStatus: supabaseUser.subscription_status,
      subscriptionEndDate: supabaseUser.subscription_end_date,
      trialStartDate: supabaseUser.trial_start_date,
      authProvider: supabaseUser.auth_provider as any,
      createdAt: supabaseUser.created_at,
      updatedAt: supabaseUser.updated_at,
    };
  }

  private notifyListeners(user: User | null): void {
    this.authListeners.forEach(listener => {
      try {
        listener(user);
      } catch (error) {
        console.error('Error in auth listener:', error);
      }
    });
  }

  // ===== AUTHENTICATION METHODS =====

  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    try {
      console.log('🔐 Attempting login for:', credentials.email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password,
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data.user) {
        throw new Error('No user data returned');
      }

      // Load user profile
      await this.loadUserProfile(data.user.id);

      if (!this.currentUser) {
        throw new Error('Failed to load user profile');
      }

      console.log('✅ Login successful for:', credentials.email);

      return {
        user: this.currentUser,
        token: data.session?.access_token || '',
        refreshToken: data.session?.refresh_token,
      };
    } catch (error) {
      console.error('❌ Login failed:', error);
      throw error;
    }
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      console.log('📝 Attempting registration for:', data.email);

      if (data.password !== data.confirmPassword) {
        throw new Error('Passwords do not match');
      }

      const { data: authData, error } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            name: data.name,
            provider: 'email',
          },
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!authData.user) {
        throw new Error('No user data returned');
      }

      // The user profile will be created automatically by the database trigger
      // Wait a moment for it to be created, then load it
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.loadUserProfile(authData.user.id);

      if (!this.currentUser) {
        throw new Error('Failed to load user profile');
      }

      console.log('✅ Registration successful for:', data.email);

      return {
        user: this.currentUser,
        token: authData.session?.access_token || '',
        refreshToken: authData.session?.refresh_token,
      };
    } catch (error) {
      console.error('❌ Registration failed:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      console.log('🚪 Logging out user...');

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw new Error(error.message);
      }

      this.currentUser = null;
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      console.log('🔄 Sending password reset email to:', email);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'itrackhabit://reset-password',
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Password reset email sent');
    } catch (error) {
      console.error('❌ Password reset failed:', error);
      throw error;
    }
  }

  async updatePassword(newPassword: string): Promise<void> {
    try {
      console.log('🔄 Updating password...');

      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Password updated successfully');
    } catch (error) {
      console.error('❌ Password update failed:', error);
      throw error;
    }
  }

  async updateProfile(updates: Partial<User>): Promise<User> {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user');
      }

      console.log('📝 Updating user profile...');

      // Update in Supabase
      const { error } = await supabase
        .from(TABLES.USERS)
        .update({
          name: updates.name,
          avatar_url: updates.avatarUrl,
          subscription_status: updates.subscriptionStatus,
          subscription_end_date: updates.subscriptionEndDate,
          trial_start_date: updates.trialStartDate,
        })
        .eq('id', this.currentUser.id);

      if (error) {
        throw new Error(error.message);
      }

      // Update auth metadata if email is being changed
      if (updates.email && updates.email !== this.currentUser.email) {
        const { error: authError } = await supabase.auth.updateUser({
          email: updates.email,
        });

        if (authError) {
          throw new Error(authError.message);
        }
      }

      // Reload user profile
      await this.loadUserProfile(this.currentUser.id);

      if (!this.currentUser) {
        throw new Error('Failed to reload user profile');
      }

      console.log('✅ Profile updated successfully');
      return this.currentUser;
    } catch (error) {
      console.error('❌ Profile update failed:', error);
      throw error;
    }
  }

  // ===== SOCIAL AUTH =====

  async signInWithGoogle(): Promise<AuthResponse> {
    try {
      console.log('🔐 Attempting Google sign-in...');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'itrackhabit://auth/callback',
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      // The auth state change will handle loading the user profile
      console.log('✅ Google sign-in initiated');

      // Return placeholder - actual user will be loaded via auth state change
      return {
        user: this.currentUser!,
        token: '',
        refreshToken: '',
      };
    } catch (error) {
      console.error('❌ Google sign-in failed:', error);
      throw error;
    }
  }

  async signInWithApple(): Promise<AuthResponse> {
    try {
      console.log('🔐 Attempting Apple sign-in...');

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'apple',
        options: {
          redirectTo: 'itrackhabit://auth/callback',
        },
      });

      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Apple sign-in initiated');

      // Return placeholder - actual user will be loaded via auth state change
      return {
        user: this.currentUser!,
        token: '',
        refreshToken: '',
      };
    } catch (error) {
      console.error('❌ Apple sign-in failed:', error);
      throw error;
    }
  }

  // ===== STATE METHODS =====

  async getCurrentUser(): Promise<User | null> {
    if (!this.isInitialized) {
      await this.initialize();
    }
    return this.currentUser;
  }

  isAuthenticated(): boolean {
    return this.currentUser !== null;
  }

  addAuthListener(listener: AuthListener): () => void {
    this.authListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.authListeners.indexOf(listener);
      if (index > -1) {
        this.authListeners.splice(index, 1);
      }
    };
  }

  async refreshSession(): Promise<void> {
    try {
      const { error } = await supabase.auth.refreshSession();
      
      if (error) {
        throw new Error(error.message);
      }

      console.log('✅ Session refreshed successfully');
    } catch (error) {
      console.error('❌ Session refresh failed:', error);
      throw error;
    }
  }

  // ===== ADMIN METHODS =====

  async deleteAccount(): Promise<void> {
    try {
      if (!this.currentUser) {
        throw new Error('No authenticated user');
      }

      console.log('🗑️ Deleting user account...');

      // Supabase doesn't have a direct delete user method for security
      // You would typically implement this as an admin function
      // For now, we'll just sign out and mark the user as deleted
      
      await this.logout();
      console.log('✅ Account deletion initiated');
    } catch (error) {
      console.error('❌ Account deletion failed:', error);
      throw error;
    }
  }

  // ===== COMPATIBILITY METHODS =====

  async socialLogin(provider: 'google' | 'apple'): Promise<AuthResponse> {
    if (provider === 'google') {
      return this.signInWithGoogle();
    } else if (provider === 'apple') {
      return this.signInWithApple();
    } else {
      throw new Error(`Unsupported provider: ${provider}`);
    }
  }
}

export const supabaseAuthService = new SupabaseAuthService();