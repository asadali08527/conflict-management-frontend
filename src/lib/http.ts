/**
 * Centralized HTTP Client
 * Implements cookie-based authentication with CSRF protection
 * Replaces all localStorage token handling with secure HttpOnly cookies
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { normalizeApiError, logApiError } from './httpErrorHandler';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

/**
 * Get CSRF token from cookie
 */
const getCsrfToken = (): string | null => {
  const match = document.cookie.match(/csrftoken=([^;]+)/);
  return match ? match[1] : null;
};

/**
 * Create the main HTTP client with security configurations
 */
const http: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // Enable sending HttpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 seconds
});

/**
 * Request interceptor - Add CSRF token to requests
 */
http.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Add CSRF token for state-changing requests
    if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
      const csrfToken = getCsrfToken();
      if (csrfToken) {
        config.headers['X-CSRF-Token'] = csrfToken;
      }
    }

    // Don't set Content-Type for FormData (browser will set it with boundary)
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor - Handle errors and auth failures
 */
http.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    const normalizedError = normalizeApiError(error);

    // Log error (production-safe)
    logApiError(normalizedError, `${error.config?.method?.toUpperCase()} ${error.config?.url}`);

    // Handle 401 Unauthorized - session expired
    if (error.response?.status === 401) {
      // Redirect to appropriate login based on current path
      const path = window.location.pathname;

      if (path.startsWith('/admin')) {
        if (path !== '/admin/login') {
          window.location.href = '/admin/login';
        }
      } else if (path.startsWith('/panelist')) {
        if (path !== '/panelist/login') {
          window.location.href = '/panelist/login';
        }
      } else if (path.startsWith('/client')) {
        if (path !== '/') {
          window.location.href = '/';
        }
      }
    }

    return Promise.reject(normalizedError);
  }
);

/**
 * API Response wrapper type
 */
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

/**
 * Extract data from API response
 */
export const extractData = <T>(response: ApiResponse<T>): T => {
  if (response.status === 'error' || !response.data) {
    throw new Error(response.message || 'An error occurred');
  }
  return response.data;
};

/**
 * Pagination types
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResponse {
  current: number;
  pages: number;
  total: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export default http;
