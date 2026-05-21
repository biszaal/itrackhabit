export const API_CONFIG = {
  baseURL: process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:3001',
  timeout: parseInt(process.env.EXPO_PUBLIC_API_TIMEOUT || '30000'),
  retryAttempts: 3,
  retryDelay: 1000,
  ENDPOINTS: {
    AUTH: '/auth',
    USERS: '/users',
    HABITS: '/habits',
    PROGRESS: '/progress',
    FRIENDS: {
      LIST: '/friends',
      REQUESTS: '/friends/requests',
      SEARCH: '/friends/search',
      SEND_REQUEST: '/friends/send-request',
      ACCEPT_REQUEST: '/friends/accept-request',
      DECLINE_REQUEST: '/friends/decline-request',
      REMOVE_FRIEND: '/friends/remove'
    },
    CHALLENGES: {
      LIST: '/challenges',
      GET: '/challenges/:id',
      CREATE: '/challenges',
      JOIN: '/challenges/:id/join',
      LEAVE: '/challenges/:id/leave',
      PARTICIPANTS: '/challenges/:id/participants'
    },
    ACHIEVEMENTS: '/achievements',
    SOCIAL: '/social',
    PREMIUM: '/premium',
    NOTIFICATIONS: '/notifications',
    HEALTH: '/health',
    ANALYTICS: '/analytics',
    BADGES: {
      CHECK_ACHIEVEMENTS: '/badges/check-achievements'
    },
  },
};

export const apiClient = {
  get: async <T = any>(url: string, config?: RequestInit): Promise<T> => {
    const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
      method: 'GET',
      ...config,
    });
    return response.json();
  },
  
  post: async <T = any>(url: string, data?: any, config?: RequestInit): Promise<T> => {
    const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      body: JSON.stringify(data),
      ...config,
    });
    return response.json();
  },
  
  put: async <T = any>(url: string, data?: any, config?: RequestInit): Promise<T> => {
    const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...config?.headers,
      },
      body: JSON.stringify(data),
      ...config,
    });
    return response.json();
  },
  
  delete: async <T = any>(url: string, config?: RequestInit): Promise<T> => {
    const response = await fetch(`${API_CONFIG.baseURL}${url}`, {
      method: 'DELETE',
      ...config,
    });
    return response.json();
  },
  
  replacePath: (template: string, params: Record<string, string>) => {
    let result = template;
    Object.keys(params).forEach(key => {
      result = result.replace(`:${key}`, params[key]);
    });
    return result;
  },
};