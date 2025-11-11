import http from '@/lib/http';
import { API_CONFIG } from '@/lib/api';
import {
  GetCasesParams,
  GetCasesResponse,
  DetailedCaseResponse,
  UpdateCaseStatusPayload,
  UpdateCaseStatusResponse,
  AddNotePayload,
  AddNoteResponse,
  AssignCasePayload,
  AssignCaseResponse,
  UpdatePriorityPayload,
  UpdatePriorityResponse,
  CaseFilesResponse,
  DashboardStatsResponse,
  StatisticsByAdminResponse,
} from '@/types/admin.types';

export const adminCasesService = {
  /**
   * Get dashboard statistics
   */
  getDashboardStats: async (): Promise<DashboardStatsResponse> => {
    const response = await http.get<DashboardStatsResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.DASHBOARD.STATS
    );
    return response.data;
  },

  /**
   * Get statistics by admin
   */
  getStatisticsByAdmin: async (): Promise<StatisticsByAdminResponse> => {
    const response = await http.get<StatisticsByAdminResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.STATISTICS.BY_ADMIN
    );
    return response.data;
  },

  /**
   * Get all cases with pagination, filtering, and search
   */
  getCases: async (params: GetCasesParams = {}): Promise<GetCasesResponse> => {
    const response = await http.get<GetCasesResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.CASES.LIST,
      { params }
    );
    return response.data;
  },

  /**
   * Get my assigned cases
   */
  getMyAssignments: async (params: GetCasesParams = {}): Promise<GetCasesResponse> => {
    const response = await http.get<GetCasesResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.CASES.MY_ASSIGNMENTS,
      { params }
    );
    return response.data;
  },

  /**
   * Get detailed case information including both parties' submissions
   */
  getCaseDetails: async (caseId: string): Promise<DetailedCaseResponse> => {
    const response = await http.get<DetailedCaseResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.CASES.DETAILED(caseId)
    );
    return response.data;
  },

  /**
   * Get all files for a case
   */
  getCaseFiles: async (caseId: string): Promise<CaseFilesResponse> => {
    const response = await http.get<CaseFilesResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.CASES.FILES(caseId)
    );
    return response.data;
  },

  /**
   * Update case status with optional resolution details, feedback, and next steps
   */
  updateCaseStatus: async (
    caseId: string,
    payload: UpdateCaseStatusPayload
  ): Promise<UpdateCaseStatusResponse> => {
    const response = await http.patch<UpdateCaseStatusResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.CASES.UPDATE_STATUS(caseId),
      payload
    );
    return response.data;
  },

  /**
   * Assign case to an admin
   */
  assignCase: async (
    caseId: string,
    payload: AssignCasePayload
  ): Promise<AssignCaseResponse> => {
    const response = await http.patch<AssignCaseResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.CASES.ASSIGN(caseId),
      payload
    );
    return response.data;
  },

  /**
   * Unassign case
   */
  unassignCase: async (caseId: string): Promise<AssignCaseResponse> => {
    const response = await http.patch<AssignCaseResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.CASES.UNASSIGN(caseId)
    );
    return response.data;
  },

  /**
   * Update case priority
   */
  updateCasePriority: async (
    caseId: string,
    payload: UpdatePriorityPayload
  ): Promise<UpdatePriorityResponse> => {
    const response = await http.patch<UpdatePriorityResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.CASES.UPDATE_PRIORITY(caseId),
      payload
    );
    return response.data;
  },

  /**
   * Add a note to a case
   */
  addNote: async (
    caseId: string,
    payload: AddNotePayload
  ): Promise<AddNoteResponse> => {
    const response = await http.post<AddNoteResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.CASES.ADD_NOTE(caseId),
      payload
    );
    return response.data;
  },
};
