import http from '@/lib/http';
import { API_CONFIG } from '@/lib/api';
import { AdminLoginPayload, AdminRegisterPayload, AdminAuthResponse, AdminUser } from '@/types/admin.types';

export const adminAuthService = {
  register: async (payload: AdminRegisterPayload): Promise<AdminAuthResponse> => {
    const response = await http.post<AdminAuthResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.AUTH.REGISTER,
      payload
    );

    // Store non-sensitive admin user info in sessionStorage
    if (response.data.data.user) {
      sessionStorage.setItem('admin_user', JSON.stringify(response.data.data.user));
    }

    return response.data;
  },

  login: async (payload: AdminLoginPayload): Promise<AdminAuthResponse> => {
    const response = await http.post<AdminAuthResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.AUTH.LOGIN,
      payload
    );

    // Store non-sensitive admin user info in sessionStorage
    if (response.data.data.user) {
      sessionStorage.setItem('admin_user', JSON.stringify(response.data.data.user));
    }

    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      // Call backend to clear HttpOnly cookies
      await http.post('/api/admin/auth/logout');
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      // Clear local state regardless of API call result
      sessionStorage.removeItem('admin_user');
    }
  },

  getStoredUser: (): AdminUser | null => {
    const user = sessionStorage.getItem('admin_user');
    return user ? JSON.parse(user) : null;
  },

  isAuthenticated: (): boolean => {
    // Check if user info exists in sessionStorage
    // Actual auth is validated by HttpOnly cookie on each request
    return !!sessionStorage.getItem('admin_user');
  },
};
