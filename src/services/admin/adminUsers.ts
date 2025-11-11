import http from '@/lib/http';
import { API_CONFIG } from '@/lib/api';
import {
  GetUsersParams,
  GetUsersResponse,
  GetAdminsResponse,
  ToggleUserStatusResponse,
} from '@/types/admin.types';

export const adminUsersService = {
  /**
   * Get all users with pagination and filtering
   */
  getUsers: async (params: GetUsersParams = {}): Promise<GetUsersResponse> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.role) queryParams.append('role', params.role);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.search) queryParams.append('search', params.search);

    const endpoint = `${API_CONFIG.ENDPOINTS.ADMIN.USERS.LIST}?${queryParams.toString()}`;

    const response = await http.get<GetUsersResponse>(endpoint);
    return response.data;
  },

  /**
   * Get all admin users with case statistics
   */
  getAdmins: async (): Promise<GetAdminsResponse> => {
    const response = await http.get<GetAdminsResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.USERS.ADMINS
    );
    return response.data;
  },

  /**
   * Toggle user active status
   */
  toggleUserStatus: async (userId: string): Promise<ToggleUserStatusResponse> => {
    const response = await http.patch<ToggleUserStatusResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.USERS.TOGGLE_STATUS(userId)
    );
    return response.data;
  },
};
