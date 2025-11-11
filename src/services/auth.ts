import http from '@/lib/http';
import { API_CONFIG } from '@/lib/api';
import { RegisterPayload, LoginPayload, AuthResponse } from '@/types/auth';

export const authService = {
  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const response = await http.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.AUTH.REGISTER,
      payload
    );
    return response.data;
  },

  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const response = await http.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.AUTH.LOGIN,
      payload
    );
    return response.data;
  },

  googleLogin: async (idToken: string): Promise<AuthResponse> => {
    const response = await http.post<AuthResponse>(
      API_CONFIG.ENDPOINTS.AUTH.GOOGLE,
      { idToken }
    );
    return response.data;
  },

  logout: async (): Promise<void> => {
    try {
      // Call backend to clear HttpOnly cookies
      await http.post('/api/auth/logout');
    } catch (error) {
      // Even if the request fails, we should still clear local state
      console.error('Logout request failed:', error);
    }
  },
};