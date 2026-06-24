import {
  NetworkError,
  RateLimitError,
  AuthenticationError,
  ResourceNotFoundError,
  DependencyDownError,
} from './errors';

const MAX_RETRIES = 3;
const BASE_DELAY = 1000;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function fetchWithRetry(url: string, options?: RequestInit): Promise<any> {
  let attempt = 0;

  while (attempt <= MAX_RETRIES) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout
      
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (response.ok) {
        return await response.json();
      }

      switch (response.status) {
        case 429:
          throw new RateLimitError();
        case 401:
        case 403:
          throw new AuthenticationError();
        case 404:
          throw new ResourceNotFoundError();
        default:
          if (response.status >= 500) {
            throw new DependencyDownError();
          }
          throw new NetworkError(`HTTP Error: ${response.status}`);
      }
    } catch (error: any) {
      if (
        error instanceof AuthenticationError ||
        error instanceof ResourceNotFoundError
      ) {
        throw error; // Fail fast for these
      }

      if (attempt >= MAX_RETRIES) {
        throw error;
      }

      attempt++;
      const jitter = Math.random() * 200;
      const backoffDelay = Math.min(BASE_DELAY * 2 ** attempt + jitter, 5000);
      await delay(backoffDelay);
    }
  }
}
