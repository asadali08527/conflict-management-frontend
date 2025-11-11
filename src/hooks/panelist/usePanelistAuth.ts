import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { authService } from '@/services/panelist/authService';
import { LoginPayload } from '@/types/panelist/auth.types';
import { usePanelistAuth as usePanelistAuthContext } from '@/contexts/PanelistAuthContext';
import { toast } from 'sonner';

export const usePanelistAuthQuery = () => {
  const { login: loginContext, logout: logoutContext } = usePanelistAuthContext();
  const queryClient = useQueryClient();

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: (response) => {
      if (response.status === 'success' && response.data) {
        const { user, panelist } = response.data;
        loginContext(user, panelist);
        toast.success('Login successful');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Login failed');
    },
  });

  // Get current user query
  const currentUserQuery = useQuery({
    queryKey: ['panelist-current-user'],
    queryFn: () => authService.getCurrentUser(),
    enabled: !!sessionStorage.getItem('panelistUser'),
    retry: false,
  });

  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: (payload: { currentPassword: string; newPassword: string }) =>
      authService.changePassword(payload),
    onSuccess: (response) => {
      if (response.status === 'success') {
        toast.success('Password changed successfully');
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSuccess: () => {
      logoutContext();
      queryClient.clear();
      toast.success('Logged out successfully');
    },
    onError: () => {
      // Force logout even if API call fails
      logoutContext();
      queryClient.clear();
    },
  });

  return {
    loginMutation,
    currentUserQuery,
    changePasswordMutation,
    logoutMutation,
  };
};
