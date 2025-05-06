import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { MessageSquareText, Lightbulb, Bug, AlertCircle, MessageSquare } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useFeedback, FeedbackFormData, FeedbackType, FeedbackSentiment } from "@/hooks/use-feedback";

// Define a schema for form validation
const feedbackSchema = z.object({
  feedback_type: z.enum(["bug", "feature", "suggestion", "other"] as const),
  content: z.string().min(3, { message: "Please provide more details" }).max(1000),
  sentiment: z.enum(["positive", "negative", "neutral"] as const),
  category: z.string().optional(),
  user_address: z.string().default("anonymous"),
  page_url: z.string().optional(),
});

type FeedbackDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/**
 * A dialog that allows users to submit feedback about the application.
 */
export function FeedbackDialog({ open, onOpenChange }: FeedbackDialogProps) {
  const { submitFeedbackMutation } = useFeedback();
  
  // Create form instance with validation schema
  const form = useForm<z.infer<typeof feedbackSchema>>({
    resolver: zodResolver(feedbackSchema),
    defaultValues: {
      feedback_type: "suggestion",
      content: "",
      sentiment: "neutral",
      user_address: window.localStorage.getItem("wallet_address") || "anonymous",
      page_url: window.location.pathname,
    },
  });
  
  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      form.reset();
    }
  }, [open, form]);
  
  // Handle form submission
  const onSubmit = async (data: z.infer<typeof feedbackSchema>) => {
    const feedbackData: FeedbackFormData = {
      ...data,
      browser_info: {
        userAgent: navigator.userAgent,
        language: navigator.language,
        viewportSize: {
          width: window.innerWidth,
          height: window.innerHeight,
        },
        timestamp: new Date().toISOString(),
      },
    };
    
    await submitFeedbackMutation.mutateAsync(feedbackData);
    onOpenChange(false);
  };
  
  // Get feedback type icon based on selected type
  const getFeedbackTypeIcon = (type: FeedbackType) => {
    switch (type) {
      case "bug":
        return <Bug className="h-5 w-5 text-red-500" />;
      case "feature":
        return <Lightbulb className="h-5 w-5 text-yellow-500" />;
      case "suggestion":
        return <MessageSquareText className="h-5 w-5 text-blue-500" />;
      case "other":
      default:
        return <MessageSquare className="h-5 w-5 text-gray-500" />;
    }
  };
  
  // Format feedback type for display
  const formatFeedbackType = (type: FeedbackType) => {
    switch (type) {
      case "bug":
        return "Report a Bug";
      case "feature":
        return "Request a Feature";
      case "suggestion":
        return "Make a Suggestion";
      case "other":
      default:
        return "Other Feedback";
    }
  };
  
  // Get sentiment description based on selected sentiment
  const getSentimentDescription = (sentiment: FeedbackSentiment) => {
    switch (sentiment) {
      case "positive":
        return "I like this";
      case "negative":
        return "I don't like this";
      case "neutral":
      default:
        return "Neutral feedback";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-black bg-opacity-78 border-blue-400 text-blue-50 backdrop-blur-lg shadow-neon">
        <DialogHeader>
          <DialogTitle className="text-xl text-shadow-neon">Share Your Feedback</DialogTitle>
          <DialogDescription className="text-blue-100">
            Help us improve PVX by sharing your thoughts, reporting issues, or suggesting new features.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="feedback_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-200">Feedback Type</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="border-blue-500 bg-black bg-opacity-78">
                        <SelectValue placeholder="Select feedback type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-black bg-opacity-78 border-blue-500">
                      <SelectItem value="bug" className="flex items-center">
                        <div className="flex items-center gap-2">
                          <Bug className="h-4 w-4 text-red-500" />
                          <span>Report a Bug</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="feature">
                        <div className="flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-yellow-500" />
                          <span>Request a Feature</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="suggestion">
                        <div className="flex items-center gap-2">
                          <MessageSquareText className="h-4 w-4 text-blue-500" />
                          <span>Make a Suggestion</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="other">
                        <div className="flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-gray-500" />
                          <span>Other Feedback</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-200">Your Feedback</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your thoughts, describe the issue, or suggest an improvement..."
                      className="min-h-[120px] border-blue-500 bg-black bg-opacity-78 focus:border-blue-400 text-shadow-neon"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Please be specific and provide steps to reproduce if reporting a bug.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="sentiment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-200">How do you feel about this?</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger className="border-blue-500 bg-black bg-opacity-78">
                        <SelectValue placeholder="Select your sentiment" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent className="bg-black bg-opacity-78 border-blue-500">
                      <SelectItem value="positive">
                        <div className="flex items-center gap-2">
                          <span className="text-green-500">😊</span>
                          <span>Positive</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="negative">
                        <div className="flex items-center gap-2">
                          <span className="text-red-500">😞</span>
                          <span>Negative</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="neutral">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">😐</span>
                          <span>Neutral</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-blue-200">Category (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="e.g., Wallet, Mining, Staking, UI, Performance..."
                      className="border-blue-500 bg-black bg-opacity-78 focus:border-blue-400 text-shadow-neon"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="border-blue-500 bg-black bg-opacity-78 hover:bg-blue-900 hover:bg-opacity-30 text-shadow-neon"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-black bg-opacity-78 border border-blue-500 hover:bg-blue-900 hover:bg-opacity-30 text-shadow-neon"
                disabled={submitFeedbackMutation.isPending}
              >
                {submitFeedbackMutation.isPending ? "Submitting..." : "Submit Feedback"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}