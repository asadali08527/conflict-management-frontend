import http from '@/lib/http';
import { API_CONFIG } from '@/lib/api';
import {
  GetPanelistsParams,
  GetPanelistsResponse,
  GetPanelistResponse,
  GetAvailablePanelistsParams,
  GetAvailablePanelistsResponse,
  CreatePanelistPayload,
  CreatePanelistResponse,
  UpdatePanelistPayload,
  UpdatePanelistResponse,
  DeactivatePanelistResponse,
  GetPanelistCasesParams,
  GetPanelistCasesResponse,
  AssignPanelPayload,
  AssignPanelResponse,
  RemovePanelistResponse,
  GetPanelStatisticsResponse,
  CreatePanelistAccountPayload,
  CreatePanelistAccountResponse,
  ResetPanelistPasswordPayload,
  ResetPanelistPasswordResponse,
  GetPanelistPerformanceResponse,
} from '@/types/panelist.types';

export const adminPanelistsService = {
  /**
   * Get all panelists with pagination, filtering, and search
   */
  getPanelists: async (params: GetPanelistsParams = {}): Promise<GetPanelistsResponse> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.specialization) queryParams.append('specialization', params.specialization);
    if (params.availability) queryParams.append('availability', params.availability);
    if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.search) queryParams.append('search', params.search);

    const endpoint = `${API_CONFIG.ENDPOINTS.ADMIN.PANELISTS.LIST}?${queryParams.toString()}`;

    const response = await http.get<GetPanelistsResponse>(endpoint);
    return response.data;
  },

  /**
   * Get available panelists (optionally filtered by case type)
   */
  getAvailablePanelists: async (
    params: GetAvailablePanelistsParams = {}
  ): Promise<GetAvailablePanelistsResponse> => {
    const queryParams = new URLSearchParams();
    if (params.caseType) queryParams.append('caseType', params.caseType);

    const endpoint = `${API_CONFIG.ENDPOINTS.ADMIN.PANELISTS.AVAILABLE}?${queryParams.toString()}`;

    const response = await http.get<GetAvailablePanelistsResponse>(endpoint);
    return response.data;
  },

  /**
   * Get panelist by ID with details
   */
  getPanelistById: async (panelistId: string): Promise<GetPanelistResponse> => {
    const response = await http.get<GetPanelistResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.PANELISTS.GET(panelistId)
    );
    return response.data;
  },

  /**
   * Create a new panelist
   */
  createPanelist: async (payload: CreatePanelistPayload): Promise<CreatePanelistResponse> => {
    const response = await http.post<CreatePanelistResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.PANELISTS.CREATE,
      payload
    );
    return response.data;
  },

  /**
   * Update panelist information
   */
  updatePanelist: async (
    panelistId: string,
    payload: UpdatePanelistPayload
  ): Promise<UpdatePanelistResponse> => {
    const response = await http.patch<UpdatePanelistResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.PANELISTS.UPDATE(panelistId),
      payload
    );
    return response.data;
  },

  /**
   * Deactivate a panelist
   */
  deactivatePanelist: async (panelistId: string): Promise<DeactivatePanelistResponse> => {
    const response = await http.delete<DeactivatePanelistResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.PANELISTS.DEACTIVATE(panelistId)
    );
    return response.data;
  },

  /**
   * Get cases for a specific panelist
   */
  getPanelistCases: async (
    panelistId: string,
    params: GetPanelistCasesParams = {}
  ): Promise<GetPanelistCasesResponse> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const endpoint = `${API_CONFIG.ENDPOINTS.ADMIN.PANELISTS.GET_CASES(panelistId)}?${queryParams.toString()}`;

    const response = await http.get<GetPanelistCasesResponse>(endpoint);
    return response.data;
  },

  /**
   * Assign panel to a case
   */
  assignPanelToCase: async (
    caseId: string,
    payload: AssignPanelPayload
  ): Promise<AssignPanelResponse> => {
    const response = await http.post<AssignPanelResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.PANELISTS.ASSIGN_PANEL(caseId),
      payload
    );
    return response.data;
  },

  /**
   * Remove panelist from a case
   */
  removePanelistFromCase: async (
    caseId: string,
    panelistId: string
  ): Promise<RemovePanelistResponse> => {
    const response = await http.delete<RemovePanelistResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.PANELISTS.REMOVE_PANELIST(caseId, panelistId)
    );
    return response.data;
  },

  /**
   * Get panelist statistics
   */
  getPanelistStatistics: async (): Promise<GetPanelStatisticsResponse> => {
    const response = await http.get<GetPanelStatisticsResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.PANELISTS.STATISTICS
    );
    return response.data;
  },

  /**
   * Get panel statistics (dashboard)
   */
  getPanelStatistics: async (): Promise<GetPanelStatisticsResponse> => {
    const response = await http.get<GetPanelStatisticsResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.PANEL.STATISTICS
    );
    return response.data;
  },

  /**
   * Create panelist account
   */
  createPanelistAccount: async (
    panelistId: string,
    payload: CreatePanelistAccountPayload
  ): Promise<CreatePanelistAccountResponse> => {
    const response = await http.post<CreatePanelistAccountResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.PANELISTS.CREATE_ACCOUNT(panelistId),
      payload
    );
    return response.data;
  },

  /**
   * Reset panelist password
   */
  resetPanelistPassword: async (
    panelistId: string,
    payload: ResetPanelistPasswordPayload
  ): Promise<ResetPanelistPasswordResponse> => {
    const response = await http.post<ResetPanelistPasswordResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.PANELISTS.RESET_PASSWORD(panelistId),
      payload
    );
    return response.data;
  },

  /**
   * Get panelist performance metrics
   */
  getPanelistPerformance: async (
    panelistId: string
  ): Promise<GetPanelistPerformanceResponse> => {
    const response = await http.get<GetPanelistPerformanceResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.PANELISTS.PERFORMANCE(panelistId)
    );
    return response.data;
  },
};
