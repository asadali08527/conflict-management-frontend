/**
 * Client API Client
 * Uses centralized HTTP client with cookie-based authentication
 */

import http from '@/lib/http';

// Re-export the centralized HTTP client as clientApiClient for backward compatibility
export const clientApiClient = http;

/**
 * API Response wrapper type
 */
export interface ApiResponse<T> {
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
