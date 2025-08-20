// API Service for connecting to backend API instead of direct Supabase
import { FriendWithDetails, FriendRequest, User, Challenge, Habit } from '../types';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001';

class ApiService {
  private baseUrl: string;
  private authToken: string | null = null;

  constructor() {
    this.baseUrl = BACKEND_URL;
  }

  setAuthToken(token: string) {
    this.authToken = token;
  }

  clearAuthToken() {
    this.authToken = null;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.authToken) {
      headers.Authorization = `Bearer ${this.authToken}`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Request failed' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Health check
  async checkHealth(): Promise<{ status: string; message: string }> {
    return this.request('/health');
  }

  // ===== FRIENDS OPERATIONS =====

  async getFriends(): Promise<FriendWithDetails[]> {
    if (!this.authToken) {
      console.log('No auth token, returning empty friends list');
      return [];
    }
    return this.request('/api/friends');
  }

  async getFriendRequests(): Promise<FriendRequest[]> {
    if (!this.authToken) {
      console.log('No auth token, returning empty friend requests');
      return [];
    }
    return this.request('/api/friend-requests');
  }

  async searchUsers(query: string): Promise<User[]> {
    if (!this.authToken || query.length < 2) {
      return [];
    }
    return this.request(`/api/users/search?q=${encodeURIComponent(query)}`);
  }

  // ===== CHALLENGES OPERATIONS =====

  async getActiveChallenges(): Promise<Challenge[]> {
    if (!this.authToken) {
      console.log('No auth token, returning empty active challenges');
      return [];
    }
    return this.request('/api/challenges/active');
  }

  async getAvailableChallenges(): Promise<Challenge[]> {
    if (!this.authToken) {
      console.log('No auth token, returning empty available challenges');
      return [];
    }
    return this.request('/api/challenges/available');
  }

  async joinChallenge(challengeId: string): Promise<void> {
    if (!this.authToken) {
      throw new Error('Must be authenticated to join challenges');
    }
    await this.request(`/api/challenges/${challengeId}/join`, {
      method: 'POST',
    });
  }

  async leaveChallenge(challengeId: string): Promise<void> {
    if (!this.authToken) {
      throw new Error('Must be authenticated to leave challenges');
    }
    await this.request(`/api/challenges/${challengeId}/leave`, {
      method: 'POST',
    });
  }

  // ===== AUTH METHODS =====

  async register(email: string, password: string, name: string): Promise<{ user: User; token: string }> {
    const response = await this.request<{ user: User; token: string }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    
    // Set token for future requests
    this.setAuthToken(response.token);
    return response;
  }

  async login(email: string, password: string): Promise<{ user: User; token: string }> {
    const response = await this.request<{ user: User; token: string }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    
    // Set token for future requests
    this.setAuthToken(response.token);
    return response;
  }

  async getCurrentUser(): Promise<User> {
    if (!this.authToken) {
      throw new Error('Not authenticated');
    }
    return this.request<User>('/api/auth/me');
  }

  // ===== HABITS OPERATIONS =====

  async getHabits(): Promise<Habit[]> {
    if (!this.authToken) {
      console.log('No auth token, returning empty habits list');
      return [];
    }
    return this.request('/api/habits');
  }

  async createDefaultHabits(): Promise<{ habits: Habit[] }> {
    if (!this.authToken) {
      throw new Error('Must be authenticated to create habits');
    }
    return this.request('/api/habits/create-defaults', {
      method: 'POST',
    });
  }

  async markHabitProgress(habitId: string, progressData: any): Promise<any> {
    if (!this.authToken) {
      throw new Error('Must be authenticated to mark progress');
    }
    return this.request(`/api/habits/${habitId}/progress`, {
      method: 'POST',
      body: JSON.stringify(progressData),
    });
  }

  // ===== AUTH HELPERS =====

  isAuthenticated(): boolean {
    return !!this.authToken;
  }

  getConnectionStatus(): boolean {
    // For compatibility with existing code that checks network status
    return true; // API service handles connection internally
  }
}

export const apiService = new ApiService();