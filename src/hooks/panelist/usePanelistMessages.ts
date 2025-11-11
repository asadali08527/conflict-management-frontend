import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { messageService, MessageListParams } from '@/services/panelist/messageService';
import { SendMessagePayload } from '@/types/panelist/message.types';
import { toast } from 'sonner';

export const usePanelistMessages = (params: MessageListParams = {}) => {
  const queryClient = useQueryClient();

  // Get messages list with optimized refetch strategy
  const messagesQuery = useQuery({
    queryKey: ['panelist-messages', params],
    queryFn: () => messageService.getMessages(params),
    refetchInterval: 60000, // Increased to 60 seconds (was 30)
    refetchOnWindowFocus: true, // Refetch when user returns to tab
    refetchIntervalInBackground: false, // Don't poll in background
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  // Get unread count with optimized refetch strategy
  const unreadCountQuery = useQuery({
    queryKey: ['panelist-unread-count'],
    queryFn: () => messageService.getUnreadCount(),
    refetchInterval: 60000, // Increased to 60 seconds (was 30)
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: false,
    staleTime: 30000,
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (payload: SendMessagePayload) => messageService.sendMessage(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panelist-messages'] });
      toast.success('Message sent successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send message');
    },
  });

  // Mark as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (messageId: string) => messageService.markAsRead(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panelist-messages'] });
      queryClient.invalidateQueries({ queryKey: ['panelist-unread-count'] });
      queryClient.invalidateQueries({ queryKey: ['panelist-dashboard-stats'] });
    },
  });

  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: (messageId: string) => messageService.deleteMessage(messageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['panelist-messages'] });
      toast.success('Message deleted successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete message');
    },
  });

  return {
    messages: messagesQuery.data?.data?.messages || [],
    unreadCount: messagesQuery.data?.data?.unreadCount || unreadCountQuery.data?.data?.unreadCount || 0,
    pagination: messagesQuery.data?.data?.pagination,
    isLoading: messagesQuery.isLoading,
    error: messagesQuery.error,

    sendMessage: sendMessageMutation.mutate,
    isSending: sendMessageMutation.isPending,

    markAsRead: markAsReadMutation.mutate,
    isMarkingRead: markAsReadMutation.isPending,

    deleteMessage: deleteMessageMutation.mutate,
    isDeleting: deleteMessageMutation.isPending,

    refetch: messagesQuery.refetch,
  };
};

export const usePanelistCaseMessages = (caseId: string) => {
  const queryClient = useQueryClient();

  // Get case messages with optimized refetch strategy
  const messagesQuery = useQuery({
    queryKey: ['panelist-case-messages', caseId],
    queryFn: () => messageService.getCaseMessages(caseId, { limit: 50 }),
    enabled: !!caseId,
    refetchOnWindowFocus: true, // Refetch when user returns
    staleTime: 30000, // Consider data fresh for 30 seconds
  });

  return {
    messages: messagesQuery.data?.data?.messages || [],
    pagination: messagesQuery.data?.data?.pagination,
    isLoading: messagesQuery.isLoading,
    error: messagesQuery.error,
    refetch: messagesQuery.refetch,
  };
};
