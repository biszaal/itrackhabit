// API Configuration for iTrackHabit
// Backend API client for React Native app

import AsyncStorage from "@react-native-async-storage/async-storage";

// Environment variable validation
const validateEnvVariables = () => {
  const required = {
    EXPO_PUBLIC_BACKEND_URL: process.env.EXPO_PUBLIC_BACKEND_URL,
  };

  const optional = {
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_ANON_KEY: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY,
    EXPO_PUBLIC_API_TIMEOUT: process.env.EXPO_PUBLIC_API_TIMEOUT,
  };

  // Check required variables
  const missing = Object.entries(required)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    console.error(
      "❌ Missing required environment variables:",
      missing.join(", ")
    );
    console.error("Please create a .env.local file based on .env.example");
  }

  // Log optional variables status
  const missingOptional = Object.entries(optional)
    .filter(([key, value]) => !value)
    .map(([key]) => key);

  if (missingOptional.length > 0) {
    console.warn(
      "⚠️ Optional environment variables not set:",
      missingOptional.join(", ")
    );
  }

  return missing.length === 0;
};

// Validate on load
const isValid = validateEnvVariables();

// Environment variables for backend API connection
const API_BASE_URL =
  process.env.EXPO_PUBLIC_BACKEND_URL || "https://itrackhabit-backend.vercel.app";

if (!isValid) {
  console.warn(
    "⚠️ Running with missing environment variables. Some features may not work correctly."
  );
}

// API Configuration
export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 10000, // 10 seconds
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: "/api/auth/login",
      REGISTER: "/api/auth/register",
      LOGOUT: "/api/auth/logout",
      REFRESH: "/api/auth/refresh",
      FORGOT_PASSWORD: "/api/auth/forgot-password",
      RESET_PASSWORD: "/api/auth/reset-password",
      VERIFY_EMAIL: "/api/auth/verify-email",
      ME: "/api/auth/me",
    },
    // User Management
    USERS: {
      PROFILE: "/api/users/profile",
      UPDATE_PROFILE: "/api/users/profile",
      DELETE_ACCOUNT: "/api/users/account",
      SUBSCRIPTION: "/api/users/subscription",
    },
    // Habits
    HABITS: {
      LIST: "/api/habits",
      CREATE: "/api/habits",
      GET: "/api/habits/:id",
      UPDATE: "/api/habits/:id",
      DELETE: "/api/habits/:id",
      PROGRESS: "/api/habits/:id/progress",
      STATS: "/api/habits/:id/stats",
      CREATE_DEFAULTS: "/api/habits/create-defaults",
    },
    // Social Features
    FRIENDS: {
      LIST: "/api/friends",
      PENDING: "/api/friends/pending",
      SEARCH: "/api/friends/search",
      SEND_REQUEST: "/api/friends/request",
      ACCEPT: "/api/friends/:id/accept",
      REJECT: "/api/friends/:id/reject",
      REMOVE: "/api/friends/:id",
      BLOCK: "/api/friends/:id/block",
    },
    // Challenges
    CHALLENGES: {
      LIST: "/api/challenges",
      ACTIVE: "/api/challenges/active",
      AVAILABLE: "/api/challenges/available",
      FRIENDS: "/api/challenges/friends",
      CREATE: "/api/challenges",
      GET: "/api/challenges/:id",
      JOIN: "/api/challenges/:id/join",
      LEAVE: "/api/challenges/:id/leave",
      PROGRESS: "/api/challenges/:id/progress",
      UPDATE_PROGRESS: "/api/challenges/:id/progress",
    },
    // Badges
    BADGES: {
      LIST: "/api/badges",
      USER_BADGES: "/api/users/badges",
      PROGRESS: "/api/badges/progress",
    },
    // Health Data
    HEALTH: {
      SYNC: "/api/health/sync",
      DATA: "/api/health/data",
      PERMISSIONS: "/api/health/permissions",
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
      const token = await AsyncStorage.getItem("auth_token");
      if (token) {
        console.log("✅ ApiClient: Token found in storage");
      } else {
        console.log("⚠️ ApiClient: No token found in storage");
      }
      return token;
    } catch (error) {
      console.error("❌ ApiClient: Failed to get auth token:", error);
      return null;
    }
  }

  // Store auth token
  private async setAuthToken(token: string): Promise<void> {
    try {
      if (token && token !== 'undefined' && token !== 'null') {
        await AsyncStorage.setItem("auth_token", token);
        console.log("✅ Token stored successfully");
      } else {
        console.warn("⚠️ Invalid token received:", token);
        await AsyncStorage.removeItem("auth_token");
      }
    } catch (error) {
      console.error("Failed to store auth token:", error);
    }
  }

  // Remove auth token
  private async removeAuthToken(): Promise<void> {
    try {
      await AsyncStorage.removeItem("auth_token");
    } catch (error) {
      console.error("Failed to remove auth token:", error);
    }
  }

  // Build request headers
  private async buildHeaders(includeAuth: boolean = true): Promise<Headers> {
    const headers = new Headers({
      "Content-Type": "application/json",
      Accept: "application/json",
    });

    if (includeAuth) {
      const token = await this.getAuthToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
        console.log("🔐 ApiClient: Authorization header added");
      } else {
        console.log("⚠️ ApiClient: No token to add to headers");
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
    // Local-only mode: no network calls, fail fast so consumers fall back
    // to their offline path without waiting for a 10-second timeout.
    try {
      const { LOCAL_ONLY } = require("./runtime");
      if (LOCAL_ONLY) {
        throw new Error("LOCAL_ONLY: backend disabled");
      }
    } catch (e) {
      if (e instanceof Error && e.message.startsWith("LOCAL_ONLY")) throw e;
    }

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
        console.error("❌ ApiClient: Got 401 Unauthorized");
        console.error("   Endpoint:", endpoint);
        // Don't auto-remove token here - let BackendAuthService handle it
        // This way we don't lose tokens on temporary network issues
        throw new Error("Authentication required");
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === "AbortError") {
        throw new Error("Request timeout");
      }

      throw error;
    }
  }

  // HTTP Methods
  async get<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, { method: "GET" }, includeAuth);
  }

  async post<T>(
    endpoint: string,
    data?: any,
    includeAuth: boolean = true
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: "POST",
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
        method: "PUT",
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
        method: "PATCH",
        body: data ? JSON.stringify(data) : undefined,
      },
      includeAuth
    );
  }

  async delete<T>(endpoint: string, includeAuth: boolean = true): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" }, includeAuth);
  }

  // Auth helper methods
  async login(
    email: string,
    password: string
  ): Promise<{ token: string; user: any }> {
    try {
      const result = await this.post<{ token: string; user: any }>(
        API_CONFIG.ENDPOINTS.AUTH.LOGIN,
        { email, password },
        false
      );

      console.log("🔍 Login response:", result);
      
      if (result && result.token) {
        await this.setAuthToken(result.token);
        return result;
      } else {
        throw new Error("No token received from server");
      }
    } catch (error) {
      console.error("❌ Login error:", error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    try {
      await this.post(API_CONFIG.ENDPOINTS.AUTH.LOGOUT);
    } catch (error) {
      console.warn("Logout request failed:", error);
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
export const handleApiResponse = <T>(promise: Promise<T>): Promise<T> => {
  return promise.catch((error) => {
    console.error("API Error:", error);
    throw error;
  });
};

// Network connectivity check
export const checkNetworkConnectivity = async (): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(`${API_CONFIG.BASE_URL}/health`, {
      method: "GET",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
};
