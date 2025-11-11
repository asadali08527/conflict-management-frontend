/**
 * HTTP Error Handler Utility
 * Provides centralized error handling and normalization for API requests
 */

import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  status?: number;
  code?: string;
  details?: any;
}

/**
 * Normalizes API errors into a consistent format
 */
export const normalizeApiError = (error: unknown): ApiError => {
  if (error instanceof AxiosError) {
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message;
    const code = error.response?.data?.code || error.code;

    return {
      message,
      status,
      code,
      details: error.response?.data,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: 'An unexpected error occurred',
  };
};

/**
 * Logs API errors in a structured format (production-safe)
 */
export const logApiError = (error: ApiError, context?: string): void => {
  // In production, use a proper logging service (e.g., Sentry)
  if (import.meta.env.PROD) {
    // Send to logging service
    console.error('[API Error]', {
      context,
      message: error.message,
      status: error.status,
      code: error.code,
    });
  } else {
    // Development: more verbose logging
    console.error(`[API Error]${context ? ` ${context}` : ''}`, error);
  }
};

/**
 * Handles common HTTP error responses
 */
export const handleHttpError = (error: ApiError): void => {
  switch (error.status) {
    case 401:
      // Handle unauthorized - will be caught by interceptor
      break;
    case 403:
      console.warn('Access forbidden:', error.message);
      break;
    case 404:
      console.warn('Resource not found:', error.message);
      break;
    case 429:
      console.warn('Rate limit exceeded:', error.message);
      break;
    case 500:
    case 502:
    case 503:
    case 504:
      console.error('Server error:', error.message);
      break;
    default:
      console.error('API error:', error.message);
  }
};
