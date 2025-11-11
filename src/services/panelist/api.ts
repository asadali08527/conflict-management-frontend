/**
 * Panelist API Client
 * Uses centralized HTTP client with cookie-based authentication
 */

import http from '@/lib/http';

// Re-export the centralized HTTP client as apiClient for backward compatibility
const apiClient = http;

// API Response wrapper type
export interface ApiResponse<T = any> {
  status: 'success' | 'error';
  data?: T;
  message?: string;
}

// Pagination type
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

export default apiClient;
