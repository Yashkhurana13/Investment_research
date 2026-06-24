import { AppError } from './errors';

export interface RetryOptions {
  maxRetries: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffFactor?: number;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions,
  onRetry?: (error: any, attempt: number) => void
): Promise<T> {
  const maxRetries = options.maxRetries;
  const initialDelay = options.initialDelayMs || 2000;
  const maxDelay = options.maxDelayMs || 30000;
  const backoffFactor = options.backoffFactor || 2;

  let attempt = 0;

  while (true) {
    try {
      return await operation();
    } catch (error: any) {
      attempt++;

      // Check if error is retryable based on our AppError hierarchy
      if (error instanceof AppError && !error.retryable) {
        throw error;
      }

      if (attempt > maxRetries) {
        throw error;
      }

      if (onRetry) {
        onRetry(error, attempt);
      }

      // Calculate exponential backoff with full jitter
      // Delay = min(maxDelay, random(0, initialDelay * backoffFactor^(attempt-1)))
      const exponentialDelay = initialDelay * Math.pow(backoffFactor, attempt - 1);
      const jitteredDelay = Math.random() * Math.min(maxDelay, exponentialDelay);
      
      await sleep(jitteredDelay);
    }
  }
}
