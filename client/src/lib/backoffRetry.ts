/**
 * Utility for retrying API calls with exponential backoff
 * Used to handle intermittent blockchain API failures
 */

type RetryOptions = {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  timeoutMs?: number;
  onRetry?: (attempt: number, error: any) => void;
};

const DEFAULT_OPTIONS: RetryOptions = {
  maxRetries: 5,
  initialDelay: 200,
  maxDelay: 5000,
  timeoutMs: 10000,
  onRetry: undefined
};

/**
 * Executes a function with exponential backoff retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let attempt = 0;
  let lastError: any;

  while (attempt <= opts.maxRetries!) {
    try {
      // Create a timeout promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`Request timed out after ${opts.timeoutMs}ms`));
        }, opts.timeoutMs);
      });

      // Race between the actual operation and the timeout
      return await Promise.race([fn(), timeoutPromise]);
    } catch (error) {
      lastError = error;
      attempt++;
      
      if (attempt > opts.maxRetries!) break;
      
      // Calculate exponential backoff delay (with jitter)
      const delay = Math.min(
        opts.maxDelay!,
        opts.initialDelay! * Math.pow(2, attempt - 1) * (0.9 + Math.random() * 0.2)
      );
      
      if (opts.onRetry) {
        opts.onRetry(attempt, error);
      }
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
}

/**
 * Creates a fetch wrapper with retry logic
 */
export function createRetryFetch(options: RetryOptions = {}) {
  return async (url: string, fetchOptions?: RequestInit): Promise<Response> => {
    return withRetry(
      () => fetch(url, fetchOptions),
      options
    );
  };
}