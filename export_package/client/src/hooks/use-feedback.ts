import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export type FeedbackType = "bug" | "feature" | "suggestion" | "other";
export type FeedbackSentiment = "positive" | "negative" | "neutral";

export interface UserFeedback {
  id: string;
  userAddress: string;
  feedbackType: FeedbackType;
  content: string;
  sentiment: FeedbackSentiment;
  category?: string;
  pageUrl?: string;
  browserInfo?: Record<string, any>;
  isResolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
  resolutionNote?: string;
}

export interface FeedbackStats {
  total: number;
  resolved: number;
  unresolved: number;
  byType: Record<string, number>;
  bySentiment: Record<string, number>;
}

export interface FeedbackFormData {
  user_address: string;
  feedback_type: FeedbackType;
  content: string;
  sentiment: FeedbackSentiment;
  category?: string;
  page_url?: string;
  browser_info?: Record<string, any>;
}

export function useFeedback() {
  const { toast } = useToast();
  
  const getAllFeedback = (limit?: number) => {
    const queryParams = limit ? `?limit=${limit}` : '';
    return useQuery<UserFeedback[]>({
      queryKey: ['/api/feedback', { limit }],
      queryFn: () => queryClient.fetchQuery(`/api/feedback${queryParams}`),
    });
  };
  
  const getFeedbackStats = () => {
    return useQuery<FeedbackStats>({
      queryKey: ['/api/feedback/stats'],
      queryFn: () => queryClient.fetchQuery('/api/feedback/stats'),
    });
  };
  
  const getFeedbackById = (id: string) => {
    return useQuery<UserFeedback>({
      queryKey: ['/api/feedback', id],
      queryFn: () => queryClient.fetchQuery(`/api/feedback/${id}`),
      enabled: !!id,
    });
  };
  
  const getFeedbackByAddress = (address: string, limit?: number) => {
    const queryParams = limit ? `?limit=${limit}` : '';
    return useQuery<UserFeedback[]>({
      queryKey: ['/api/feedback/user', address, { limit }],
      queryFn: () => queryClient.fetchQuery(`/api/feedback/user/${address}${queryParams}`),
      enabled: !!address,
    });
  };
  
  const submitFeedbackMutation = useMutation({
    mutationFn: async (feedbackData: FeedbackFormData) => {
      const res = await apiRequest('POST', '/api/feedback', feedbackData);
      return await res.json();
    },
    onSuccess: (data: UserFeedback) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
      queryClient.invalidateQueries({ queryKey: ['/api/feedback/user', data.userAddress] });
      queryClient.invalidateQueries({ queryKey: ['/api/feedback/stats'] });
      
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error Submitting Feedback",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });

  const updateFeedbackStatusMutation = useMutation({
    mutationFn: async ({ id, isResolved, resolutionNote }: { id: string; isResolved: boolean; resolutionNote?: string }) => {
      const res = await apiRequest('PATCH', `/api/feedback/${id}/status`, { isResolved, resolutionNote });
      return await res.json();
    },
    onSuccess: (data: UserFeedback) => {
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ['/api/feedback'] });
      queryClient.invalidateQueries({ queryKey: ['/api/feedback', data.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/feedback/user', data.userAddress] });
      queryClient.invalidateQueries({ queryKey: ['/api/feedback/stats'] });
      
      toast({
        title: "Feedback Status Updated",
        description: `Feedback marked as ${data.isResolved ? 'resolved' : 'unresolved'}`,
        variant: "default",
      });
    },
    onError: (error) => {
      toast({
        title: "Error Updating Feedback",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: "destructive",
      });
    },
  });
  
  return {
    getAllFeedback,
    getFeedbackStats,
    getFeedbackById,
    getFeedbackByAddress,
    submitFeedbackMutation,
    updateFeedbackStatusMutation,
  };
}