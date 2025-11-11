import http from '@/lib/http';
import { API_CONFIG } from '@/lib/api';
import {
  ScheduleMeetingPayload,
  ScheduleMeetingResponse,
  UpdateMeetingPayload,
  UpdateMeetingResponse,
  GetMeetingsParams,
  GetMeetingsResponse,
  GetMeetingResponse,
  CancelMeetingPayload,
  CancelMeetingResponse,
} from '@/types/admin.types';

export const adminMeetingsService = {
  /**
   * Get all meetings with pagination and filtering
   */
  getMeetings: async (params: GetMeetingsParams = {}): Promise<GetMeetingsResponse> => {
    const queryParams = new URLSearchParams();

    if (params.page) queryParams.append('page', params.page.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.status) queryParams.append('status', params.status);
    if (params.meetingType) queryParams.append('meetingType', params.meetingType);
    if (params.caseId) queryParams.append('caseId', params.caseId);
    if (params.sortBy) queryParams.append('sortBy', params.sortBy);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);

    const endpoint = `${API_CONFIG.ENDPOINTS.ADMIN.MEETINGS.LIST}?${queryParams.toString()}`;

    const response = await http.get<GetMeetingsResponse>(endpoint);
    return response.data;
  },

  /**
   * Get a specific meeting by ID
   */
  getMeeting: async (meetingId: string): Promise<GetMeetingResponse> => {
    const response = await http.get<GetMeetingResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.MEETINGS.GET(meetingId)
    );
    return response.data;
  },

  /**
   * Get all meetings for a specific case
   */
  getCaseMeetings: async (caseId: string): Promise<GetMeetingsResponse> => {
    const response = await http.get<GetMeetingsResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.CASES.MEETINGS(caseId)
    );
    return response.data;
  },

  /**
   * Schedule a new meeting for a case
   */
  scheduleMeeting: async (
    payload: ScheduleMeetingPayload
  ): Promise<ScheduleMeetingResponse> => {
    const response = await http.post<ScheduleMeetingResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.MEETINGS.CREATE,
      payload
    );
    return response.data;
  },

  /**
   * Update an existing meeting
   */
  updateMeeting: async (
    meetingId: string,
    payload: UpdateMeetingPayload
  ): Promise<UpdateMeetingResponse> => {
    const response = await http.patch<UpdateMeetingResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.MEETINGS.UPDATE(meetingId),
      payload
    );
    return response.data;
  },

  /**
   * Cancel a meeting
   */
  cancelMeeting: async (
    meetingId: string,
    payload?: CancelMeetingPayload
  ): Promise<CancelMeetingResponse> => {
    const response = await http.patch<CancelMeetingResponse>(
      API_CONFIG.ENDPOINTS.ADMIN.MEETINGS.CANCEL(meetingId),
      payload || {}
    );
    return response.data;
  },
};
