// API Configuration for iTrackHabit
// Backend API client for React Native app

import AsyncStorage from '@react-native-async-storage/async-storage';

// Environment variables for backend API connection
const API_BASE_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001';

if (!API_BASE_URL) {
  console.warn('⚠️ Backend API URL not found. Please check your environment variables.');
}

// API Configuration
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 10000, // 10 seconds
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
      VERIFY_EMAIL: '/auth/verify-email',
    },
    // User Management
    USERS: {
      PROFILE: '/users/profile',
      UPDATE_PROFILE: '/users/profile',
      DELETE_ACCOUNT: '/users/account',
      SUBSCRIPTION: '/users/subscription',
    },
    // Habits
    HABITS: {
      LIST: '/habits',
      CREATE: '/habits',
      GET: '/habits/:id',
      UPDATE: '/habits/:id',
      DELETE: '/habits/:id',
      PROGRESS: '/habits/:id/progress',
      STATS: '/habits/:id/stats',
    },
    // Social Features
    FRIENDS: {
      LIST: '/api/friends',
      REQUESTS: '/api/friend-requests',
      SEND_REQUEST: '/api/friend-requests',
      ACCEPT_REQUEST: '/api/friend-requests/:id/accept',
      DECLINE_REQUEST: '/api/friend-requests/:id/decline',
      REMOVE_FRIEND: '/api/friends/:id',
      SEARCH: '/api/friends/search',
    },
    // Challenges
    CHALLENGES: {
      LIST: '/challenges',
      CREATE: '/challenges',
      GET: '/challenges/:id',
      JOIN: '/challenges/:id/join',
      LEAVE: '/challenges/:id/leave',
      PARTICIPANTS: '/challenges/:id/participants',
    },
    // Badges
    BADGES: {
      LIST: '/api/badges',
      USER_BADGES: '/api/users/badges',
      PROGRESS: '/api/badges/progress',
    },
    // Health Data
    HEALTH: {
      SYNC: '/health/sync',
      DATA: '/health/data',
      PERMISSIONS: '/health/permissions',
    },
  },
} as const;

// API Client Class
class ApiClient {
  private baseURL: string;
  private timeout: number;

  constructor(baseURL: string, timeout: number = 10000) {
    this.baseURL = baseURL;
    this.timeout = timeout;
  }

  // Get stored auth token
  private async getAuthToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Failed to get auth token:', error);
      return null;
    }
  }

  // Store auth token
  private async setAuthToken(token: string): Promise<void> {
    try {
      await AsyncStorage.setItem('auth_token', token);
    } catch (error) {
      console.error('Failed to store auth token:', error);
    }
  }

  // Remove auth token
  private async removeAuthToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem('auth_token');
    } catch (error) {
      console.error('Failed to remove auth token:', error);
    }
  }

  // Build request headers
  private async buildHeaders(includeAuth: boolean = true): Promise<Headers> {
    const headers = new Headers({
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    });

    if (includeAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    return headers;
  }

  // Make HTTP request
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    includeAuth: boolean = true
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.buildHeaders(includeAuth);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...Object.fromEntries(headers.entries()),
          ...options.headers,
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      // Handle authentication errors
      if (response.status === 401) {
        await this.removeAuthToken();
        throw new Error('Authentication required');
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        throw new Error('Request timeout');
      }
      
      throw error;
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' }, includeAuth);
  }

  async post<T>(
    endpoint: string,
    data?: any,
    includeAuth: boolean = true
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth
    );
  }

  async put<T>(
    endpoint: string,
    data?: any,
    includeAuth: boolean = true
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth
    );
  }

  async patch<T>(
    endpoint: string,
    data?: any,
    includeAuth: boolean = true
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PATCH',
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth
    );
  }

  async delete<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' }, includeAuth);
  }

  // Auth helper methods
  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    const result = await this.post<{ token: string; user: any }>(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      { email, password },
      false
    );
    
    await this.setAuthToken(result.token);
    return result;
  }

  async logout(): Promise<void> {
    try {
      await this.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.warn('Logout request failed:', error);
    } finally {
      await this.removeAuthToken();
    }
  }

  async refreshToken(): Promise<{ token: string }> {
    const result = await this.post<{ token: string }>(
      API_CONFIG.ENDPOINTS.AUTH.REFRESH
    );
    
    await this.setAuthToken(result.token);
    return result;
  }

  // Utility method to replace path parameters
  replacePath(path: string, params: Record<string, string | number>): string {
    let result = path;
    Object.entries(params).forEach(([key, value]) => {
      result = result.replace(`:${key}`, String(value));
    });
    return result;
  }
}

// Create singleton instance
export const apiClient = new ApiClient(API_CONFIG.BASE_URL, API_CONFIG.TIMEOUT);

// Export types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: string;
  message: string;
  statusCode?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// API Response wrapper for consistent handling
export const handleApiResponse = <T>(
  promise: Promise<T>
): Promise<T> => {
  return promise.catch((error) => {
    console.error('API Error:', error);
    throw error;
  });
};

// Network connectivity check
export const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
      method: 'GET',
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
};